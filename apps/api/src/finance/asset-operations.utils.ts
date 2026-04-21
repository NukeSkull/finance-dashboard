import { BadRequestException, NotFoundException } from "@nestjs/common";
import { normalizeSheetNumber } from "./monthly-summary.utils";

const GOOGLE_SHEETS_EPOCH = Date.UTC(1899, 11, 30);
const RANGE_END_COLUMN = "J";
const RANGE_START_ROW = 1;
const EURO_SYMBOL = "\u20AC";

type AssetOperationKind = "purchase" | "sale";

type AssetOperationSheetConfig = {
  sheetName: string;
  dateHeader: string;
  platformHeader: string;
  totalHeaderPrefix: string;
};

const SHEET_CONFIG: Record<AssetOperationKind, AssetOperationSheetConfig> = {
  purchase: {
    sheetName: "Compras",
    dateHeader: "Fecha",
    platformHeader: "Plataforma de compra",
    totalHeaderPrefix: "Total compra"
  },
  sale: {
    sheetName: "Ventas",
    dateHeader: "Fecha de compra",
    platformHeader: "Plataforma de venta",
    totalHeaderPrefix: "Total venta"
  }
};

export type AssetOperationsFilter = {
  dateFrom: string;
  dateTo: string;
};

export type AssetOperation = {
  date: string;
  dateSerial: number;
  product: string;
  platform: string;
  quantity: number;
  unitPriceEur: number | null;
  unitPriceUsd: number | null;
  feesEur: number | null;
  feesUsd: number | null;
  totalEur: number | null;
  totalUsd: number | null;
};

export type AssetOperationsSummary = {
  count: number;
  totalEur: number | null;
  totalUsd: number | null;
};

export type AssetOperationsResponse = {
  operationType: AssetOperationKind;
  sheetName: string;
  dateFrom: string;
  dateTo: string;
  summary: AssetOperationsSummary;
  items: AssetOperation[];
};

export function parseAssetOperationsFilter(query: {
  dateFrom?: string;
  dateTo?: string;
}) {
  const today = new Date();
  const defaultDateTo = formatDate(today);
  const defaultDateFrom = formatDate(
    new Date(today.getFullYear(), today.getMonth() - 2, today.getDate())
  );
  const dateFrom = parseDateQuery(query.dateFrom, defaultDateFrom, "dateFrom");
  const dateTo = parseDateQuery(query.dateTo, defaultDateTo, "dateTo");

  if (dateFrom > dateTo) {
    throw new BadRequestException("dateFrom must be before or equal to dateTo.");
  }

  return {
    dateFrom: formatDate(dateFrom),
    dateTo: formatDate(dateTo)
  } satisfies AssetOperationsFilter;
}

export function buildAssetOperationsRange(kind: AssetOperationKind) {
  const sheetName = escapeSheetName(SHEET_CONFIG[kind].sheetName);
  return `'${sheetName}'!A${RANGE_START_ROW}:${RANGE_END_COLUMN}`;
}

export function buildAssetOperationsResponse(input: {
  kind: AssetOperationKind;
  filter: AssetOperationsFilter;
  values: unknown[][];
}): AssetOperationsResponse {
  const config = SHEET_CONFIG[input.kind];
  const header = input.values[0];

  if (!header?.length) {
    throw new NotFoundException(`No data found for sheet ${config.sheetName}.`);
  }

  const columnIndexes = getColumnIndexes(input.kind, header);
  const fromTime = Date.parse(input.filter.dateFrom);
  const toTime = Date.parse(input.filter.dateTo);

  const items = input.values
    .slice(1)
    .map((row) => parseAssetOperationRow(row, columnIndexes))
    .filter((item): item is AssetOperation => item !== null)
    .filter((item) => {
      const currentTime = googleSheetsSerialToDate(item.dateSerial).getTime();
      return currentTime >= fromTime && currentTime <= toTime;
    })
    .sort((left, right) => right.dateSerial - left.dateSerial);

  return {
    operationType: input.kind,
    sheetName: config.sheetName,
    dateFrom: input.filter.dateFrom,
    dateTo: input.filter.dateTo,
    summary: {
      count: items.length,
      totalEur: sumNullable(items.map((item) => item.totalEur)),
      totalUsd: sumNullable(items.map((item) => item.totalUsd))
    },
    items
  };
}

