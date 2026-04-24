"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";
import { DonutChart } from "@/components/charts/donut-chart";
import { getFinanceChartColor } from "@/components/charts/chart-colors";
import { DashboardPageSkeleton } from "@/components/page-skeletons";
import { PrivacyValue } from "@/components/privacy-value";
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
  const router = useRouter();
  const { getIdToken, loading, user } = useAuth();
  const { settings, globalMonthSelection, privacyModeEnabled } = useSettings();
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
          setSummaryError("No se pudo cargar el resumen del período seleccionado.");
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
  const heroLegendRows = netWorth
    ? netWorth.groups
        .filter((group) => group.amount > 0)
        .map((group) => ({
          amount: group.amount,
          color: getFinanceChartColor(group.key),
          id: group.key,
          label: getNetWorthDisplayLabel(group),
          share: netWorth.totalNetWorth > 0 ? group.amount / netWorth.totalNetWorth : 0
        }))
    : [];
  const heroInsights = netWorth ? buildNetWorthInsights(netWorth) : [];

  return (
    <AuthenticatedAppShell
      description="Vista general de tu patrimonio y del período seleccionado."
      eyebrow="Resumen"
      title="Vista general"
    >
      {summaryError ? <StatusPanel tone="error">{summaryError}</StatusPanel> : null}
      {netWorthError ? <StatusPanel tone="error">{netWorthError}</StatusPanel> : null}

      {(summaryLoading && !summary) || (netWorthLoading && !netWorth) ? (
        <DashboardPageSkeleton />
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
              <div className="hero-net-worth-header">
                <div className="hero-net-worth-primary">
                  <p className="eyebrow">Patrimonio total</p>
                  <div className="hero-net-worth-title-row">
                    <h2>
                      <PrivacyValue as="span" hidden={privacyModeEnabled} intensity="strong">
                        {formatCurrency(netWorth.totalNetWorth, settings.numberFormatLocale)}
                      </PrivacyValue>
                    </h2>
                  </div>
                </div>

                <div className="hero-net-worth-breakdown">
                  <article className="hero-breakdown-item">
                    <span>Líquido</span>
                    <strong>
                      <PrivacyValue as="span" hidden={privacyModeEnabled}>
                        {formatCurrency(netWorth.liquidTotal, settings.numberFormatLocale)}
                      </PrivacyValue>
                    </strong>
                  </article>
                  <article className="hero-breakdown-item">
                    <span>Invertido</span>
                    <strong>
                      <PrivacyValue as="span" hidden={privacyModeEnabled}>
                        {formatCurrency(netWorth.investedTotal, settings.numberFormatLocale)}
                      </PrivacyValue>
                    </strong>
                  </article>
                  <article
                    aria-label="Distribución líquido e invertido"
                    className="hero-breakdown-item hero-breakdown-composition"
                  >
                    <div className="hero-breakdown-composition-header">
                      <span>Distribución líquido / invertido</span>
                    </div>

                    <div className="hero-composition-bar" aria-hidden="true">
                      <div
                        className="hero-composition-bar-segment liquid"
                        style={{ width: `${Math.max(netWorth.liquidRatio * 100, 0)}%` }}
                      />
                      <div
                        className="hero-composition-bar-segment invested"
                        style={{ width: `${Math.max(netWorth.investedRatio * 100, 0)}%` }}
                      />
                      <span className="hero-composition-target" style={{ left: "20%" }}>
                        <span className="hero-composition-target-label">20%</span>
                      </span>
                    </div>

                    <div className="hero-composition-values">
                      <span>
                        Líquido{" "}
                        <strong>
                          <PrivacyValue as="span" hidden={privacyModeEnabled}>
                            {formatPercent(netWorth.liquidRatio, settings.numberFormatLocale)}
                          </PrivacyValue>
                        </strong>
                      </span>
                      <span>
                        Invertido{" "}
                        <strong>
                          <PrivacyValue as="span" hidden={privacyModeEnabled}>
                            {formatPercent(netWorth.investedRatio, settings.numberFormatLocale)}
                          </PrivacyValue>
                        </strong>
                      </span>
                    </div>
                  </article>
                </div>
              </div>

              <div className="hero-net-worth-body">
                <div className="hero-chart-wrap">
                  <DonutChart
                    data={donutData}
                    locale={settings.numberFormatLocale}
                    privacyModeEnabled={privacyModeEnabled}
                  />
                </div>

                <div className="hero-side-panel">
                  <div className="hero-chart-legend" aria-label="Distribución macro del patrimonio">
                    {heroLegendRows.map((item) => (
                      <article className="hero-legend-item" key={item.id}>
                        <div className="hero-legend-label">
                          <span
                            aria-hidden="true"
                            className="hero-legend-dot"
                            style={{ backgroundColor: item.color }}
                          />
                          <strong>{item.label}</strong>
                        </div>
                        <div className="hero-legend-values">
                          <strong>
                            <PrivacyValue as="span" hidden={privacyModeEnabled}>
                              {formatCurrency(item.amount, settings.numberFormatLocale)}
                            </PrivacyValue>
                          </strong>
                          <span>
                            <PrivacyValue as="span" hidden={privacyModeEnabled}>
                              {formatPercent(item.share, settings.numberFormatLocale)}
                            </PrivacyValue>
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>

                  <section className="hero-insights" aria-label="Salud patrimonial">
                    <p className="eyebrow">Salud patrimonial</p>
                    <div className="hero-insight-list">
                      {heroInsights.map((insight) => (
                        <article className={`hero-insight-chip ${insight.tone}`} key={insight.title}>
                          <strong>{insight.title}</strong>
                          <span>{insight.description}</span>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </section>
          ) : null}

          {summary && derived ? (
            <section className="dashboard-month-grid">
              <section
                className="detail-card compact-signal-card priority-card"
                aria-label="Señales del mes"
              >
                <header className="detail-card-header detail-card-header-tight">
                  <div>
                    <p className="eyebrow">Alertas</p>
                    <h2>Señales del mes</h2>
                  </div>
                </header>

                {visibleSignals.length > 0 ? (
                  <div className="signal-stack">
                    {visibleSignals.map((signal) => (
                      <article className={`signal-pill ${signal.tone}`} key={signal.id}>
                        <span className="signal-pill-marker" aria-hidden="true" />
                        <span>{signal.message}</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="muted">Sin alertas relevantes este mes.</p>
                )}
              </section>

              <section className="dashboard-month-state" aria-label="Estado del mes">
                <header className="dashboard-summary-header">
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
                </header>

                <section className="dashboard-kpi-grid" aria-label="KPIs mensuales">
                  <DashboardMetricCard
                    amountsHidden={privacyModeEnabled}
                    delta={
                      previousSummary
                        ? buildSummaryDelta(summary.income, previousSummary.income, "Ingresos")
                        : null
                    }
                    label="Ingresos"
                    locale={settings.numberFormatLocale}
                    semantic="standard"
                    value={summary.income}
                  />
                  <DashboardMetricCard
                    amountsHidden={privacyModeEnabled}
                    delta={
                      previousSummary
                        ? buildSummaryDelta(
                            summary.essentialExpenses,
                            previousSummary.essentialExpenses,
                            "Gastos vitales"
                          )
                        : null
                    }
                    label="Gastos vitales"
                    locale={settings.numberFormatLocale}
                    semantic="inverse"
                    value={summary.essentialExpenses}
                  />
                  <DashboardMetricCard
                    amountsHidden={privacyModeEnabled}
                    delta={
                      previousSummary
                        ? buildSummaryDelta(
                            summary.discretionaryExpenses,
                            previousSummary.discretionaryExpenses,
                            "Gastos extra"
                          )
                        : null
                    }
                    label="Gastos extra"
                    locale={settings.numberFormatLocale}
                    semantic="inverse"
                    value={summary.discretionaryExpenses}
                  />
                  <DashboardMetricCard
                    amountsHidden={privacyModeEnabled}
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
                    semantic="inverse"
                    value={summary.totalExpenses}
                  />
                  <DashboardMetricCard
                    amountsHidden={privacyModeEnabled}
                    delta={
                      previousSummary
                        ? buildSummaryDelta(summary.invested, previousSummary.invested, "Invertido")
                        : null
                    }
                    label="Inversion del mes"
                    locale={settings.numberFormatLocale}
                    semantic="standard"
                    value={summary.invested}
                  />
                  <DashboardMetricCard
                    amountsHidden={privacyModeEnabled}
                    delta={
                      previousSummary
                        ? buildSummaryDelta(summary.savings, previousSummary.savings, "Ahorro")
                        : null
                    }
                    label="Ahorro del mes"
                    locale={settings.numberFormatLocale}
                    semantic="standard"
                    value={summary.savings}
                  />
                </section>
              </section>
            </section>
          ) : null}
        </>
      ) : null}
    </AuthenticatedAppShell>
  );
}

function DashboardMetricCard(input: {
  amountsHidden: boolean;
  delta: ReturnType<typeof buildSummaryDelta> | null;
  label: string;
  locale: "es-ES" | "en-US";
  semantic: "standard" | "inverse";
  value: number;
}) {
  const previousValue = input.delta ? input.value - input.delta.absolute : null;
  const percentage =
    previousValue !== null && previousValue !== 0
      ? Math.abs(input.delta!.absolute) / Math.abs(previousValue)
      : input.delta
        ? 0
        : null;
  const direction = input.delta?.direction ?? "flat";
  const directionGlyph = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  const semanticTone =
    direction === "flat"
      ? "flat"
      : input.semantic === "inverse"
        ? direction === "up"
          ? "negative"
          : "positive"
        : direction === "up"
          ? "positive"
          : "negative";
  const valueTone =
    input.semantic === "inverse"
      ? input.value > 0
        ? "negative"
        : input.value < 0
          ? "positive"
          : "flat"
      : input.value > 0
        ? "positive"
        : input.value < 0
          ? "negative"
          : "flat";

  return (
    <article className={`dashboard-metric-card ${valueTone}`}>
      <span className="dashboard-metric-label">{input.label}</span>
      <div className="dashboard-metric-mainline">
        <PrivacyValue as="strong" hidden={input.amountsHidden}>
          {formatCurrency(input.value, input.locale)}
        </PrivacyValue>
        <div className={`delta-inline ${semanticTone}`}>
          <span aria-hidden="true">{directionGlyph}</span>
          <span>
            {percentage !== null
              ? (
                <PrivacyValue hidden={input.amountsHidden}>
                  {formatPercent(percentage, input.locale)}
                </PrivacyValue>
              )
              : "Sin comparativa"}
          </span>
        </div>
      </div>
    </article>
  );
}


function buildNetWorthDonutData(groups: NetWorthGroup[]) {
  return groups
    .filter((group) => group.amount > 0)
    .map((group) => ({
      id: group.key,
      label: getNetWorthDisplayLabel(group),
      value: Math.max(group.amount, 0),
      color: getFinanceChartColor(group.key)
    }));
}

function buildNetWorthInsights(netWorth: NetWorthSummary) {
  const sortedGroups = [...netWorth.groups].sort((left, right) => right.amount - left.amount);
  const dominantGroup = sortedGroups[0];
  const secondGroup = sortedGroups[1];
  const dominantGroupShare =
    dominantGroup && netWorth.totalNetWorth > 0 ? dominantGroup.amount / netWorth.totalNetWorth : 0;
  const secondGroupShare =
    secondGroup && netWorth.totalNetWorth > 0 ? secondGroup.amount / netWorth.totalNetWorth : 0;
  const diversificationGap = dominantGroupShare - secondGroupShare;

  const concentrationInsight =
    dominantGroupShare > 0.65
      ? {
          description:
            "Tienes una parte muy dominante del patrimonio concentrada en una sola categoría.",
          title: "Concentración alta",
          tone: "negative"
        }
      : dominantGroupShare > 0.5
        ? {
            description:
              "Conviene vigilar el peso de la categoría principal para no depender demasiado de ella.",
            title: "Concentración relevante",
            tone: "warning"
          }
        : {
            description:
              "El reparto principal no muestra una dependencia excesiva de una sola categoría.",
            title: "Concentración controlada",
            tone: "positive"
          };

  const liquidityInsight =
    netWorth.liquidRatio < 0.2
      ? {
          description:
            "Tu colchón de liquidez está por debajo de una zona cómoda y conviene vigilarlo.",
          title: "Liquidez ajustada",
          tone: "negative"
        }
      : netWorth.liquidRatio <= 0.3
        ? {
            description:
              "La liquidez está en una zona razonable para combinar flexibilidad y exposición.",
            title: "Liquidez correcta",
            tone: "warning"
          }
        : {
            description:
              "Dispones de un nivel de liquidez holgado para absorber movimientos sin tensión.",
            title: "Liquidez holgada",
            tone: "positive"
          };

  const diversificationInsight =
    dominantGroupShare > 0.6 || diversificationGap > 0.35
      ? {
          description:
            "La diversificación es limitada y el patrimonio todavía depende demasiado de pocos bloques.",
          title: "Diversificación débil",
          tone: "negative"
        }
      : dominantGroupShare > 0.45 || diversificationGap > 0.2
        ? {
            description:
              "El patrimonio está repartido en varias categorías, aunque con un bloque dominante claro.",
            title: "Diversificación aceptable",
            tone: "warning"
          }
        : {
            description:
              "El patrimonio está repartido de forma bastante equilibrada entre varias categorías.",
            title: "Diversificación sana",
            tone: "positive"
          };

  return [concentrationInsight, liquidityInsight, diversificationInsight];
}

function getNetWorthDisplayLabel(group: NetWorthGroup) {
  if (group.key === "participations") {
    return "Fondos";
  }

  if (group.key === "forex") {
    return "VT Markets";
  }

  return group.label;
}
