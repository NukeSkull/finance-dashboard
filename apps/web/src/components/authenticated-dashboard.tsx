"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSections } from "@/components/dashboard-sections";
import { KpiCard } from "@/components/kpi-card";
import { MonthSelector } from "@/components/month-selector";
import { QuickAddExpensePanel } from "@/components/quick-add-expense-panel";
import { useAuth } from "@/features/auth/auth-provider";
import { useSettings } from "@/features/settings/settings-provider";
import { fetchMonthlySummary, fetchNetWorthSummary } from "@/lib/api/client";
import {
  MonthlySummary,
  NetWorthSummary,
  QuickAddExpenseResult
} from "@/lib/api/types";
import { formatCurrency, formatPercent } from "@/lib/dashboard/formatters";
import { calculateDashboardDerivedMetrics } from "@/lib/dashboard/metrics";
import {
  MonthSelection,
  getCurrentMonthSelection,
  getMonthOptions
} from "@/lib/dashboard/month-selection";

export function AuthenticatedDashboard() {
  const router = useRouter();
  const { getIdToken, loading, logout, user } = useAuth();
  const {
    lastDashboardSelection,
    setLastDashboardSelection,
    settings
  } = useSettings();
  const [selection, setSelection] = useState<MonthSelection>(() =>
    settings.defaultDashboardPeriodMode === "last_visited" && lastDashboardSelection
      ? lastDashboardSelection
      : getCurrentMonthSelection()
  );
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [netWorthError, setNetWorthError] = useState<string | null>(null);
  const [netWorthLoading, setNetWorthLoading] = useState(false);
  const [summaryReloadKey, setSummaryReloadKey] = useState(0);
  const [quickAddNotice, setQuickAddNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let ignore = false;

    async function loadSummary() {
      setSummaryLoading(true);
      setSummaryError(null);

      try {
        const token = await getIdToken();
        const data = await fetchMonthlySummary({
          token,
          month: selection.month,
          year: selection.year
        });

        if (!ignore) {
          setSummary(data);
        }
      } catch {
        if (!ignore) {
          setSummary(null);
          setSummaryError(
            "No se pudo cargar ese mes. Puede que aun no exista la hoja del ano seleccionado."
          );
        }
      } finally {
        if (!ignore) {
          setSummaryLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      ignore = true;
    };
  }, [getIdToken, selection.month, selection.year, summaryReloadKey, user]);

  useEffect(() => {
    if (!user || !settings.showNetWorthOnHome) {
      return;
    }

    let ignore = false;

    async function loadNetWorth() {
      setNetWorthLoading(true);
      setNetWorthError(null);

      try {
        const token = await getIdToken();
        const data = await fetchNetWorthSummary({ token });

        if (!ignore) {
          setNetWorth(data);
        }
      } catch {
        if (!ignore) {
          setNetWorth(null);
          setNetWorthError("No se pudo cargar el resumen global de patrimonio.");
        }
      } finally {
        if (!ignore) {
          setNetWorthLoading(false);
        }
      }
    }

    void loadNetWorth();

    return () => {
      ignore = true;
    };
  }, [getIdToken, settings.showNetWorthOnHome, user]);

  async function handleLogout() {
    if (
      settings.confirmBeforeLogout &&
      typeof window !== "undefined" &&
      !window.confirm("Se va a cerrar la sesion actual. Quieres continuar?")
    ) {
      return;
    }

    await logout();
    router.replace("/login");
  }

  function handleExpenseAdded(result: QuickAddExpenseResult) {
    if (result.year === selection.year && result.month === selection.month) {
      setQuickAddNotice(
        `Se ha actualizado el resumen de ${result.categoryLabel} para ${result.month}/${result.year}.`
      );
      setSummaryReloadKey((currentValue) => currentValue + 1);
      return;
    }

    setQuickAddNotice(
      `Gasto guardado en ${result.categoryLabel} para ${result.month}/${result.year}. El dashboard sigue mostrando ${selection.month}/${selection.year}.`
    );
  }

  function handleSelectionChange(nextSelection: MonthSelection) {
    setSelection(nextSelection);
    setLastDashboardSelection(nextSelection);
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
  const derived = summary ? calculateDashboardDerivedMetrics(summary) : null;

  return (
    <main className="app-shell">
      <section className="page-stack">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dashboard general</p>
            <h1>Finance Dashboard</h1>
            <p className="lede">
              Resumen ejecutivo mensual conectado a Google Sheets.
            </p>
            <p className="user-line">{user.email}</p>
          </div>
          <button className="button secondary" type="button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </header>

        <section className="dashboard-toolbar" aria-label="Filtros del dashboard">
          <div>
            <p className="eyebrow">Periodo</p>
            <h2>
              {monthLabel} {selection.year}
            </h2>
          </div>
          <MonthSelector
            disabled={summaryLoading}
            onChange={handleSelectionChange}
            selection={selection}
          />
        </section>

        {summaryError ? (
          <section className="notice-panel error" role="alert">
            {summaryError}
          </section>
        ) : null}

        {quickAddNotice ? (
          <section className="notice-panel compact">{quickAddNotice}</section>
        ) : null}

        {summaryLoading && !summary ? (
          <section className="notice-panel">Cargando resumen mensual...</section>
        ) : null}

        {summary && derived ? (
          <>
            {summaryLoading ? (
              <section className="notice-panel compact">
                Actualizando resumen...
              </section>
            ) : null}

            {derived.isEmpty ? (
              <section className="notice-panel">
                No hay valores registrados para este periodo.
              </section>
            ) : null}

            <section className="kpi-grid" aria-label="KPIs mensuales">
              <KpiCard
                label="Ingresos"
                value={formatCurrency(summary.income, settings.numberFormatLocale)}
              />
              <KpiCard
                helper="Gastos fijos o necesarios"
                label="Gastos vitales"
                tone="bad"
                value={formatCurrency(summary.essentialExpenses, settings.numberFormatLocale)}
              />
              <KpiCard
                helper="Ocio y extraordinarios"
                label="Gastos extra"
                tone="bad"
                value={formatCurrency(
                  summary.discretionaryExpenses,
                  settings.numberFormatLocale
                )}
              />
              <KpiCard
                label="Gasto total"
                tone="bad"
                value={formatCurrency(summary.totalExpenses, settings.numberFormatLocale)}
              />
              <KpiCard
                label="Invertido"
                tone="good"
                value={formatCurrency(summary.invested, settings.numberFormatLocale)}
              />
              <KpiCard
                label="Ahorro"
                tone={summary.savings >= 0 ? "good" : "bad"}
                value={formatCurrency(summary.savings, settings.numberFormatLocale)}
              />
              <KpiCard
                helper="Ingresos - gasto total"
                label="Balance mensual"
                tone={derived.monthlyBalance >= 0 ? "good" : "bad"}
                value={formatCurrency(
                  derived.monthlyBalance,
                  settings.numberFormatLocale
                )}
              />
              <KpiCard
                helper="Ahorro dividido entre ingresos"
                label="Ratio ahorro"
                tone={
                  derived.savingsRate !== null && derived.savingsRate >= 0
                    ? "good"
                    : "bad"
                }
                value={formatPercent(
                  derived.savingsRate,
                  settings.numberFormatLocale
                )}
              />
            </section>
          </>
        ) : null}

        {settings.showNetWorthOnHome && netWorthError ? (
          <section className="notice-panel error" role="alert">
            {netWorthError}
          </section>
        ) : null}

        {settings.showNetWorthOnHome && netWorthLoading && !netWorth ? (
          <section className="notice-panel">Cargando patrimonio total...</section>
        ) : null}

        {settings.showNetWorthOnHome && netWorth ? (
          <section className="detail-card" aria-label="Patrimonio total">
            <header className="detail-card-header">
              <div>
                <p className="eyebrow">Patrimonio total</p>
                <h2>Distribucion global</h2>
              </div>
              <strong className="detail-total good">
                {formatCurrency(netWorth.totalNetWorth, settings.numberFormatLocale)}
              </strong>
            </header>

            {netWorthLoading ? (
              <section className="notice-panel compact">
                Actualizando patrimonio...
              </section>
            ) : null}

            <section className="kpi-grid" aria-label="KPIs de patrimonio">
              <KpiCard
                label="Patrimonio total"
                value={formatCurrency(
                  netWorth.totalNetWorth,
                  settings.numberFormatLocale
                )}
              />
              <KpiCard
                label="Liquido"
                value={formatCurrency(netWorth.liquidTotal, settings.numberFormatLocale)}
              />
              <KpiCard
                label="Invertido"
                value={formatCurrency(
                  netWorth.investedTotal,
                  settings.numberFormatLocale
                )}
              />
              <KpiCard
                label="% liquido"
                value={formatPercent(netWorth.liquidRatio, settings.numberFormatLocale)}
              />
              <KpiCard
                label="% invertido"
                value={formatPercent(
                  netWorth.investedRatio,
                  settings.numberFormatLocale
                )}
              />
            </section>

            <p className="muted net-worth-groups-line">
              {netWorth.groups
                .map(
                  (group) =>
                    `${group.label}: ${formatCurrency(
                      group.amount,
                      settings.numberFormatLocale
                    )}`
                )
                .join(" | ")}
            </p>

            <div className="net-worth-table" role="table" aria-label="Patrimonio por sitio">
              <div className="net-worth-row net-worth-head" role="row">
                <span role="columnheader">Sitio</span>
                <span role="columnheader">Total</span>
                <span role="columnheader">% del patrimonio</span>
              </div>

              {netWorth.sites.map((site) => (
                <div className="net-worth-row" key={site.label} role="row">
                  <strong role="cell">{site.label}</strong>
                  <span role="cell">
                    {formatCurrency(site.amount, settings.numberFormatLocale)}
                  </span>
                  <span role="cell">
                    {formatPercent(site.shareRatio, settings.numberFormatLocale)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {settings.showQuickAddOnHome ? (
          <QuickAddExpensePanel
            getIdToken={getIdToken}
            onExpenseAdded={handleExpenseAdded}
          />
        ) : null}

        <DashboardSections />
      </section>
    </main>
  );
}
