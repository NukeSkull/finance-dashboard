"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState
} from "react";
import { QuickAddExpenseResult } from "@/lib/api/types";

type AppShellContextValue = {
  isQuickAddOpen: boolean;
  lastQuickAddResult: QuickAddExpenseResult | null;
  quickAddVersion: number;
  quickAddNotice: string | null;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  dismissQuickAddNotice: () => void;
  registerQuickAddResult: (input: {
    currentSelection: { year: number; month: number };
    result: QuickAddExpenseResult;
  }) => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [lastQuickAddResult, setLastQuickAddResult] =
    useState<QuickAddExpenseResult | null>(null);
  const [quickAddVersion, setQuickAddVersion] = useState(0);
  const [quickAddNotice, setQuickAddNotice] = useState<string | null>(null);

  function openQuickAdd() {
    setIsQuickAddOpen(true);
  }

  function closeQuickAdd() {
    setIsQuickAddOpen(false);
  }

  function dismissQuickAddNotice() {
    setQuickAddNotice(null);
  }

  function registerQuickAddResult(input: {
    currentSelection: { year: number; month: number };
    result: QuickAddExpenseResult;
  }) {
    setLastQuickAddResult(input.result);
    setQuickAddVersion((currentValue) => currentValue + 1);
    setQuickAddNotice(
      input.result.year === input.currentSelection.year &&
        input.result.month === input.currentSelection.month
        ? `Gasto guardado en ${input.result.categoryLabel}. El periodo visible se ha actualizado.`
        : `Gasto guardado en ${input.result.categoryLabel} para ${input.result.month}/${input.result.year}. El periodo visible sigue siendo ${input.currentSelection.month}/${input.currentSelection.year}.`
    );
  }

  const value = useMemo(
    () => ({
      isQuickAddOpen,
      lastQuickAddResult,
      quickAddVersion,
      quickAddNotice,
      openQuickAdd,
      closeQuickAdd,
      dismissQuickAddNotice,
      registerQuickAddResult
    }),
    [isQuickAddOpen, lastQuickAddResult, quickAddNotice, quickAddVersion]
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const value = useContext(AppShellContext);

  if (!value) {
    throw new Error("useAppShell must be used within AppShellProvider.");
  }

  return value;
}
