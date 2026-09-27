import test from "node:test";
import assert from "node:assert";

import { formatCents, applyPercent } from "../src/money";

test("formatCents renders integer cents as a decimal string", () => {
  assert.strictEqual(formatCents(2999), "29.99");
  assert.strictEqual(formatCents(7999), "79.99");
  assert.strictEqual(formatCents(500), "5.00");
  assert.strictEqual(formatCents(5), "0.05");
});

test("applyPercent floors to whole cents", () => {
  assert.strictEqual(applyPercent(7999, 10), 799); // 799.9 -> 799
  assert.strictEqual(applyPercent(5998, 10), 599); // 599.8 -> 599
  assert.strictEqual(applyPercent(1000, 25), 250);
});
