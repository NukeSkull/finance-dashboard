import { BadRequestException, NotFoundException } from "@nestjs/common";
import { normalizeSheetNumber } from "./monthly-summary.utils";

const VT_RESULTS_YEAR_PATTERN = /^Resultados VT Markets (\d{4})$/;
const VT_RESULTS_RANGE_END_COLUMN = "O";
const VT_RESULTS_RANGE_END_ROW = 40;
const VT_GLOBAL_RESULTS_SHEET = "Resultados Globales VT Markets";
const VT_ACCOUNT_TOTALS_SHEET = "Total VT Markets";
const GOOGLE_SHEETS_EPOCH = Date.UTC(1899, 11, 30);

const RESULTS_HEADER_ROW_INDEX = 1;
const RESULTS_SUBHEADER_ROW_INDEX = 2;
const RESULTS_MONTH_COLUMN_INDEX = 1;

const GLOBAL_YEAR_COLUMN_INDEX = 1;
const GLOBAL_PASSIVE_COLUMN_INDEX = 2;
const GLOBAL_COMPOUND_COLUMN_INDEX = 3;
const GLOBAL_ZERO_TO_HERO_COLUMN_INDEX = 4;
const GLOBAL_TOTAL_COLUMN_INDEX = 5;
const GLOBAL_INVESTED_COLUMN_INDEX = 7;
const GLOBAL_WITHDRAWN_COLUMN_INDEX = 8;

export type VtMarketsMonthlyRow = {
  month: number;
  monthLabel: string;
  startingCapital: number | null;
  profitUsd: number | null;
  profitRatio: number | null;
};

export type VtMarketsStrategyBlock = {
  key: string;
  label: string;
  columns: string[];
  rows: VtMarketsMonthlyRow[];
  totalProfitUsd: number | null;
};

export type VtMarketsResults = {
  availableYears: number[];
  year: number;
  sheetName: string;
  months: Array<{
    month: number;
    monthLabel: string;
  }>;
  strategyBlocks: VtMarketsStrategyBlock[];
  totals: {
    totalProfitUsd: number | null;
    lastMonthCapital: number | null;
    monthCount: number;
    strategyCount: number;
  };
};

export type VtMarketsGlobalResultItem = {
  year: number;
  passiveIncomeUsd: number | null;
  compoundInterestUsd: number | null;
  zeroToHeroUsd: number | null;
  totalUsd: number | null;
  investedUsd: number | null;
  withdrawnUsd: number | null;
};

export type VtMarketsGlobalResults = {
  sheetName: string;
  items: VtMarketsGlobalResultItem[];
  summary: {
    totalProfitUsd: number | null;
    investedUsd: number | null;
    withdrawnUsd: number | null;
  };
};

export type VtMarketsAccount = {
  label: string;
  accountId: string | null;
  groupKey: string;
  groupLabel: string;
  balanceUsd: number;
};

export type VtMarketsAccountGroup = {
  key: string;
  label: string;
  totalUsd: number;
};

export type VtMarketsAccountTotals = {
  sheetName: string;
  accounts: VtMarketsAccount[];
  groupedTotals: VtMarketsAccountGroup[];
  grandTotal: number;
};

export function buildVtMarketsResultsRange(year: number) {
  const sheetName = escapeSheetName(`Resultados VT Markets ${year}`);
  return `'${sheetName}'!A1:${VT_RESULTS_RANGE_END_COLUMN}${VT_RESULTS_RANGE_END_ROW}`;
}

export function buildVtMarketsGlobalResultsRange() {
  return `'${escapeSheetName(VT_GLOBAL_RESULTS_SHEET)}'!A1:I20`;
}

export function buildVtMarketsAccountTotalsRange() {
  return `'${escapeSheetName(VT_ACCOUNT_TOTALS_SHEET)}'!A1:K6`;
}

export function discoverVtMarketsYears(sheetTitles: string[]) {
  return sheetTitles
    .map((title) => {
      const match = title.match(VT_RESULTS_YEAR_PATTERN);
      return match ? Number(match[1]) : null;
    })
    .filter((year): year is number => year !== null)
    .sort((left, right) => left - right);
}

