import test from "node:test";
import assert from "node:assert";
import request from "supertest";

import { createApp } from "../src/app";
import { reset } from "../src/store";

type ProductRow = { id: string; name: string; priceCents: number; stock: number; price: string };

test("GET /products lists the seeded catalog", async () => {
  reset();
  const res = await request(createApp()).get("/products");

  assert.strictEqual(res.status, 200);
  const rows = res.body.products as ProductRow[];
  assert.strictEqual(rows.length, 5);

  const mouse = rows.find((p) => p.name === "Wireless Mouse")!;
  assert.strictEqual(mouse.stock, 3);
  assert.strictEqual(mouse.priceCents, 2999);
  assert.strictEqual(mouse.price, "29.99");
});
