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
const {
  buildAssetOperationsResponse,
  buildAssetOperationsRange,
  parseAssetOperationsFilter
} = require("../dist/finance/asset-operations.utils");
const {
  buildIncomeExpensesDetail,
  buildIncomeExpensesDetailRange
} = require("../dist/finance/income-expenses-detail.utils");
const {
  buildZenSummary,
  buildZenSummaryRange
} = require("../dist/finance/zen-summary.utils");
const {
  buildVtMarketsAccountTotals,
  buildVtMarketsAccountTotalsRange,
  buildVtMarketsGlobalResults,
  buildVtMarketsGlobalResultsRange,
  buildVtMarketsResults,
  buildVtMarketsResultsRange,
  discoverVtMarketsYears,
  resolveVtMarketsResultsYear
} = require("../dist/finance/vt-markets.utils");

const AVAILABLE_LABEL = "DISPONIBLE PARA VOLVER A ESPA\u00D1A";

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

test("builds the detail range for income and expenses view", () => {
  assert.equal(
    buildIncomeExpensesDetailRange(2026),
    "'Ingresos/Gastos 2026'!A2:M37"
  );
});

test("builds detailed sections for income and expenses view", () => {
  const values = Array.from({ length: 36 }, () => Array.from({ length: 13 }, () => ""));

  values[0][0] = "Sueldo";
  values[0][4] = 2400;
  values[1][0] = "Otros";
  values[1][4] = 75;
  values[2][0] = "Total Ingresos";
  values[2][4] = 2475;

  values[4][0] = "Alquiler / hipoteca";
  values[4][4] = 800;
  values[5][0] = "Electricidad";
  values[5][4] = 100;
  values[15][0] = "Total gastos vitales";
  values[15][4] = 900;

  values[17][0] = "Spotify";
  values[17][4] = 12;
  values[18][0] = "Videojuegos";
  values[18][4] = 40;
  values[35][0] = "Total gastos extraordinarios y ocio";
  values[35][4] = 52;

  assert.deepEqual(
    buildIncomeExpensesDetail({
      year: 2026,
      month: 4,
      values
    }),
    {
      year: 2026,
      month: 4,
      sheetName: "Ingresos/Gastos 2026",
      incomeSection: {
        title: "Ingresos",
        totalLabel: "Total ingresos",
        items: [
          { label: "Sueldo", row: 2, value: 2400 },
          { label: "Otros", row: 3, value: 75 }
        ],
        total: 2475
      },
      essentialExpensesSection: {
        title: "Gastos vitales",
        totalLabel: "Total gastos vitales",
        items: [
          { label: "Alquiler / hipoteca", row: 6, value: 800 },
          { label: "Electricidad", row: 7, value: 100 }
        ],
        total: 900
      },
      discretionaryExpensesSection: {
        title: "Gastos extra",
        totalLabel: "Total gastos extraordinarios y ocio",
        items: [
          { label: "Spotify", row: 19, value: 12 },
          { label: "Videojuegos", row: 20, value: 40 }
        ],
        total: 52
      },
      grandTotalExpenses: 952
    }
  );
});

test("builds the purchases range", () => {
  assert.equal(buildAssetOperationsRange("purchase"), "'Compras'!A1:J");
});

test("builds the sales range", () => {
  assert.equal(buildAssetOperationsRange("sale"), "'Ventas'!A1:J");
});

test("parses and validates date filters", () => {
  assert.deepEqual(
    parseAssetOperationsFilter({
      dateFrom: "2024-01-01",
      dateTo: "2024-03-31"
    }),
    {
      dateFrom: "2024-01-01",
      dateTo: "2024-03-31"
    }
  );
});

test("builds purchase operations response sorted by latest date", () => {
  const values = [
    [
      "Fecha",
      "Producto",
      "Plataforma de compra",
      "Cantidad",
      "Precio unitario (€)",
      "Precio unitario ($)",
      "Fees (€)",
      "Fees ($)",
      "Total compra (€)",
      "Total compra ($)"
    ],
    [45566, "USDT", "Binance", 248.7, 0.93, "", 0, "", 233.59, ""],
    [45535, "BTC", "Binance", 0.00566, 26482.05, "", 0, "", 149.88, ""]
  ];

  const response = buildAssetOperationsResponse({
    kind: "purchase",
    filter: {
      dateFrom: "2023-10-01",
      dateTo: "2024-12-31"
    },
    values
  });

  assert.equal(response.operationType, "purchase");
  assert.equal(response.items.length, 2);
  assert.equal(response.items[0].product, "USDT");
  assert.equal(response.summary.totalEur, 383.47);
});

test("builds sales operations response and tolerates null totals", () => {
  const values = [
    [
      "Fecha de compra",
      "Producto",
      "Plataforma de venta",
      "Cantidad",
      "Precio unitario (€)",
      "Precio unitario ($)",
      "Fees (€)",
      "Fees ($)",
      "Total venta (€)",
      "Total venta ($)"
    ],
    [45948, "DOGE", "KuCoin", 1305.22, "", 0.19478, "", "= 0,08071 + 0,17351", "", "= 173,5181 + 80,7134"],
    [45877, "USDT", "KuCoin", 608.33, 0.927, "", 0.5639, "", 563.37, ""]
  ];

  const response = buildAssetOperationsResponse({
    kind: "sale",
    filter: {
      dateFrom: "2024-01-01",
      dateTo: "2025-12-31"
    },
    values
  });

  assert.equal(response.operationType, "sale");
  assert.equal(response.items.length, 2);
  assert.equal(response.items[0].product, "DOGE");
  assert.equal(response.items[0].totalUsd, null);
  assert.equal(response.summary.totalEur, 563.37);
});

