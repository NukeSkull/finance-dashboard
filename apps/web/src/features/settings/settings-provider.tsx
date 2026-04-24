"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState
} from "react";
import { getCurrentMonthSelection } from "@/lib/dashboard/month-selection";
import {
  AppSettings,
  VtTabPreference,
  getDefaultSettings,
  loadGlobalMonthSelection,
  loadPrivacyModeEnabled,
  loadLastVisitedVtTab,
  loadSettings,
  resetSettings,
  saveGlobalMonthSelection,
  savePrivacyModeEnabled,
  saveLastVisitedVtTab,
  saveSettings
} from "@/features/settings/settings";

type SettingsContextValue = {
  settings: AppSettings;
  globalMonthSelection: {
    year: number;
    month: number;
  };
  lastVisitedVtTab: VtTabPreference | null;
  privacyModeEnabled: boolean;
  updateSettings: (next: Partial<AppSettings>) => void;
  restoreDefaultSettings: () => void;
  setGlobalMonthSelection: (next: { year: number; month: number }) => void;
  setLastVisitedVtTab: (next: VtTabPreference) => void;
  setPrivacyModeEnabled: (next: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [globalMonthSelection, setGlobalMonthSelectionState] = useState<{
    year: number;
    month: number;
  }>(() => loadGlobalMonthSelection() ?? getCurrentMonthSelection());
  const [lastVisitedVtTab, setLastVisitedVtTabState] =
    useState<VtTabPreference | null>(loadLastVisitedVtTab);
  const [privacyModeEnabled, setPrivacyModeEnabledState] =
    useState<boolean>(loadPrivacyModeEnabled);

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
    setGlobalMonthSelectionState(getCurrentMonthSelection());
    setLastVisitedVtTabState(null);
    setPrivacyModeEnabledState(false);
  }

  function handleSetGlobalMonthSelection(next: { year: number; month: number }) {
    setGlobalMonthSelectionState(next);
    saveGlobalMonthSelection(next);
  }

  function handleSetLastVisitedVtTab(next: VtTabPreference) {
    setLastVisitedVtTabState(next);
    saveLastVisitedVtTab(next);
  }

  function handleSetPrivacyModeEnabled(next: boolean) {
    setPrivacyModeEnabledState(next);
    savePrivacyModeEnabled(next);
  }

  const value = useMemo(
    () => ({
      settings,
      globalMonthSelection,
      lastVisitedVtTab,
      privacyModeEnabled,
      updateSettings,
      restoreDefaultSettings,
      setGlobalMonthSelection: handleSetGlobalMonthSelection,
      setLastVisitedVtTab: handleSetLastVisitedVtTab,
      setPrivacyModeEnabled: handleSetPrivacyModeEnabled
    }),
    [globalMonthSelection, lastVisitedVtTab, privacyModeEnabled, settings]
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
