import Link from "next/link";
import { useSettings } from "@/features/settings/settings-provider";

const plannedSections = [
  {
    description: "Detalle mensual por categorias reales del Sheet.",
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
    description: "Compras y ventas historicas en una unica vista con tabs y rango comun.",
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
    description: "Resumen integrado directamente en la home.",
    href: null,
    label: "Patrimonio total",
    status: "active"
  },
  {
    description: "Preferencias de uso y estado tecnico de la app.",
    href: "/settings",
    label: "Configuracion",
    status: "active"
  }
] as const;

export function DashboardSections() {
  const { settings } = useSettings();
  const visibleSections = settings.showSectionCardsCompletedOnly
    ? plannedSections.filter((section) => section.status === "active")
    : plannedSections;

  return (
    <section className="card-grid" aria-label="Secciones de la app">
      {visibleSections.map((section) => (
        section.href ? (
          <Link className="section-card section-card-link" href={section.href} key={section.label}>
            <div className="section-card-topline">
              <h2>{section.label}</h2>
              <span className="section-status active">Disponible</span>
            </div>
            <p>{section.description}</p>
          </Link>
        ) : (
          <article className="section-card" key={section.label}>
            <div className="section-card-topline">
              <h2>{section.label}</h2>
              <span className="section-status">Pendiente</span>
            </div>
            <p>{section.description}</p>
          </article>
        )
      ))}
    </section>
  );
}