test("builds the zen summary range", () => {
  assert.equal(buildZenSummaryRange(), "'Total Zen'!A2:I6");
});

test("builds the zen summary from the sheet structure", () => {
  const values = [
    [
      "",
      "PARA",
      "AHORRADO",
      "RESTANTE",
      "OBJETIVO",
      "",
      "TOTAL",
      "",
      AVAILABLE_LABEL
    ],
    ["", "Ibon", 300, 300, 600, "", 300, "", 6265.37],
    ["", "AJ1 Lost & Found", 0, 400, 400],
    ["", "Escape GR86", 0, 2000, 2000],
    ["", "RTX 5080", 0, 1800, 1800]
  ];

  assert.deepEqual(buildZenSummary(values), {
    sheetName: "Total Zen",
    totalSaved: 300,
    availableToReturnToSpain: 6265.37,
    goals: [
      {
        name: "Ibon",
        saved: 300,
        remaining: 300,
        target: 600,
        progressRatio: 0.5
      },
      {
        name: "AJ1 Lost & Found",
        saved: 0,
        remaining: 400,
        target: 400,
        progressRatio: 0
      },
      {
        name: "Escape GR86",
        saved: 0,
        remaining: 2000,
        target: 2000,
        progressRatio: 0
      },
      {
        name: "RTX 5080",
        saved: 0,
        remaining: 1800,
        target: 1800,
        progressRatio: 0
      }
    ]
  });
});

test("discovers VT Markets yearly sheets", () => {
  assert.deepEqual(
    discoverVtMarketsYears([
      "Resultados VT Markets 2026",
      "Resultados VT Markets 2024",
      "Resultados VT Markets 2025",
      "Resultados Globales VT Markets"
    ]),
    [2024, 2025, 2026]
  );
});

test("resolves the latest VT Markets year by default", () => {
  assert.equal(resolveVtMarketsResultsYear(undefined, [2024, 2025, 2026]), 2026);
});

test("builds VT Markets result ranges", () => {
  assert.equal(
    buildVtMarketsResultsRange(2026),
    "'Resultados VT Markets 2026'!A1:O40"
  );
  assert.equal(
    buildVtMarketsGlobalResultsRange(),
    "'Resultados Globales VT Markets'!A1:I20"
  );
  assert.equal(buildVtMarketsAccountTotalsRange(), "'Total VT Markets'!A1:K6");
});

test("builds VT Markets yearly results with dynamic blocks", () => {
  const values = [
    [],
    ["", "", "INGRESO PASIVO", "", "", "INTERES COMPUESTO", "", "", "TOTAL"],
    [
      "",
      "Mes",
      "Capital inicio mes",
      "Beneficios ($)",
      "Beneficios (%)",
      "Capital inicio mes",
      "Beneficios ($)",
      "Beneficios(%)",
      "Capital inicio mes",
      "Beneficios ($)",
      "Beneficios(%)"
    ],
    ["", 45566, 4000, 411.81, 0.1029, 3116.41, 938.62, 0.3012, 7116.41, 1350.43, 0.1897],
    ["", 45597, 4000, 496.95, 0.1242, 4011.77, 1246.74, 0.3108, 8011.77, 1743.69, 0.2176],
    [],
    ["", "", "TOTAL", 908.76, "", "TOTAL", 2185.36, "", "TOTAL", 3094.12, ""]
  ];

  const response = buildVtMarketsResults({
    year: 2024,
    availableYears: [2024, 2025, 2026],
    values
  });

  assert.equal(response.year, 2024);
  assert.equal(response.strategyBlocks.length, 3);
  assert.equal(response.strategyBlocks[0].label, "INGRESO PASIVO");
  assert.equal(response.strategyBlocks[1].rows[0].monthLabel, "Oct 2024");
  assert.equal(response.totals.totalProfitUsd, 3094.12);
});

test("builds VT Markets global results", () => {
  const values = [
    [],
    ["", "", "TOTAL INGRESO PASIVO", "TOTAL INTERES COMPUESTO", "ZERO 2 HERO", "TOTAL", "", "INVERTIDO", "SACADO"],
    ["", 2024, 2078.61, 4098.5, 0, 6177.11, "", 8469.39, 608.33],
    ["", 2025, 1727.02, 241.61, 458.9, 2427.53, "", null, null]
  ];

  const response = buildVtMarketsGlobalResults(values);

  assert.equal(response.items.length, 2);
  assert.equal(response.items[0].year, 2024);
  assert.equal(response.summary.totalProfitUsd, 8604.64);
  assert.equal(response.summary.investedUsd, 8469.39);
});

test("builds VT Markets account totals with grouped families", () => {
  const values = [
    [],
    [
      "",
      "INGRESOS PASIVOS 1\n(9073194)",
      "INTERES COMPUESTO 1\n(9073162)",
      "ZERO 2 HERO OUT 1\n(23280581)",
      "CUENTA AHORRO IN\n(24609917)",
      "TOTAL"
    ],
    ["", 2114.65, 6253.01, 500, 79.62, 8947.28]
  ];

  const response = buildVtMarketsAccountTotals(values);

  assert.equal(response.accounts.length, 4);
  assert.equal(response.groupedTotals.length, 4);
  assert.equal(response.grandTotal, 8947.28);
  assert.equal(response.accounts[0].accountId, "9073194");
});
