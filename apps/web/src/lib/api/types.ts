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
