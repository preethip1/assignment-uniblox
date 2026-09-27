import test from "node:test";
import assert from "node:assert";

import { formatCents } from "../src/money";

test("formatCents renders integer cents as a decimal string", () => {
  assert.strictEqual(formatCents(2999), "29.99");
  assert.strictEqual(formatCents(7999), "79.99");
  assert.strictEqual(formatCents(500), "5.00");
  assert.strictEqual(formatCents(5), "0.05");
});
