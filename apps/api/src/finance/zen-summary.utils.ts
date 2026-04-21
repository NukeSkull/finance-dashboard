import { NotFoundException } from "@nestjs/common";
import { normalizeSheetNumber } from "./monthly-summary.utils";

const SHEET_NAME = "Total Zen";
const RANGE_START_ROW = 2;
const RANGE_END_ROW = 6;
const RANGE_END_COLUMN = "I";

const GOAL_ROWS = {
  start: 3,
  end: 6
} as const;

const COLUMN_INDEXES = {
  name: 1,
  saved: 2,
  remaining: 3,
  target: 4,
  totalLabel: 6,
  availableLabel: 8
} as const;

const AVAILABLE_LABEL = "DISPONIBLE PARA VOLVER A ESPA\u00D1A";

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

export function buildZenSummaryRange() {
  return `'${escapeSheetName(SHEET_NAME)}'!A${RANGE_START_ROW}:${RANGE_END_COLUMN}${RANGE_END_ROW}`;
}

export function buildZenSummary(values: unknown[][]): ZenSummary {
  if (!values.length) {
    throw new NotFoundException(`No data found for sheet ${SHEET_NAME}.`);
  }

  const goals: ZenGoal[] = [];

  for (let row = GOAL_ROWS.start; row <= GOAL_ROWS.end; row += 1) {
    const name = getTrimmedCellValue(values, row, COLUMN_INDEXES.name);

    if (!name) {
      continue;
    }

    const saved = getNumericCellValue(values, row, COLUMN_INDEXES.saved);
    const remaining = getNumericCellValue(values, row, COLUMN_INDEXES.remaining);
    const target = getNumericCellValue(values, row, COLUMN_INDEXES.target);

    goals.push({
      name,
      saved,
      remaining,
      target,
      progressRatio: clampProgressRatio(saved, target)
    });
  }

  const totalLabel = getTrimmedCellValue(values, 2, COLUMN_INDEXES.totalLabel);
  const availableLabel = getTrimmedCellValue(values, 2, COLUMN_INDEXES.availableLabel);

  if (totalLabel !== "TOTAL" || availableLabel !== AVAILABLE_LABEL) {
    throw new NotFoundException(`Unexpected structure found in sheet ${SHEET_NAME}.`);
  }

  if (goals.length === 0) {
    throw new NotFoundException(`No goals found in sheet ${SHEET_NAME}.`);
  }

  return {
    sheetName: SHEET_NAME,
    totalSaved: getNumericCellValue(values, 3, COLUMN_INDEXES.totalLabel),
    availableToReturnToSpain: getNumericCellValue(values, 3, COLUMN_INDEXES.availableLabel),
    goals
  };
}

function getTrimmedCellValue(values: unknown[][], row: number, columnIndex: number) {
  const rowIndex = row - RANGE_START_ROW;
  const value = values[rowIndex]?.[columnIndex];
  return String(value ?? "").trim();
}

function getNumericCellValue(values: unknown[][], row: number, columnIndex: number) {
  const rowIndex = row - RANGE_START_ROW;
  return normalizeSheetNumber(values[rowIndex]?.[columnIndex]);
}

function clampProgressRatio(saved: number, target: number) {
  if (!Number.isFinite(target) || target <= 0) {
    return 0;
  }

  return Math.min(Math.max(saved / target, 0), 1);
}

function escapeSheetName(sheetName: string) {
  return sheetName.replace(/'/g, "''");
}
