"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { StatusPanel } from "@/components/status-panel";
import {
  createQuickAddExpense,
  fetchExpenseCategories
} from "@/lib/api/client";
import {
  ExpenseCategory,
  QuickAddExpenseResult
} from "@/lib/api/types";
import {
  MonthSelection,
  getCurrentMonthSelection,
  getMonthOptions,
  getYearOptions
} from "@/lib/dashboard/month-selection";
import {
  loadQuickAddHistory,
  mapRecentCategories,
  saveQuickAddHistory
} from "@/lib/quick-add-history";

type QuickAddExpensePanelProps = {
  getIdToken: () => Promise<string>;
  initialSelection?: MonthSelection;
  onExpenseAdded: (
    result: QuickAddExpenseResult,
    meta: { saveMode: "single" | "continue" }
  ) => void | Promise<void>;
};

export function QuickAddExpensePanel({
  getIdToken,
  initialSelection,
  onExpenseAdded
}: QuickAddExpensePanelProps) {
  const currentSelection = initialSelection ?? getCurrentMonthSelection();
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const [selection, setSelection] = useState(currentSelection);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<"single" | "continue">("single");
  const [recentCategoryIds, setRecentCategoryIds] = useState<string[]>(
    () => loadQuickAddHistory().recentCategoryIds
  );
  const [lastExpense, setLastExpense] = useState<
    ReturnType<typeof loadQuickAddHistory>["lastExpense"]
  >(() => loadQuickAddHistory().lastExpense);

  useEffect(() => {
    setSelection(initialSelection ?? getCurrentMonthSelection());
  }, [initialSelection]);

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      setLoadingCategories(true);
      setError(null);

      try {
        const token = await getIdToken();
        const nextCategories = await fetchExpenseCategories({
          token,
          year: selection.year
        });

        if (ignore) {
          return;
        }

        setCategories(nextCategories);
        setSelectedCategoryId((currentValue) =>
          nextCategories.some((category) => category.id === currentValue)
            ? currentValue
            : (nextCategories[0]?.id ?? "")
        );
      } catch {
        if (!ignore) {
          setCategories([]);
          setSelectedCategoryId("");
          setError("No se pudieron cargar las categorías de gasto.");
        }
      } finally {
        if (!ignore) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      ignore = true;
    };
  }, [getIdToken, selection.year]);

  useEffect(() => {
    amountInputRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = Number(amount.replace(",", "."));

    if (!selectedCategoryId) {
      setError("Selecciona una categoría antes de guardar.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Introduce un importe válido mayor que 0.");
      return;
    }

    setSubmitting(true);

    try {
      const token = await getIdToken();
      const expense = {
        amount: parsedAmount,
        categoryId: selectedCategoryId,
        currency: "EUR" as const,
        month: selection.month,
        year: selection.year
      };
      const result = await createQuickAddExpense({
        token,
        expense
      });

      saveQuickAddHistory({ expense, result });
      const history = loadQuickAddHistory();
      setRecentCategoryIds(history.recentCategoryIds);
      setLastExpense(history.lastExpense);
      setAmount("");
      setSuccess(
        saveMode === "continue"
          ? `Gasto guardado en ${result.categoryLabel}. Puedes seguir añadiendo movimientos.`
          : `Gasto guardado en ${result.categoryLabel} (${result.month}/${result.year}).`
      );
      await onExpenseAdded(result, { saveMode });

      if (saveMode === "continue") {
        amountInputRef.current?.focus();
      }
    } catch {
      setError("No se pudo guardar el gasto en Google Sheets.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRepeatLastExpense() {
    if (!lastExpense) {
      return;
    }

    setSelection({
      month: lastExpense.month,
      year: lastExpense.year
    });
    setSelectedCategoryId(lastExpense.categoryId);
    setAmount(String(lastExpense.amount));
  }

  const recentCategories = mapRecentCategories(categories, recentCategoryIds);

  return (
    <section className="quick-add-sheet" aria-label="Quick add de gastos">
      {lastExpense ? (
        <div className="quick-add-summary">
          <div>
            <strong>Último movimiento</strong>
            <p className="muted">
              {lastExpense.categoryLabel} - {lastExpense.amount} EUR - {lastExpense.month}/
              {lastExpense.year}
            </p>
          </div>
          <button className="button secondary" onClick={handleRepeatLastExpense} type="button">
            Repetir último
          </button>
        </div>
      ) : null}

      {recentCategories.length > 0 ? (
        <div className="quick-add-chip-group" aria-label="Categorías recientes">
          {recentCategories.map((category) => (
            <button
              className={
                category.id === selectedCategoryId ? "quick-add-chip active" : "quick-add-chip"
              }
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              type="button"
            >
              {category.label}
            </button>
          ))}
        </div>
      ) : null}

      <form className="quick-add-form quick-add-form-embedded" onSubmit={handleSubmit}>
        <label>
          Categoría
          <select
            disabled={loadingCategories || submitting || categories.length === 0}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            value={selectedCategoryId}
          >
            {categories.length === 0 ? (
              <option value="">Sin categorías disponibles</option>
            ) : null}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Importe
          <input
            disabled={submitting}
            inputMode="decimal"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="60"
            ref={amountInputRef}
            type="text"
            value={amount}
          />
        </label>

        <label>
          Moneda
          <input disabled readOnly type="text" value="EUR" />
        </label>

        <label>
          Mes
          <select
            disabled={submitting}
            onChange={(event) =>
              setSelection((currentValue) => ({
                ...currentValue,
                month: Number(event.target.value)
              }))
            }
            value={selection.month}
          >
            {getMonthOptions().map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Año
          <select
            disabled={submitting}
            onChange={(event) =>
              setSelection((currentValue) => ({
                ...currentValue,
                year: Number(event.target.value)
              }))
            }
            value={selection.year}
          >
            {getYearOptions(currentSelection.year).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <div className="quick-add-actions">
          <button
            className="button"
            disabled={submitting || loadingCategories || categories.length === 0}
            onClick={() => setSaveMode("single")}
            type="submit"
          >
            {submitting && saveMode === "single" ? "Guardando..." : "Guardar"}
          </button>
          <button
            className="button secondary"
            disabled={submitting || loadingCategories || categories.length === 0}
            onClick={() => setSaveMode("continue")}
            type="submit"
          >
            {submitting && saveMode === "continue"
              ? "Guardando..."
              : "Guardar y añadir otro"}
          </button>
        </div>

        <p className="muted quick-add-feedback">
          Usa “Guardar y añadir otro” para mantener abierto el flujo y cargar varios
          movimientos seguidos.
        </p>

        {loadingCategories ? (
          <StatusPanel compact>Cargando categorías para {selection.year}...</StatusPanel>
        ) : null}

        {error ? (
          <StatusPanel compact tone="error">
            {error}
          </StatusPanel>
        ) : null}

        {success ? <StatusPanel compact>{success}</StatusPanel> : null}
      </form>
    </section>
  );
}
