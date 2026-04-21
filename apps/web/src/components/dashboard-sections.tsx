import Link from "next/link";

const plannedSections = [
  {
    description: "Detalle mensual por categorias reales del Sheet.",
    href: "/income-expenses",
    label: "Ingresos y gastos",
    status: "active"
  },
  {
    description: "Pendiente para proximas fases.",
    href: null,
    label: "Compras de activos",
    status: "planned"
  },
  {
    description: "Pendiente para proximas fases.",
    href: null,
    label: "Ventas de activos",
    status: "planned"
  },
  {
    description: "Pendiente para proximas fases.",
    href: null,
    label: "Zen",
    status: "planned"
  },
  {
    description: "Pendiente para proximas fases.",
    href: null,
    label: "VT Markets",
    status: "planned"
  },
  {
    description: "Pendiente para proximas fases.",
    href: null,
    label: "Patrimonio total",
    status: "planned"
  },
  {
    description: "Pendiente para proximas fases.",
    href: null,
    label: "Configuracion",
    status: "planned"
  }
] as const;

export function DashboardSections() {
  return (
    <section className="card-grid" aria-label="Secciones previstas">
      {plannedSections.map((section) => (
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
