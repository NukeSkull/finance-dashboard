import { ExpenseCategory, QuickAddExpenseInput, QuickAddExpenseResult } from "@/lib/api/types";

const QUICK_ADD_HISTORY_KEY = "finance-dashboard.quick-add-history.v1";

type QuickAddHistory = {
  lastExpense: (QuickAddExpenseInput & { categoryLabel: string }) | null;
  recentCategoryIds: string[];
};

export function loadQuickAddHistory() {
  if (typeof window === "undefined") {
    return getDefaultQuickAddHistory();
  }

  try {
    const raw = window.localStorage.getItem(QUICK_ADD_HISTORY_KEY);

    if (!raw) {
      return getDefaultQuickAddHistory();
    }

    const parsed = JSON.parse(raw) as Partial<QuickAddHistory>;

    return {
      lastExpense:
        parsed.lastExpense &&
        typeof parsed.lastExpense.categoryId === "string" &&
        typeof parsed.lastExpense.categoryLabel === "string" &&
        typeof parsed.lastExpense.amount === "number" &&
        typeof parsed.lastExpense.year === "number" &&
        typeof parsed.lastExpense.month === "number"
          ? {
              amount: parsed.lastExpense.amount,
              categoryId: parsed.lastExpense.categoryId,
              categoryLabel: parsed.lastExpense.categoryLabel,
              currency: "EUR",
              month: parsed.lastExpense.month,
              year: parsed.lastExpense.year
            }
          : null,
      recentCategoryIds: Array.isArray(parsed.recentCategoryIds)
        ? parsed.recentCategoryIds.filter((value): value is string => typeof value === "string")
        : []
    } satisfies QuickAddHistory;
  } catch {
    return getDefaultQuickAddHistory();
  }
}

export function saveQuickAddHistory(input: {
  expense: QuickAddExpenseInput;
  result: QuickAddExpenseResult;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const current = loadQuickAddHistory();
  const next: QuickAddHistory = {
    lastExpense: {
      ...input.expense,
      categoryLabel: input.result.categoryLabel
    },
    recentCategoryIds: [
      input.result.categoryId,
      ...current.recentCategoryIds.filter((id) => id !== input.result.categoryId)
    ].slice(0, 5)
  };

  window.localStorage.setItem(QUICK_ADD_HISTORY_KEY, JSON.stringify(next));
}

export function mapRecentCategories(
  categories: ExpenseCategory[],
  recentCategoryIds: string[]
) {
  return recentCategoryIds
    .map((id) => categories.find((category) => category.id === id) ?? null)
    .filter((category): category is ExpenseCategory => category !== null);
}

function getDefaultQuickAddHistory(): QuickAddHistory {
  return {
    lastExpense: null,
    recentCategoryIds: []
  };
}
