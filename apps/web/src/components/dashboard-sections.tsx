const plannedSections = [
  "Ingresos y gastos",
  "Compras de activos",
  "Ventas de activos",
  "Zen",
  "VT Markets",
  "Patrimonio total",
  "Configuracion"
];

export function DashboardSections() {
  return (
    <section className="card-grid" aria-label="Secciones previstas">
      {plannedSections.map((section) => (
        <article className="section-card" key={section}>
          <h2>{section}</h2>
          <p>Pendiente para proximas fases.</p>
        </article>
      ))}
    </section>
  );
}
