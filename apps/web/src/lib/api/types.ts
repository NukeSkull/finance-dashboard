export type MonthlySummary = {
  year: number;
  month: number;
  sheetName: string;
  income: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  totalExpenses: number;
  invested: number;
  savings: number;
};

export type ExpenseCategory = {
  id: string;
  label: string;
};

export type QuickAddExpenseInput = {
  categoryId: string;
  amount: number;
  currency: "EUR";
  year: number;
  month: number;
};

export type QuickAddExpenseResult = {
  success: true;
  categoryId: string;
  categoryLabel: string;
  year: number;
  month: number;
  currency: "EUR";
  cell: string;
  writtenValue: string;
};

export type IncomeExpensesItem = {
  label: string;
  row: number;
  value: number;
};

export type IncomeExpensesSection = {
  title: string;
  totalLabel: string;
  items: IncomeExpensesItem[];
  total: number;
};

export type IncomeExpensesDetail = {
  year: number;
  month: number;
  sheetName: string;
  incomeSection: IncomeExpensesSection;
  essentialExpensesSection: IncomeExpensesSection;
  discretionaryExpensesSection: IncomeExpensesSection;
  grandTotalExpenses: number;
};

export type IncomeExpensesYearContextMonth = {
  month: number;
  income: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  totalExpenses: number;
  savings: number;
};

export type IncomeExpensesYearContextInsight = {
  id: string;
  tone: "positive" | "warning" | "negative" | "neutral";
  message: string;
};

export type IncomeExpensesYearContext = {
  year: number;
  selectedMonth: number;
  sheetName: string;
  monthly: IncomeExpensesYearContextMonth[];
  averages: {
    income: number;
    totalExpenses: number;
    savings: number;
  };
  insights: IncomeExpensesYearContextInsight[];
};

export type AssetOperation = {
  date: string;
  dateSerial: number;
  product: string;
  platform: string;
  quantity: number;
  unitPriceEur: number | null;
  unitPriceUsd: number | null;
  feesEur: number | null;
  feesUsd: number | null;
  totalEur: number | null;
  totalUsd: number | null;
};

export type AssetOperationsResponse = {
  operationType: "purchase" | "sale";
  sheetName: string;
  dateFrom: string;
  dateTo: string;
  summary: {
    count: number;
    totalEur: number | null;
    totalUsd: number | null;
  };
  items: AssetOperation[];
};

export type ZenGoal = {
  name: string;
  saved: number;
  remaining: number;
  target: number;
  progressRatio: number;
};

export type ZenSummary = {
  sheetName: string;
  totalSaved: number;
  availableToReturnToSpain: number;
  goals: ZenGoal[];
};

export type VtMarketsMonthlyRow = {
  month: number;
  monthLabel: string;
  startingCapital: number | null;
  profitUsd: number | null;
  profitRatio: number | null;
};

export type VtMarketsStrategyBlock = {
  key: string;
  label: string;
  columns: string[];
  rows: VtMarketsMonthlyRow[];
  totalProfitUsd: number | null;
};

export type VtMarketsResults = {
  availableYears: number[];
  year: number;
  sheetName: string;
  months: Array<{
    month: number;
    monthLabel: string;
  }>;
  strategyBlocks: VtMarketsStrategyBlock[];
  totals: {
    totalProfitUsd: number | null;
    lastMonthCapital: number | null;
    monthCount: number;
    strategyCount: number;
  };
};

export type VtMarketsGlobalResultItem = {
  year: number;
  passiveIncomeUsd: number | null;
  compoundInterestUsd: number | null;
  zeroToHeroUsd: number | null;
  totalUsd: number | null;
  investedUsd: number | null;
  withdrawnUsd: number | null;
};

export type VtMarketsGlobalResults = {
  sheetName: string;
  items: VtMarketsGlobalResultItem[];
  summary: {
    totalProfitUsd: number | null;
    investedUsd: number | null;
    withdrawnUsd: number | null;
  };
};

export type VtMarketsAccount = {
  label: string;
  accountId: string | null;
  groupKey: string;
  groupLabel: string;
  balanceUsd: number;
};

export type VtMarketsAccountGroup = {
  key: string;
  label: string;
  totalUsd: number;
};

export type VtMarketsAccountTotals = {
  sheetName: string;
  accounts: VtMarketsAccount[];
  groupedTotals: VtMarketsAccountGroup[];
  grandTotal: number;
};

export type NetWorthSite = {
  label: string;
  amount: number;
  shareRatio: number;
};

export type NetWorthGroup = {
  key: "banks" | "crypto" | "forex" | "participations";
  label: string;
  amount: number;
};

export type NetWorthSummary = {
  sheetName: string;
  totalNetWorth: number;
  liquidTotal: number;
  investedTotal: number;
  liquidRatio: number;
  investedRatio: number;
  sites: NetWorthSite[];
  groups: NetWorthGroup[];
};
