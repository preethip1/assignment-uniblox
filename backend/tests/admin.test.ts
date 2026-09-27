import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import type { Express } from "express";

import { createApp } from "../src/app";
import { reset } from "../src/store";

async function placeOrder(app: Express, productId = "p1", qty = 1): Promise<void> {
  const cart = await request(app).post("/carts");
  await request(app).post(`/carts/${cart.body.id}/items`).send({ productId, qty });
  await request(app).post(`/carts/${cart.body.id}/checkout`);
}

test("no coupon before the milestone is reached", async () => {
  reset();
  const app = createApp();

  const res = await request(app).post("/admin/coupons/generate");

  assert.strictEqual(res.status, 422);
  assert.strictEqual(res.body.error.code, "NO_MILESTONE_REACHED");
});

test("a coupon is generated once the milestone is reached, and only once", async () => {
  reset();
  const app = createApp();
  for (let i = 0; i < 5; i++) await placeOrder(app);

  const first = await request(app).post("/admin/coupons/generate");
  assert.strictEqual(first.status, 201);
  assert.strictEqual(first.body.percentOff, 10);
  assert.strictEqual(first.body.milestoneIndex, 1);

  const second = await request(app).post("/admin/coupons/generate");
  assert.strictEqual(second.status, 409);
  assert.strictEqual(second.body.error.code, "COUPON_ALREADY_GENERATED");
});

test("the report reconciles orders, revenue, and coupons", async () => {
  reset();
  const app = createApp();
  for (let i = 0; i < 5; i++) await placeOrder(app); // 5 x 7999

  const generated = await request(app).post("/admin/coupons/generate");
  const code = generated.body.code as string;

  // a sixth order that uses the coupon
  const cart = await request(app).post("/carts");
  await request(app).post(`/carts/${cart.body.id}/items`).send({ productId: "p1", qty: 1 });
  await request(app).post(`/carts/${cart.body.id}/checkout`).send({ couponCode: code });

  const res = await request(app).get("/admin/report");
  assert.strictEqual(res.status, 200);

  assert.strictEqual(res.body.totalOrders, 6);
  assert.strictEqual(res.body.couponEveryNOrders, 5);
  assert.strictEqual(res.body.itemsSold[0].productId, "p1");
  assert.strictEqual(res.body.itemsSold[0].qty, 6);
  assert.strictEqual(res.body.grossRevenueCents, 7999 * 6);
  assert.strictEqual(res.body.totalDiscountCents, 799);
  assert.strictEqual(res.body.netRevenueCents, 7999 * 6 - 799);
  assert.deepStrictEqual(res.body.coupons, { generated: 1, available: 0, redeemed: 1 });
});
