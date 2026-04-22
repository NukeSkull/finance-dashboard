import { MonthlySummary } from "@/lib/api/types";

export type DashboardSignal = {
  id: string;
  kind: "alert" | "info";
  severity: "high" | "medium" | "low";
  message: string;
  tone: "negative" | "positive" | "neutral";
};

export type DashboardDerivedMetrics = {
  signals: DashboardSignal[];
  monthlyBalance: number;
  savingsRate: number | null;
  isEmpty: boolean;
};

export type SummaryDelta = {
  absolute: number;
  direction: "up" | "down" | "flat";
  label: string;
};

export function calculateDashboardDerivedMetrics(
  summary: MonthlySummary,
  previousSummary?: MonthlySummary | null
): DashboardDerivedMetrics {
  const monthlyBalance = summary.income - summary.totalExpenses;
  const savingsRate = summary.income > 0 ? summary.savings / summary.income : null;
  const isEmpty = [
    summary.income,
    summary.essentialExpenses,
    summary.discretionaryExpenses,
    summary.totalExpenses,
    summary.invested,
    summary.savings
  ].every((value) => value === 0);
  const signals = buildDashboardSignals(summary, previousSummary);

  return {
    signals,
    isEmpty,
    monthlyBalance,
    savingsRate
  };
}

export function buildSummaryDelta(
  currentValue: number,
  previousValue: number,
  label: string
): SummaryDelta {
  const absolute = currentValue - previousValue;

  return {
    absolute,
    direction: absolute === 0 ? "flat" : absolute > 0 ? "up" : "down",
    label
  };
}

export function getPreviousMonthSelection(input: { month: number; year: number }) {
  if (input.month === 1) {
    return {
      month: 12,
      year: input.year - 1
    };
  }

  return {
    month: input.month - 1,
    year: input.year
  };
}

function buildDashboardSignals(
  summary: MonthlySummary,
  previousSummary?: MonthlySummary | null
) {
  const signals: DashboardSignal[] = [];
  const incomeDeltaThreshold = getDeltaThreshold(summary.income);
  const expensesDeltaThreshold = getDeltaThreshold(summary.totalExpenses);
  const savingsDeltaThreshold = getDeltaThreshold(Math.max(Math.abs(summary.savings), summary.income));

  if (summary.savings < 0) {
    signals.push({
      id: "negative-savings",
      kind: "alert",
      message: "El ahorro del periodo es negativo.",
      severity: "high",
      tone: "negative"
    });
  }

  if (summary.totalExpenses > summary.income) {
    signals.push({
      id: "expenses-over-income",
      kind: "alert",
      message: "El gasto total supera a los ingresos del periodo.",
      severity: "high",
      tone: "negative"
    });
  }

  if (summary.discretionaryExpenses > summary.essentialExpenses) {
    signals.push({
      id: "discretionary-over-essential",
      kind: "alert",
      message: "Los gastos extra estan por encima de los gastos vitales.",
      severity: "medium",
      tone: "negative"
    });
  }

  if (summary.savings > 0 && summary.income > 0 && summary.savings / summary.income >= 0.2) {
    signals.push({
      id: "healthy-savings-rate",
      kind: "info",
      message: "El ratio de ahorro del periodo se mantiene en una zona saludable.",
      severity: "low",
      tone: "positive"
    });
  }

  if (previousSummary) {
    const savingsDelta = summary.savings - previousSummary.savings;
    const expensesDelta = summary.totalExpenses - previousSummary.totalExpenses;
    const incomeDelta = summary.income - previousSummary.income;

    if (savingsDelta < -savingsDeltaThreshold) {
      signals.push({
        id: "savings-down",
        kind: "alert",
        message: "El ahorro ha caido respecto al periodo anterior.",
        severity: Math.abs(savingsDelta) >= savingsDeltaThreshold * 2 ? "high" : "medium",
        tone: "negative"
      });
    }

    if (expensesDelta > expensesDeltaThreshold) {
      signals.push({
        id: "expenses-up",
        kind: "alert",
        message: "El gasto total ha subido respecto al periodo anterior.",
        severity: expensesDelta >= expensesDeltaThreshold * 2 ? "high" : "medium",
        tone: "negative"
      });
    }

    if (incomeDelta > incomeDeltaThreshold) {
      signals.push({
        id: "income-up",
        kind: "info",
        message: "Los ingresos han mejorado respecto al periodo anterior.",
        severity: incomeDelta >= incomeDeltaThreshold * 2 ? "medium" : "low",
        tone: "positive"
      });
    }
  }

  return rankSignals(signals).slice(0, 4);
}

function getDeltaThreshold(reference: number) {
  return Math.max(50, reference * 0.05);
}

function rankSignals(signals: DashboardSignal[]) {
  const severityWeight = {
    high: 3,
    medium: 2,
    low: 1
  } as const;

  const kindWeight = {
    alert: 2,
    info: 1
  } as const;

  return [...signals].sort((left, right) => {
    const rightScore =
      severityWeight[right.severity] * 10 + kindWeight[right.kind];
    const leftScore =
      severityWeight[left.severity] * 10 + kindWeight[left.kind];

    return rightScore - leftScore;
  });
}
