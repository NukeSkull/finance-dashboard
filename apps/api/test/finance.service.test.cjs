const assert = require("node:assert/strict");
const test = require("node:test");
const { NotFoundException } = require("@nestjs/common");

const { FinanceService } = require("../dist/finance/finance.service");

test("returns monthly summary from sheet values", async () => {
  const values = Array.from({ length: 42 }, () => [0]);
  values[0] = [2500];
  values[13] = [1800];
  values[33] = [120];
  values[35] = [1920];
  values[39] = [300];
  values[41] = [280];

  const service = new FinanceService({
    async readValues(range) {
      assert.equal(range, "'Ingresos/Gastos 2026'!E4:E45");
      return values;
    }
  });

  const result = await service.getMonthlySummary({ year: 2026, month: 4 });

  assert.equal(result.income, 2500);
  assert.equal(result.totalExpenses, 1920);
  assert.equal(result.savings, 280);
});

test("throws not found when monthly summary range is empty", async () => {
  const service = new FinanceService({
    async readValues() {
      return [];
    }
  });

  await assert.rejects(
    () => service.getMonthlySummary({ year: 2026, month: 4 }),
    (error) => {
      assert.ok(error instanceof NotFoundException);
      assert.match(error.message, /No values found for range/);
      return true;
    }
  );
});

test("returns income and expenses detail from sheet values", async () => {
  const values = Array.from({ length: 36 }, () => Array.from({ length: 13 }, () => ""));
  values[0][0] = "Sueldo";
  values[0][4] = 3000;
  values[2][0] = "Total Ingresos";
  values[2][4] = 3000;
  values[4][0] = "Alquiler";
  values[4][4] = 1000;
  values[15][0] = "Total gastos vitales";
  values[15][4] = 1000;
  values[35][0] = "Total gastos extraordinarios y ocio";
  values[35][4] = 0;

  const service = new FinanceService({
    async readValues(range) {
      assert.equal(range, "'Ingresos/Gastos 2026'!A2:M37");
      return values;
    }
  });

  const result = await service.getIncomeExpensesDetail({ year: 2026, month: 4 });

  assert.equal(result.incomeSection.total, 3000);
  assert.equal(result.essentialExpensesSection.total, 1000);
});

test("returns income and expenses year context from sheet values", async () => {
  const values = Array.from({ length: 44 }, () => Array.from({ length: 13 }, () => ""));
  values[2][1] = 2000;
  values[2][2] = 2200;
  values[2][3] = 2100;
  values[15][1] = 900;
  values[15][2] = 850;
  values[15][3] = 910;
  values[35][1] = 300;
  values[35][2] = 450;
  values[35][3] = 280;
  values[37][1] = 1200;
  values[37][2] = 1300;
  values[37][3] = 1190;
  values[43][1] = 800;
  values[43][2] = 900;
  values[43][3] = 910;

  const service = new FinanceService({
    async readValues(range) {
      assert.equal(range, "'Ingresos/Gastos 2026'!A2:M45");
      return values;
    }
  });

  const result = await service.getIncomeExpensesYearContext({
    year: 2026,
    month: 2
  });

  assert.equal(result.year, 2026);
  assert.equal(result.selectedMonth, 2);
  assert.equal(result.monthly.length, 12);
  assert.equal(result.monthly[0].income, 2000);
  assert.equal(result.monthly[1].totalExpenses, 1300);
  assert.equal(result.averages.income, (2000 + 2200) / 2);
  assert.ok(result.insights.length >= 1);
});

test("returns asset purchases from mocked sheet values", async () => {
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
    [45566, "BTC", "Binance", 0.01, 25000, "", 0, "", 250, ""]
  ];
  const service = new FinanceService({
    async readValues(range) {
      assert.equal(range, "'Compras'!A1:J");
      return values;
    }
  });

  const result = await service.getAssetPurchases({
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31"
  });

  assert.equal(result.operationType, "purchase");
  assert.equal(result.items.length, 1);
});

