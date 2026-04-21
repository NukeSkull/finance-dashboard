"use client";

import { FormEvent, useEffect, useState } from "react";
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

type QuickAddExpensePanelProps = {
  getIdToken: () => Promise<string>;
  onExpenseAdded: (result: QuickAddExpenseResult) => void | Promise<void>;
};

export function QuickAddExpensePanel({
  getIdToken,
  onExpenseAdded
}: QuickAddExpensePanelProps) {
  const currentSelection = getCurrentMonthSelection();
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState(currentSelection);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      const result = await createQuickAddExpense({
        token,
        expense: {
          categoryId: selectedCategoryId,
          amount: parsedAmount,
          currency: "EUR",
          year: selection.year,
          month: selection.month
        }
      });

      setAmount("");
      setSuccess(
        `Gasto guardado en ${result.categoryLabel} (${result.month}/${result.year}).`
      );
      await onExpenseAdded(result);
    } catch {
      setError("No se pudo guardar el gasto en Google Sheets.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="quick-add-panel" aria-label="Quick add de gastos">
      <div className="quick-add-header">
        <div>
          <p className="eyebrow">Fase 6</p>
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
            Ano
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
              type="submit"
            >
              {submitting ? "Guardando..." : "Guardar gasto"}
            </button>
          </div>

          {loadingCategories ? (
            <p className="muted quick-add-feedback">
              Cargando categorias para {selection.year}...
            </p>
          ) : null}

          {error ? <p className="error-text quick-add-feedback">{error}</p> : null}
          {success ? <p className="success-text quick-add-feedback">{success}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
