import test from "node:test";
import assert from "node:assert/strict";
import { csvCell, salesSummaryCsv } from "../src/utils/reportExport.js";

test("CSV escapes names and neutralizes spreadsheet formulas", () => {
  assert.equal(csvCell('Coffee, "iced"'), '"Coffee, ""iced"""');
  assert.equal(csvCell("=SUM(A1:A2)"), '"\'=SUM(A1:A2)"');
  assert.equal(csvCell("  @malicious"), '"\'  @malicious"');
});
test("sales CSV includes full aggregate rows and applied filters", () => {
  const result = salesSummaryCsv({ from: "2026-09-01", to: "2026-09-22", timeZone: "UTC", tableId: "table-1", menuItemId: null,
    settledBills: 10, totalOrders: 12, totalItems: 20, totalAmount: 100,
    items: [{ name: "Tea", totalItems: 20, totalAmount: 100 }], tables: [], days: [] });
  assert.match(result, /"Table filter","table-1"/);
  assert.match(result, /"Tea","20","100"/);
});