export function resolveVtMarketsResultsYear(
  requestedYear: number | undefined,
  availableYears: number[]
) {
  if (availableYears.length === 0) {
    throw new NotFoundException("No VT Markets yearly result sheets were found.");
  }

  if (requestedYear === undefined) {
    return availableYears[availableYears.length - 1];
  }

  if (!availableYears.includes(requestedYear)) {
    throw new BadRequestException("Requested VT Markets year is not available.");
  }

  return requestedYear;
}

export function buildVtMarketsResults(input: {
  year: number;
  availableYears: number[];
  values: unknown[][];
}): VtMarketsResults {
  const populatedColumnCount = getPopulatedColumnCount(input.values);
  const blockStartIndexes = getBlockStartIndexes(input.values[RESULTS_HEADER_ROW_INDEX] ?? []);
  const monthEntries = getVtMonthEntries(input.values);
  const totalRowIndex = findResultsTotalRowIndex(input.values);

  if (blockStartIndexes.length === 0 || monthEntries.length === 0) {
    throw new NotFoundException(`Unexpected VT Markets results structure for ${input.year}.`);
  }

  const strategyBlocks = blockStartIndexes.map((startIndex, blockIndex) => {
    const endIndex =
      blockIndex < blockStartIndexes.length - 1
        ? blockStartIndexes[blockIndex + 1] - 1
        : populatedColumnCount - 1;
    const label = getTrimmedCellValue(
      input.values[RESULTS_HEADER_ROW_INDEX]?.[startIndex]
    );
    const columns = (input.values[RESULTS_SUBHEADER_ROW_INDEX] ?? [])
      .slice(startIndex, endIndex + 1)
      .map((value) => getTrimmedCellValue(value))
      .filter(Boolean);
    const fieldIndexes = getResultsFieldIndexes(
      input.values[RESULTS_SUBHEADER_ROW_INDEX] ?? [],
      startIndex,
      endIndex
    );
    const rows = monthEntries.map((entry) => ({
      month: entry.month,
      monthLabel: entry.monthLabel,
      startingCapital: getNullableNumericCellValue(
        getValueAtColumnIndex(
          input.values[entry.rowIndex],
          fieldIndexes.startingCapital
        )
      ),
      profitUsd: getNullableNumericCellValue(
        getValueAtColumnIndex(input.values[entry.rowIndex], fieldIndexes.profitUsd)
      ),
      profitRatio: getNullableNumericCellValue(
        getValueAtColumnIndex(input.values[entry.rowIndex], fieldIndexes.profitRatio)
      )
    }));

    return {
      key: slugify(label),
      label,
      columns,
      rows,
      totalProfitUsd:
        totalRowIndex >= 0
          ? getNullableNumericCellValue(
              getValueAtColumnIndex(input.values[totalRowIndex], fieldIndexes.profitUsd)
            )
          : null
    } satisfies VtMarketsStrategyBlock;
  });

  const totalBlock =
    strategyBlocks.find((block) => slugify(block.label) === "total") ??
    strategyBlocks[strategyBlocks.length - 1];
  const lastMonthRow = totalBlock.rows[totalBlock.rows.length - 1] ?? null;

  return {
    availableYears: input.availableYears,
    year: input.year,
    sheetName: `Resultados VT Markets ${input.year}`,
    months: monthEntries.map((entry) => ({
      month: entry.month,
      monthLabel: entry.monthLabel
    })),
    strategyBlocks,
    totals: {
      totalProfitUsd: totalBlock.totalProfitUsd,
      lastMonthCapital: lastMonthRow?.startingCapital ?? null,
      monthCount: monthEntries.length,
      strategyCount: strategyBlocks.length
    }
  };
}

