import { MonthlySummary } from "./types";

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
