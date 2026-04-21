import { NotFoundException } from "@nestjs/common";
import { normalizeSheetNumber } from "./monthly-summary.utils";

const SHEET_NAME = "Total";
const RANGE_START_ROW = 2;
const RANGE_END_ROW = 7;
const RANGE_END_COLUMN = "K";

type NetWorthGroupKey = "banks" | "crypto" | "forex" | "participations";

const GROUP_LABELS: Record<NetWorthGroupKey, string> = {
  banks: "Bancos",
  crypto: "Crypto",
  forex: "Forex",
  participations: "Participaciones"
};

export type NetWorthSite = {
  label: string;
  amount: number;
  shareRatio: number;
};

export type NetWorthGroup = {
  key: NetWorthGroupKey;
  label: string;
  amount: number;
};

export type NetWorthSummary = {
  sheetName: string;
  totalNetWorth: number;
  liquidTotal: number;
  investedTotal: number;
  liquidRatio: number;
  investedRatio: number;
  sites: NetWorthSite[];
  groups: NetWorthGroup[];
};

export function buildNetWorthSummaryRange() {
  return `'${escapeSheetName(SHEET_NAME)}'!A${RANGE_START_ROW}:${RANGE_END_COLUMN}${RANGE_END_ROW}`;
}

export function buildNetWorthSummary(values: unknown[][]): NetWorthSummary {
  const siteLabelsRow = values[0] ?? [];
  const siteValuesRow = values[1] ?? [];
  const groupLabelsRow = values[4] ?? [];
  const groupValuesRow = values[5] ?? [];

  const totalNetWorth = getNamedSiteTotal(siteLabelsRow, siteValuesRow, "Total");

  if (totalNetWorth <= 0) {
    throw new NotFoundException("Net worth total was not found in Total sheet.");
  }

  const sites = siteLabelsRow
    .map((label, index) => ({
      label: String(label ?? "").trim(),
      amount: normalizeSheetNumber(siteValuesRow[index])
    }))
    .filter((site) => site.label && site.label !== "Total")
    .map((site) => ({
      ...site,
      shareRatio: site.amount / totalNetWorth
    }))
    .sort((left, right) => right.amount - left.amount);

  if (sites.length === 0) {
    throw new NotFoundException("No net worth sites were found in Total sheet.");
  }

  const groups = buildGroups(groupLabelsRow, groupValuesRow);
  const liquidTotal = roundCurrency(findGroupAmount(groups, "banks"));
  const investedTotal = roundCurrency(
    findGroupAmount(groups, "crypto") +
    findGroupAmount(groups, "forex") +
    findGroupAmount(groups, "participations")
  );

  return {
    sheetName: SHEET_NAME,
    totalNetWorth: roundCurrency(totalNetWorth),
    liquidTotal,
    investedTotal,
    liquidRatio: liquidTotal / totalNetWorth,
    investedRatio: investedTotal / totalNetWorth,
    sites,
    groups
  };
}

function buildGroups(labelsRow: unknown[], valuesRow: unknown[]) {
  const resolvedGroups = Object.entries(GROUP_LABELS).map(([key, expectedLabel]) => {
    const columnIndex = labelsRow.findIndex(
      (label) => String(label ?? "").trim() === expectedLabel
    );

    if (columnIndex === -1) {
      throw new NotFoundException(`Missing net worth group: ${expectedLabel}`);
    }

    return {
      key: key as NetWorthGroupKey,
      label: expectedLabel,
      amount: normalizeSheetNumber(valuesRow[columnIndex])
    } satisfies NetWorthGroup;
  });

  return resolvedGroups;
}

function getNamedSiteTotal(labelsRow: unknown[], valuesRow: unknown[], targetLabel: string) {
  const columnIndex = labelsRow.findIndex(
    (label) => String(label ?? "").trim() === targetLabel
  );

  if (columnIndex === -1) {
    return 0;
  }

  return normalizeSheetNumber(valuesRow[columnIndex]);
}

function findGroupAmount(groups: NetWorthGroup[], key: NetWorthGroupKey) {
  return groups.find((group) => group.key === key)?.amount ?? 0;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function escapeSheetName(sheetName: string) {
  return sheetName.replace(/'/g, "''");
}
