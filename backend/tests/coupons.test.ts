import test from "node:test";
import assert from "node:assert";
import request from "supertest";

import { createApp } from "../src/app";
import { reset, coupons } from "../src/store";

test("look up a coupon by code", async () => {
  reset();
  const app = createApp();
  coupons.set("SAVE10", { code: "SAVE10", percentOff: 10, redeemed: false, redeemedOrderId: null });

  const res = await request(app).get("/coupons/SAVE10");

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.percentOff, 10);
  assert.strictEqual(res.body.redeemed, false);
});

test("unknown coupon returns 404", async () => {
  reset();
  const app = createApp();

  const res = await request(app).get("/coupons/NOPE");

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, "COUPON_NOT_FOUND");
});
