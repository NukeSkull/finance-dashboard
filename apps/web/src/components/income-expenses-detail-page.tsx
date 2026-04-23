"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";
import { StatusPanel } from "@/components/status-panel";
import { useAuth } from "@/features/auth/auth-provider";
import { useAppShell } from "@/features/app-shell/app-shell-provider";
import { useSettings } from "@/features/settings/settings-provider";
import {
  fetchIncomeExpensesDetail,
  fetchIncomeExpensesYearContext
} from "@/lib/api/client";
import {
  IncomeExpensesDetail,
  IncomeExpensesSection,
  IncomeExpensesYearContext
} from "@/lib/api/types";
import { formatCurrency, formatPercent } from "@/lib/dashboard/formatters";
import {
  MonthSelection,
  getCurrentMonthSelection,
  getMonthOptions
} from "@/lib/dashboard/month-selection";

type CategorySortMode =
  | "original"
  | "amount_desc"
  | "amount_asc"
  | "label_asc";

type InsightTone = "positive" | "warning" | "negative" | "neutral";

export function IncomeExpensesDetailPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getIdToken, loading, user } = useAuth();
  const { globalMonthSelection, setGlobalMonthSelection, settings } = useSettings();
  const { lastQuickAddResult, quickAddVersion } = useAppShell();
  const previousQuerySelectionKeyRef = useRef<string | null>(null);
  const [detail, setDetail] = useState<IncomeExpensesDetail | null>(null);
  const [yearContext, setYearContext] = useState<IncomeExpensesYearContext | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showOnlyActiveCategories, setShowOnlyActiveCategories] = useState(true);
  const [sortMode, setSortMode] = useState<CategorySortMode>("original");

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
    querySelection,
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

    async function loadPage() {
      setPageLoading(true);
      setPageError(null);

      try {
        const token = await getIdToken();
        const [nextDetail, nextYearContext] = await Promise.all([
          fetchIncomeExpensesDetail({
            token,
            year: selection.year,
            month: selection.month
          }),
          fetchIncomeExpensesYearContext({
            token,
            year: selection.year,
            month: selection.month
          })
        ]);

        if (!ignore) {
          setDetail(nextDetail);
          setYearContext(nextYearContext);
        }
      } catch {
        if (!ignore) {
          setDetail(null);
          setYearContext(null);
          setPageError(
            "No se pudo cargar el análisis de ingresos y gastos para ese período."
          );
        }
      } finally {
        if (!ignore) {
          setPageLoading(false);
        }
      }
    }

    void loadPage();

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

  const selectedMonthSummary =
    yearContext?.monthly.find((item) => item.month === selection.month) ?? null;
  const previousMonthSummary =
    selection.month > 1
      ? yearContext?.monthly.find((item) => item.month === selection.month - 1) ?? null
      : null;
  const displayInsights = yearContext
    ? buildDisplayInsights(yearContext, selection.month, settings.numberFormatLocale)
    : [];
  const visibleSections = detail
    ? [
        buildVisibleSection(detail.incomeSection, showOnlyActiveCategories, sortMode),
        buildVisibleSection(
          detail.essentialExpensesSection,
          showOnlyActiveCategories,
          sortMode
        ),
        buildVisibleSection(
          detail.discretionaryExpensesSection,
          showOnlyActiveCategories,
          sortMode
        )
      ]
    : [];

  return (
    <AuthenticatedAppShell
      description="Detalle mensual y comparativa del año."
      eyebrow="Ingresos y gastos"
      title="Ingresos y gastos"
    >
      {pageError ? <StatusPanel tone="error">{pageError}</StatusPanel> : null}

      {pageLoading && !detail && !yearContext ? (
        <StatusPanel>Cargando análisis mensual...</StatusPanel>
      ) : null}

      {detail && yearContext && selectedMonthSummary ? (
        <>
          {pageLoading ? <StatusPanel compact>Actualizando vista...</StatusPanel> : null}

          <section
            className="dashboard-kpi-grid income-expenses-kpi-grid"
            aria-label="KPIs del mes"
          >
            <IncomeExpensesKpiCard
              label="Ingresos"
              locale={settings.numberFormatLocale}
              previousValue={previousMonthSummary?.income ?? null}
              semantic="standard"
              value={selectedMonthSummary.income}
            />
            <IncomeExpensesKpiCard
              label="Gastos vitales"
              locale={settings.numberFormatLocale}
              previousValue={previousMonthSummary?.essentialExpenses ?? null}
              semantic="inverse"
              value={selectedMonthSummary.essentialExpenses}
            />
            <IncomeExpensesKpiCard
              label="Gastos extra"
              locale={settings.numberFormatLocale}
              previousValue={previousMonthSummary?.discretionaryExpenses ?? null}
              semantic="inverse"
              value={selectedMonthSummary.discretionaryExpenses}
            />
            <IncomeExpensesKpiCard
              label="Gasto total"
              locale={settings.numberFormatLocale}
              previousValue={previousMonthSummary?.totalExpenses ?? null}
              semantic="inverse"
              value={selectedMonthSummary.totalExpenses}
            />
            <IncomeExpensesKpiCard
              label="Ahorro del mes"
              locale={settings.numberFormatLocale}
              previousValue={previousMonthSummary?.savings ?? null}
              semantic="standard"
              value={selectedMonthSummary.savings}
            />
          </section>

          <section className="income-expenses-context-grid" aria-label="Contexto anual">
            <section className="detail-card income-expenses-annual-card">
              <header className="detail-card-header detail-card-header-tight">
                <div>
                  <p className="eyebrow">Contexto anual</p>
                  <h2>Cómo encaja este mes en el año</h2>
                </div>
              </header>

              <div className="income-expenses-annual-metrics">
                <article className="income-expenses-annual-metric">
                  <span>Media ingresos</span>
                  <strong>
                    {formatCurrency(yearContext.averages.income, settings.numberFormatLocale)}
                  </strong>
                </article>
                <article className="income-expenses-annual-metric">
                  <span>Media gasto total</span>
                  <strong>
                    {formatCurrency(
                      yearContext.averages.totalExpenses,
                      settings.numberFormatLocale
                    )}
                  </strong>
                </article>
                <article className="income-expenses-annual-metric">
                  <span>Media ahorro</span>
                  <strong>
                    {formatCurrency(yearContext.averages.savings, settings.numberFormatLocale)}
                  </strong>
                </article>
              </div>

              <div className="income-expenses-insight-list">
                {displayInsights.length > 0 ? (
                  displayInsights.map((insight) => (
                    <article
                      className={`income-expenses-insight-chip ${insight.tone}`}
                      key={insight.id}
                    >
                      {insight.message}
                    </article>
                  ))
                ) : (
                  <p className="muted">Sin insights destacados para este mes.</p>
                )}
              </div>
            </section>

            <section className="detail-card income-expenses-chart-card">
              <header className="detail-card-header detail-card-header-tight">
                <div>
                  <p className="eyebrow">Evolución anual</p>
                  <h2>Comparativa por meses</h2>
                </div>
              </header>
              <IncomeExpensesYearChart
                data={yearContext}
                locale={settings.numberFormatLocale}
              />
            </section>
          </section>

          <section
            className="detail-card income-expenses-detail-card"
            aria-label="Detalle por categorías"
          >
            <header className="detail-card-header detail-card-header-tight">
              <div>
                <p className="eyebrow">Detalle por categorías</p>
                <h2>En qué se reparte el dinero del mes</h2>
              </div>
              <div className="income-expenses-controls">
                <button
                  aria-label={
                    showOnlyActiveCategories
                      ? "Mostrar tambien categorias vacias"
                      : "Ocultar categorias vacias"
                  }
                  aria-pressed={showOnlyActiveCategories}
                  className={`income-expenses-visibility-toggle ${showOnlyActiveCategories ? "active" : ""}`}
                  onClick={() => setShowOnlyActiveCategories((value) => !value)}
                  type="button"
                >
                  <span className="income-expenses-visibility-icon" aria-hidden="true">
                    {showOnlyActiveCategories ? (
                      <svg viewBox="0 0 24 24" focusable="false">
                        <path
                          d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          fill="none"
                          r="3.2"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" focusable="false">
                        <path
                          d="M3 3 21 21"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M10.6 5.2A12.4 12.4 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-3.7 4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M6.1 6.1A18.3 18.3 0 0 0 2 12s3.6 7 10 7c1.8 0 3.4-.5 4.8-1.2"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="income-expenses-visibility-copy">
                    {showOnlyActiveCategories
                      ? "Ocultar categorias vacias"
                      : "Mostrar categorias vacias"}
                  </span>
                </button>

                <label className="vt-inline-select income-expenses-select">
                  Orden
                  <select
                    onChange={(event) =>
                      setSortMode(event.target.value as CategorySortMode)
                    }
                    value={sortMode}
                  >
                    <option value="original">Orden original</option>
                    <option value="amount_desc">Importe desc</option>
                    <option value="amount_asc">Importe asc</option>
                    <option value="label_asc">Nombre A-Z</option>
                  </select>
                </label>
              </div>
            </header>

            <section
              className="detail-sections income-expenses-detail-sections"
              aria-label="Bloques de categorías"
            >
              {visibleSections.map((section) => (
                <IncomeExpensesSectionCard
                  key={section.title}
                  locale={settings.numberFormatLocale}
                  section={section}
                  tone={section.title === "Ingresos" ? "good" : "bad"}
                />
              ))}
            </section>
          </section>
        </>
      ) : null}
    </AuthenticatedAppShell>
  );
}

function IncomeExpensesKpiCard(input: {
  label: string;
  locale: "es-ES" | "en-US";
  previousValue: number | null;
  semantic: "standard" | "inverse";
  value: number;
}) {
  const delta = buildMonthDelta(input.value, input.previousValue);
  const directionGlyph =
    delta?.direction === "up" ? "↑" : delta?.direction === "down" ? "↓" : "→";
  const deltaTone =
    !delta || delta.direction === "flat"
      ? "flat"
      : input.semantic === "inverse"
        ? delta.direction === "up"
          ? "negative"
          : "positive"
        : delta.direction === "up"
          ? "positive"
          : "negative";
  const valueTone =
    input.semantic === "inverse"
      ? input.value > 0
        ? "negative"
        : "flat"
      : input.value > 0
        ? "positive"
        : input.value < 0
          ? "negative"
          : "flat";

  return (
    <article className={`dashboard-metric-card income-expenses-kpi-card ${valueTone}`}>
      <span className="dashboard-metric-label">{input.label}</span>
      <div className="dashboard-metric-mainline">
        <strong>{formatCurrency(input.value, input.locale)}</strong>
        <div className={`delta-inline income-expenses-delta ${deltaTone}`}>
          <span aria-hidden="true">{directionGlyph}</span>
          <span>{delta ? formatPercent(delta.ratio, input.locale) : "Sin comparativa"}</span>
        </div>
      </div>
    </article>
  );
}

function IncomeExpensesYearChart(input: {
  data: IncomeExpensesYearContext;
  locale: "es-ES" | "en-US";
}) {
  const option = useMemo(() => {
    const monthLabels = getMonthOptions().map((month) => month.label.slice(0, 3));
    const selectedMonthIndex = input.data.selectedMonth - 1;

    return {
      animationDuration: 420,
      color: ["#63f2a9", "#f59b73", "#78c8ff"],
      grid: {
        bottom: 18,
        left: 12,
        right: 12,
        top: 58,
        containLabel: true
      },
      legend: {
        icon: "roundRect",
        itemHeight: 8,
        itemWidth: 14,
        top: 4,
        textStyle: {
          color: "#8ea0ad",
          fontSize: 12
        }
      },
      series: [
        buildBarSeries(
          "Ingresos",
          input.data.monthly.map((item) =>
            item.month > input.data.selectedMonth ? null : item.income
          ),
          selectedMonthIndex
        ),
        buildBarSeries(
          "Gasto total",
          input.data.monthly.map((item) =>
            item.month > input.data.selectedMonth ? null : item.totalExpenses
          ),
          selectedMonthIndex
        ),
        buildLineSeries(
          "Ahorro",
          input.data.monthly.map((item) =>
            item.month > input.data.selectedMonth ? null : item.savings
          ),
          selectedMonthIndex
        )
      ],
      tooltip: {
        backgroundColor: "rgba(9, 13, 18, 0.96)",
        borderColor: "rgba(37, 50, 65, 0.92)",
        borderWidth: 1,
        className: "chart-tooltip-echarts",
        confine: true,
        formatter: (params) => {
          const tooltipParams = Array.isArray(params) ? params : [params];
          const axisLabel =
            tooltipParams[0] && "axisValueLabel" in tooltipParams[0]
              ? String(tooltipParams[0].axisValueLabel ?? "")
              : "";
          const rows = tooltipParams
            .filter((item) => item.value !== null)
            .map((item) => {
              const rawValue =
                typeof item.value === "object" && item.value !== null && "value" in item.value
                  ? Number(item.value.value)
                  : Number(item.value ?? 0);
              return `<span>${item.seriesName}: ${formatCurrency(rawValue, input.locale)}</span>`;
            });

          return [`<strong>${axisLabel}</strong>`, ...rows].join("");
        },
        padding: 0,
        textStyle: {
          color: "#eef4f8",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 13,
          lineHeight: 20
        },
        trigger: "axis"
      },
      xAxis: {
        axisLabel: {
          color: "#8ea0ad",
          margin: 12
        },
        axisLine: {
          lineStyle: {
            color: "rgba(37, 50, 65, 0.85)"
          }
        },
        axisTick: {
          show: false
        },
        boundaryGap: true,
        data: monthLabels,
        type: "category"
      },
      yAxis: {
        axisLabel: {
          color: "#8ea0ad",
          formatter: (value: number) =>
            new Intl.NumberFormat(input.locale, {
              notation: "compact",
              maximumFractionDigits: 1
            }).format(value)
        },
        splitLine: {
          lineStyle: {
            color: "rgba(37, 50, 65, 0.45)"
          }
        },
        type: "value"
      }
    } satisfies EChartsOption;
  }, [input.data, input.locale]);

  return (
    <div className="income-expenses-year-chart" role="img" aria-label="Comparativa anual por meses">
      <ReactECharts notMerge option={option} opts={{ renderer: "svg" }} style={{ height: 352 }} />
    </div>
  );
}

function IncomeExpensesSectionCard(input: {
  locale: "es-ES" | "en-US";
  section: IncomeExpensesSection;
  tone: "good" | "bad";
}) {
  const highestValue = Math.max(...input.section.items.map((item) => Math.abs(item.value)), 0);

  return (
    <section className="detail-card income-expenses-section-card">
      <header className="detail-card-header income-expenses-section-header">
        <div>
          <p className="eyebrow">{input.section.title}</p>
          <h2>{input.section.title}</h2>
        </div>
        <strong className={`detail-total ${input.tone}`}>
          {formatCurrency(input.section.total, input.locale)}
        </strong>
      </header>

      <div
        className="detail-table income-expenses-detail-table"
        role="table"
        aria-label={input.section.title}
      >
        <div className="detail-row detail-row-head" role="row">
          <span role="columnheader">Categoría</span>
          <span role="columnheader">Importe</span>
        </div>

        {input.section.items.length > 0 ? (
          input.section.items.map((item) => (
            <div
              className={
                highestValue > 0 && Math.abs(item.value) >= highestValue * 0.8
                  ? "detail-row income-expenses-detail-row highlight"
                  : "detail-row income-expenses-detail-row"
              }
              key={`${input.section.title}-${item.row}`}
              role="row"
            >
              <div className="income-expenses-row-main" role="cell">
                <span>{item.label}</span>
                <div className="income-expenses-row-bar">
                  <span
                    className="income-expenses-row-bar-fill"
                    style={{
                      width: `${buildCategoryShareWidth(item.value, highestValue)}%`
                    }}
                  />
                </div>
              </div>
              <strong role="cell">{formatCurrency(item.value, input.locale)}</strong>
            </div>
          ))
        ) : (
          <div className="detail-row income-expenses-detail-row" role="row">
            <span role="cell">Sin categorías visibles con los filtros actuales.</span>
            <strong role="cell">-</strong>
          </div>
        )}
      </div>
    </section>
  );
}

function buildVisibleSection(
  section: IncomeExpensesSection,
  showOnlyActiveCategories: boolean,
  sortMode: CategorySortMode
): IncomeExpensesSection {
  let items = showOnlyActiveCategories
    ? section.items.filter((item) => item.value !== 0)
    : [...section.items];

  if (sortMode === "amount_desc") {
    items = [...items].sort((left, right) => Math.abs(right.value) - Math.abs(left.value));
  }

  if (sortMode === "amount_asc") {
    items = [...items].sort((left, right) => Math.abs(left.value) - Math.abs(right.value));
  }

  if (sortMode === "label_asc") {
    items = [...items].sort((left, right) => left.label.localeCompare(right.label, "es"));
  }

  return {
    ...section,
    items
  };
}

function buildMonthDelta(value: number, previousValue: number | null) {
  if (previousValue === null) {
    return null;
  }

  const absolute = value - previousValue;
  const direction = absolute > 0 ? "up" : absolute < 0 ? "down" : "flat";
  const ratio =
    previousValue !== 0 ? Math.abs(absolute) / Math.abs(previousValue) : absolute === 0 ? 0 : 1;

  return {
    absolute,
    direction,
    ratio
  };
}

function buildBarSeries(
  name: string,
  values: Array<number | null>,
  selectedMonthIndex: number,
  opacity = 1
) {
  return {
    barGap: "12%",
    barMaxWidth: 18,
    data: values.map((value, index) => ({
      itemStyle:
        value === null
          ? {
              opacity: 0
            }
          : {
              borderColor: index === selectedMonthIndex ? "#eef4f8" : "transparent",
              borderRadius: [2, 2, 0, 0],
              borderWidth: index === selectedMonthIndex ? 1 : 0,
              opacity: index === selectedMonthIndex ? 1 : opacity,
              shadowBlur: index === selectedMonthIndex ? 12 : 8,
              shadowColor: "rgba(0, 0, 0, 0.16)"
            },
      value
    })),
    emphasis: {
      focus: "series" as const
    },
    itemStyle: {
      borderRadius: [2, 2, 0, 0]
    },
    name,
    type: "bar" as const
  };
}

function buildLineSeries(
  name: string,
  values: Array<number | null>,
  selectedMonthIndex: number
) {
  return {
    data: values.map((value, index) => ({
      itemStyle: {
        borderColor: "#09111a",
        borderWidth: value === null ? 0 : index === selectedMonthIndex ? 2 : 1
      },
      symbolSize: value === null ? 0 : index === selectedMonthIndex ? 10 : 7,
      value
    })),
    lineStyle: {
      opacity: 0.92,
      shadowBlur: 10,
      shadowColor: "rgba(120, 200, 255, 0.22)",
      width: 3
    },
    name,
    smooth: true,
    symbol: "circle",
    type: "line" as const,
    z: 3
  };
}

function buildDisplayInsights(
  data: IncomeExpensesYearContext,
  month: number,
  locale: "es-ES" | "en-US"
) {
  const current = data.monthly.find((item) => item.month === month);

  if (!current) {
    return data.insights;
  }

  const monthlyBySpendRank = [...data.monthly].sort(
    (left, right) => right.totalExpenses - left.totalExpenses
  );
  const spendRank = monthlyBySpendRank.findIndex((item) => item.month === month) + 1;
  const extraShare =
    current.totalExpenses > 0
      ? current.discretionaryExpenses / current.totalExpenses
      : 0;
  const totalExpensesDelta = buildInsightDelta(current.totalExpenses, data.averages.totalExpenses);
  const savingsDelta = buildInsightDelta(current.savings, data.averages.savings);

  const derived: Array<{ id: string; message: string; tone: InsightTone }> = [];

  if (totalExpensesDelta) {
    derived.push({
      id: "expenses-vs-average",
      message: `El gasto total de este mes está ${formatPercent(totalExpensesDelta.ratio, locale)} ${totalExpensesDelta.direction === "above" ? "por encima" : "por debajo"} de la media acumulada del año.`,
      tone: totalExpensesDelta.direction === "above" ? "warning" : "positive"
    });
  }

  if (savingsDelta) {
    derived.push({
      id: "savings-vs-average",
      message: `El ahorro de este mes está ${formatPercent(savingsDelta.ratio, locale)} ${savingsDelta.direction === "above" ? "por encima" : "por debajo"} de tu media acumulada del año.`,
      tone: savingsDelta.direction === "above" ? "positive" : "negative"
    });
  }

  derived.push({
    id: "discretionary-share",
    message: `Los gastos extra representan ${formatPercent(extraShare, locale)} del gasto total del mes.`,
    tone: extraShare > 0.3 ? "warning" : "neutral"
  });

  if (spendRank > 0 && spendRank <= 3) {
    derived.push({
      id: "top-spend-month",
      message: "Este es uno de los meses con más gasto del año.",
      tone: "warning"
    });
  }

  return derived.slice(0, 3);
}

function buildCategoryShareWidth(value: number, maxValue: number) {
  if (maxValue <= 0 || value === 0) {
    return 0;
  }

  return Math.min(100, (Math.abs(value) / maxValue) * 100);
}

function buildInsightDelta(value: number, averageValue: number) {
  if (averageValue === 0 || value === averageValue) {
    return null;
  }

  return {
    direction: value > averageValue ? "above" : "below",
    ratio: Math.abs(value - averageValue) / Math.abs(averageValue)
  };
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
