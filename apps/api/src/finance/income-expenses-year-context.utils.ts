import { buildIncomeExpensesSheetName, normalizeSheetNumber } from "./monthly-summary.utils";

const RANGE_START_ROW = 2;
const RANGE_END_ROW = 45;
const RANGE_END_COLUMN = "M";

const ROWS = {
  income: 4,
  essentialExpenses: 17,
  discretionaryExpenses: 37,
  totalExpenses: 39,
  savings: 45
} as const;

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

export function buildIncomeExpensesYearContextRange(year: number) {
  const sheetName = escapeSheetName(buildIncomeExpensesSheetName(year));
  return `'${sheetName}'!A${RANGE_START_ROW}:${RANGE_END_COLUMN}${RANGE_END_ROW}`;
}

export function buildIncomeExpensesYearContext(input: {
  year: number;
  selectedMonth: number;
  values: unknown[][];
}): IncomeExpensesYearContext {
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;

    return {
      month,
      income: getMonthValueForRow(input.values, ROWS.income, month),
      essentialExpenses: getMonthValueForRow(input.values, ROWS.essentialExpenses, month),
      discretionaryExpenses: getMonthValueForRow(
        input.values,
        ROWS.discretionaryExpenses,
        month
      ),
      totalExpenses: getMonthValueForRow(input.values, ROWS.totalExpenses, month),
      savings: getMonthValueForRow(input.values, ROWS.savings, month)
    };
  });

  const elapsedMonths = monthly.filter((item) => item.month <= input.selectedMonth);
  const averages = {
    income: average(elapsedMonths.map((item) => item.income)),
    totalExpenses: average(elapsedMonths.map((item) => item.totalExpenses)),
    savings: average(elapsedMonths.map((item) => item.savings))
  };

  return {
    year: input.year,
    selectedMonth: input.selectedMonth,
    sheetName: buildIncomeExpensesSheetName(input.year),
    monthly,
    averages,
    insights: buildInsights(monthly, input.selectedMonth, averages)
  };
}

function buildInsights(
  monthly: IncomeExpensesYearContextMonth[],
  selectedMonth: number,
  averages: {
    income: number;
    totalExpenses: number;
    savings: number;
  }
) {
  const current = monthly.find((item) => item.month === selectedMonth);

  if (!current) {
    return [];
  }

  const elapsedMonths = monthly.filter((item) => item.month <= selectedMonth);
  const averageDiscretionary = average(
    elapsedMonths.map((item) => item.discretionaryExpenses)
  );
  const insights: IncomeExpensesYearContextInsight[] = [];
  const totalExpensesDelta = buildDeltaRatio(current.totalExpenses, averages.totalExpenses);
  const savingsDelta = buildDeltaRatio(current.savings, averages.savings);
  const discretionaryDelta = buildDeltaRatio(
    current.discretionaryExpenses,
    averageDiscretionary
  );

  if (current.totalExpenses > averages.totalExpenses * 1.1 && totalExpensesDelta !== null) {
    insights.push({
      id: "expenses-above-average",
      tone: "warning",
      message: `El gasto total de este mes esta ${formatRatio(totalExpensesDelta)} por encima de la media acumulada del ano.`
    });
  } else if (
    current.totalExpenses < averages.totalExpenses * 0.9 &&
    totalExpensesDelta !== null
  ) {
    insights.push({
      id: "expenses-below-average",
      tone: "positive",
      message: `El gasto total de este mes esta ${formatRatio(totalExpensesDelta)} por debajo de la media acumulada del ano.`
    });
  }

  if (current.savings < averages.savings * 0.9 && savingsDelta !== null) {
    insights.push({
      id: "savings-below-average",
      tone: "negative",
      message: `El ahorro de este mes esta ${formatRatio(savingsDelta)} por debajo de tu media acumulada del ano.`
    });
  } else if (current.savings > averages.savings * 1.1 && savingsDelta !== null) {
    insights.push({
      id: "savings-above-average",
      tone: "positive",
      message: `El ahorro de este mes esta ${formatRatio(savingsDelta)} por encima de tu media acumulada del ano.`
    });
  } else if (
    current.discretionaryExpenses > averageDiscretionary * 1.15 &&
    discretionaryDelta !== null
  ) {
    insights.push({
      id: "discretionary-above-average",
      tone: "warning",
      message: `Los gastos extra de este mes estan ${formatRatio(discretionaryDelta)} por encima de la media acumulada del ano.`
    });
  } else if (
    current.discretionaryExpenses < averageDiscretionary * 0.85 &&
    discretionaryDelta !== null
  ) {
    insights.push({
      id: "discretionary-below-average",
      tone: "positive",
      message: `Los gastos extra de este mes estan ${formatRatio(discretionaryDelta)} por debajo de la media acumulada del ano.`
    });
  }

  return insights.slice(0, 2);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildDeltaRatio(value: number, averageValue: number) {
  if (averageValue === 0) {
    return null;
  }

  return Math.abs(value - averageValue) / Math.abs(averageValue);
}

function formatRatio(value: number) {
  return `${(value * 100).toFixed(1).replace(".", ",")} %`;
}

function getMonthValueForRow(values: unknown[][], row: number, month: number) {
  const rowIndex = row - RANGE_START_ROW;
  const columnIndex = month;
  return normalizeSheetNumber(values[rowIndex]?.[columnIndex]);
}

function escapeSheetName(sheetName: string) {
  return sheetName.replace(/'/g, "''");
}
