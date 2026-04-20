const plannedSections = [
  "Resumen general",
  "Ingresos y gastos",
  "Compras de activos",
  "Ventas de activos",
  "Zen",
  "VT Markets",
  "Patrimonio total",
  "Configuracion"
];

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
            Fase 1
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Finance Dashboard
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">
            Base inicial del dashboard financiero personal. La logica de login,
            Google Sheets y KPIs llegara en las siguientes fases.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plannedSections.map((section) => (
            <div
              key={section}
              className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5"
            >
              <p className="text-sm font-medium text-[var(--foreground)]">
                {section}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Pendiente para proximas fases.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
