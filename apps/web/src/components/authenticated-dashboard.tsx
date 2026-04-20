"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMonthlySummary } from "@/lib/api/client";
import { MonthlySummary } from "@/lib/api/types";
import { useAuth } from "@/features/auth/auth-provider";

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

export function AuthenticatedDashboard() {
  const router = useRouter();
  const { getIdToken, loading, logout, user } = useAuth();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let ignore = false;

    async function loadSummary() {
      setSummaryLoading(true);
      setSummaryError(null);

      try {
        const token = await getIdToken();
        const data = await fetchMonthlySummary({ token, year: 2026, month: 4 });

        if (!ignore) {
          setSummary(data);
        }
      } catch {
        if (!ignore) {
          setSummaryError("No se pudo cargar el resumen mensual.");
        }
      } finally {
        if (!ignore) {
          setSummaryLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      ignore = true;
    };
  }, [getIdToken, user]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (loading || !user) {
    return (
      <main className="app-shell">
        <p className="muted">Comprobando sesion...</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="page-stack">
        <header className="topbar">
          <div>
            <p className="eyebrow">Fase 4</p>
            <h1>Finance Dashboard</h1>
            <p className="lede">
              Sesion iniciada. La app ya puede llamar al backend con token de
              Firebase.
            </p>
          </div>
          <button className="button secondary" type="button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </header>

        <section className="summary-panel" aria-label="Resumen mensual">
          <div>
            <p className="eyebrow">Prueba autenticada</p>
            <h2>Resumen abril 2026</h2>
          </div>

          {summaryLoading ? <p className="muted">Cargando Google Sheets...</p> : null}
          {summaryError ? <p className="error-text">{summaryError}</p> : null}

          {summary ? (
            <div className="metric-grid">
              <Metric label="Ingresos" value={summary.income} />
              <Metric label="Gasto total" value={summary.totalExpenses} />
              <Metric label="Invertido" value={summary.invested} />
              <Metric label="Ahorro" value={summary.savings} />
            </div>
          ) : null}
        </section>

        <section className="card-grid">
          {plannedSections.map((section) => (
            <article className="section-card" key={section}>
              <h2>{section}</h2>
              <p>Pendiente para proximas fases.</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>
        {new Intl.NumberFormat("es-ES", {
          currency: "EUR",
          style: "currency"
        }).format(value)}
      </strong>
    </div>
  );
}
