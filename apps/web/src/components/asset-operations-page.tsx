"use client";

import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";
import { AssetOperationsPageSkeleton } from "@/components/page-skeletons";
import { PrivacyValue } from "@/components/privacy-value";
import { StatusPanel } from "@/components/status-panel";
import { useAuth } from "@/features/auth/auth-provider";
import { NumberFormatLocale } from "@/features/settings/settings";
import { useSettings } from "@/features/settings/settings-provider";
import { fetchAssetOperationsHistory } from "@/lib/api/client";
import { AssetOperation, AssetOperationsHistoryResponse } from "@/lib/api/types";

type HistoryType = "all" | "purchases" | "sales";
type CurrencyFilter = "EUR" | "USD";
const INITIAL_VISIBLE_OPERATIONS = 25;

type AssetOperationsView = {
  type: HistoryType;
  q: string;
  product: string;
  platform: string;
  currency: string;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_VIEW: AssetOperationsView = {
  type: "all",
  q: "",
  product: "",
  platform: "",
  currency: "",
  dateFrom: "",
  dateTo: ""
};

export function AssetOperationsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getIdToken, loading, user } = useAuth();
  const { privacyModeEnabled, settings } = useSettings();
  const [data, setData] = useState<AssetOperationsHistoryResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_OPERATIONS);

  const view = useMemo(() => parseAssetOperationsView(searchParams), [searchParams]);
  const visibleItems = useMemo(
    () => data?.items.slice(0, visibleCount) ?? [],
    [data?.items, visibleCount]
  );
  const canLoadMore = data ? visibleItems.length < data.items.length : false;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_OPERATIONS);
  }, [
    view.currency,
    view.dateFrom,
    view.dateTo,
    view.platform,
    view.product,
    view.q,
    view.type,
    data?.items.length
  ]);

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
        const nextData = await fetchAssetOperationsHistory({
          token,
          currency: normalizeViewCurrency(view.currency),
          dateFrom: view.dateFrom || null,
          dateTo: view.dateTo || null,
          platform: view.platform || null,
          product: view.product || null,
          q: view.q || null,
          type: mapHistoryTypeToApi(view.type)
        });

        if (!ignore) {
          setData(nextData);
        }
      } catch {
        if (!ignore) {
          setData(null);
          setPageError("No se pudo cargar el historial de operaciones.");
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
  }, [getIdToken, user, view]);

  if (loading || !user) {
    return (
      <main className="app-shell">
        <p className="muted">Comprobando sesiÃ³n...</p>
      </main>
    );
  }

  return (
    <AuthenticatedAppShell
      description="Historial unificado de movimientos de activos con foco en lectura y filtrado."
      eyebrow="Operaciones"
      title="Operaciones de activos"
    >
      {pageError ? <StatusPanel tone="error">{pageError}</StatusPanel> : null}

      {pageLoading && !data ? <AssetOperationsPageSkeleton /> : null}

      {data ? (
        <>
          {pageLoading ? <StatusPanel compact>Actualizando historial...</StatusPanel> : null}

          <section className="asset-operations-kpi-grid" aria-label="KPIs de operaciones">
            <HistoryKpiCard label="Operaciones" value={String(data.summary.operationsCount)} />
            <HistoryKpiCard
              hidden={privacyModeEnabled}
              label="Compras totales"
              value={formatNullableCurrency(data.summary.purchasesTotalEur, settings.numberFormatLocale)}
            />
            <HistoryKpiCard
              hidden={privacyModeEnabled}
              label="Ventas totales"
              value={formatNullableCurrency(data.summary.salesTotalEur, settings.numberFormatLocale)}
            />
            <HistoryKpiCard
              hidden={privacyModeEnabled}
              label="Balance neto"
              tone={data.summary.netBalanceEur !== null && data.summary.netBalanceEur >= 0 ? "good" : "bad"}
              value={formatNullableCurrency(data.summary.netBalanceEur, settings.numberFormatLocale)}
            />
            <HistoryKpiCard
              label="Activos operados"
              value={String(data.summary.operatedAssetsCount)}
            />
            <HistoryKpiCard
              hidden={privacyModeEnabled}
              label="Ticket medio"
              value={formatNullableCurrency(data.summary.averageTicketEur, settings.numberFormatLocale)}
            />
          </section>

          <section className="detail-card asset-history-card" aria-label="Historial de operaciones">
            <header className="asset-history-header">
              <div>
                <p className="eyebrow">Historial</p>
                <h2>Movimientos registrados</h2>
                <p className="muted asset-history-helper">
                  Mostrando {Math.min(visibleItems.length, data.items.length)} de {data.items.length} operaciones
                </p>
              </div>
            </header>

            <div className="asset-history-toolbar" aria-label="Filtros del historial de operaciones">
              <nav className="asset-segmented-control" aria-label="Tipo de operaciones">
                <button
                  className={getSegmentClassName(view.type === "all")}
                  onClick={() => updateView(pathname, router, { ...view, type: "all" })}
                  type="button"
                >
                  Todas
                </button>
                <button
                  className={getSegmentClassName(view.type === "purchases")}
                  onClick={() => updateView(pathname, router, { ...view, type: "purchases" })}
                  type="button"
                >
                  Compras
                </button>
                <button
                  className={getSegmentClassName(view.type === "sales")}
                  onClick={() => updateView(pathname, router, { ...view, type: "sales" })}
                  type="button"
                >
                  Ventas
                </button>
              </nav>

              <div className="asset-history-filters">
                <label className="asset-history-search">
                  Buscar
                  <input
                    aria-label="Buscar operaciones"
                    onChange={(event) =>
                      updateView(pathname, router, { ...view, q: event.target.value })
                    }
                    placeholder="Buscar activo o plataforma"
                    type="search"
                    value={view.q}
                  />
                </label>

                <AssetHistorySelect
                  label="Activo"
                  onChange={(event) =>
                    updateView(pathname, router, { ...view, product: event.target.value })
                  }
                  options={data.options.products}
                  value={view.product}
                />

                <AssetHistorySelect
                  label="Plataforma"
                  onChange={(event) =>
                    updateView(pathname, router, { ...view, platform: event.target.value })
                  }
                  options={data.options.platforms}
                  value={view.platform}
                />

                {data.options.currencies.length > 0 ? (
                  <AssetHistorySelect
                    label="Divisa"
                    onChange={(event) =>
                      updateView(pathname, router, { ...view, currency: event.target.value })
                    }
                    options={data.options.currencies}
                    value={view.currency}
                  />
                ) : null}

                <label className="asset-history-date">
                  Desde
                  <input
                    aria-label="Fecha desde"
                    onChange={(event) =>
                      updateView(pathname, router, { ...view, dateFrom: event.target.value })
                    }
                    type="date"
                    value={view.dateFrom}
                  />
                </label>

                <label className="asset-history-date">
                  Hasta
                  <input
                    aria-label="Fecha hasta"
                    onChange={(event) =>
                      updateView(pathname, router, { ...view, dateTo: event.target.value })
                    }
                    type="date"
                    value={view.dateTo}
                  />
                </label>

                <button
                  className="button secondary asset-history-reset"
                  onClick={() => updateView(pathname, router, DEFAULT_VIEW)}
                  type="button"
                >
                  Resetear filtros
                </button>
              </div>
            </div>

            {data.items.length === 0 ? (
              <StatusPanel>No hay operaciones que coincidan con los filtros activos.</StatusPanel>
            ) : (
              <div className="asset-operations-table" role="table" aria-label="Historial de operaciones">
                <div className="asset-operations-row asset-operations-head asset-operations-history-head" role="row">
                  <span className="asset-column-date" role="columnheader">Fecha</span>
                  <span className="asset-column-type" role="columnheader">Tipo</span>
                  <span className="asset-column-product" role="columnheader">Activo / producto</span>
                  <span className="asset-column-platform" role="columnheader">Plataforma</span>
                  <span className="asset-column-number" role="columnheader">Cantidad</span>
                  <span className="asset-column-number" role="columnheader">Total EUR</span>
                  <span className="asset-column-number" role="columnheader">Total USD</span>
                </div>

                {visibleItems.map((item) => (
                  <AssetOperationHistoryRow
                    item={item}
                    key={`${item.operationType}-${item.dateSerial}-${item.product}-${item.platform}`}
                    locale={settings.numberFormatLocale}
                    privacyModeEnabled={privacyModeEnabled}
                  />
                ))}
              </div>
            )}

            {canLoadMore ? (
              <div className="asset-history-footer">
                <button
                  className="button secondary asset-history-load-more"
                  onClick={() =>
                    setVisibleCount((currentCount) => currentCount + INITIAL_VISIBLE_OPERATIONS)
                  }
                  type="button"
                >
                  Cargar mas
                </button>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </AuthenticatedAppShell>
  );
}

function HistoryKpiCard(input: {
  label: string;
  value: string;
  hidden?: boolean;
  tone?: "good" | "bad";
}) {
  return (
    <article className={`kpi-card asset-history-kpi${input.tone ? ` ${input.tone}` : ""}`}>
      <span>{input.label}</span>
      {input.hidden ? (
        <PrivacyValue as="strong" hidden={true}>
          {input.value}
        </PrivacyValue>
      ) : (
        <strong>{input.value}</strong>
      )}
    </article>
  );
}

function AssetHistorySelect(input: {
  label: string;
  options: string[];
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="asset-history-select">
      {input.label}
      <select onChange={input.onChange} value={input.value}>
        <option value="">Todos</option>
        {input.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AssetOperationHistoryRow(input: {
  item: AssetOperation;
  locale: NumberFormatLocale;
  privacyModeEnabled: boolean;
}) {
  const { item, locale, privacyModeEnabled } = input;

  return (
    <div
      className={`asset-operations-row asset-operations-history-row ${item.operationType}`}
      role="row"
    >
      <span className="asset-column-date" role="cell">{item.date}</span>
      <span className="asset-column-type" role="cell">
        <span className={`asset-operation-badge ${item.operationType}`}>
          {item.operationType === "purchase" ? "Compra" : "Venta"}
        </span>
      </span>
      <span className="asset-operation-product asset-column-product" role="cell">{item.product}</span>
      <span className="asset-column-platform" role="cell">{item.platform}</span>
      <span className="asset-column-number" role="cell">{formatQuantity(item.quantity, locale)}</span>
      <strong className="asset-column-number" role="cell">
        <PrivacyValue as="span" hidden={privacyModeEnabled}>
          {formatNullableCurrency(item.totalEur, locale)}
        </PrivacyValue>
      </strong>
      <strong className="asset-column-number" role="cell">
        <PrivacyValue as="span" hidden={privacyModeEnabled}>
          {formatNullableCurrency(item.totalUsd, locale, "USD")}
        </PrivacyValue>
      </strong>
    </div>
  );
}

function parseAssetOperationsView(
  searchParams: URLSearchParams | ReadonlyURLSearchParams
): AssetOperationsView {
  const type = searchParams.get("type");

  return {
    type: type === "purchases" || type === "sales" ? type : "all",
    q: searchParams.get("q") ?? "",
    product: searchParams.get("product") ?? "",
    platform: searchParams.get("platform") ?? "",
    currency: searchParams.get("currency") ?? "",
    dateFrom: parseDateValue(searchParams.get("dateFrom")),
    dateTo: parseDateValue(searchParams.get("dateTo"))
  };
}

function buildAssetOperationsHistoryUrl(pathname: string, view: AssetOperationsView) {
  const params = new URLSearchParams();

  if (view.type !== "all") {
    params.set("type", view.type);
  }

  if (view.q) {
    params.set("q", view.q);
  }

  if (view.product) {
    params.set("product", view.product);
  }

  if (view.platform) {
    params.set("platform", view.platform);
  }

  if (view.currency) {
    params.set("currency", view.currency);
  }

  if (view.dateFrom) {
    params.set("dateFrom", view.dateFrom);
  }

  if (view.dateTo) {
    params.set("dateTo", view.dateTo);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function updateView(
  pathname: string,
  router: ReturnType<typeof useRouter>,
  view: AssetOperationsView
) {
  router.replace(buildAssetOperationsHistoryUrl(pathname, view));
}

function parseDateValue(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function normalizeViewCurrency(value: string): CurrencyFilter | null {
  return value === "EUR" || value === "USD" ? value : null;
}

function mapHistoryTypeToApi(value: HistoryType) {
  if (value === "purchases") {
    return "purchase" as const;
  }

  if (value === "sales") {
    return "sale" as const;
  }

  return "all" as const;
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

function formatQuantity(value: number, locale: NumberFormatLocale) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 4
  }).format(value);
}

function getSegmentClassName(active: boolean) {
  return active ? "page-tab active" : "page-tab";
}
