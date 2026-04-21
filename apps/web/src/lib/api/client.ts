import {
  AssetOperationsResponse,
  ExpenseCategory,
  IncomeExpensesDetail,
  MonthlySummary,
  QuickAddExpenseInput,
  QuickAddExpenseResult
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
