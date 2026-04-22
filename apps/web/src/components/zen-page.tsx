"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";
import { StatusPanel } from "@/components/status-panel";
import { useAuth } from "@/features/auth/auth-provider";
import { useSettings } from "@/features/settings/settings-provider";
import { fetchZenSummary } from "@/lib/api/client";
import { ZenGoal, ZenSummary } from "@/lib/api/types";
import { formatCurrency } from "@/lib/dashboard/formatters";

export function ZenPage() {
  const router = useRouter();
  const { getIdToken, loading, user } = useAuth();
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

  if (loading || !user) {
    return (
      <main className="app-shell">
        <p className="muted">Comprobando sesión...</p>
      </main>
    );
  }

  return (
    <AuthenticatedAppShell
      description="Objetivos de ahorro, total acumulado y disponible para volver a España."
      eyebrow="Zen"
      title="Zen"
    >
      {pageError ? <StatusPanel tone="error">{pageError}</StatusPanel> : null}

      {pageLoading && !summary ? (
        <StatusPanel>Cargando resumen de Zen...</StatusPanel>
      ) : null}

      {summary ? (
        <>
          {pageLoading ? (
            <StatusPanel compact>Actualizando resumen...</StatusPanel>
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
              <p>Disponible para volver a España</p>
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
    </AuthenticatedAppShell>
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
