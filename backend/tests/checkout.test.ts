import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import type { Express } from "express";

import { createApp } from "../src/app";
import { reset, products, coupons } from "../src/store";

async function cartWith(app: Express, productId: string, qty: number): Promise<string> {
  const created = await request(app).post("/carts");
  const cartId = created.body.id as string;
  await request(app).post(`/carts/${cartId}/items`).send({ productId, qty });
  return cartId;
}

test("checkout snapshots items, totals, and decrements stock", async () => {
  reset();
  const app = createApp();
  const cartId = await cartWith(app, "p2", 2); // Wireless Mouse, 2999 each, stock 3

  const res = await request(app).post(`/carts/${cartId}/checkout`);

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.subtotalCents, 5998);
  assert.strictEqual(res.body.discountCents, 0);
  assert.strictEqual(res.body.totalCents, 5998);
  assert.strictEqual(res.body.items[0].unitPriceCents, 2999);
  assert.strictEqual(products.get("p2")!.stock, 1);
});

test("retrying with the same Idempotency-Key returns the same order once", async () => {
  reset();
  const app = createApp();
  const cartId = await cartWith(app, "p2", 2);

  const first = await request(app).post(`/carts/${cartId}/checkout`).set("Idempotency-Key", "abc");
  const retry = await request(app).post(`/carts/${cartId}/checkout`).set("Idempotency-Key", "abc");

  assert.strictEqual(first.status, 201);
  assert.strictEqual(retry.status, 200);
  assert.strictEqual(retry.body.id, first.body.id);
  assert.strictEqual(products.get("p2")!.stock, 1); // consumed once, not twice
});

test("a cart cannot be checked out twice", async () => {
  reset();
  const app = createApp();
  const cartId = await cartWith(app, "p1", 1);

  await request(app).post(`/carts/${cartId}/checkout`);
  const second = await request(app).post(`/carts/${cartId}/checkout`);

  assert.strictEqual(second.status, 409);
  assert.strictEqual(second.body.error.code, "CART_ALREADY_CHECKED_OUT");
});

test("an empty cart cannot be checked out", async () => {
  reset();
  const app = createApp();
  const created = await request(app).post("/carts");

  const res = await request(app).post(`/carts/${created.body.id}/checkout`);

  assert.strictEqual(res.status, 422);
  assert.strictEqual(res.body.error.code, "EMPTY_CART");
});

test("inventory is not oversold across separate carts", async () => {
  reset();
  const app = createApp();
  const cartA = await cartWith(app, "p2", 3); // takes all 3
  const cartB = await cartWith(app, "p2", 3);

  const a = await request(app).post(`/carts/${cartA}/checkout`);
  const b = await request(app).post(`/carts/${cartB}/checkout`);

  assert.strictEqual(a.status, 201);
  assert.strictEqual(b.status, 409);
  assert.strictEqual(b.body.error.code, "INSUFFICIENT_STOCK");
  assert.strictEqual(products.get("p2")!.stock, 0);
});

test("concurrent checkouts for the last units: exactly one wins", async () => {
  reset();
  const app = createApp();
  const cartA = await cartWith(app, "p2", 3);
  const cartB = await cartWith(app, "p2", 3);

  const [a, b] = await Promise.all([
    request(app).post(`/carts/${cartA}/checkout`),
    request(app).post(`/carts/${cartB}/checkout`),
  ]);

  const statuses = [a.status, b.status].sort();
  assert.deepStrictEqual(statuses, [201, 409]);
  assert.strictEqual(products.get("p2")!.stock, 0);
});

test("a coupon applies a discount and can only be used once", async () => {
  reset();
  const app = createApp();
  coupons.set("SAVE10", { code: "SAVE10", percentOff: 10, redeemed: false, redeemedOrderId: null });

  const cartA = await cartWith(app, "p1", 1); // 7999
  const first = await request(app).post(`/carts/${cartA}/checkout`).send({ couponCode: "SAVE10" });

  assert.strictEqual(first.status, 201);
  assert.strictEqual(first.body.discountCents, 799); // floor(7999 * 10 / 100)
  assert.strictEqual(first.body.totalCents, 7200);

  const cartB = await cartWith(app, "p1", 1);
  const second = await request(app).post(`/carts/${cartB}/checkout`).send({ couponCode: "SAVE10" });

  assert.strictEqual(second.status, 409);
  assert.strictEqual(second.body.error.code, "COUPON_ALREADY_REDEEMED");
});

test("a failed checkout does not consume the coupon", async () => {
  reset();
  const app = createApp();
  coupons.set("SAVE10", { code: "SAVE10", percentOff: 10, redeemed: false, redeemedOrderId: null });

  const cartId = await cartWith(app, "p2", 3);
  products.get("p2")!.stock = 1; // stock drops below what the cart holds

  const res = await request(app).post(`/carts/${cartId}/checkout`).send({ couponCode: "SAVE10" });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.error.code, "INSUFFICIENT_STOCK");
  assert.strictEqual(coupons.get("SAVE10")!.redeemed, false);
});
