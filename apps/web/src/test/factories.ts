import {
  AssetOperationsHistoryResponse,
  AssetOperationsResponse,
  IncomeExpensesDetail,
  IncomeExpensesYearContext,
  MonthlySummary,
  NetWorthSummary,
  QuickAddExpenseResult
} from "@/lib/api/types";

export function createMonthlySummary(input?: Partial<MonthlySummary>): MonthlySummary {
  return {
    discretionaryExpenses: 300,
    essentialExpenses: 800,
    income: 2500,
    invested: 400,
    month: 4,
    savings: 1000,
    sheetName: "Ingresos/Gastos 2026",
    totalExpenses: 1500,
    year: 2026,
    ...input
  };
}

export function createIncomeExpensesDetail(
  input?: Partial<IncomeExpensesDetail>
): IncomeExpensesDetail {
  return {
    discretionaryExpensesSection: {
      items: [
        { label: "Ocio", row: 37, value: 120 },
        { label: "Restaurantes", row: 38, value: 80 }
      ],
      title: "Gastos extra",
      total: 200,
      totalLabel: "Total gastos extra"
    },
    essentialExpensesSection: {
      items: [
        { label: "Alquiler", row: 17, value: 700 },
        { label: "Supermercado", row: 18, value: 250 }
      ],
      title: "Gastos vitales",
      total: 950,
      totalLabel: "Total gastos vitales"
    },
    grandTotalExpenses: 1150,
    incomeSection: {
      items: [
        { label: "Nomina", row: 4, value: 2400 },
        { label: "Extra", row: 5, value: 200 }
      ],
      title: "Ingresos",
      total: 2600,
      totalLabel: "Total ingresos"
    },
    month: 4,
    sheetName: "Ingresos/Gastos 2026",
    year: 2026,
    ...input
  };
}

export function createIncomeExpensesYearContext(
  input?: Partial<IncomeExpensesYearContext>
): IncomeExpensesYearContext {
  return {
    averages: {
      income: 2350,
      savings: 742.5,
      totalExpenses: 1052.5
    },
    insights: [
      {
        id: "expenses-above-average",
        message:
          "El gasto total de este mes esta 18,8 % por encima de la media acumulada del ano.",
        tone: "warning"
      },
      {
        id: "savings-below-average",
        message:
          "El ahorro de este mes esta 12,5 % por debajo de tu media acumulada del ano.",
        tone: "negative"
      }
    ],
    monthly: [
      {
        discretionaryExpenses: 180,
        essentialExpenses: 760,
        income: 2200,
        invested: 180,
        month: 1,
        savings: 840,
        totalExpenses: 940
      },
      {
        discretionaryExpenses: 240,
        essentialExpenses: 790,
        income: 2250,
        invested: 200,
        month: 2,
        savings: 720,
        totalExpenses: 1030
      },
      {
        discretionaryExpenses: 210,
        essentialExpenses: 780,
        income: 2350,
        invested: 220,
        month: 3,
        savings: 760,
        totalExpenses: 990
      },
      {
        discretionaryExpenses: 300,
        essentialExpenses: 950,
        income: 2600,
        invested: 260,
        month: 4,
        savings: 650,
        totalExpenses: 1250
      },
      ...Array.from({ length: 8 }, (_, index) => ({
        discretionaryExpenses: 0,
        essentialExpenses: 0,
        income: 0,
        invested: 0,
        month: index + 5,
        savings: 0,
        totalExpenses: 0
      }))
    ],
    selectedMonth: 4,
    sheetName: "Ingresos/Gastos 2026",
    year: 2026,
    ...input
  };
}

export function createAssetOperationsResponse(
  overrides?: Partial<AssetOperationsResponse>
): AssetOperationsResponse {
  return {
    dateFrom: "2026-01-01",
    dateTo: "2026-04-30",
    items: [
      {
        date: "2026-04-15",
        dateSerial: 46027,
        feesEur: null,
        feesUsd: null,
        operationType: "purchase",
        platform: "Trade Republic",
        product: "ETF MSCI World",
        quantity: 2,
        totalEur: 180,
        totalUsd: null,
        unitPriceEur: 90,
        unitPriceUsd: null
      }
    ],
    operationType: "purchase",
    sheetName: "Compras",
    summary: {
      count: 1,
      totalEur: 180,
      totalUsd: null
    },
    ...overrides
  };
}

export function createAssetOperationsHistoryResponse(
  overrides?: Partial<AssetOperationsHistoryResponse>
): AssetOperationsHistoryResponse {
  return {
    filters: {
      currency: null,
      dateFrom: null,
      dateTo: null,
      platform: null,
      product: null,
      q: null,
      type: "all"
    },
    items: [
      {
        date: "15/04/2026",
        dateSerial: 46027,
        feesEur: null,
        feesUsd: null,
        operationType: "purchase",
        platform: "Trade Republic",
        product: "ETF MSCI World",
        quantity: 2,
        totalEur: 180,
        totalUsd: null,
        unitPriceEur: 90,
        unitPriceUsd: null
      },
      {
        date: "10/04/2026",
        dateSerial: 46022,
        feesEur: null,
        feesUsd: null,
        operationType: "sale",
        platform: "Trade Republic",
        product: "ETF MSCI World",
        quantity: 1,
        totalEur: 120,
        totalUsd: null,
        unitPriceEur: 120,
        unitPriceUsd: null
      }
    ],
    options: {
      currencies: ["EUR"],
      platforms: ["Trade Republic"],
      products: ["ETF MSCI World"]
    },
    summary: {
      averageTicketEur: 150,
      netBalanceEur: -60,
      operatedAssetsCount: 1,
      operationsCount: 2,
      purchasesTotalEur: 180,
      salesTotalEur: 120
    },
    ...overrides
  };
}

export function createNetWorthSummary(input?: Partial<NetWorthSummary>): NetWorthSummary {
  return {
    groups: [
      { amount: 3200, key: "banks", label: "Bancos" },
      { amount: 8600, key: "participations", label: "Participaciones" },
      { amount: 5200, key: "forex", label: "Forex" },
      { amount: 50, key: "crypto", label: "Crypto" }
    ],
    investedRatio: 0.8281,
    investedTotal: 13850,
    liquidRatio: 0.1719,
    liquidTotal: 3200,
    sheetName: "Total",
    sites: [
      { amount: 3200, label: "ING", shareRatio: 0.1916 },
      { amount: 5200, label: "VT Markets", shareRatio: 0.3114 },
      { amount: 8600, label: "MyInvestor", shareRatio: 0.515 }
    ],
    totalNetWorth: 17050,
    ...input
  };
}

export function createQuickAddExpenseResult(
  input?: Partial<QuickAddExpenseResult>
): QuickAddExpenseResult {
  return {
    cell: "'Ingresos/Gastos 2026'!E17",
    categoryId: "rent",
    categoryLabel: "Alquiler",
    currency: "EUR",
    month: 4,
    success: true,
    writtenValue: "=700+50",
    year: 2026,
    ...input
  };
}
