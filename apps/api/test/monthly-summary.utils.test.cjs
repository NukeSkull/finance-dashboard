const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildIncomeExpensesRange,
  buildMonthlySummary,
  getMonthColumn,
  normalizeSheetNumber
} = require("../dist/finance/monthly-summary.utils");

test("maps January to column B", () => {
  assert.equal(getMonthColumn(1), "B");
});

test("maps December to column M", () => {
  assert.equal(getMonthColumn(12), "M");
});

test("rejects invalid months", () => {
  assert.throws(() => getMonthColumn(0), /Month must be between 1 and 12/);
  assert.throws(() => getMonthColumn(13), /Month must be between 1 and 12/);
});

test("builds the monthly range for the selected year and month", () => {
  assert.equal(
    buildIncomeExpensesRange(2026, 4),
    "'Ingresos/Gastos 2026'!E4:E45"
  );
});

test("normalizes numeric values returned by Google Sheets", () => {
  assert.equal(normalizeSheetNumber(123.45), 123.45);
  assert.equal(normalizeSheetNumber("123.45"), 123.45);
  assert.equal(normalizeSheetNumber("123,45"), 123.45);
  assert.equal(normalizeSheetNumber(""), 0);
});

test("builds a monthly summary from a sheet range matrix", () => {
  const values = Array.from({ length: 42 }, () => [0]);
  values[0] = [2400];
  values[13] = [2200];
  values[33] = [150];
  values[35] = [2350];
  values[39] = [200];
  values[41] = [50];

  assert.deepEqual(buildMonthlySummary({ year: 2026, month: 4, values }), {
    year: 2026,
    month: 4,
    sheetName: "Ingresos/Gastos 2026",
    income: 2400,
    essentialExpenses: 2200,
    discretionaryExpenses: 150,
    totalExpenses: 2350,
    invested: 200,
    savings: 50
  });
});