export function buildVtMarketsGlobalResults(
  values: unknown[][]
): VtMarketsGlobalResults {
  const items = values
    .slice(2)
    .map((row) => {
      const year = Number(row[GLOBAL_YEAR_COLUMN_INDEX]);

      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return null;
      }

      return {
        year,
        passiveIncomeUsd: getNullableNumericCellValue(row[GLOBAL_PASSIVE_COLUMN_INDEX]),
        compoundInterestUsd: getNullableNumericCellValue(
          row[GLOBAL_COMPOUND_COLUMN_INDEX]
        ),
        zeroToHeroUsd: getNullableNumericCellValue(
          row[GLOBAL_ZERO_TO_HERO_COLUMN_INDEX]
        ),
        totalUsd: getNullableNumericCellValue(row[GLOBAL_TOTAL_COLUMN_INDEX]),
        investedUsd: getNullableNumericCellValue(row[GLOBAL_INVESTED_COLUMN_INDEX]),
        withdrawnUsd: getNullableNumericCellValue(row[GLOBAL_WITHDRAWN_COLUMN_INDEX])
      } satisfies VtMarketsGlobalResultItem;
    })
    .filter((item): item is VtMarketsGlobalResultItem => item !== null);

  if (items.length === 0) {
    throw new NotFoundException("No VT Markets global results were found.");
  }

  return {
    sheetName: VT_GLOBAL_RESULTS_SHEET,
    items,
    summary: {
      totalProfitUsd: sumNullable(items.map((item) => item.totalUsd)),
      investedUsd: sumNullable(items.map((item) => item.investedUsd)),
      withdrawnUsd: sumNullable(items.map((item) => item.withdrawnUsd))
    }
  };
}

export function buildVtMarketsAccountTotals(
  values: unknown[][]
): VtMarketsAccountTotals {
  const headerRow = values[1] ?? [];
  const valueRow = values[2] ?? [];
  const accounts: VtMarketsAccount[] = [];
  let grandTotal = 0;

  for (let columnIndex = 1; columnIndex < headerRow.length; columnIndex += 1) {
    const rawHeader = getTrimmedCellValue(headerRow[columnIndex]);

    if (!rawHeader) {
      continue;
    }

    if (normalizeLabel(rawHeader) === "TOTAL") {
      grandTotal = normalizeSheetNumber(valueRow[columnIndex]);
      continue;
    }

    const parsedHeader = parseAccountHeader(rawHeader);
    const group = resolveAccountGroup(parsedHeader.label);

    accounts.push({
      label: parsedHeader.label,
      accountId: parsedHeader.accountId,
      groupKey: group.key,
      groupLabel: group.label,
      balanceUsd: normalizeSheetNumber(valueRow[columnIndex])
    });
  }

  if (accounts.length === 0) {
    throw new NotFoundException("No VT Markets accounts were found.");
  }

  const groupedTotals = Object.values(
    accounts.reduce<Record<string, VtMarketsAccountGroup>>((accumulator, account) => {
      const existing = accumulator[account.groupKey];

      if (existing) {
        existing.totalUsd += account.balanceUsd;
      } else {
        accumulator[account.groupKey] = {
          key: account.groupKey,
          label: account.groupLabel,
          totalUsd: account.balanceUsd
        };
      }

      return accumulator;
    }, {})
  );

  return {
    sheetName: VT_ACCOUNT_TOTALS_SHEET,
    accounts,
    groupedTotals,
    grandTotal
  };
}

function getBlockStartIndexes(headerRow: unknown[]) {
  const indexes: number[] = [];

  for (let columnIndex = 0; columnIndex < headerRow.length; columnIndex += 1) {
    if (getTrimmedCellValue(headerRow[columnIndex])) {
      indexes.push(columnIndex);
    }
  }

  return indexes;
}

