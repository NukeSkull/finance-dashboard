import Link from "next/link";
import { useSettings } from "@/features/settings/settings-provider";

const plannedSections = [
  {
    description: "Detalle mensual por categorías reales del Sheet.",
    href: "/income-expenses",
    label: "Ingresos y gastos",
    status: "active"
  },
  {
    description: "Timeline unificada con ingresos, gastos, compras y ventas recientes.",
    href: "/activity",
    label: "Actividad reciente",
    status: "active"
  },
  {
    description: "Compras y ventas históricas en una única vista con tabs y rango común.",
    href: "/asset-operations",
    label: "Operaciones de activos",
    status: "active"
  },
  {
    description: "Objetivos de ahorro, total acumulado y disponible Zen.",
    href: "/zen",
    label: "Zen",
    status: "active"
  },
  {
    description: "Resultados, resumen global y cuentas actuales de VT Markets.",
    href: "/vt-markets",
    label: "VT Markets",
    status: "active"
  },
  {
    description: "Preferencias de uso y estado técnico de la app.",
    href: "/settings",
    label: "Configuración",
    status: "active"
  }
] as const;

export function DashboardSections() {
  const { settings } = useSettings();
  const visibleSections = settings.showSectionCardsCompletedOnly
    ? plannedSections.filter((section) => section.status === "active")
    : plannedSections;

  return (
    <div className="card-grid compact-card-grid" aria-label="Secciones de la app">
      {visibleSections.map((section) => (
        <Link className="section-card section-card-link" href={section.href} key={section.label}>
          <div className="section-card-topline">
            <h2>{section.label}</h2>
            <span className="section-status active">Disponible</span>
          </div>
          <p>{section.description}</p>
        </Link>
      ))}
    </div>
  );
}
