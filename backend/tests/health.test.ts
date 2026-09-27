import test from "node:test";
import assert from "node:assert";
import request from "supertest";

import { createApp } from "../src/app";

test("GET /health returns { status: 'ok' }", async () => {
  const res = await request(createApp()).get("/health");
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { status: "ok" });
});
