const assert = require("node:assert/strict");
const test = require("node:test");
require("reflect-metadata");

const { GUARDS_METADATA } = require("@nestjs/common/constants");
const { FirebaseAuthGuard } = require("../dist/auth/firebase-auth.guard");
const { FinanceController } = require("../dist/finance/finance.controller");

test("FinanceController is protected by FirebaseAuthGuard", () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, FinanceController) ?? [];

  assert.ok(guards.includes(FirebaseAuthGuard));
});

test("delegates monthly summary with parsed query params", async () => {
  const financeService = createFinanceServiceMock();
  const controller = new FinanceController(financeService);

  const response = await controller.getMonthlySummary("2026", "4");

  assert.deepEqual(financeService.calls.getMonthlySummary[0], {
    year: 2026,
    month: 4
  });
  assert.equal(response.ok, "monthly-summary");
});

test("rejects invalid monthly summary params", async () => {
  const controller = new FinanceController(createFinanceServiceMock());

  assert.throws(
    () => controller.getMonthlySummary("2026", "99"),
    /Query param month must be between 1 and 12/
  );
});

test("delegates quick add with parsed body", async () => {
  const financeService = createFinanceServiceMock();
  const controller = new FinanceController(financeService);

  const response = await controller.quickAddExpense({
    categoryId: "expense-row-6",
    amount: "42,5",
    currency: "EUR",
    year: "2026",
    month: "4"
  });

  assert.deepEqual(financeService.calls.quickAddExpense[0], {
    categoryId: "expense-row-6",
    amount: 42.5,
    currency: "EUR",
    year: 2026,
    month: 4
  });
  assert.equal(response.ok, "quick-add");
});

test("rejects invalid quick add payload", async () => {
  const controller = new FinanceController(createFinanceServiceMock());

  assert.throws(
    () =>
      controller.quickAddExpense({
        categoryId: "",
        amount: "abc",
        currency: "USD",
        year: "2026",
        month: "4"
      }),
    /categoryId is required/
  );
});

test("delegates asset purchases with parsed filters", async () => {
  const financeService = createFinanceServiceMock();
  const controller = new FinanceController(financeService);

  const response = await controller.getAssetPurchases("2024-01-01", "2024-03-31");

  assert.deepEqual(financeService.calls.getAssetPurchases[0], {
    dateFrom: "2024-01-01",
    dateTo: "2024-03-31"
  });
  assert.equal(response.ok, "asset-purchases");
});

test("delegates unified asset history with parsed filters", async () => {
  const financeService = createFinanceServiceMock();
  const controller = new FinanceController(financeService);

  const response = await controller.getAssetOperationsHistory(
    "all",
    "btc",
    "BTC",
    "Binance",
    "EUR",
    "2024-01-01",
    "2024-03-31"
  );

  assert.deepEqual(financeService.calls.getAssetOperationsHistory[0], {
    type: "all",
    q: "btc",
    product: "BTC",
    platform: "Binance",
    currency: "EUR",
    dateFrom: "2024-01-01",
    dateTo: "2024-03-31"
  });
  assert.equal(response.ok, "asset-history");
});

test("delegates VT Markets results with optional year", async () => {
  const financeService = createFinanceServiceMock();
  const controller = new FinanceController(financeService);

  await controller.getVtMarketsResults(undefined);
  await controller.getVtMarketsResults("2025");

  assert.deepEqual(financeService.calls.getVtMarketsResults[0], { year: undefined });
  assert.deepEqual(financeService.calls.getVtMarketsResults[1], { year: 2025 });
});

function createFinanceServiceMock() {
  const calls = {
    getMonthlySummary: [],
    quickAddExpense: [],
    getAssetPurchases: [],
    getAssetOperationsHistory: [],
    getVtMarketsResults: []
  };

  return {
    calls,
    async getMonthlySummary(input) {
      calls.getMonthlySummary.push(input);
      return { ok: "monthly-summary" };
    },
    async quickAddExpense(input) {
      calls.quickAddExpense.push(input);
      return { ok: "quick-add" };
    },
    async getAssetPurchases(input) {
      calls.getAssetPurchases.push(input);
      return { ok: "asset-purchases" };
    },
    async getAssetOperationsHistory(input) {
      calls.getAssetOperationsHistory.push(input);
      return { ok: "asset-history" };
    },
    async getVtMarketsResults(input) {
      calls.getVtMarketsResults.push(input);
      return { ok: "vt-results" };
    },
    async getIncomeExpensesDetail() {
      return { ok: "income-expenses" };
    },
    async getAssetSales() {
      return { ok: "asset-sales" };
    },
    async getZenSummary() {
      return { ok: "zen" };
    },
    async getVtMarketsGlobalResults() {
      return { ok: "vt-global" };
    },
    async getVtMarketsAccountTotals() {
      return { ok: "vt-accounts" };
    },
    async getNetWorthSummary() {
      return { ok: "net-worth" };
    },
    async getExpenseCategories() {
      return { ok: "expense-categories" };
    }
  };
}
