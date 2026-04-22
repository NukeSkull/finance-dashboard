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
import {
  NumberFormatLocale,
  SectionDateRangePreset
} from "@/features/settings/settings";
import { useSettings } from "@/features/settings/settings-provider";
import { fetchAssetPurchases, fetchAssetSales } from "@/lib/api/client";
import { AssetOperation, AssetOperationsResponse } from "@/lib/api/types";

type AssetTab = "purchases" | "sales";

export function AssetOperationsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getIdToken, loading, logout, user } = useAuth();
  const { settings } = useSettings();
  const defaults = getDefaultDateRange(settings.defaultSectionDateRange);
  const view = parseAssetView(searchParams, defaults);
  const [data, setData] = useState<AssetOperationsResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    const rawTab = searchParams.get("tab");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if ((rawTab === "purchases" || rawTab === "sales") && dateFrom && dateTo) {
      return;
    }

    router.replace(buildAssetOperationsUrl(pathname, view.tab, view.filters));
  }, [pathname, router, searchParams, view.filters, view.tab]);

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
        const detail =
          view.tab === "purchases"
            ? await fetchAssetPurchases({
                token,
                dateFrom: view.filters.dateFrom,
                dateTo: view.filters.dateTo
              })
            : await fetchAssetSales({
                token,
                dateFrom: view.filters.dateFrom,
                dateTo: view.filters.dateTo
              });

        if (!ignore) {
          setData(detail);
        }
      } catch {
        if (!ignore) {
          setData(null);
          setPageError("No se pudieron cargar las operaciones para ese rango.");
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
  }, [getIdToken, user, view.filters.dateFrom, view.filters.dateTo, view.tab]);

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

  function handleDateChange(nextFilters: DateRangeState) {
    router.replace(buildAssetOperationsUrl(pathname, view.tab, nextFilters));
  }

  function handleTabChange(tab: AssetTab) {
    router.replace(buildAssetOperationsUrl(pathname, tab, view.filters));
  }

  if (loading || !user) {
    return (
      <main className="app-shell">
        <p className="muted">Comprobando sesion...</p>
      </main>
    );
  }

  const isPurchase = view.tab === "purchases";
  const title = isPurchase ? "Compras de activos" : "Ventas de activos";
  const eyebrow = isPurchase ? "Compras" : "Ventas";

  return (
    <main className="app-shell">
      <section className="page-stack">
        <header className="topbar">
          <div>
            <p className="eyebrow">Vista por seccion</p>
            <h1>Operaciones de activos</h1>
            <p className="lede">
              Compras y ventas en una sola ruta, con tabs y filtros compartidos.
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

        <section
          className="dashboard-toolbar"
          aria-label={`Filtros de ${title.toLowerCase()}`}
        >
          <div>
            <p className="eyebrow">Activos</p>
            <h2>{title}</h2>
            <p className="muted section-intro">
              Cambia entre compras y ventas sin salir de la vista y manteniendo el
              mismo rango de fechas.
            </p>
          </div>
          <div className="page-actions">
            <nav className="page-tabs" aria-label="Tabs de operaciones de activos">
              <button
                className={getTabClassName(view.tab === "purchases")}
                onClick={() => handleTabChange("purchases")}
                type="button"
              >
                Compras
              </button>
              <button
                className={getTabClassName(view.tab === "sales")}
                onClick={() => handleTabChange("sales")}
                type="button"
              >
                Ventas
              </button>
            </nav>
            <AssetDateRangeForm
              disabled={pageLoading}
              onChange={handleDateChange}
              value={view.filters}
            />
          </div>
        </section>

        {pageError ? (
          <section className="notice-panel error" role="alert">
            {pageError}
          </section>
        ) : null}

        {pageLoading && !data ? (
          <section className="notice-panel">Cargando operaciones...</section>
        ) : null}

        {data ? (
          <>
            {pageLoading ? (
              <section className="notice-panel compact">
                Actualizando operaciones...
              </section>
            ) : null}

            <section className="kpi-grid" aria-label={`Resumen de ${title.toLowerCase()}`}>
              <article className="kpi-card">
                <span>Operaciones</span>
                <strong>{data.summary.count}</strong>
              </article>
              <article className="kpi-card">
                <span>Total EUR</span>
                <strong>
                  {formatNullableCurrency(
                    data.summary.totalEur,
                    settings.numberFormatLocale
                  )}
                </strong>
              </article>
              <article className="kpi-card">
                <span>Total USD</span>
                <strong>
                  {formatNullableCurrency(
                    data.summary.totalUsd,
                    settings.numberFormatLocale,
                    "USD"
                  )}
                </strong>
              </article>
            </section>

            <section className="detail-card" aria-label={`Tabla de ${title.toLowerCase()}`}>
              <header className="detail-card-header">
                <div>
                  <p className="eyebrow">{eyebrow}</p>
                  <h2>
                    {view.filters.dateFrom} - {view.filters.dateTo}
                  </h2>
                </div>
                <strong className="detail-total good">{data.items.length} filas</strong>
              </header>

              {data.items.length === 0 ? (
                <p className="muted">No hay operaciones en el rango seleccionado.</p>
              ) : (
                <div className="asset-operations-table" role="table" aria-label={title}>
                  <div className="asset-operations-row asset-operations-head" role="row">
                    <span role="columnheader">Fecha</span>
                    <span role="columnheader">Producto</span>
                    <span role="columnheader">Plataforma</span>
                    <span role="columnheader">Cantidad</span>
                    <span role="columnheader">Total EUR</span>
                    <span role="columnheader">Total USD</span>
                  </div>

                  {data.items.map((item) => (
                    <AssetOperationRow
                      item={item}
                      key={`${item.dateSerial}-${item.product}-${item.platform}`}
                      locale={settings.numberFormatLocale}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function AssetDateRangeForm(input: {
  disabled: boolean;
  value: DateRangeState;
  onChange: (value: DateRangeState) => void;
}) {
  return (
    <form className="asset-filters" aria-label="Rango de fechas">
      <label>
        Desde
        <input
          disabled={input.disabled}
          onChange={(event) =>
            input.onChange({
              ...input.value,
              dateFrom: event.target.value
            })
          }
          type="date"
          value={input.value.dateFrom}
        />
      </label>

      <label>
        Hasta
        <input
          disabled={input.disabled}
          onChange={(event) =>
            input.onChange({
              ...input.value,
              dateTo: event.target.value
            })
          }
          type="date"
          value={input.value.dateTo}
        />
      </label>
    </form>
  );
}

function AssetOperationRow(input: {
  item: AssetOperation;
  locale: NumberFormatLocale;
}) {
  const { item, locale } = input;

  return (
    <div className="asset-operations-row" role="row">
      <span role="cell">{item.date}</span>
      <span role="cell">{item.product}</span>
      <span role="cell">{item.platform}</span>
      <span role="cell">{item.quantity}</span>
      <strong role="cell">{formatNullableCurrency(item.totalEur, locale)}</strong>
      <strong role="cell">{formatNullableCurrency(item.totalUsd, locale, "USD")}</strong>
    </div>
  );
}

function parseAssetView(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  defaults: DateRangeState
) {
  const rawTab = searchParams.get("tab");

  return {
    filters: parseDateRange(searchParams, defaults),
    tab: rawTab === "sales" ? "sales" : "purchases"
  } satisfies {
    filters: DateRangeState;
    tab: AssetTab;
  };
}

function parseDateRange(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  defaults: DateRangeState
) {
  return {
    dateFrom: parseDateValue(searchParams.get("dateFrom"), defaults.dateFrom),
    dateTo: parseDateValue(searchParams.get("dateTo"), defaults.dateTo)
  };
}

function getDefaultDateRange(preset: SectionDateRangePreset): DateRangeState {
  const today = new Date();
  const dateTo = formatDateInput(today);

  if (preset === "current_year") {
    return {
      dateFrom: formatDateInput(new Date(today.getFullYear(), 0, 1)),
      dateTo
    };
  }

  const daysBack = preset === "last_30_days" ? 29 : 89;

  return {
    dateFrom: formatDateInput(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysBack)
    ),
    dateTo
  };
}

function buildAssetOperationsUrl(
  pathname: string,
  tab: AssetTab,
  range: DateRangeState
) {
  const params = new URLSearchParams();
  params.set("tab", tab);
  params.set("dateFrom", range.dateFrom);
  params.set("dateTo", range.dateTo);
  return `${pathname}?${params.toString()}`;
}

function parseDateValue(value: string | null, fallback: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatNullableCurrency(
  value: number | null,
  locale: NumberFormatLocale,
  currency = "EUR"
) {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function getTabClassName(active: boolean) {
  return active ? "page-tab active" : "page-tab";
}

type DateRangeState = {
  dateFrom: string;
  dateTo: string;
};
