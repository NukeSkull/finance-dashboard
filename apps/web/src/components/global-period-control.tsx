"use client";

import { useSettings } from "@/features/settings/settings-provider";
import {
  MonthSelection,
  getMonthOptions,
  getYearOptions
} from "@/lib/dashboard/month-selection";

type GlobalPeriodControlProps = {
  disabled?: boolean;
};

export function GlobalPeriodControl({
  disabled = false
}: GlobalPeriodControlProps) {
  const { globalMonthSelection, setGlobalMonthSelection } = useSettings();
  const monthLabel =
    getMonthOptions().find((month) => month.value === globalMonthSelection.month)?.label ??
    "Mes";
  const years = getYearOptions(new Date().getFullYear());

  function shiftMonth(step: -1 | 1) {
    const next = getShiftedSelection(globalMonthSelection, step);
    setGlobalMonthSelection(next);
  }

  return (
    <section className="global-period-control" aria-label="Período global seleccionado">
      <div className="global-period-label">
        <span className="eyebrow">Período</span>
        <strong>
          {monthLabel} {globalMonthSelection.year}
        </strong>
      </div>

      <div className="global-period-actions">
        <button
          aria-label="Período anterior"
          className="icon-button"
          disabled={disabled}
          onClick={() => shiftMonth(-1)}
          type="button"
        >
          {"<"}
        </button>

        <form className="global-period-form" aria-label="Selector de período global">
          <label className="sr-only" htmlFor="global-period-month">
            Mes
          </label>
          <select
            disabled={disabled}
            id="global-period-month"
            onChange={(event) =>
              setGlobalMonthSelection({
                ...globalMonthSelection,
                month: Number(event.target.value)
              })
            }
            value={globalMonthSelection.month}
          >
            {getMonthOptions().map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="global-period-year">
            Año
          </label>
          <select
            disabled={disabled}
            id="global-period-year"
            onChange={(event) =>
              setGlobalMonthSelection({
                ...globalMonthSelection,
                year: Number(event.target.value)
              })
            }
            value={globalMonthSelection.year}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </form>

        <button
          aria-label="Período siguiente"
          className="icon-button"
          disabled={disabled}
          onClick={() => shiftMonth(1)}
          type="button"
        >
          {">"}
        </button>
      </div>
    </section>
  );
}

function getShiftedSelection(selection: MonthSelection, step: -1 | 1): MonthSelection {
  if (step === -1) {
    return selection.month === 1
      ? { month: 12, year: selection.year - 1 }
      : { month: selection.month - 1, year: selection.year };
  }

  return selection.month === 12
    ? { month: 1, year: selection.year + 1 }
    : { month: selection.month + 1, year: selection.year };
}
