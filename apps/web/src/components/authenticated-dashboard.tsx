"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSections } from "@/components/dashboard-sections";
import { KpiCard } from "@/components/kpi-card";
import { MonthSelector } from "@/components/month-selector";
import { QuickAddExpensePanel } from "@/components/quick-add-expense-panel";
import { fetchMonthlySummary } from "@/lib/api/client";
import { MonthlySummary, QuickAddExpenseResult } from "@/lib/api/types";
import { formatCurrency, formatPercent } from "@/lib/dashboard/formatters";
import {
  MonthSelection,
  getCurrentMonthSelection,
  getMonthOptions
} from "@/lib/dashboard/month-selection";
import { calculateDashboardDerivedMetrics } from "@/lib/dashboard/metrics";
import { useAuth } from "@/features/auth/auth-provider";

export function AuthenticatedDashboard() {
  const router = useRouter();
  const { getIdToken, loading, logout, user } = useAuth();
  const [selection, setSelection] = useState<MonthSelection>(
    getCurrentMonthSelection
  );
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
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

  async function handleLogout() {
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
            onChange={setSelection}
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
              <KpiCard label="Ingresos" value={formatCurrency(summary.income)} />
              <KpiCard
                helper="Gastos fijos o necesarios"
                label="Gastos vitales"
                tone="bad"
                value={formatCurrency(summary.essentialExpenses)}
              />
              <KpiCard
                helper="Ocio y extraordinarios"
                label="Gastos extra"
                tone="bad"
                value={formatCurrency(summary.discretionaryExpenses)}
              />
              <KpiCard
                label="Gasto total"
                tone="bad"
                value={formatCurrency(summary.totalExpenses)}
              />
              <KpiCard
                label="Invertido"
                tone="good"
                value={formatCurrency(summary.invested)}
              />
              <KpiCard
                label="Ahorro"
                tone={summary.savings >= 0 ? "good" : "bad"}
                value={formatCurrency(summary.savings)}
              />
              <KpiCard
                helper="Ingresos - gastos - inversion"
                label="Balance mensual"
                tone={derived.monthlyBalance >= 0 ? "good" : "bad"}
                value={formatCurrency(derived.monthlyBalance)}
              />
              <KpiCard
                helper="Ahorro dividido entre ingresos"
                label="Ratio ahorro"
                tone={
                  derived.savingsRate !== null && derived.savingsRate >= 0
                    ? "good"
                    : "bad"
                }
                value={formatPercent(derived.savingsRate)}
              />
            </section>
          </>
        ) : null}

        <QuickAddExpensePanel
          getIdToken={getIdToken}
          onExpenseAdded={handleExpenseAdded}
        />

        <DashboardSections />
      </section>
    </main>
  );
}
