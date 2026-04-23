"use client";

import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";
import { StatusPanel } from "@/components/status-panel";
import { useAuth } from "@/features/auth/auth-provider";
import { useAppShell } from "@/features/app-shell/app-shell-provider";
import { useSettings } from "@/features/settings/settings-provider";
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
  const { getIdToken, loading, user } = useAuth();
  const { globalMonthSelection, setGlobalMonthSelection, settings } = useSettings();
  const { lastQuickAddResult, quickAddVersion } = useAppShell();
  const previousQuerySelectionKeyRef = useRef<string | null>(null);
  const [detail, setDetail] = useState<IncomeExpensesDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const selection = globalMonthSelection;
  const querySelection = parseSelection(searchParams);
  const hasExplicitSelection =
    searchParams.get("year") !== null && searchParams.get("month") !== null;
  const selectionKey = `${selection.year}-${selection.month}`;
  const querySelectionKey = `${querySelection.year}-${querySelection.month}`;
  const detailReloadKey =
    lastQuickAddResult &&
    lastQuickAddResult.year === selection.year &&
    lastQuickAddResult.month === selection.month
      ? quickAddVersion
      : 0;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!hasExplicitSelection) {
      previousQuerySelectionKeyRef.current = null;
      return;
    }

    const previousQuerySelectionKey = previousQuerySelectionKeyRef.current;
    previousQuerySelectionKeyRef.current = querySelectionKey;

    if (previousQuerySelectionKey === null) {
      return;
    }

    if (
      previousQuerySelectionKey !== querySelectionKey &&
      querySelectionKey !== selectionKey
    ) {
      setGlobalMonthSelection(querySelection);
    }
  }, [
    hasExplicitSelection,
    querySelectionKey,
    selectionKey,
    setGlobalMonthSelection
  ]);

  useEffect(() => {
    if (hasExplicitSelection && querySelectionKey === selectionKey) {
      return;
    }

    router.replace(buildSelectionUrl(pathname, selection));
  }, [
    hasExplicitSelection,
    pathname,
    querySelectionKey,
    router,
    selection,
    selectionKey
  ]);

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
            "No se pudo cargar el detalle de ingresos y gastos para ese período."
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
  }, [detailReloadKey, getIdToken, selection.month, selection.year, user]);

  if (loading || !user) {
    return (
      <main className="app-shell">
        <p className="muted">Comprobando sesión...</p>
      </main>
    );
  }

  const monthLabel =
    getMonthOptions().find((month) => month.value === selection.month)?.label ?? "Mes";

  return (
    <AuthenticatedAppShell
      description="Detalle mensual por categorías reales del Google Sheet."
      eyebrow="Ingresos y gastos"
      title="Ingresos y gastos"
    >
      <section className="dashboard-toolbar" aria-label="Resumen de ingresos y gastos">
        <div>
          <p className="eyebrow">Detalle del período</p>
          <h2>
            {monthLabel} {selection.year}
          </h2>
          <p className="muted section-intro">
            Lectura detallada de ingresos, gastos vitales y gastos extra del mes activo.
          </p>
        </div>
      </section>

      {detailError ? <StatusPanel tone="error">{detailError}</StatusPanel> : null}

      {detailLoading && !detail ? (
        <StatusPanel>Cargando detalle mensual...</StatusPanel>
      ) : null}

      {detail ? (
        <>
          {detailLoading ? (
            <StatusPanel compact>Actualizando detalle...</StatusPanel>
          ) : null}

          <section className="kpi-grid" aria-label="Resumen del período">
            <article className="kpi-card">
              <span>Ingresos</span>
              <strong>
                {formatCurrency(detail.incomeSection.total, settings.numberFormatLocale)}
              </strong>
            </article>
            <article className="kpi-card bad">
              <span>Gastos vitales</span>
              <strong>
                {formatCurrency(
                  detail.essentialExpensesSection.total,
                  settings.numberFormatLocale
                )}
              </strong>
            </article>
            <article className="kpi-card bad">
              <span>Gastos extra</span>
              <strong>
                {formatCurrency(
                  detail.discretionaryExpensesSection.total,
                  settings.numberFormatLocale
                )}
              </strong>
            </article>
            <article className="kpi-card bad">
              <span>Gasto total</span>
              <strong>
                {formatCurrency(detail.grandTotalExpenses, settings.numberFormatLocale)}
              </strong>
            </article>
          </section>

          <section className="detail-sections" aria-label="Detalle por bloques">
            <IncomeExpensesSectionCard
              locale={settings.numberFormatLocale}
              section={detail.incomeSection}
              tone="good"
            />
            <IncomeExpensesSectionCard
              locale={settings.numberFormatLocale}
              section={detail.essentialExpensesSection}
              tone="bad"
            />
            <IncomeExpensesSectionCard
              locale={settings.numberFormatLocale}
              section={detail.discretionaryExpensesSection}
              tone="bad"
            />
          </section>
        </>
      ) : null}
    </AuthenticatedAppShell>
  );
}

function IncomeExpensesSectionCard(input: {
  locale: "es-ES" | "en-US";
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
          {formatCurrency(input.section.total, input.locale)}
        </strong>
      </header>

      <div className="detail-table" role="table" aria-label={input.section.title}>
        <div className="detail-row detail-row-head" role="row">
          <span role="columnheader">Categoría</span>
          <span role="columnheader">Importe</span>
        </div>

        {input.section.items.map((item) => (
          <div className="detail-row" key={`${input.section.title}-${item.row}`} role="row">
            <span role="cell">{item.label}</span>
            <strong role="cell">{formatCurrency(item.value, input.locale)}</strong>
          </div>
        ))}

        <div className="detail-row detail-row-total" role="row">
          <span role="cell">{input.section.totalLabel}</span>
          <strong role="cell">{formatCurrency(input.section.total, input.locale)}</strong>
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
