import { BadRequestException, NotFoundException } from "@nestjs/common";
import { normalizeSheetNumber } from "./monthly-summary.utils";

const GOOGLE_SHEETS_EPOCH = Date.UTC(1899, 11, 30);
const RANGE_END_COLUMN = "J";
const RANGE_START_ROW = 1;
const EURO_SYMBOL = "\u20AC";

export type AssetOperationKind = "purchase" | "sale";
export type AssetOperationHistoryType = "all" | AssetOperationKind;
export type AssetOperationCurrency = "EUR" | "USD";

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

export type AssetOperationHistoryFilter = {
  type: AssetOperationHistoryType;
  q: string | null;
  product: string | null;
  platform: string | null;
  currency: AssetOperationCurrency | null;
  dateFrom: string | null;
  dateTo: string | null;
};

export type AssetOperation = {
  date: string;
  dateSerial: number;
  operationType: AssetOperationKind;
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

export type AssetOperationsHistorySummary = {
  operationsCount: number;
  purchasesTotalEur: number | null;
  salesTotalEur: number | null;
  netBalanceEur: number | null;
  operatedAssetsCount: number;
  averageTicketEur: number | null;
};

export type AssetOperationsHistoryResponse = {
  items: AssetOperation[];
  summary: AssetOperationsHistorySummary;
  filters: {
    type: AssetOperationHistoryType;
    q: string | null;
    product: string | null;
    platform: string | null;
    currency: AssetOperationCurrency | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
  options: {
    products: string[];
    platforms: string[];
    currencies: AssetOperationCurrency[];
  };
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

export function parseAssetOperationHistoryFilter(query: {
  type?: string;
  q?: string;
  product?: string;
  platform?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const type =
    query.type === "purchase" || query.type === "purchases"
      ? "purchase"
      : query.type === "sale" || query.type === "sales"
        ? "sale"
        : "all";
  const q = normalizeNullableString(query.q);
  const product = normalizeNullableString(query.product);
  const platform = normalizeNullableString(query.platform);
  const currency =
    query.currency === "EUR" || query.currency === "USD" ? query.currency : null;
  const dateFrom = query.dateFrom
    ? parseDateQuery(query.dateFrom, query.dateFrom, "dateFrom")
    : null;
  const dateTo = query.dateTo
    ? parseDateQuery(query.dateTo, query.dateTo, "dateTo")
    : null;

  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new BadRequestException("dateFrom must be before or equal to dateTo.");
  }

  return {
    type,
    q,
    product,
    platform,
    currency,
    dateFrom: dateFrom ? formatDate(dateFrom) : null,
    dateTo: dateTo ? formatDate(dateTo) : null
  } satisfies AssetOperationHistoryFilter;
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
  const items = parseAssetOperationsSheet(input.kind, input.values).filter((item) =>
    matchesDateRange(item, input.filter.dateFrom, input.filter.dateTo)
  );

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

export function buildAssetOperationsHistoryResponse(input: {
  filter: AssetOperationHistoryFilter;
  purchasesValues: unknown[][];
  salesValues: unknown[][];
}): AssetOperationsHistoryResponse {
  const allItems = [
    ...parseOptionalAssetOperationsSheet("purchase", input.purchasesValues),
    ...parseOptionalAssetOperationsSheet("sale", input.salesValues)
  ].sort((left, right) => right.dateSerial - left.dateSerial);

  const options = {
    products: getSortedUniqueValues(allItems.map((item) => item.product)),
    platforms: getSortedUniqueValues(allItems.map((item) => item.platform)),
    currencies: buildCurrencyOptions(allItems)
  };

  const items = allItems.filter((item) => matchesHistoryFilters(item, input.filter));

  return {
    items,
    summary: buildHistorySummary(items),
    filters: input.filter,
    options
  };
}

function parseOptionalAssetOperationsSheet(
  kind: AssetOperationKind,
  values: unknown[][]
) {
  return values.length > 0 ? parseAssetOperationsSheet(kind, values) : [];
}

function parseAssetOperationsSheet(kind: AssetOperationKind, values: unknown[][]) {
  const config = SHEET_CONFIG[kind];
  const header = values[0];

  if (!header?.length) {
    throw new NotFoundException(`No data found for sheet ${config.sheetName}.`);
  }

  const columnIndexes = getColumnIndexes(kind, header);

  return values
    .slice(1)
    .map((row) => parseAssetOperationRow(kind, row, columnIndexes))
    .filter((item): item is AssetOperation => item !== null)
    .sort((left, right) => right.dateSerial - left.dateSerial);
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
  kind: AssetOperationKind,
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
    operationType: kind,
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

function matchesHistoryFilters(item: AssetOperation, filter: AssetOperationHistoryFilter) {
  if (filter.type !== "all" && item.operationType !== filter.type) {
    return false;
  }

  if (filter.dateFrom && !matchesDateRange(item, filter.dateFrom, null)) {
    return false;
  }

  if (filter.dateTo && !matchesDateRange(item, null, filter.dateTo)) {
    return false;
  }

  if (filter.q) {
    const haystack = `${item.product} ${item.platform}`.toLocaleLowerCase("es");

    if (!haystack.includes(filter.q.toLocaleLowerCase("es"))) {
      return false;
    }
  }

  if (filter.product && item.product !== filter.product) {
    return false;
  }

  if (filter.platform && item.platform !== filter.platform) {
    return false;
  }

  if (filter.currency === "EUR" && item.totalEur === null) {
    return false;
  }

  if (filter.currency === "USD" && item.totalUsd === null) {
    return false;
  }

  return true;
}

function matchesDateRange(
  item: AssetOperation,
  dateFrom: string | null,
  dateTo: string | null
) {
  const currentTime = googleSheetsSerialToDate(item.dateSerial).getTime();
  const fromTime = dateFrom ? Date.parse(dateFrom) : Number.NEGATIVE_INFINITY;
  const toTime = dateTo ? Date.parse(dateTo) : Number.POSITIVE_INFINITY;

  return currentTime >= fromTime && currentTime <= toTime;
}

function buildHistorySummary(items: AssetOperation[]): AssetOperationsHistorySummary {
  const purchases = items.filter((item) => item.operationType === "purchase");
  const sales = items.filter((item) => item.operationType === "sale");
  const purchasesTotalEur = sumNullable(purchases.map((item) => item.totalEur));
  const salesTotalEur = sumNullable(sales.map((item) => item.totalEur));
  const eurTotals = items
    .map((item) => item.totalEur)
    .filter((value): value is number => value !== null);

  return {
    operationsCount: items.length,
    purchasesTotalEur,
    salesTotalEur,
    netBalanceEur:
      purchasesTotalEur !== null || salesTotalEur !== null
        ? roundCurrency((salesTotalEur ?? 0) - (purchasesTotalEur ?? 0))
        : null,
    operatedAssetsCount: new Set(items.map((item) => item.product)).size,
    averageTicketEur:
      eurTotals.length > 0
        ? roundCurrency(
            eurTotals.reduce((sum, value) => sum + Math.abs(value), 0) / eurTotals.length
          )
        : null
  };
}

function buildCurrencyOptions(items: AssetOperation[]) {
  const currencies = new Set<AssetOperationCurrency>();

  if (items.some((item) => item.totalEur !== null)) {
    currencies.add("EUR");
  }

  if (items.some((item) => item.totalUsd !== null)) {
    currencies.add("USD");
  }

  return [...currencies];
}

function getSortedUniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "es")
  );
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

function normalizeNullableString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function sumNullable(values: Array<number | null>) {
  const numericValues = values.filter((value): value is number => value !== null);
  return numericValues.length > 0
    ? roundCurrency(numericValues.reduce((sum, value) => sum + value, 0))
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
  const normalizedLabel = normalizeHeaderLabel(label);
  const index = headers.findIndex(
    (header) => normalizeHeaderLabel(header) === normalizedLabel
  );

  if (index === -1) {
    throw new NotFoundException(`Missing expected column: ${label}`);
  }

  return index;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function escapeSheetName(sheetName: string) {
  return sheetName.replace(/'/g, "''");
}

function normalizeHeaderLabel(value: string) {
  return value
    .trim()
    .normalize("NFKC")
    .replace(/Ã¢â€šÂ¬|â‚¬/g, EURO_SYMBOL);
}
