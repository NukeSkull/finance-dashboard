"use client";

export const APP_SETTINGS_STORAGE_KEY = "finance-dashboard.settings.v1";

export type DashboardPeriodMode = "current_month" | "last_visited";
export type SectionDateRangePreset =
  | "last_30_days"
  | "last_90_days"
  | "current_year";
export type NumberFormatLocale = "es-ES" | "en-US";
export type VtTabPreference = "results" | "global" | "accounts";

export type AppSettings = {
  version: 1;
  defaultDashboardPeriodMode: DashboardPeriodMode;
  defaultSectionDateRange: SectionDateRangePreset;
  showQuickAddOnHome: boolean;
  showNetWorthOnHome: boolean;
  showSectionCardsCompletedOnly: boolean;
  numberFormatLocale: NumberFormatLocale;
  confirmBeforeLogout: boolean;
  rememberLastVisitedVtTab: boolean;
};

type PersistedSettingsState = {
  lastDashboardSelection: {
    year: number;
    month: number;
  } | null;
  lastVisitedVtTab: VtTabPreference | null;
};

type PersistedSettingsPayload = {
  version: 1;
  settings: AppSettings;
  state: PersistedSettingsState;
};

export function getDefaultSettings(): AppSettings {
  return {
    version: 1,
    defaultDashboardPeriodMode: "current_month",
    defaultSectionDateRange: "last_90_days",
    showQuickAddOnHome: true,
    showNetWorthOnHome: true,
    showSectionCardsCompletedOnly: false,
    numberFormatLocale: "es-ES",
    confirmBeforeLogout: false,
    rememberLastVisitedVtTab: true
  };
}

function getDefaultState(): PersistedSettingsState {
  return {
    lastDashboardSelection: null,
    lastVisitedVtTab: null
  };
}

export function loadSettings(): AppSettings {
  return loadSettingsPayload().settings;
}

export function saveSettings(next: AppSettings): void {
  const payload = loadSettingsPayload();

  writeSettingsPayload({
    ...payload,
    settings: sanitizeSettings(next)
  });
}

export function loadLastDashboardSelection() {
  return loadSettingsPayload().state.lastDashboardSelection;
}

export function saveLastDashboardSelection(next: {
  year: number;
  month: number;
}): void {
  const payload = loadSettingsPayload();

  writeSettingsPayload({
    ...payload,
    state: {
      ...payload.state,
      lastDashboardSelection: isValidDashboardSelection(next) ? next : null
    }
  });
}

export function loadLastVisitedVtTab() {
  return loadSettingsPayload().state.lastVisitedVtTab;
}

export function saveLastVisitedVtTab(next: VtTabPreference): void {
  const payload = loadSettingsPayload();

  writeSettingsPayload({
    ...payload,
    state: {
      ...payload.state,
      lastVisitedVtTab: isValidVtTab(next) ? next : null
    }
  });
}

export function resetSettings(): void {
  writeSettingsPayload({
    version: 1,
    settings: getDefaultSettings(),
    state: getDefaultState()
  });
}

function loadSettingsPayload(): PersistedSettingsPayload {
  const fallback: PersistedSettingsPayload = {
    version: 1,
    settings: getDefaultSettings(),
    state: getDefaultState()
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);

    if (!rawValue) {
      return fallback;
    }

    const parsed = JSON.parse(rawValue) as Partial<PersistedSettingsPayload>;

    if (parsed.version !== 1) {
      return fallback;
    }

    return {
      version: 1,
      settings: sanitizeSettings(parsed.settings),
      state: sanitizeState(parsed.state)
    };
  } catch {
    return fallback;
  }
}

function writeSettingsPayload(payload: PersistedSettingsPayload) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // Ignore storage failures and keep runtime defaults.
  }
}

function sanitizeSettings(input: unknown): AppSettings {
  const defaults = getDefaultSettings();

  if (!input || typeof input !== "object") {
    return defaults;
  }

  const value = input as Partial<AppSettings>;

  return {
    version: 1,
    defaultDashboardPeriodMode:
      value.defaultDashboardPeriodMode === "last_visited"
        ? "last_visited"
        : defaults.defaultDashboardPeriodMode,
    defaultSectionDateRange:
      value.defaultSectionDateRange === "last_30_days" ||
      value.defaultSectionDateRange === "current_year"
        ? value.defaultSectionDateRange
        : defaults.defaultSectionDateRange,
    showQuickAddOnHome:
      typeof value.showQuickAddOnHome === "boolean"
        ? value.showQuickAddOnHome
        : defaults.showQuickAddOnHome,
    showNetWorthOnHome:
      typeof value.showNetWorthOnHome === "boolean"
        ? value.showNetWorthOnHome
        : defaults.showNetWorthOnHome,
    showSectionCardsCompletedOnly:
      typeof value.showSectionCardsCompletedOnly === "boolean"
        ? value.showSectionCardsCompletedOnly
        : defaults.showSectionCardsCompletedOnly,
    numberFormatLocale:
      value.numberFormatLocale === "en-US"
        ? "en-US"
        : defaults.numberFormatLocale,
    confirmBeforeLogout:
      typeof value.confirmBeforeLogout === "boolean"
        ? value.confirmBeforeLogout
        : defaults.confirmBeforeLogout,
    rememberLastVisitedVtTab:
      typeof value.rememberLastVisitedVtTab === "boolean"
        ? value.rememberLastVisitedVtTab
        : defaults.rememberLastVisitedVtTab
  };
}

function sanitizeState(input: unknown): PersistedSettingsState {
  if (!input || typeof input !== "object") {
    return getDefaultState();
  }

  const value = input as Partial<PersistedSettingsState>;

  return {
    lastDashboardSelection: isValidDashboardSelection(value.lastDashboardSelection)
      ? value.lastDashboardSelection
      : null,
    lastVisitedVtTab: isValidVtTab(value.lastVisitedVtTab)
      ? value.lastVisitedVtTab
      : null
  };
}

function isValidDashboardSelection(
  value: unknown
): value is PersistedSettingsState["lastDashboardSelection"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const selection = value as { year?: number; month?: number };

  return (
    Number.isInteger(selection.year) &&
    Number.isInteger(selection.month) &&
    Number(selection.year) >= 2000 &&
    Number(selection.year) <= 2100 &&
    Number(selection.month) >= 1 &&
    Number(selection.month) <= 12
  );
}

function isValidVtTab(value: unknown): value is VtTabPreference {
  return value === "results" || value === "global" || value === "accounts";
}