function getColumnIndexes(kind: AssetOperationKind, headerRow: unknown[]) {
  const config = SHEET_CONFIG[kind];
  const headers = headerRow.map((value) => String(value ?? "").trim());

  return {
    date: findColumnIndex(headers, config.dateHeader),
    product: findColumnIndex(headers, "Producto"),
    platform: findColumnIndex(headers, config.platformHeader),
    quantity: findColumnIndex(headers, "Cantidad"),
    unitPriceEur: findColumnIndex(headers, `Precio unitario (${EURO_SYMBOL})`),
    unitPriceUsd: findColumnIndex(headers, "Precio unitario ($)"),
    feesEur: findColumnIndex(headers, `Fees (${EURO_SYMBOL})`),
    feesUsd: findColumnIndex(headers, "Fees ($)"),
    totalEur: findColumnIndex(headers, `${config.totalHeaderPrefix} (${EURO_SYMBOL})`),
    totalUsd: findColumnIndex(headers, `${config.totalHeaderPrefix} ($)`)
  };
}

function parseAssetOperationRow(
  row: unknown[],
  indexes: ReturnType<typeof getColumnIndexes>
) {
  const product = String(row[indexes.product] ?? "").trim();
  const platform = String(row[indexes.platform] ?? "").trim();
  const dateValue = row[indexes.date];

  if (!product || !platform || dateValue === undefined || dateValue === null || dateValue === "") {
    return null;
  }

  const dateSerial = normalizeSheetNumber(dateValue);

  if (!Number.isFinite(dateSerial) || dateSerial <= 0) {
    return null;
  }

  return {
    date: formatGoogleSheetsDate(dateSerial),
    dateSerial,
    product,
    platform,
    quantity: normalizeSheetNumber(row[indexes.quantity]),
    unitPriceEur: normalizeNullableNumber(row[indexes.unitPriceEur]),
    unitPriceUsd: normalizeNullableNumber(row[indexes.unitPriceUsd]),
    feesEur: normalizeNullableNumber(row[indexes.feesEur]),
    feesUsd: normalizeNullableNumber(row[indexes.feesUsd]),
    totalEur: normalizeNullableNumber(row[indexes.totalEur]),
    totalUsd: normalizeNullableNumber(row[indexes.totalUsd])
  } satisfies AssetOperation;
}

function normalizeNullableNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("=")) {
      return null;
    }
  }

  const normalized = normalizeSheetNumber(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function sumNullable(values: Array<number | null>) {
  const numericValues = values.filter((value): value is number => value !== null);
  return numericValues.length > 0
    ? numericValues.reduce((sum, value) => sum + value, 0)
    : null;
}

function parseDateQuery(
  rawValue: string | undefined,
  fallback: string,
  label: "dateFrom" | "dateTo"
) {
  const value = rawValue?.trim() ? rawValue.trim() : fallback;
  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${label} must use YYYY-MM-DD format.`);
  }

  return parsed;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatGoogleSheetsDate(serial: number) {
  const date = googleSheetsSerialToDate(serial);

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function googleSheetsSerialToDate(serial: number) {
  return new Date(GOOGLE_SHEETS_EPOCH + serial * 24 * 60 * 60 * 1000);
}

function findColumnIndex(headers: string[], label: string) {
  const index = headers.findIndex((header) => header === label);

  if (index === -1) {
    throw new NotFoundException(`Missing expected column: ${label}`);
  }

  return index;
}

function escapeSheetName(sheetName: string) {
  return sheetName.replace(/'/g, "''");
}
