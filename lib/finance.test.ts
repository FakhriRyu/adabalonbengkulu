import assert from "node:assert/strict";
import { test } from "node:test";
import { summarize } from "./finance.ts";

test("arus kas bulanan", () => {
  const s = summarize(
    [{ total: 100000 }, { total: 60000 }],
    [
      { type: "keluar", amount: 75000 }, // belanja balon
      { type: "masuk", amount: 20000 },
      { type: "keluar", amount: 5000 },
    ],
  );
  assert.equal(s.orderIncome, 160000);
  assert.equal(s.otherIncome, 20000);
  assert.equal(s.expense, 80000);
  assert.equal(s.net, 100000);
  assert.equal(s.paidOrders, 2);
});

test("bulan kosong", () => {
  assert.deepEqual(summarize([], []), { orderIncome: 0, otherIncome: 0, expense: 0, net: 0, paidOrders: 0 });
});
