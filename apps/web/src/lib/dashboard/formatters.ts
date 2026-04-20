export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    currency: "EUR",
    maximumFractionDigits: 2,
    style: "currency"
  }).format(value);
}

export function formatPercent(value: number | null) {
  if (value === null) {
    return "Sin ingresos";
  }

  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 1,
    style: "percent"
  }).format(value);
}
