"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState
} from "react";
import {
  AppSettings,
  VtTabPreference,
  getDefaultSettings,
  loadLastDashboardSelection,
  loadLastVisitedVtTab,
  loadSettings,
  resetSettings,
  saveLastDashboardSelection,
  saveLastVisitedVtTab,
  saveSettings
} from "@/features/settings/settings";

type SettingsContextValue = {
  settings: AppSettings;
  lastDashboardSelection: {
    year: number;
    month: number;
  } | null;
  lastVisitedVtTab: VtTabPreference | null;
  updateSettings: (next: Partial<AppSettings>) => void;
  restoreDefaultSettings: () => void;
  setLastDashboardSelection: (next: { year: number; month: number }) => void;
  setLastVisitedVtTab: (next: VtTabPreference) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [lastDashboardSelection, setLastDashboardSelectionState] = useState<{
    year: number;
    month: number;
  } | null>(loadLastDashboardSelection);
  const [lastVisitedVtTab, setLastVisitedVtTabState] =
    useState<VtTabPreference | null>(loadLastVisitedVtTab);

  function updateSettings(next: Partial<AppSettings>) {
    setSettings((currentValue) => {
      const merged = {
        ...currentValue,
        ...next,
        version: 1 as const
      };

      saveSettings(merged);
      return merged;
    });
  }

  function restoreDefaultSettings() {
    resetSettings();
    setSettings(getDefaultSettings());
    setLastDashboardSelectionState(null);
    setLastVisitedVtTabState(null);
  }

  function handleSetLastDashboardSelection(next: { year: number; month: number }) {
    setLastDashboardSelectionState(next);
    saveLastDashboardSelection(next);
  }

  function handleSetLastVisitedVtTab(next: VtTabPreference) {
    setLastVisitedVtTabState(next);
    saveLastVisitedVtTab(next);
  }

  const value = useMemo(
    () => ({
      settings,
      lastDashboardSelection,
      lastVisitedVtTab,
      updateSettings,
      restoreDefaultSettings,
      setLastDashboardSelection: handleSetLastDashboardSelection,
      setLastVisitedVtTab: handleSetLastVisitedVtTab
    }),
    [lastDashboardSelection, lastVisitedVtTab, settings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const value = useContext(SettingsContext);

  if (!value) {
    throw new Error("useSettings must be used within SettingsProvider.");
  }

  return value;
}
