import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import type { Express } from "express";

import { createApp } from "../src/app";
import { reset } from "../src/store";

async function newCart(app: Express): Promise<string> {
  const res = await request(app).post("/carts");
  assert.strictEqual(res.status, 201);
  return res.body.id as string;
}

test("add an item and see priced cart contents", async () => {
  reset();
  const app = createApp();
  const cartId = await newCart(app);

  const res = await request(app).post(`/carts/${cartId}/items`).send({ productId: "p2", qty: 2 });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.items.length, 1);
  assert.strictEqual(res.body.items[0].qty, 2);
  assert.strictEqual(res.body.items[0].lineTotalCents, 2999 * 2);
  assert.strictEqual(res.body.subtotalCents, 2999 * 2);
  assert.strictEqual(res.body.subtotal, "59.98");
});

test("adding the same product twice accumulates quantity", async () => {
  reset();
  const app = createApp();
  const cartId = await newCart(app);

  await request(app).post(`/carts/${cartId}/items`).send({ productId: "p1", qty: 1 });
  const res = await request(app).post(`/carts/${cartId}/items`).send({ productId: "p1", qty: 2 });

  assert.strictEqual(res.body.items[0].qty, 3);
});

test("unknown product is rejected", async () => {
  reset();
  const app = createApp();
  const cartId = await newCart(app);

  const res = await request(app).post(`/carts/${cartId}/items`).send({ productId: "nope", qty: 1 });

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, "PRODUCT_NOT_FOUND");
});

test("non-positive quantity is rejected", async () => {
  reset();
  const app = createApp();
  const cartId = await newCart(app);

  const res = await request(app).post(`/carts/${cartId}/items`).send({ productId: "p1", qty: 0 });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, "INVALID_QUANTITY");
});

test("cannot add more than the available stock", async () => {
  reset();
  const app = createApp();
  const cartId = await newCart(app);

  // p2 (Wireless Mouse) only has 3 in stock.
  const res = await request(app).post(`/carts/${cartId}/items`).send({ productId: "p2", qty: 4 });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.error.code, "INSUFFICIENT_STOCK");
});

test("update quantity then remove the item", async () => {
  reset();
  const app = createApp();
  const cartId = await newCart(app);
  await request(app).post(`/carts/${cartId}/items`).send({ productId: "p1", qty: 1 });

  const patched = await request(app).patch(`/carts/${cartId}/items/p1`).send({ qty: 5 });
  assert.strictEqual(patched.body.items[0].qty, 5);

  const removed = await request(app).delete(`/carts/${cartId}/items/p1`);
  assert.strictEqual(removed.status, 200);
  assert.strictEqual(removed.body.items.length, 0);
});

test("fetching a missing cart returns 404", async () => {
  reset();
  const app = createApp();

  const res = await request(app).get("/carts/does-not-exist");

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, "CART_NOT_FOUND");
});
