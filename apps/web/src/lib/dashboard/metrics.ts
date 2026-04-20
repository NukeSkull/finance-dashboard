import { MonthlySummary } from "@/lib/api/types";

export type DashboardDerivedMetrics = {
  monthlyBalance: number;
  savingsRate: number | null;
  isEmpty: boolean;
};

export function calculateDashboardDerivedMetrics(
  summary: MonthlySummary
): DashboardDerivedMetrics {
  const monthlyBalance = summary.income - summary.totalExpenses - summary.invested;
  const savingsRate = summary.income > 0 ? summary.savings / summary.income : null;
  const isEmpty = [
    summary.income,
    summary.essentialExpenses,
    summary.discretionaryExpenses,
    summary.totalExpenses,
    summary.invested,
    summary.savings
  ].every((value) => value === 0);

  return {
    isEmpty,
    monthlyBalance,
    savingsRate
  };
}
