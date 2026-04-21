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
