"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";
import { DonutChart } from "@/components/charts/donut-chart";
import { getFinanceChartColor } from "@/components/charts/chart-colors";
import { DashboardSections } from "@/components/dashboard-sections";
import { StatusPanel } from "@/components/status-panel";
import { useAuth } from "@/features/auth/auth-provider";
import { useAppShell } from "@/features/app-shell/app-shell-provider";
import { useSettings } from "@/features/settings/settings-provider";
import { fetchMonthlySummary, fetchNetWorthSummary } from "@/lib/api/client";
import {
  MonthlySummary,
  NetWorthGroup,
  NetWorthSummary
} from "@/lib/api/types";
import { formatCurrency, formatPercent } from "@/lib/dashboard/formatters";
import {
  buildSummaryDelta,
  calculateDashboardDerivedMetrics,
  getPreviousMonthSelection
} from "@/lib/dashboard/metrics";
import { getMonthOptions } from "@/lib/dashboard/month-selection";

export function AuthenticatedDashboard() {
  const { getIdToken, loading, user } = useAuth();
  const { settings, globalMonthSelection } = useSettings();
  const { lastQuickAddResult, quickAddVersion } = useAppShell();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [previousSummary, setPreviousSummary] = useState<MonthlySummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [netWorthError, setNetWorthError] = useState<string | null>(null);
  const [netWorthLoading, setNetWorthLoading] = useState(false);

  const summaryReloadKey =
    lastQuickAddResult &&
    lastQuickAddResult.year === globalMonthSelection.year &&
    lastQuickAddResult.month === globalMonthSelection.month
      ? quickAddVersion
      : 0;

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
        const previousSelection = getPreviousMonthSelection({
          month: globalMonthSelection.month,
          year: globalMonthSelection.year
        });
        const data = await fetchMonthlySummary({
          token,
          month: globalMonthSelection.month,
          year: globalMonthSelection.year
        });
        const previous = await fetchMonthlySummary({
          token,
          month: previousSelection.month,
          year: previousSelection.year
        }).catch(() => null);

        if (!ignore) {
          setSummary(data);
          setPreviousSummary(previous);
        }
      } catch {
        if (!ignore) {
          setSummary(null);
          setPreviousSummary(null);
          setSummaryError(
            "No se pudo cargar el resumen del período seleccionado."
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
  }, [
    getIdToken,
    globalMonthSelection.month,
    globalMonthSelection.year,
    summaryReloadKey,
    user
  ]);

  useEffect(() => {
    if (!user) {
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
  }, [getIdToken, user]);

  if (loading || !user) {
    return (
      <main className="app-shell">
        <p className="muted">Comprobando sesión...</p>
      </main>
    );
  }

  const monthLabel =
    getMonthOptions().find((month) => month.value === globalMonthSelection.month)?.label ??
    "Mes";
  const derived = summary ? calculateDashboardDerivedMetrics(summary) : null;
  const visibleSignals = derived?.signals.slice(0, 3) ?? [];
  const donutData = netWorth ? buildNetWorthDonutData(netWorth.groups) : [];

  return (
    <AuthenticatedAppShell
      description="Vista general de tu patrimonio y del período seleccionado."
      eyebrow="Resumen"
      title="Resumen"
    >
      {summaryError ? <StatusPanel tone="error">{summaryError}</StatusPanel> : null}
      {netWorthError ? <StatusPanel tone="error">{netWorthError}</StatusPanel> : null}

      {summaryLoading && !summary ? (
        <StatusPanel>Cargando resumen mensual...</StatusPanel>
      ) : null}

      {netWorthLoading && !netWorth ? (
        <StatusPanel>Cargando patrimonio total...</StatusPanel>
      ) : null}

      {summary || netWorth ? (
        <>
          {summaryLoading && summary ? (
            <StatusPanel compact>Actualizando resumen...</StatusPanel>
          ) : null}

          {netWorthLoading && netWorth ? (
            <StatusPanel compact>Actualizando patrimonio...</StatusPanel>
          ) : null}

          {netWorth ? (
            <section className="hero-net-worth-card" aria-label="Patrimonio total">
              <div className="hero-net-worth-copy">
                <p className="eyebrow">Patrimonio total</p>
                <h2>{formatCurrency(netWorth.totalNetWorth, settings.numberFormatLocale)}</h2>
                <p className="muted hero-net-worth-subtitle">
                  Panorama global de tu patrimonio actual.
                </p>

                <div className="hero-net-worth-breakdown">
                  <article className="hero-breakdown-item">
                    <span>Líquido</span>
                    <strong>
                      {formatCurrency(netWorth.liquidTotal, settings.numberFormatLocale)}
                    </strong>
                  </article>
                  <article className="hero-breakdown-item">
                    <span>Invertido</span>
                    <strong>
                      {formatCurrency(netWorth.investedTotal, settings.numberFormatLocale)}
                    </strong>
                  </article>
                  <article className="hero-breakdown-item">
                    <span>% líquido</span>
                    <strong>
                      {formatPercent(netWorth.liquidRatio, settings.numberFormatLocale)}
                    </strong>
                  </article>
                  <article className="hero-breakdown-item">
                    <span>% invertido</span>
                    <strong>
                      {formatPercent(netWorth.investedRatio, settings.numberFormatLocale)}
                    </strong>
                  </article>
                </div>
              </div>

              <div className="hero-net-worth-visual">
                <div className="hero-chart-wrap">
                  <DonutChart data={donutData} />
                </div>
                <div className="hero-chart-legend" aria-label="Distribución macro del patrimonio">
                  {netWorth.groups.map((group) => (
                    <article className="hero-legend-item" key={group.key}>
                      <div className="hero-legend-label">
                        <span
                          aria-hidden="true"
                          className="hero-legend-dot"
                          style={{ backgroundColor: getFinanceChartColor(group.key) }}
                        />
                        <strong>{group.label}</strong>
                      </div>
                      <div className="hero-legend-values">
                        <span>
                          {formatCurrency(group.amount, settings.numberFormatLocale)}
                        </span>
                        <span>
                          {formatPercent(
                            netWorth.totalNetWorth > 0
                              ? group.amount / netWorth.totalNetWorth
                              : 0,
                            settings.numberFormatLocale
                          )}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {summary && derived ? (
            <>
              <section className="dashboard-summary-header">
                <div>
                  <p className="eyebrow">Estado del mes</p>
                  <h2>
                    {monthLabel} {globalMonthSelection.year}
                  </h2>
                </div>
                {derived.isEmpty ? (
                  <p className="muted dashboard-summary-empty">
                    Sin movimientos relevantes registrados en este período.
                  </p>
                ) : null}
              </section>

              <section className="dashboard-kpi-grid" aria-label="KPIs mensuales">
                <DashboardMetricCard
                  delta={previousSummary ? buildSummaryDelta(summary.income, previousSummary.income, "Ingresos") : null}
                  label="Ingresos"
                  locale={settings.numberFormatLocale}
                  tone="good"
                  value={summary.income}
                />
                <DashboardMetricCard
                  delta={
                    previousSummary
                      ? buildSummaryDelta(
                          summary.totalExpenses,
                          previousSummary.totalExpenses,
                          "Gasto total"
                        )
                      : null
                  }
                  label="Gasto total"
                  locale={settings.numberFormatLocale}
                  tone="bad"
                  value={summary.totalExpenses}
                />
                <DashboardMetricCard
                  delta={
                    previousSummary
                      ? buildSummaryDelta(summary.invested, previousSummary.invested, "Invertido")
                      : null
                  }
                  label="Invertido"
                  locale={settings.numberFormatLocale}
                  tone="good"
                  value={summary.invested}
                />
                <DashboardMetricCard
                  delta={
                    previousSummary
                      ? buildSummaryDelta(summary.savings, previousSummary.savings, "Ahorro")
                      : null
                  }
                  label="Ahorro del mes"
                  locale={settings.numberFormatLocale}
                  tone={summary.savings >= 0 ? "good" : "bad"}
                  value={summary.savings}
                />
              </section>

              <section className="dashboard-secondary-grid">
                <section className="detail-card compact-signal-card" aria-label="Señales del mes">
                  <header className="detail-card-header">
                    <div>
                      <p className="eyebrow">Alertas</p>
                      <h2>Señales del mes</h2>
                    </div>
                    <strong className="detail-total">{visibleSignals.length}</strong>
                  </header>

                  {visibleSignals.length > 0 ? (
                    <div className="signal-stack">
                      {visibleSignals.map((signal) => (
                        <article className={`signal-pill ${signal.tone}`} key={signal.id}>
                          {signal.message}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">Sin alertas relevantes este mes.</p>
                  )}
                </section>

                <section className="detail-card quick-links-card" aria-label="Accesos rápidos">
                  <header className="detail-card-header">
                    <div>
                      <p className="eyebrow">Atajos</p>
                      <h2>Explora el detalle</h2>
                    </div>
                  </header>

                  <DashboardSections />
                </section>
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </AuthenticatedAppShell>
  );
}

function DashboardMetricCard(input: {
  delta: ReturnType<typeof buildSummaryDelta> | null;
  label: string;
  locale: "es-ES" | "en-US";
  tone: "good" | "bad";
  value: number;
}) {
  const deltaDirection = input.delta?.direction ?? "flat";
  const deltaPrefix =
    deltaDirection === "up" ? "↑" : deltaDirection === "down" ? "↓" : "•";

  return (
    <article className={`dashboard-metric-card ${input.tone}`}>
      <span>{input.label}</span>
      <strong>{formatCurrency(input.value, input.locale)}</strong>
      {input.delta ? (
        <div className={`delta-chip ${deltaDirection}`}>
          <span>{deltaPrefix}</span>
          <span>{formatCurrency(Math.abs(input.delta.absolute), input.locale)}</span>
        </div>
      ) : (
        <div className="delta-chip flat">
          <span>•</span>
          <span>Sin comparativa</span>
        </div>
      )}
    </article>
  );
}

function buildNetWorthDonutData(groups: NetWorthGroup[]) {
  return groups.map((group) => ({
    id: group.key,
    label: group.label,
    value: Math.max(group.amount, 0),
    color: getFinanceChartColor(group.key)
  }));
}
