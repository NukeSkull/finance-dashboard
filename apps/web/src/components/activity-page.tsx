"use client";

import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import { useEffect, useState } from "react";
import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";
import { StatusPanel } from "@/components/status-panel";
import { useAuth } from "@/features/auth/auth-provider";
import { useAppShell } from "@/features/app-shell/app-shell-provider";
import { SectionDateRangePreset } from "@/features/settings/settings";
import { useSettings } from "@/features/settings/settings-provider";
import {
  fetchAssetPurchases,
  fetchAssetSales,
  fetchIncomeExpensesDetail
} from "@/lib/api/client";
import {
  AssetOperation,
  AssetOperationsResponse,
  IncomeExpensesDetail
} from "@/lib/api/types";
import { formatCurrency } from "@/lib/dashboard/formatters";
import {
  MonthSelection,
  getCurrentMonthSelection,
  getMonthOptions
} from "@/lib/dashboard/month-selection";

type ActivityItem = {
  amount: number;
  bucket: "income" | "expense" | "purchase" | "sale";
  sortKey: number;
  key: string;
  label: string;
  meta: string;
  periodLabel: string;
  tone: "good" | "bad" | "neutral";
  dateValue: string;
};

export function ActivityPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getIdToken, loading, user } = useAuth();
  const { settings, globalMonthSelection, setGlobalMonthSelection } = useSettings();
  const { lastQuickAddResult, quickAddVersion } = useAppShell();
  const defaults = getDefaultDateRange(settings.defaultSectionDateRange);
  const selection = globalMonthSelection;
  const range = parseDateRange(searchParams, defaults);
  const [detail, setDetail] = useState<IncomeExpensesDetail | null>(null);
  const [purchases, setPurchases] = useState<AssetOperationsResponse | null>(null);
  const [sales, setSales] = useState<AssetOperationsResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const pageReloadKey =
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
    const nextSelection = parseSelection(searchParams);

    if (
      searchParams.get("year") &&
      searchParams.get("month") &&
      (nextSelection.year !== selection.year || nextSelection.month !== selection.month)
    ) {
      setGlobalMonthSelection(nextSelection);
    }
  }, [searchParams, selection.month, selection.year, setGlobalMonthSelection]);

  useEffect(() => {
    const currentYear = Number(searchParams.get("year"));
    const currentMonth = Number(searchParams.get("month"));
    const currentDateFrom = searchParams.get("dateFrom");
    const currentDateTo = searchParams.get("dateTo");

    if (
      currentYear === selection.year &&
      currentMonth === selection.month &&
      currentDateFrom === range.dateFrom &&
      currentDateTo === range.dateTo
    ) {
      return;
    }

    router.replace(buildActivityUrl(pathname, selection, range));
  }, [pathname, range, router, searchParams, selection]);

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
        const [nextDetail, nextPurchases, nextSales] = await Promise.all([
          fetchIncomeExpensesDetail({
            token,
            year: selection.year,
            month: selection.month
          }),
          fetchAssetPurchases({
            token,
            dateFrom: range.dateFrom,
            dateTo: range.dateTo
          }),
          fetchAssetSales({
            token,
            dateFrom: range.dateFrom,
            dateTo: range.dateTo
          })
        ]);

        if (!ignore) {
          setDetail(nextDetail);
          setPurchases(nextPurchases);
          setSales(nextSales);
        }
      } catch {
        if (!ignore) {
          setDetail(null);
          setPurchases(null);
          setSales(null);
          setPageError("No se pudo cargar la actividad reciente combinada.");
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
  }, [
    getIdToken,
    pageReloadKey,
    range.dateFrom,
    range.dateTo,
    selection.month,
    selection.year,
    user
  ]);

  function handleDateChange(nextRange: DateRangeState) {
    router.replace(buildActivityUrl(pathname, selection, nextRange));
  }

  if (loading || !user) {
    return (
      <main className="app-shell">
        <p className="muted">Comprobando sesión...</p>
      </main>
    );
  }

  const monthLabel =
    getMonthOptions().find((month) => month.value === selection.month)?.label ?? "Mes";
  const items =
    detail && purchases && sales
      ? buildActivityItems({
          detail,
          purchases: purchases.items,
          sales: sales.items
        })
      : [];

  return (
    <AuthenticatedAppShell
      description="Timeline combinada de ingresos, gastos, compras y ventas para revisar el movimiento reciente."
      eyebrow="Actividad"
      title="Actividad reciente"
    >
      <section className="dashboard-toolbar" aria-label="Filtros de actividad reciente">
        <div>
          <p className="eyebrow">Contexto</p>
          <h2>
            {monthLabel} {selection.year}
          </h2>
          <p className="muted section-intro">
            Los ingresos y gastos se leen por categorías del mes seleccionado. Las
            compras y ventas se leen por fecha real dentro del rango indicado.
          </p>
        </div>
        <div className="activity-toolbar-controls">
          <ActivityDateRangeForm
            disabled={pageLoading}
            onChange={handleDateChange}
            value={range}
          />
        </div>
      </section>

      {pageError ? <StatusPanel tone="error">{pageError}</StatusPanel> : null}

      {pageLoading && !detail && !purchases && !sales ? (
        <StatusPanel>Cargando actividad reciente...</StatusPanel>
      ) : null}

      {detail && purchases && sales ? (
        <>
          {pageLoading ? (
            <StatusPanel compact>Actualizando actividad...</StatusPanel>
          ) : null}

          <section className="kpi-grid" aria-label="Resumen combinado de actividad">
            <article className="kpi-card">
              <span>Items timeline</span>
              <strong>{items.length}</strong>
            </article>
            <article className="kpi-card good">
              <span>Ingresos del mes</span>
              <strong>
                {formatCurrency(detail.incomeSection.total, settings.numberFormatLocale)}
              </strong>
            </article>
            <article className="kpi-card bad">
              <span>Gasto total del mes</span>
              <strong>
                {formatCurrency(detail.grandTotalExpenses, settings.numberFormatLocale)}
              </strong>
            </article>
            <article className="kpi-card">
              <span>Operaciones de activos</span>
              <strong>{purchases.items.length + sales.items.length}</strong>
              <p>
                {range.dateFrom} - {range.dateTo}
              </p>
            </article>
          </section>

          {items.length === 0 ? (
            <StatusPanel>No hay actividad disponible con los filtros actuales.</StatusPanel>
          ) : (
            <section className="detail-card" aria-label="Timeline de actividad reciente">
              <header className="detail-card-header">
                <div>
                  <p className="eyebrow">Timeline</p>
                  <h2>Actividad combinada</h2>
                </div>
                <strong className="detail-total">{items.length} registros</strong>
              </header>

              <div className="activity-timeline">
                {items.map((item) => (
                  <article className="activity-item" key={item.key}>
                    <div className={`activity-pill ${item.bucket}`}>{item.periodLabel}</div>
                    <div className="activity-main">
                      <div className="activity-row">
                        <strong>{item.label}</strong>
                        <strong className={`activity-amount ${item.tone}`}>
                          {formatCurrency(item.amount, settings.numberFormatLocale)}
                        </strong>
                      </div>
                      <div className="activity-row muted">
                        <span>{item.meta}</span>
                        <span>{item.dateValue}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}
    </AuthenticatedAppShell>
  );
}

function ActivityDateRangeForm(input: {
  disabled: boolean;
  onChange: (value: DateRangeState) => void;
  value: DateRangeState;
}) {
  return (
    <form className="asset-filters" aria-label="Rango de fechas de actividad">
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

function buildActivityItems(input: {
  detail: IncomeExpensesDetail;
  purchases: AssetOperation[];
  sales: AssetOperation[];
}) {
  const monthSortKey = input.detail.year * 100 + input.detail.month;
  const expenseItems = [
    ...input.detail.essentialExpensesSection.items,
    ...input.detail.discretionaryExpensesSection.items
  ]
    .filter((item) => item.value !== 0)
    .map<ActivityItem>((item) => ({
      amount: item.value,
      bucket: "expense",
      dateValue: `${String(input.detail.month).padStart(2, "0")}/${input.detail.year}`,
      key: `expense-${item.row}`,
      label: item.label,
      meta: "Gasto mensual",
      periodLabel: "Mes",
      sortKey: monthSortKey,
      tone: "bad"
    }));

  const incomeItems = input.detail.incomeSection.items
    .filter((item) => item.value !== 0)
    .map<ActivityItem>((item) => ({
      amount: item.value,
      bucket: "income",
      dateValue: `${String(input.detail.month).padStart(2, "0")}/${input.detail.year}`,
      key: `income-${item.row}`,
      label: item.label,
      meta: "Ingreso mensual",
      periodLabel: "Mes",
      sortKey: monthSortKey,
      tone: "good"
    }));

  const purchaseItems = input.purchases.map<ActivityItem>((item) => ({
    amount: item.totalEur ?? 0,
    bucket: "purchase",
    dateValue: item.date,
    sortKey: item.dateSerial,
    key: `purchase-${item.dateSerial}-${item.product}-${item.platform}`,
    label: item.product,
    meta: `Compra · ${item.platform}`,
    periodLabel: "Compra",
    tone: "neutral"
  }));

  const saleItems = input.sales.map<ActivityItem>((item) => ({
    amount: item.totalEur ?? 0,
    bucket: "sale",
    dateValue: item.date,
    sortKey: item.dateSerial,
    key: `sale-${item.dateSerial}-${item.product}-${item.platform}`,
    label: item.product,
    meta: `Venta · ${item.platform}`,
    periodLabel: "Venta",
    tone: "good"
  }));

  return [...purchaseItems, ...saleItems, ...incomeItems, ...expenseItems].sort(
    (a, b) => b.sortKey - a.sortKey
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

function buildActivityUrl(
  pathname: string,
  selection: MonthSelection,
  range: DateRangeState
) {
  const params = new URLSearchParams();
  params.set("year", String(selection.year));
  params.set("month", String(selection.month));
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

type DateRangeState = {
  dateFrom: string;
  dateTo: string;
};
