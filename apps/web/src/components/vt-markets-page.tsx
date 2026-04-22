"use client";

import Link from "next/link";
import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { NumberFormatLocale } from "@/features/settings/settings";
import { useSettings } from "@/features/settings/settings-provider";
import {
  fetchVtMarketsAccountTotals,
  fetchVtMarketsGlobalResults,
  fetchVtMarketsResults
} from "@/lib/api/client";
import {
  VtMarketsAccountTotals,
  VtMarketsGlobalResults,
  VtMarketsResults,
  VtMarketsStrategyBlock
} from "@/lib/api/types";

type VtTab = "results" | "global" | "accounts";

type VtViewState = {
  tab: VtTab;
  year?: number;
};

export function VtMarketsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getIdToken, loading, logout, user } = useAuth();
  const {
    lastVisitedVtTab,
    setLastVisitedVtTab,
    settings
  } = useSettings();
  const [results, setResults] = useState<VtMarketsResults | null>(null);
  const [globalResults, setGlobalResults] = useState<VtMarketsGlobalResults | null>(null);
  const [accountTotals, setAccountTotals] = useState<VtMarketsAccountTotals | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const defaultTab =
    settings.rememberLastVisitedVtTab && lastVisitedVtTab
      ? lastVisitedVtTab
      : "results";
  const view = parseViewState(searchParams, defaultTab);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (searchParams.get("tab")) {
      return;
    }

    router.replace(buildVtMarketsUrl(pathname, { tab: defaultTab }));
  }, [defaultTab, pathname, router, searchParams]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let ignore = false;

    async function loadData() {
      setPageLoading(true);
      setPageError(null);

      try {
        const token = await getIdToken();

        if (view.tab === "results") {
          const data = await fetchVtMarketsResults({
            token,
            year: view.year
          });

          if (ignore) {
            return;
          }

          setResults(data);

          if (view.year !== data.year) {
            router.replace(buildVtMarketsUrl(pathname, { tab: "results", year: data.year }));
            return;
          }
        } else if (view.tab === "global") {
          const data = await fetchVtMarketsGlobalResults({ token });

          if (!ignore) {
            setGlobalResults(data);
          }
        } else {
          const data = await fetchVtMarketsAccountTotals({ token });

          if (!ignore) {
            setAccountTotals(data);
          }
        }
      } catch {
        if (!ignore) {
          setPageError("No se pudo cargar la vista de VT Markets.");
        }
      } finally {
        if (!ignore) {
          setPageLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [getIdToken, pathname, router, user, view.tab, view.year]);

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

  function handleTabChange(tab: VtTab) {
    const nextView =
      tab === "results"
        ? {
            tab,
            year: results?.year ?? view.year
          }
        : { tab };

    if (settings.rememberLastVisitedVtTab) {
      setLastVisitedVtTab(tab);
    }

    router.replace(buildVtMarketsUrl(pathname, nextView));
  }

  function handleYearChange(year: number) {
    const nextView = {
      tab: "results" as const,
      year
    };

    if (settings.rememberLastVisitedVtTab) {
      setLastVisitedVtTab("results");
    }

    router.replace(buildVtMarketsUrl(pathname, nextView));
  }

  if (loading || !user) {
    return (
      <main className="app-shell">
        <p className="muted">Comprobando sesion...</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="page-stack">
        <header className="topbar">
          <div>
            <p className="eyebrow">Vista por seccion</p>
            <h1>VT Markets</h1>
            <p className="lede">
              Resultados por ano, resumen global y capital actual distribuido por
              cuentas.
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

        <section className="dashboard-toolbar" aria-label="Navegacion VT Markets">
          <div>
            <p className="eyebrow">VT Markets</p>
            <h2>{getTabTitle(view.tab)}</h2>
            <p className="muted section-intro">
              Ruta unica con tabs, estado persistido en query params y lectura directa
              desde Google Sheets.
            </p>
          </div>
          <nav className="page-tabs" aria-label="Tabs VT Markets">
            <button
              className={getTabClassName(view.tab === "results")}
              onClick={() => handleTabChange("results")}
              type="button"
            >
              Resultados
            </button>
            <button
              className={getTabClassName(view.tab === "global")}
              onClick={() => handleTabChange("global")}
              type="button"
            >
              Global
            </button>
            <button
              className={getTabClassName(view.tab === "accounts")}
              onClick={() => handleTabChange("accounts")}
              type="button"
            >
              Cuentas
            </button>
          </nav>
        </section>

        {pageError ? (
          <section className="notice-panel error" role="alert">
            {pageError}
          </section>
        ) : null}

        {pageLoading && !getActivePayload(view.tab, results, globalResults, accountTotals) ? (
          <section className="notice-panel">Cargando VT Markets...</section>
        ) : null}

        {renderContextSummary(
          view.tab,
          results,
          globalResults,
          accountTotals,
          settings.numberFormatLocale
        )}

        {pageLoading && getActivePayload(view.tab, results, globalResults, accountTotals) ? (
          <section className="notice-panel compact">Actualizando vista...</section>
        ) : null}

        {view.tab === "results" && results ? (
          <section className="detail-card">
            <header className="detail-card-header">
              <div>
                <p className="eyebrow">Resultados</p>
                <h2>{results.year}</h2>
              </div>
              <label className="vt-inline-select">
                Ano
                <select
                  onChange={(event) => handleYearChange(Number(event.target.value))}
                  value={results.year}
                >
                  {results.availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </header>

            <div className="vt-results-grid">
              {results.strategyBlocks.map((block) => (
                <VtStrategyBlockCard
                  block={block}
                  key={`${results.year}-${block.key}`}
                  locale={settings.numberFormatLocale}
                />
              ))}
            </div>
          </section>
        ) : null}

        {view.tab === "global" && globalResults ? (
          <section className="detail-card" aria-label="Resultados globales VT Markets">
            <header className="detail-card-header">
              <div>
                <p className="eyebrow">Global</p>
                <h2>Resumen anual</h2>
              </div>
              <strong className="detail-total good">{globalResults.items.length} anos</strong>
            </header>

            <div className="vt-global-table" role="table" aria-label="Resultados globales">
              <div className="vt-global-row vt-global-head" role="row">
                <span role="columnheader">Ano</span>
                <span role="columnheader">Ingreso pasivo</span>
                <span role="columnheader">Interes compuesto</span>
                <span role="columnheader">Zero 2 Hero</span>
                <span role="columnheader">Total</span>
                <span role="columnheader">Invertido</span>
                <span role="columnheader">Sacado</span>
              </div>

              {globalResults.items.map((item) => (
                <div className="vt-global-row" key={item.year} role="row">
                  <strong role="cell">{item.year}</strong>
                  <span role="cell">{formatNullableUsd(item.passiveIncomeUsd, settings.numberFormatLocale)}</span>
                  <span role="cell">
                    {formatNullableUsd(item.compoundInterestUsd, settings.numberFormatLocale)}
                  </span>
                  <span role="cell">{formatNullableUsd(item.zeroToHeroUsd, settings.numberFormatLocale)}</span>
                  <strong role="cell">{formatNullableUsd(item.totalUsd, settings.numberFormatLocale)}</strong>
                  <span role="cell">{formatNullableUsd(item.investedUsd, settings.numberFormatLocale)}</span>
                  <span role="cell">{formatNullableUsd(item.withdrawnUsd, settings.numberFormatLocale)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {view.tab === "accounts" && accountTotals ? (
          <>
            <section className="kpi-grid" aria-label="Resumen agrupado de cuentas VT">
              {accountTotals.groupedTotals.map((group) => (
                <article className="kpi-card" key={group.key}>
                  <span>{group.label}</span>
                  <strong>{formatUsd(group.totalUsd, settings.numberFormatLocale)}</strong>
                </article>
              ))}
            </section>

            <section className="detail-card" aria-label="Desglose de cuentas VT Markets">
              <header className="detail-card-header">
                <div>
                  <p className="eyebrow">Cuentas</p>
                  <h2>Desglose exacto</h2>
                </div>
                <strong className="detail-total good">
                  {accountTotals.accounts.length} cuentas
                </strong>
              </header>

              <div className="vt-accounts-table" role="table" aria-label="Cuentas VT">
                <div className="vt-accounts-row vt-accounts-head" role="row">
                  <span role="columnheader">Cuenta</span>
                  <span role="columnheader">ID</span>
                  <span role="columnheader">Familia</span>
                  <span role="columnheader">Balance</span>
                </div>

                {accountTotals.accounts.map((account) => (
                  <div
                    className="vt-accounts-row"
                    key={`${account.groupKey}-${account.label}-${account.accountId ?? "none"}`}
                    role="row"
                  >
                    <strong role="cell">{account.label}</strong>
                    <span role="cell">{account.accountId ?? "N/A"}</span>
                    <span role="cell">{account.groupLabel}</span>
                    <strong role="cell">
                      {formatUsd(account.balanceUsd, settings.numberFormatLocale)}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function VtStrategyBlockCard(input: {
  block: VtMarketsStrategyBlock;
  locale: NumberFormatLocale;
}) {
  const { block, locale } = input;

  return (
    <section className="detail-card">
      <header className="detail-card-header">
        <div>
          <p className="eyebrow">Estrategia</p>
          <h2>{block.label}</h2>
        </div>
        <strong className="detail-total good">
          {formatNullableUsd(block.totalProfitUsd, locale)}
        </strong>
      </header>

      <div className="vt-block-table" role="table" aria-label={block.label}>
        <div className="vt-block-row vt-block-head" role="row">
          <span role="columnheader">Mes</span>
          <span role="columnheader">Capital inicio</span>
          <span role="columnheader">Beneficio USD</span>
          <span role="columnheader">Rentabilidad</span>
        </div>

        {block.rows.map((row) => (
          <div className="vt-block-row" key={`${block.key}-${row.month}`} role="row">
            <span role="cell">{row.monthLabel}</span>
            <span role="cell">{formatNullableUsd(row.startingCapital, locale)}</span>
            <strong role="cell">{formatNullableUsd(row.profitUsd, locale)}</strong>
            <span role="cell">{formatNullablePercent(row.profitRatio, locale)}</span>
          </div>
        ))}

        <div className="vt-block-row vt-block-total" role="row">
          <span role="cell">Total anual</span>
          <span role="cell">-</span>
          <strong role="cell">{formatNullableUsd(block.totalProfitUsd, locale)}</strong>
          <span role="cell">-</span>
        </div>
      </div>
    </section>
  );
}

function renderContextSummary(
  tab: VtTab,
  results: VtMarketsResults | null,
  globalResults: VtMarketsGlobalResults | null,
  accountTotals: VtMarketsAccountTotals | null,
  locale: NumberFormatLocale
) {
  if (tab === "results" && results) {
    return (
      <section className="kpi-grid" aria-label="Resumen de resultados VT">
        <article className="kpi-card">
          <span>Ano activo</span>
          <strong>{results.year}</strong>
        </article>
        <article className="kpi-card">
          <span>Beneficio total</span>
          <strong>{formatNullableUsd(results.totals.totalProfitUsd, locale)}</strong>
        </article>
        <article className="kpi-card">
          <span>Capital ultimo mes</span>
          <strong>{formatNullableUsd(results.totals.lastMonthCapital, locale)}</strong>
        </article>
        <article className="kpi-card">
          <span>Bloques</span>
          <strong>{results.totals.strategyCount}</strong>
          <p>{results.totals.monthCount} meses detectados</p>
        </article>
      </section>
    );
  }

  if (tab === "global" && globalResults) {
    return (
      <section className="kpi-grid" aria-label="Resumen global VT">
        <article className="kpi-card">
          <span>Beneficio acumulado</span>
          <strong>{formatNullableUsd(globalResults.summary.totalProfitUsd, locale)}</strong>
        </article>
        <article className="kpi-card">
          <span>Invertido</span>
          <strong>{formatNullableUsd(globalResults.summary.investedUsd, locale)}</strong>
        </article>
        <article className="kpi-card">
          <span>Sacado</span>
          <strong>{formatNullableUsd(globalResults.summary.withdrawnUsd, locale)}</strong>
        </article>
      </section>
    );
  }

  if (tab === "accounts" && accountTotals) {
    return (
      <section className="kpi-grid" aria-label="Resumen de cuentas VT">
        <article className="kpi-card good">
          <span>Total VT</span>
          <strong>{formatUsd(accountTotals.grandTotal, locale)}</strong>
        </article>
        {accountTotals.groupedTotals.slice(0, 3).map((group) => (
          <article className="kpi-card" key={group.key}>
            <span>{group.label}</span>
            <strong>{formatUsd(group.totalUsd, locale)}</strong>
          </article>
        ))}
      </section>
    );
  }

  return null;
}

function parseViewState(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  defaultTab: VtTab
): VtViewState {
  const rawTab = searchParams.get("tab");
  const rawYear = Number(searchParams.get("year"));
  const tab: VtTab =
    rawTab === "global" || rawTab === "accounts" || rawTab === "results"
      ? rawTab
      : defaultTab;

  return {
    tab,
    year:
      tab === "results" && Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100
        ? rawYear
        : undefined
  };
}

function buildVtMarketsUrl(pathname: string, view: VtViewState) {
  const params = new URLSearchParams();
  params.set("tab", view.tab);

  if (view.tab === "results" && view.year !== undefined) {
    params.set("year", String(view.year));
  }

  return `${pathname}?${params.toString()}`;
}

function getTabTitle(tab: VtTab) {
  if (tab === "global") {
    return "Resumen global";
  }

  if (tab === "accounts") {
    return "Cuentas activas";
  }

  return "Resultados por ano";
}

function getTabClassName(active: boolean) {
  return active ? "page-tab active" : "page-tab";
}

function getActivePayload(
  tab: VtTab,
  results: VtMarketsResults | null,
  globalResults: VtMarketsGlobalResults | null,
  accountTotals: VtMarketsAccountTotals | null
) {
  if (tab === "global") {
    return globalResults;
  }

  if (tab === "accounts") {
    return accountTotals;
  }

  return results;
}

function formatUsd(value: number, locale: NumberFormatLocale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function formatNullableUsd(value: number | null, locale: NumberFormatLocale) {
  return value === null ? "N/A" : formatUsd(value, locale);
}

function formatNullablePercent(value: number | null, locale: NumberFormatLocale) {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2
  }).format(value);
}
