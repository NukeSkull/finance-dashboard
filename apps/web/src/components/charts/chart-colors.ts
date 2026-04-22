export const financeChartColors = {
  banks: "#4f8cff",
  participations: "#37d67a",
  forex: "#8f6bff",
  crypto: "#f59b2f"
} as const;

export function getFinanceChartColor(key: string) {
  if (key === "banks" || key === "participations" || key === "forex" || key === "crypto") {
    return financeChartColors[key];
  }

  return "#8ea0ad";
}
