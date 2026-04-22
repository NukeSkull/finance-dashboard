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
  onExpenseAdded: (result: QuickAddExpenseResult) => void | Promise<void>;
};

export function QuickAddExpensePanel({
  getIdToken,
  onExpenseAdded
}: QuickAddExpensePanelProps) {
  const currentSelection = getCurrentMonthSelection();
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
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
          setError("No se pudieron cargar las categorias de gasto.");
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
    if (isOpen) {
      amountInputRef.current?.focus();
    }
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = Number(amount.replace(",", "."));

    if (!selectedCategoryId) {
      setError("Selecciona una categoria antes de guardar.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Introduce un importe valido mayor que 0.");
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
          ? `Gasto guardado en ${result.categoryLabel}. Puedes seguir anadiendo movimientos.`
          : `Gasto guardado en ${result.categoryLabel} (${result.month}/${result.year}).`
      );
      await onExpenseAdded(result);

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
    setIsOpen(true);
  }

  const recentCategories = mapRecentCategories(categories, recentCategoryIds);

  return (
    <section className="quick-add-panel" aria-label="Quick add de gastos">
      <div className="quick-add-header">
        <div>
          <p className="eyebrow">Accion rapida</p>
          <h2>Quick add de gastos</h2>
          <p className="muted">
            Anade un gasto rapido al Google Sheet sin salir del dashboard.
          </p>
        </div>
        <button
          aria-expanded={isOpen}
          className="button secondary"
          type="button"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
        >
          {isOpen ? "Ocultar" : "Abrir formulario"}
        </button>
      </div>

      {lastExpense ? (
        <div className="quick-add-summary">
          <div>
            <strong>Ultimo movimiento</strong>
            <p className="muted">
              {lastExpense.categoryLabel} - {lastExpense.amount} EUR - {lastExpense.month}/
              {lastExpense.year}
            </p>
          </div>
          <button className="button secondary" onClick={handleRepeatLastExpense} type="button">
            Repetir ultimo
          </button>
        </div>
      ) : null}

      {recentCategories.length > 0 ? (
        <div className="quick-add-chip-group" aria-label="Categorias recientes">
          {recentCategories.map((category) => (
            <button
              className={
                category.id === selectedCategoryId ? "quick-add-chip active" : "quick-add-chip"
              }
              key={category.id}
              onClick={() => {
                setSelectedCategoryId(category.id);
                setIsOpen(true);
              }}
              type="button"
            >
              {category.label}
            </button>
          ))}
        </div>
      ) : null}

      {isOpen ? (
        <form className="quick-add-form" onSubmit={handleSubmit}>
          <label>
            Categoria
            <select
              disabled={loadingCategories || submitting || categories.length === 0}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              value={selectedCategoryId}
            >
              {categories.length === 0 ? (
                <option value="">Sin categorias disponibles</option>
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
              ref={amountInputRef}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="60"
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
            {"A\u00f1o"}
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
              {submitting && saveMode === "single" ? "Guardando..." : "Guardar gasto"}
            </button>
            <button
              className="button secondary"
              disabled={submitting || loadingCategories || categories.length === 0}
              onClick={() => setSaveMode("continue")}
              type="submit"
            >
              {submitting && saveMode === "continue"
                ? "Guardando..."
                : "Guardar y seguir"}
            </button>
          </div>

          <p className="muted quick-add-feedback">
            Enter guarda el movimiento actual. Usa &quot;Guardar y seguir&quot; para repetir el
            flujo sin cerrar el formulario.
          </p>

          {loadingCategories ? (
            <StatusPanel compact>Cargando categorias para {selection.year}...</StatusPanel>
          ) : null}

          {error ? (
            <StatusPanel compact tone="error">
              {error}
            </StatusPanel>
          ) : null}

          {success ? <StatusPanel compact>{success}</StatusPanel> : null}
        </form>
      ) : null}
    </section>
  );
}
