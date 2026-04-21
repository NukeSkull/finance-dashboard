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