test("returns unified asset operations history from both sheets", async () => {
  const purchaseValues = [
    [
      "Fecha",
      "Producto",
      "Plataforma de compra",
      "Cantidad",
      "Precio unitario (â‚¬)",
      "Precio unitario ($)",
      "Fees (â‚¬)",
      "Fees ($)",
      "Total compra (â‚¬)",
      "Total compra ($)"
    ],
    [45566, "BTC", "Binance", 0.01, 25000, "", 0, "", 250, ""]
  ];
  const saleValues = [
    [
      "Fecha de compra",
      "Producto",
      "Plataforma de venta",
      "Cantidad",
      "Precio unitario (â‚¬)",
      "Precio unitario ($)",
      "Fees (â‚¬)",
      "Fees ($)",
      "Total venta (â‚¬)",
      "Total venta ($)"
    ],
    [45597, "ETH", "Kraken", 0.5, 2300, "", 0, "", 1150, ""]
  ];

  const service = new FinanceService({
    async readValues(range) {
      if (range === "'Compras'!A1:J") {
        return purchaseValues;
      }

      if (range === "'Ventas'!A1:J") {
        return saleValues;
      }

      throw new Error(`Unexpected range ${range}`);
    }
  });

  const result = await service.getAssetOperationsHistory({
    type: "all",
    q: null,
    product: null,
    platform: null,
    currency: null,
    dateFrom: null,
    dateTo: null
  });

  assert.equal(result.items.length, 2);
  assert.equal(result.summary.operationsCount, 2);
  assert.equal(result.items[0].operationType, "sale");
});

test("returns expense categories from mocked sheet labels", async () => {
  const labels = Array.from({ length: 31 }, () => [""]);
  labels[0] = ["Alquiler"];
  labels[1] = ["Internet"];
  labels[13] = ["Spotify"];
  const service = new FinanceService({
    async readValues(range) {
      assert.equal(range, "'Ingresos/Gastos 2026'!A6:A36");
      return labels;
    }
  });

  const result = await service.getExpenseCategories({ year: 2026 });

  assert.deepEqual(result, [
    { id: "expense-row-6", label: "Alquiler" },
    { id: "expense-row-7", label: "Internet" },
    { id: "expense-row-19", label: "Spotify" }
  ]);
});

test("writes quick add expense using formula-aware update", async () => {
  const labels = Array.from({ length: 31 }, () => [""]);
  labels[0] = ["Alquiler"];
  const calls = [];
  const service = new FinanceService({
    async readValues(range, options) {
      calls.push(["read", range, options ?? null]);

      if (range === "'Ingresos/Gastos 2026'!A6:A36") {
        return labels;
      }

      if (range === "'Ingresos/Gastos 2026'!E6") {
        return [[100]];
      }

      throw new Error(`Unexpected read range ${range}`);
    },
    async writeValue(range, value) {
      calls.push(["write", range, value]);
    }
  });

  const result = await service.quickAddExpense({
    categoryId: "expense-row-6",
    amount: 42.5,
    currency: "EUR",
    year: 2026,
    month: 4
  });

  assert.equal(result.success, true);
  assert.equal(result.cell, "'Ingresos/Gastos 2026'!E6");
  assert.equal(result.writtenValue, "=100+42,5");
  assert.deepEqual(calls, [
    ["read", "'Ingresos/Gastos 2026'!A6:A36", null],
    [
      "read",
      "'Ingresos/Gastos 2026'!E6",
      {
        valueRenderOption: "FORMULA"
      }
    ],
    ["write", "'Ingresos/Gastos 2026'!E6", "=100+42,5"]
  ]);
});

test("throws not found when quick add category does not exist", async () => {
  const service = new FinanceService({
    async readValues() {
      return [["Solo otra categoria"]];
    }
  });

  await assert.rejects(
    () =>
      service.quickAddExpense({
        categoryId: "expense-row-30",
        amount: 10,
        currency: "EUR",
        year: 2026,
        month: 4
      }),
    (error) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Expense category not found.");
      return true;
    }
  );
});

test("resolves latest VT Markets year by default", async () => {
  const service = new FinanceService({
    async listSheetTitles() {
      return [
        "Resultados VT Markets 2024",
        "Resultados VT Markets 2026",
        "Resultados VT Markets 2025"
      ];
    },
    async readValues(range) {
      assert.equal(range, "'Resultados VT Markets 2026'!A1:O40");
      return [
        [],
        ["", "", "TOTAL"],
        ["", "Mes", "Capital inicio mes", "Beneficios ($)", "Beneficios (%)"],
        ["", 45566, 7000, 500, 0.07],
        [],
        ["", "", "TOTAL", 500, ""]
      ];
    }
  });

  const result = await service.getVtMarketsResults({});

  assert.equal(result.year, 2026);
  assert.deepEqual(result.availableYears, [2024, 2025, 2026]);
});

test("throws a controlled error when no VT Markets sheets are available", async () => {
  const service = new FinanceService({
    async listSheetTitles() {
      return [];
    },
    async readValues() {
      throw new Error("readValues should not be called");
    }
  });

  await assert.rejects(
    () => service.getVtMarketsResults({}),
    /No VT Markets yearly result sheets were found/
  );
});
