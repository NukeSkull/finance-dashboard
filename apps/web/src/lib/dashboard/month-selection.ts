export type MonthSelection = {
  year: number;
  month: number;
};

export type MonthOption = {
  value: number;
  label: string;
};

export function getCurrentMonthSelection(date = new Date()): MonthSelection {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1
  };
}

export function getMonthOptions(): MonthOption[] {
  return [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
  ].map((label, index) => ({
    label,
    value: index + 1
  }));
}

export function getYearOptions(currentYear: number) {
  const startYear = 2023;
  const endYear = Math.max(currentYear + 1, 2026);
  const years: number[] = [];

  for (let year = endYear; year >= startYear; year -= 1) {
    years.push(year);
  }

  return years;
}
