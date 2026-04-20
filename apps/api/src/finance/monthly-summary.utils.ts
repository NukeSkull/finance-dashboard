import { BadRequestException } from "@nestjs/common";

const MONTH_COLUMNS = [
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M"
] as const;

const RANGE_START_ROW = 4;
const RANGE_END_ROW = 45;

const ROWS = {
  income: 4,
  essentialExpenses: 17,
  discretionaryExpenses: 37,
  totalExpenses: 39,
  invested: 43,
  savings: 45
} as const;

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

export function parseYear(value: string | undefined) {
  const year = Number(value);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new BadRequestException("Query param year must be between 2000 and 2100.");
  }

  return year;
}

export function parseMonth(value: string | undefined) {
  const month = Number(value);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new BadRequestException("Query param month must be between 1 and 12.");
  }

  return month;
}

export function getMonthColumn(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new BadRequestException("Month must be between 1 and 12.");
  }

  return MONTH_COLUMNS[month - 1];
}

export function buildIncomeExpensesSheetName(year: number) {
  return `Ingresos/Gastos ${year}`;
}

export function buildIncomeExpensesRange(year: number, month: number) {
  const sheetName = escapeSheetName(buildIncomeExpensesSheetName(year));
  const column = getMonthColumn(month);

  return `'${sheetName}'!${column}${RANGE_START_ROW}:${column}${RANGE_END_ROW}`;
}

export function buildMonthlySummary(input: {
  year: number;
  month: number;
  values: unknown[][];
}): MonthlySummary {
  const sheetName = buildIncomeExpensesSheetName(input.year);

  return {
    year: input.year,
    month: input.month,
    sheetName,
    income: getValueForRow(input.values, ROWS.income),
    essentialExpenses: getValueForRow(input.values, ROWS.essentialExpenses),
    discretionaryExpenses: getValueForRow(
      input.values,
      ROWS.discretionaryExpenses
    ),
    totalExpenses: getValueForRow(input.values, ROWS.totalExpenses),
    invested: getValueForRow(input.values, ROWS.invested),
    savings: getValueForRow(input.values, ROWS.savings)
  };
}

export function normalizeSheetNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    const parsed = Number(normalized);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function getValueForRow(values: unknown[][], row: number) {
  const rowIndex = row - RANGE_START_ROW;
  return normalizeSheetNumber(values[rowIndex]?.[0]);
}

function escapeSheetName(sheetName: string) {
  return sheetName.replace(/'/g, "''");
}
