import {
  AssetOperationsResponse,
  ExpenseCategory,
  IncomeExpensesDetail,
  MonthlySummary,
  QuickAddExpenseInput,
  QuickAddExpenseResult,
  VtMarketsAccountTotals,
  VtMarketsGlobalResults,
  VtMarketsResults,
  ZenSummary
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchMonthlySummary(input: {
  token: string;
  year: number;
  month: number;
}): Promise<MonthlySummary> {
  const url = new URL("/finance/monthly-summary", API_URL);
  url.searchParams.set("year", String(input.year));
  url.searchParams.set("month", String(input.month));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${input.token}`
    }
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo cargar el resumen mensual. Codigo ${response.status}.`
    );
  }

  return response.json() as Promise<MonthlySummary>;
}

export async function fetchExpenseCategories(input: {
  token: string;
  year: number;
}): Promise<ExpenseCategory[]> {
  const url = new URL("/finance/expense-categories", API_URL);
  url.searchParams.set("year", String(input.year));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${input.token}`
    }
  });

  if (!response.ok) {
    throw new Error(
      `No se pudieron cargar las categorias. Codigo ${response.status}.`
    );
  }

  return response.json() as Promise<ExpenseCategory[]>;
}

export async function createQuickAddExpense(input: {
  token: string;
  expense: QuickAddExpenseInput;
}): Promise<QuickAddExpenseResult> {
  const url = new URL("/finance/quick-add-expense", API_URL);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.token}`
    },
    body: JSON.stringify(input.expense)
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo guardar el gasto. Codigo ${response.status}.`
    );
  }

  return response.json() as Promise<QuickAddExpenseResult>;
}

export async function fetchIncomeExpensesDetail(input: {
  token: string;
  year: number;
  month: number;
}): Promise<IncomeExpensesDetail> {
  const url = new URL("/finance/income-expenses-detail", API_URL);
  url.searchParams.set("year", String(input.year));
  url.searchParams.set("month", String(input.month));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${input.token}`
    }
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo cargar el detalle mensual. Codigo ${response.status}.`
    );
  }

  return response.json() as Promise<IncomeExpensesDetail>;
}

export async function fetchAssetPurchases(input: {
  token: string;
  dateFrom: string;
  dateTo: string;
}): Promise<AssetOperationsResponse> {
  return fetchAssetOperations("/finance/asset-purchases", input);
}

export async function fetchAssetSales(input: {
  token: string;
  dateFrom: string;
  dateTo: string;
}): Promise<AssetOperationsResponse> {
  return fetchAssetOperations("/finance/asset-sales", input);
}

export async function fetchZenSummary(input: {
  token: string;
}): Promise<ZenSummary> {
  const url = new URL("/finance/zen-summary", API_URL);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${input.token}`
    }
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar la vista de Zen. Codigo ${response.status}.`);
  }

  return response.json() as Promise<ZenSummary>;
}

export async function fetchVtMarketsResults(input: {
  token: string;
  year?: number;
}): Promise<VtMarketsResults> {
  const url = new URL("/finance/vt-markets/results", API_URL);

  if (input.year !== undefined) {
    url.searchParams.set("year", String(input.year));
  }

  return fetchProtectedJson(url, input.token, "No se pudo cargar la vista de resultados VT.");
}

export async function fetchVtMarketsGlobalResults(input: {
  token: string;
}): Promise<VtMarketsGlobalResults> {
  const url = new URL("/finance/vt-markets/global-results", API_URL);
  return fetchProtectedJson(url, input.token, "No se pudo cargar la vista global VT.");
}

export async function fetchVtMarketsAccountTotals(input: {
  token: string;
}): Promise<VtMarketsAccountTotals> {
  const url = new URL("/finance/vt-markets/account-totals", API_URL);
  return fetchProtectedJson(url, input.token, "No se pudo cargar la vista de cuentas VT.");
}

async function fetchAssetOperations(
  path: string,
  input: {
    token: string;
    dateFrom: string;
    dateTo: string;
  }
) {
  const url = new URL(path, API_URL);
  url.searchParams.set("dateFrom", input.dateFrom);
  url.searchParams.set("dateTo", input.dateTo);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${input.token}`
    }
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo cargar el detalle de operaciones. Codigo ${response.status}.`
    );
  }

  return response.json() as Promise<AssetOperationsResponse>;
}

async function fetchProtectedJson<T>(url: URL, token: string, message: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`${message} Codigo ${response.status}.`);
  }

  return response.json() as Promise<T>;
}
