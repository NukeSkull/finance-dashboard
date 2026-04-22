import { NumberFormatLocale } from "@/features/settings/settings";

export function formatCurrency(
  value: number,
  locale: NumberFormatLocale = "es-ES",
  currency = "EUR"
) {
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 2,
    style: "currency"
  }).format(value);
}

export function formatPercent(
  value: number | null,
  locale: NumberFormatLocale = "es-ES"
) {
  if (value === null) {
    return "Sin ingresos";
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    style: "percent"
  }).format(value);
}
