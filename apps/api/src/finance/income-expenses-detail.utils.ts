import { NotFoundException } from "@nestjs/common";
import {
  buildIncomeExpensesSheetName,
  getMonthColumn,
  normalizeSheetNumber
} from "./monthly-summary.utils";

const INCOME_ROWS = {
  start: 2,
  end: 3,
  total: 4
} as const;

const ESSENTIAL_EXPENSE_ROWS = {
  start: 6,
  end: 16,
  total: 17
} as const;

const DISCRETIONARY_EXPENSE_ROWS = {
  start: 19,
  end: 36,
  total: 37
} as const;

const RANGE_START_ROW = 2;
const RANGE_END_ROW = 37;
const RANGE_END_COLUMN = "M";

export type IncomeExpensesDetailItem = {
  label: string;
  row: number;
  value: number;
};

export type IncomeExpensesDetailSection = {
  title: string;
  totalLabel: string;
  items: IncomeExpensesDetailItem[];
  total: number;
};

export type IncomeExpensesDetail = {
  year: number;
  month: number;
  sheetName: string;
  incomeSection: IncomeExpensesDetailSection;
  essentialExpensesSection: IncomeExpensesDetailSection;
  discretionaryExpensesSection: IncomeExpensesDetailSection;
  grandTotalExpenses: number;
};

export function buildIncomeExpensesDetailRange(year: number) {
  const sheetName = escapeSheetName(buildIncomeExpensesSheetName(year));
  return `'${sheetName}'!A${RANGE_START_ROW}:${RANGE_END_COLUMN}${RANGE_END_ROW}`;
}

export function buildIncomeExpensesDetail(input: {
  year: number;
  month: number;
  values: unknown[][];
}): IncomeExpensesDetail {
  const sheetName = buildIncomeExpensesSheetName(input.year);
  const monthColumnIndex = getMonthColumnIndex(input.month);

  const incomeSection = buildSection({
    values: input.values,
    monthColumnIndex,
    rows: INCOME_ROWS,
    title: "Ingresos",
    totalLabel: "Total ingresos"
  });
  const essentialExpensesSection = buildSection({
    values: input.values,
    monthColumnIndex,
    rows: ESSENTIAL_EXPENSE_ROWS,
    title: "Gastos vitales",
    totalLabel: "Total gastos vitales"
  });
  const discretionaryExpensesSection = buildSection({
    values: input.values,
    monthColumnIndex,
    rows: DISCRETIONARY_EXPENSE_ROWS,
    title: "Gastos extra",
    totalLabel: "Total gastos extraordinarios y ocio"
  });

  if (
    incomeSection.items.length === 0 &&
    essentialExpensesSection.items.length === 0 &&
    discretionaryExpensesSection.items.length === 0
  ) {
    throw new NotFoundException(`No values found for sheet: ${sheetName}`);
  }

  return {
    year: input.year,
    month: input.month,
    sheetName,
    incomeSection,
    essentialExpensesSection,
    discretionaryExpensesSection,
    grandTotalExpenses:
      essentialExpensesSection.total + discretionaryExpensesSection.total
  };
}

function buildSection(input: {
  values: unknown[][];
  monthColumnIndex: number;
  rows: {
    start: number;
    end: number;
    total: number;
  };
  title: string;
  totalLabel: string;
}) {
  const items: IncomeExpensesDetailItem[] = [];

  for (let row = input.rows.start; row <= input.rows.end; row += 1) {
    const label = getLabelForRow(input.values, row);

    if (!label) {
      continue;
    }

    items.push({
      label,
      row,
      value: getMonthValueForRow(input.values, row, input.monthColumnIndex)
    });
  }

  return {
    title: input.title,
    totalLabel: input.totalLabel,
    items,
    total: getMonthValueForRow(input.values, input.rows.total, input.monthColumnIndex)
  };
}

function getLabelForRow(values: unknown[][], row: number) {
  const rowIndex = row - RANGE_START_ROW;
  const value = values[rowIndex]?.[0];
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function getMonthValueForRow(
  values: unknown[][],
  row: number,
  monthColumnIndex: number
) {
  const rowIndex = row - RANGE_START_ROW;
  return normalizeSheetNumber(values[rowIndex]?.[monthColumnIndex]);
}

function getMonthColumnIndex(month: number) {
  return getMonthColumn(month).charCodeAt(0) - "B".charCodeAt(0) + 1;
}

function escapeSheetName(sheetName: string) {
  return sheetName.replace(/'/g, "''");
}
