"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { useSettings } from "@/features/settings/settings-provider";
import { fetchZenSummary } from "@/lib/api/client";
import { ZenGoal, ZenSummary } from "@/lib/api/types";
import { formatCurrency } from "@/lib/dashboard/formatters";

export function ZenPage() {
  const router = useRouter();
  const { getIdToken, loading, logout, user } = useAuth();
  const { settings } = useSettings();
  const [summary, setSummary] = useState<ZenSummary | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

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
      setPageLoading(true);
      setPageError(null);

      try {
        const token = await getIdToken();
        const data = await fetchZenSummary({ token });

        if (!ignore) {
          setSummary(data);
        }
      } catch {
        if (!ignore) {
          setSummary(null);
          setPageError("No se pudo cargar la vista de Zen.");
        }
      } finally {
        if (!ignore) {
          setPageLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      ignore = true;
    };
  }, [getIdToken, user]);

  async function handleLogout() {
    if (
      settings.confirmBeforeLogout &&
      typeof window !== "undefined" &&
      !window.confirm("Se va a cerrar la sesion actual. Quieres continuar?")
    ) {
      return;
    }

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
            <p className="eyebrow">Vista por seccion</p>
            <h1>Zen</h1>
            <p className="lede">
              Objetivos de ahorro, total acumulado y disponible para volver a Espana.
            </p>
            <p className="user-line">{user.email}</p>
          </div>
          <div className="page-actions">
            <Link className="button secondary" href="/">
              Volver al dashboard
            </Link>
            <button className="button secondary" type="button" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        </header>

        {pageError ? (
          <section className="notice-panel error" role="alert">
            {pageError}
          </section>
        ) : null}

        {pageLoading && !summary ? (
          <section className="notice-panel">Cargando resumen de Zen...</section>
        ) : null}

        {summary ? (
          <>
            {pageLoading ? (
              <section className="notice-panel compact">
                Actualizando resumen...
              </section>
            ) : null}

            <section className="kpi-grid" aria-label="KPIs de Zen">
              <article className="kpi-card good">
                <span>Total</span>
                <strong>{formatCurrency(summary.totalSaved, settings.numberFormatLocale)}</strong>
              </article>
              <article className="kpi-card">
                <span>Disponible Zen</span>
                <strong>
                  {formatCurrency(
                    summary.availableToReturnToSpain,
                    settings.numberFormatLocale
                  )}
                </strong>
                <p>Disponible para volver a Espana</p>
              </article>
            </section>

            <section className="detail-card" aria-label="Objetivos de ahorro Zen">
              <header className="detail-card-header">
                <div>
                  <p className="eyebrow">Objetivos</p>
                  <h2>Tabla de ahorro</h2>
                </div>
                <strong className="detail-total good">{summary.goals.length} objetivos</strong>
              </header>

              <div className="zen-table" role="table" aria-label="Objetivos de Zen">
                <div className="zen-row zen-row-head" role="row">
                  <span role="columnheader">Objetivo</span>
                  <span role="columnheader">Ahorrado</span>
                  <span role="columnheader">Restante</span>
                  <span role="columnheader">Objetivo</span>
                  <span role="columnheader">Progreso</span>
                </div>

                {summary.goals.map((goal) => (
                  <ZenGoalRow
                    goal={goal}
                    key={goal.name}
                    locale={settings.numberFormatLocale}
                  />
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function ZenGoalRow(input: {
  goal: ZenGoal;
  locale: "es-ES" | "en-US";
}) {
  const { goal, locale } = input;
  const progressPercent = Math.round(goal.progressRatio * 100);

  return (
    <div className="zen-row" role="row">
      <strong role="cell">{goal.name}</strong>
      <span role="cell">{formatCurrency(goal.saved, locale)}</span>
      <span role="cell">{formatCurrency(goal.remaining, locale)}</span>
      <span role="cell">{formatCurrency(goal.target, locale)}</span>
      <div className="zen-progress-cell" role="cell">
        <strong>{progressPercent}%</strong>
        <div aria-hidden="true" className="zen-progress-track">
          <div className="zen-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
