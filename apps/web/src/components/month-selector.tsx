import {
  MonthSelection,
  getMonthOptions,
  getYearOptions
} from "@/lib/dashboard/month-selection";

type MonthSelectorProps = {
  disabled?: boolean;
  selection: MonthSelection;
  onChange: (selection: MonthSelection) => void;
};

export function MonthSelector({
  disabled = false,
  onChange,
  selection
}: MonthSelectorProps) {
  const years = getYearOptions(new Date().getFullYear());

  return (
    <form className="month-selector" aria-label="Seleccion de mes y ano">
      <label>
        Mes
        <select
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...selection, month: Number(event.target.value) })
          }
          value={selection.month}
        >
          {getMonthOptions().map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Ano
        <select
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...selection, year: Number(event.target.value) })
          }
          value={selection.year}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
