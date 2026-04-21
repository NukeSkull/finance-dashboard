import { BadRequestException } from "@nestjs/common";
import { buildIncomeExpensesSheetName, getMonthColumn } from "./monthly-summary.utils";

const EXPENSE_CATEGORY_SECTIONS = [
  {
    startRow: 6,
    endRow: 16,
    section: "essential"
  },
  {
    startRow: 19,
    endRow: 36,
    section: "discretionary"
  }
] as const;

const FIRST_EXPENSE_CATEGORY_ROW = EXPENSE_CATEGORY_SECTIONS[0].startRow;
const LAST_EXPENSE_CATEGORY_ROW =
  EXPENSE_CATEGORY_SECTIONS[EXPENSE_CATEGORY_SECTIONS.length - 1].endRow;

export type ExpenseCategorySection =
  (typeof EXPENSE_CATEGORY_SECTIONS)[number]["section"];

export type ExpenseCategory = {
  id: string;
  label: string;
  row: number;
  section: ExpenseCategorySection;
};

export type QuickAddExpenseInput = {
  categoryId: string;
  amount: number;
  currency: "EUR";
  year: number;
  month: number;
};

export function buildExpenseCategoriesRange(year: number) {
  const sheetName = escapeSheetName(buildIncomeExpensesSheetName(year));
  return `'${sheetName}'!A${FIRST_EXPENSE_CATEGORY_ROW}:A${LAST_EXPENSE_CATEGORY_ROW}`;
}

export function buildExpenseCellRange(input: {
  year: number;
  month: number;
  row: number;
}) {
  const sheetName = escapeSheetName(buildIncomeExpensesSheetName(input.year));
  const column = getMonthColumn(input.month);
  return `'${sheetName}'!${column}${input.row}`;
}

export function buildExpenseCategories(values: unknown[][]) {
  return values
    .map((rowValue, index) => {
      const row = FIRST_EXPENSE_CATEGORY_ROW + index;
      const label = String(rowValue?.[0] ?? "").trim();

      if (!label) {
        return null;
      }

      const section = getExpenseCategorySection(row);

      if (!section) {
        return null;
      }

      return {
        id: buildExpenseCategoryId(row),
        label,
        row,
        section
      } satisfies ExpenseCategory;
    })
    .filter((category): category is ExpenseCategory => category !== null);
}

export function parseQuickAddExpenseInput(body: unknown): QuickAddExpenseInput {
  if (typeof body !== "object" || body === null) {
    throw new BadRequestException("Request body is required.");
  }

  const input = body as Record<string, unknown>;

  return {
    categoryId: parseCategoryId(input.categoryId),
    amount: parseExpenseAmount(input.amount),
    currency: parseCurrency(input.currency),
    year: parseYearValue(input.year),
    month: parseMonthValue(input.month)
  };
}

export function resolveExpenseCategoryById(
  categories: ExpenseCategory[],
  categoryId: string
) {
  return categories.find((category) => category.id === categoryId) ?? null;
}

export function planExpenseCellUpdate(input: {
  amount: number;
  existingValue: unknown;
}) {
  const amountLiteral = formatSheetNumber(input.amount);
  const existingValue = input.existingValue;

  if (existingValue === undefined || existingValue === null) {
    return {
      nextValue: `=${amountLiteral}`,
      previousValue: null
    };
  }

  if (typeof existingValue === "string") {
    const trimmed = existingValue.trim();

    if (!trimmed) {
      return {
        nextValue: `=${amountLiteral}`,
        previousValue: null
      };
    }

    if (trimmed.startsWith("=")) {
      const expression = trimmed.slice(1).trim();

      if (!expression) {
        return {
          nextValue: `=${amountLiteral}`,
          previousValue: trimmed
        };
      }

      return {
        nextValue: `=${expression}+${amountLiteral}`,
        previousValue: trimmed
      };
    }

    return planLiteralUpdate({
      amountLiteral,
      existingValue: trimmed
    });
  }

  if (typeof existingValue === "number") {
    return planLiteralUpdate({
      amountLiteral,
      existingValue
    });
  }

  throw new BadRequestException(
    "The destination cell contains an unsupported value."
  );
}

export function buildExpenseCategoryId(row: number) {
  return `expense-row-${row}`;
}

export function parseExpenseCategoryId(categoryId: string) {
  const match = /^expense-row-(\d+)$/.exec(categoryId);

  if (!match) {
    throw new BadRequestException("Invalid expense category id.");
  }

  const row = Number(match[1]);
  const section = getExpenseCategorySection(row);

  if (!section) {
    throw new BadRequestException("Expense category row is not writable.");
  }

  return { row, section };
}

function planLiteralUpdate(input: {
  amountLiteral: string;
  existingValue: number | string;
}) {
  const numericValue = parseNumericLiteralCellValue(input.existingValue);

  if (numericValue === null) {
    throw new BadRequestException(
      "The destination cell contains an unsupported value."
    );
  }

  if (numericValue === 0) {
    return {
      nextValue: `=${input.amountLiteral}`,
      previousValue: input.existingValue
    };
  }

  return {
    nextValue: `=${formatSheetNumber(numericValue)}+${input.amountLiteral}`,
    previousValue: input.existingValue
  };
}

function parseCategoryId(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestException("categoryId is required.");
  }

  parseExpenseCategoryId(value.trim());
  return value.trim();
}

function parseExpenseAmount(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim().replace(",", "."))
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException("amount must be a positive number.");
  }

  return parsed;
}

function parseCurrency(value: unknown): "EUR" {
  if (value !== "EUR") {
    throw new BadRequestException("currency must be EUR.");
  }

  return "EUR";
}

function parseYearValue(value: unknown) {
  const year = Number(value);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new BadRequestException("year must be between 2000 and 2100.");
  }

  return year;
}

function parseMonthValue(value: unknown) {
  const month = Number(value);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new BadRequestException("month must be between 1 and 12.");
  }

  return month;
}

function getExpenseCategorySection(row: number) {
  const section = EXPENSE_CATEGORY_SECTIONS.find(
    (item) => row >= item.startRow && row <= item.endRow
  );

  return section?.section ?? null;
}

function escapeSheetName(sheetName: string) {
  return sheetName.replace(/'/g, "''");
}

function formatSheetNumber(value: number) {
  const normalized = Number.isInteger(value) ? String(value) : String(value);
  return normalized.replace(".", ",");
}

function parseNumericLiteralCellValue(value: number | string) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();

  if (!/^-?\d+(?:[.,]\d+)?$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}
