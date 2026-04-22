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
    description: "Operaciones historicas de compra filtradas por rango de fechas.",
    href: "/asset-purchases",
    label: "Compras de activos",
    status: "active"
  },
  {
    description: "Operaciones historicas de venta filtradas por rango de fechas.",
    href: "/asset-sales",
    label: "Ventas de activos",
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
    <section className="card-grid" aria-label="Secciones previstas">
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
