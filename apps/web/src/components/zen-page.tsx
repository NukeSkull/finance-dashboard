"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";
import { PrivacyValue } from "@/components/privacy-value";
import { StatusPanel } from "@/components/status-panel";
import { useAuth } from "@/features/auth/auth-provider";
import { useSettings } from "@/features/settings/settings-provider";
import { fetchZenSummary } from "@/lib/api/client";
import { ZenGoal, ZenSummary } from "@/lib/api/types";
import { formatCurrency } from "@/lib/dashboard/formatters";

export function ZenPage() {
  const router = useRouter();
  const { getIdToken, loading, user } = useAuth();
  const { privacyModeEnabled, settings } = useSettings();
  const [summary, setSummary] = useState<ZenSummary | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const progressSummary = useMemo(() => {
    if (!summary) {
      return null;
    }

    const totalTarget = summary.goals.reduce((sum, goal) => sum + goal.target, 0);
    const totalSaved = summary.goals.reduce((sum, goal) => sum + goal.saved, 0);
    const totalRemaining = summary.goals.reduce((sum, goal) => sum + goal.remaining, 0);
    const completionRatio = totalTarget > 0 ? totalSaved / totalTarget : 0;

    return {
      completionPercent: Math.round(completionRatio * 100),
      totalRemaining,
      totalSaved,
      totalTarget
    };
  }, [summary]);

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
        <p className="muted">Comprobando sesion...</p>
      </main>
    );
  }

  return (
    <AuthenticatedAppShell
      description="Objetivos de ahorro, total acumulado y disponible para volver a Espana."
      eyebrow="Zen"
      title="Zen"
    >
      {pageError ? <StatusPanel tone="error">{pageError}</StatusPanel> : null}

      {pageLoading && !summary ? <StatusPanel>Cargando resumen de Zen...</StatusPanel> : null}

      {summary ? (
        <>
          {pageLoading ? <StatusPanel compact>Actualizando resumen...</StatusPanel> : null}

          <section className="zen-overview-grid" aria-label="KPIs de Zen">
            <article className="kpi-card good zen-kpi-card">
              <span className="zen-kpi-label">Total</span>
              <PrivacyValue as="strong" hidden={privacyModeEnabled}>
                {formatCurrency(summary.totalSaved, settings.numberFormatLocale)}
              </PrivacyValue>
              <p className="zen-kpi-caption">Ahorrado en objetivos activos</p>
            </article>

            <article className="kpi-card zen-kpi-card">
              <span className="zen-kpi-label">Disponible Zen</span>
              <PrivacyValue as="strong" hidden={privacyModeEnabled}>
                {formatCurrency(
                  summary.availableToReturnToSpain,
                  settings.numberFormatLocale
                )}
              </PrivacyValue>
              <p className="zen-kpi-caption">Disponible para volver a Espana</p>
            </article>

            {progressSummary ? (
              <article className="detail-card zen-progress-overview-card">
                <div className="zen-progress-overview-head">
                  <p className="eyebrow">Resumen global</p>
                  <PrivacyValue
                    as="strong"
                    className="zen-progress-overview-percent"
                    hidden={privacyModeEnabled}
                  >
                    {progressSummary.completionPercent}%
                  </PrivacyValue>
                </div>

                <div className="zen-progress-overview-metrics">
                  <div>
                    <span>Objetivo total</span>
                    <PrivacyValue as="strong" hidden={privacyModeEnabled}>
                      {formatCurrency(progressSummary.totalTarget, settings.numberFormatLocale)}
                    </PrivacyValue>
                  </div>
                  <div>
                    <span>Ahorrado total</span>
                    <PrivacyValue as="strong" hidden={privacyModeEnabled}>
                      {formatCurrency(progressSummary.totalSaved, settings.numberFormatLocale)}
                    </PrivacyValue>
                  </div>
                  <div>
                    <span>Restante total</span>
                    <PrivacyValue as="strong" hidden={privacyModeEnabled}>
                      {formatCurrency(progressSummary.totalRemaining, settings.numberFormatLocale)}
                    </PrivacyValue>
                  </div>
                </div>

                <div className="zen-progress-overview-track" aria-hidden="true">
                  <div
                    className="zen-progress-overview-fill"
                    style={{ width: `${progressSummary.completionPercent}%` }}
                  />
                </div>
              </article>
            ) : null}
          </section>

          <section className="detail-card zen-goals-card" aria-label="Objetivos de ahorro Zen">
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
                  privacyModeEnabled={privacyModeEnabled}
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
  privacyModeEnabled: boolean;
}) {
  const { goal, locale, privacyModeEnabled } = input;
  const progressPercent = Math.round(goal.progressRatio * 100);
  const goalCompleted = goal.remaining === 0 || goal.saved >= goal.target;

  return (
    <div className={`zen-row ${goalCompleted ? "is-complete" : "is-pending"}`} role="row">
      <strong className="zen-goal-name" role="cell">
        {goal.name}
      </strong>
      <span className="zen-saved-value" role="cell">
        <PrivacyValue hidden={privacyModeEnabled}>
          {formatCurrency(goal.saved, locale)}
        </PrivacyValue>
      </span>
      <span className="zen-remaining-value" role="cell">
        <PrivacyValue hidden={privacyModeEnabled}>
          {formatCurrency(goal.remaining, locale)}
        </PrivacyValue>
      </span>
      <span className="zen-target-value" role="cell">
        <PrivacyValue hidden={privacyModeEnabled}>
          {formatCurrency(goal.target, locale)}
        </PrivacyValue>
      </span>
      <div className="zen-progress-cell" role="cell">
        <PrivacyValue as="strong" hidden={privacyModeEnabled}>
          {progressPercent}%
        </PrivacyValue>
        <div aria-hidden="true" className="zen-progress-track">
          <div className="zen-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
