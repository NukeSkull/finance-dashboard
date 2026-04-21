"use client";

import Link from "next/link";
import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import { useEffect, useState } from "react";
import { MonthSelector } from "@/components/month-selector";
import { useAuth } from "@/features/auth/auth-provider";
import { fetchIncomeExpensesDetail } from "@/lib/api/client";
import { IncomeExpensesDetail } from "@/lib/api/types";
import { formatCurrency } from "@/lib/dashboard/formatters";
import {
  MonthSelection,
  getCurrentMonthSelection,
  getMonthOptions
} from "@/lib/dashboard/month-selection";

export function IncomeExpensesDetailPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getIdToken, loading, logout, user } = useAuth();
  const [selection, setSelection] = useState<MonthSelection>(() =>
    parseSelection(searchParams)
  );
  const [detail, setDetail] = useState<IncomeExpensesDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    const nextSelection = parseSelection(searchParams);

    setSelection((currentValue) =>
      currentValue.year === nextSelection.year &&
      currentValue.month === nextSelection.month
        ? currentValue
        : nextSelection
    );
  }, [searchParams]);

  useEffect(() => {
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (year && month) {
      return;
    }

    const currentSelection = getCurrentMonthSelection();
    router.replace(
      buildSelectionUrl(pathname, {
        year: currentSelection.year,
        month: currentSelection.month
      })
    );
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let ignore = false;

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError(null);

      try {
        const token = await getIdToken();
        const data = await fetchIncomeExpensesDetail({
          token,
          year: selection.year,
          month: selection.month
        });

        if (!ignore) {
          setDetail(data);
        }
      } catch {
        if (!ignore) {
          setDetail(null);
          setDetailError(
            "No se pudo cargar el detalle de ingresos y gastos para ese periodo."
          );
        }
      } finally {
        if (!ignore) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      ignore = true;
    };
  }, [getIdToken, selection.month, selection.year, user]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  function handleSelectionChange(nextSelection: MonthSelection) {
    setSelection(nextSelection);
    router.replace(buildSelectionUrl(pathname, nextSelection));
  }

  if (loading || !user) {
    return (
      <main className="app-shell">
        <p className="muted">Comprobando sesion...</p>
      </main>
    );
  }

  const monthLabel =
    getMonthOptions().find((month) => month.value === selection.month)?.label ??
    "Mes";

  return (
    <main className="app-shell">
      <section className="page-stack">
        <header className="topbar">
          <div>
            <p className="eyebrow">Vista por seccion</p>
            <h1>Ingresos y gastos</h1>
            <p className="lede">
              Detalle mensual por categorias reales del Google Sheet.
            </p>
            <p className="user-line">{user.email}</p>
          </div>
          <div className="page-actions">
            <Link className="button secondary" href="/">
              Volver al dashboard
            </Link>
            <button className="button secondary" type="button" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        </header>

        <section className="dashboard-toolbar" aria-label="Filtros de ingresos y gastos">
          <div>
            <p className="eyebrow">Periodo</p>
            <h2>
              {monthLabel} {selection.year}
            </h2>
            <p className="muted section-intro">
              Vista de lectura v1 con ingresos, gastos vitales y gastos extra.
            </p>
          </div>
          <MonthSelector
            disabled={detailLoading}
            onChange={handleSelectionChange}
            selection={selection}
          />
        </section>

        {detailError ? (
          <section className="notice-panel error" role="alert">
            {detailError}
          </section>
        ) : null}

        {detailLoading && !detail ? (
          <section className="notice-panel">Cargando detalle mensual...</section>
        ) : null}

        {detail ? (
          <>
            {detailLoading ? (
              <section className="notice-panel compact">
                Actualizando detalle...
              </section>
            ) : null}

            <section className="kpi-grid" aria-label="Resumen del periodo">
              <article className="kpi-card">
                <span>Ingresos</span>
                <strong>{formatCurrency(detail.incomeSection.total)}</strong>
              </article>
              <article className="kpi-card bad">
                <span>Gastos vitales</span>
                <strong>{formatCurrency(detail.essentialExpensesSection.total)}</strong>
              </article>
              <article className="kpi-card bad">
                <span>Gastos extra</span>
                <strong>{formatCurrency(detail.discretionaryExpensesSection.total)}</strong>
              </article>
              <article className="kpi-card bad">
                <span>Gasto total</span>
                <strong>{formatCurrency(detail.grandTotalExpenses)}</strong>
              </article>
            </section>

            <section className="detail-sections" aria-label="Detalle por bloques">
              <IncomeExpensesSectionCard section={detail.incomeSection} tone="good" />
              <IncomeExpensesSectionCard
                section={detail.essentialExpensesSection}
                tone="bad"
              />
              <IncomeExpensesSectionCard
                section={detail.discretionaryExpensesSection}
                tone="bad"
              />
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function IncomeExpensesSectionCard(input: {
  section: IncomeExpensesDetail["incomeSection"];
  tone: "good" | "bad";
}) {
  return (
    <section className="detail-card">
      <header className="detail-card-header">
        <div>
          <p className="eyebrow">{input.section.title}</p>
          <h2>{input.section.title}</h2>
        </div>
        <strong className={`detail-total ${input.tone}`}>
          {formatCurrency(input.section.total)}
        </strong>
      </header>

      <div className="detail-table" role="table" aria-label={input.section.title}>
        <div className="detail-row detail-row-head" role="row">
          <span role="columnheader">Categoria</span>
          <span role="columnheader">Importe</span>
        </div>

        {input.section.items.map((item) => (
          <div className="detail-row" key={`${input.section.title}-${item.row}`} role="row">
            <span role="cell">{item.label}</span>
            <strong role="cell">{formatCurrency(item.value)}</strong>
          </div>
        ))}

        <div className="detail-row detail-row-total" role="row">
          <span role="cell">{input.section.totalLabel}</span>
          <strong role="cell">{formatCurrency(input.section.total)}</strong>
        </div>
      </div>
    </section>
  );
}

function parseSelection(searchParams: URLSearchParams | ReadonlyURLSearchParams) {
  const fallback = getCurrentMonthSelection();
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  return {
    year:
      Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : fallback.year,
    month:
      Number.isInteger(month) && month >= 1 && month <= 12 ? month : fallback.month
  };
}

function buildSelectionUrl(pathname: string, selection: MonthSelection) {
  const params = new URLSearchParams();
  params.set("year", String(selection.year));
  params.set("month", String(selection.month));
  return `${pathname}?${params.toString()}`;
}
