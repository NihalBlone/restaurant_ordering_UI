import assert from "node:assert/strict";
import test from "node:test";
import { buildSalesBars } from "../src/services/salesChart.js";

const report = {
  from: "2026-09-01T18:30:00Z", to: "2026-09-04T18:29:59.999Z", timeZone: "Asia/Kolkata",
  items: [
    { menuItemId: "tea", name: "Tea", totalItems: 6, totalAmount: "62.50" },
    { menuItemId: "cake", name: "Cake", totalItems: 3, totalAmount: "150.00" },
  ],
  tables: [{ tableId: "t1", tableNumber: "T1", totalItems: 9, totalAmount: "212.50" }],
  days: [{ date: "2026-09-02", totalItems: 7, totalAmount: "112.50" }, { date: "2026-09-04", totalItems: 2, totalAmount: "100.00" }],
};

test("food bars use complete report aggregates, not the statement page", () => {
  const result = buildSalesBars({ ...report, statements: [] }, "item", "amount");
  assert.equal(result.max, 150);
  assert.equal(result.bars[0].label, "Cake");
  assert.equal(result.bars[0].percent, 100);
  assert.equal(result.bars.reduce((sum, bar) => sum + bar.value, 0), 212.5);
});

test("quantity measure reorders food bars", () => {
  const result = buildSalesBars(report, "item", "quantity");
  assert.equal(result.bars[0].label, "Tea");
  assert.equal(result.bars[0].value, 6);
  assert.equal(result.bars[1].percent, 50);
});

test("table chart uses matching table totals", () => {
  assert.equal(buildSalesBars(report, "table", "amount").bars[0].label, "Table T1");
  assert.equal(buildSalesBars(report, "table", "amount").bars[0].value, 212.5);
});

test("daily chart includes zero-sales days using the report's calendar zone", () => {
  const bars = buildSalesBars(report, "day", "amount").bars;
  assert.deepEqual(bars.map((bar) => bar.key), ["2026-09-02", "2026-09-03", "2026-09-04"]);
  assert.deepEqual(bars.map((bar) => bar.value), [112.5, 0, 100]);
});

test("calendar days remain consecutive across daylight savings", () => {
  const data = { ...report, from: "2026-03-07T05:00:00Z", to: "2026-03-10T03:59:59.999Z", timeZone: "America/New_York", days: [] };
  assert.deepEqual(buildSalesBars(data, "day", "quantity").bars.map((bar) => bar.key), ["2026-03-07", "2026-03-08", "2026-03-09"]);
});

test("zero and empty data never produce invalid bar widths", () => {
  assert.deepEqual(buildSalesBars({ ...report, items: [] }, "item", "amount"), { max: 0, bars: [] });
  const result = buildSalesBars({ ...report, tables: [{ tableId: "t1", tableNumber: "T1", totalItems: 0, totalAmount: "0.00" }] }, "table", "quantity");
  assert.equal(result.bars[0].percent, 0);
});