function getResultsFieldIndexes(
  subheaderRow: unknown[],
  startIndex: number,
  endIndex: number
) {
  let startingCapital: number | null = null;
  let profitUsd: number | null = null;
  let profitRatio: number | null = null;

  for (let columnIndex = startIndex; columnIndex <= endIndex; columnIndex += 1) {
    const header = normalizeLabel(subheaderRow[columnIndex]);

    if (startingCapital === null && header.includes("CAPITAL INICIO MES")) {
      startingCapital = columnIndex;
    }

    if (profitUsd === null && header.includes("BENEFICIOS ($)")) {
      profitUsd = columnIndex;
    }

    if (
      profitRatio === null &&
      (header.includes("BENEFICIOS (%)") || header.includes("BENEFICIOS(%)"))
    ) {
      profitRatio = columnIndex;
    }
  }

  return {
    startingCapital,
    profitUsd,
    profitRatio
  };
}

function getVtMonthEntries(values: unknown[][]) {
  const entries: Array<{ rowIndex: number; month: number; monthLabel: string }> = [];

  for (let rowIndex = RESULTS_SUBHEADER_ROW_INDEX + 1; rowIndex < values.length; rowIndex += 1) {
    const month = getNullableNumericCellValue(values[rowIndex]?.[RESULTS_MONTH_COLUMN_INDEX]);

    if (month === null) {
      continue;
    }

    entries.push({
      rowIndex,
      month,
      monthLabel: formatMonthLabel(month)
    });
  }

  return entries;
}

function findResultsTotalRowIndex(values: unknown[][]) {
  for (let rowIndex = RESULTS_SUBHEADER_ROW_INDEX + 1; rowIndex < values.length; rowIndex += 1) {
    if (
      values[rowIndex]?.some((value) => normalizeLabel(value) === "TOTAL")
    ) {
      return rowIndex;
    }
  }

  return -1;
}

function getPopulatedColumnCount(values: unknown[][]) {
  return values.reduce((maxColumns, row) => {
    let lastIndex = -1;

    for (let columnIndex = row.length - 1; columnIndex >= 0; columnIndex -= 1) {
      if (getTrimmedCellValue(row[columnIndex])) {
        lastIndex = columnIndex;
        break;
      }
    }

    return Math.max(maxColumns, lastIndex + 1);
  }, 0);
}

function getTrimmedCellValue(value: unknown) {
  return String(value ?? "").trim();
}

function getNullableNumericCellValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed || trimmed.startsWith("=")) {
      return null;
    }
  }

  return normalizeSheetNumber(value);
}

function getValueAtColumnIndex(row: unknown[] | undefined, columnIndex: number | null) {
  if (!row || columnIndex === null) {
    return undefined;
  }

  return row[columnIndex];
}

function sumNullable(values: Array<number | null>) {
  const numericValues = values.filter((value): value is number => value !== null);
  return numericValues.length > 0
    ? numericValues.reduce((sum, value) => sum + value, 0)
    : null;
}

function formatMonthLabel(serial: number) {
  const date = new Date(GOOGLE_SHEETS_EPOCH + serial * 24 * 60 * 60 * 1000);
  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic"
  ];

  return `${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function parseAccountHeader(rawHeader: string) {
  const lines = rawHeader
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const accountIdMatch = rawHeader.match(/\(([^)]*)\)/);

  return {
    label: lines[0] ?? rawHeader.trim(),
    accountId: accountIdMatch?.[1]?.trim() ? accountIdMatch[1].trim() : null
  };
}

function resolveAccountGroup(label: string) {
  const normalized = normalizeLabel(label);

  if (normalized.startsWith("INGRESOS PASIVOS")) {
    return { key: "passive-income", label: "Ingresos pasivos" };
  }

  if (normalized.startsWith("INTERES COMPUESTO")) {
    return { key: "compound-interest", label: "Interes compuesto" };
  }

  if (normalized.startsWith("ZERO 2 HERO")) {
    return { key: "zero-to-hero", label: "Zero 2 Hero" };
  }

  if (normalized.startsWith("CUENTA AHORRO")) {
    return { key: "savings-account", label: "Cuenta ahorro" };
  }

  return { key: "other", label: "Otros" };
}

function normalizeLabel(value: unknown) {
  return getTrimmedCellValue(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function escapeSheetName(sheetName: string) {
  return sheetName.replace(/'/g, "''");
}
