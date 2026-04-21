const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildIncomeExpensesRange,
  buildMonthlySummary,
  getMonthColumn,
  normalizeSheetNumber
} = require("../dist/finance/monthly-summary.utils");
const {
  buildExpenseCategories,
  buildExpenseCellRange,
  buildExpenseCategoriesRange,
  planExpenseCellUpdate
} = require("../dist/finance/quick-add-expense.utils");

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

test("builds the expense categories range for the sheet", () => {
  assert.equal(
    buildExpenseCategoriesRange(2026),
    "'Ingresos/Gastos 2026'!A6:A36"
  );
});

test("builds the writable cell for a category and month", () => {
  assert.equal(
    buildExpenseCellRange({ year: 2026, month: 4, row: 10 }),
    "'Ingresos/Gastos 2026'!E10"
  );
});

test("extracts dynamic expense categories from sheet labels", () => {
  const labels = Array.from({ length: 31 }, () => [""]);
  labels[0] = ["Alquiler / hipoteca"];
  labels[4] = ["Gasolina"];
  labels[13] = ["Spotify"];
  labels[30] = [""];

  assert.deepEqual(buildExpenseCategories(labels), [
    {
      id: "expense-row-6",
      label: "Alquiler / hipoteca",
      row: 6,
      section: "essential"
    },
    {
      id: "expense-row-10",
      label: "Gasolina",
      row: 10,
      section: "essential"
    },
    {
      id: "expense-row-19",
      label: "Spotify",
      row: 19,
      section: "discretionary"
    }
  ]);
});

test("creates an initial formula when the target cell is empty", () => {
  assert.deepEqual(planExpenseCellUpdate({ amount: 60, existingValue: "" }), {
    nextValue: "=60",
    previousValue: null
  });
});

test("replaces a literal zero with an initial formula", () => {
  assert.deepEqual(planExpenseCellUpdate({ amount: 60, existingValue: 0 }), {
    nextValue: "=60",
    previousValue: 0
  });
});

test("converts a numeric literal into a formula before appending", () => {
  assert.deepEqual(planExpenseCellUpdate({ amount: 60, existingValue: 100 }), {
    nextValue: "=100+60",
    previousValue: 100
  });
});

test("appends to an existing formula safely", () => {
  assert.deepEqual(
    planExpenseCellUpdate({
      amount: 52.5,
      existingValue: "= 60 + 52"
    }),
    {
      nextValue: "=60 + 52+52,5",
      previousValue: "= 60 + 52"
    }
  );
});
