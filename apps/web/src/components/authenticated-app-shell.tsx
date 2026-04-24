"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { AppSectionNav } from "@/components/app-section-nav";
import { GlobalPeriodControl } from "@/components/global-period-control";
import { QuickAddExpensePanel } from "@/components/quick-add-expense-panel";
import { StatusPanel } from "@/components/status-panel";
import { useAuth } from "@/features/auth/auth-provider";
import { useAppShell } from "@/features/app-shell/app-shell-provider";
import { useSettings } from "@/features/settings/settings-provider";

type AuthenticatedAppShellProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function AuthenticatedAppShell({
  children,
  description,
  eyebrow,
  title
}: AuthenticatedAppShellProps) {
  const router = useRouter();
  const { getIdToken, logout } = useAuth();
  const { globalMonthSelection, privacyModeEnabled, setPrivacyModeEnabled, settings } =
    useSettings();
  const {
    closeQuickAdd,
    dismissQuickAddNotice,
    isQuickAddOpen,
    quickAddNotice,
    openQuickAdd,
    registerQuickAddResult
  } = useAppShell();

  async function handleLogout() {
    if (
      settings.confirmBeforeLogout &&
      typeof window !== "undefined" &&
      !window.confirm("Se va a cerrar la sesión actual. ¿Quieres continuar?")
    ) {
      return;
    }

    await logout();
    router.replace("/login");
  }

  return (
    <main className={`app-shell${privacyModeEnabled ? " privacy-mode" : ""}`}>
      <section className="page-stack">
        <header className="app-frame-header">
          <div className="app-frame-copy">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="lede">{description}</p>
          </div>

          <div className="app-frame-controls">
            <GlobalPeriodControl />

            <div className="app-frame-actions">
              <button
                aria-label={
                  privacyModeEnabled ? "Desactivar modo privacidad" : "Activar modo privacidad"
                }
                className={`icon-button${privacyModeEnabled ? " active" : ""}`}
                onClick={() => setPrivacyModeEnabled(!privacyModeEnabled)}
                type="button"
              >
                {privacyModeEnabled ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
              <button className="button" onClick={openQuickAdd} type="button">
                Añadir gasto
              </button>

              <details className="user-menu">
                <summary aria-label="Abrir menú de usuario" className="icon-button" role="button">
                  <span aria-hidden="true">⋯</span>
                </summary>
                <div className="user-menu-panel">
                  <Link className="user-menu-item" href="/settings">
                    Configuración
                  </Link>
                  <button className="user-menu-item danger" onClick={handleLogout} type="button">
                    Cerrar sesión
                  </button>
                </div>
              </details>
            </div>
          </div>
        </header>

        <AppSectionNav />

        {quickAddNotice ? (
          <StatusPanel compact>
            <div className="notice-inline-actions">
              <span>{quickAddNotice}</span>
              <button
                aria-label="Cerrar aviso"
                className="icon-button subtle"
                onClick={dismissQuickAddNotice}
                type="button"
              >
                ×
              </button>
            </div>
          </StatusPanel>
        ) : null}

        {children}
      </section>

      {isQuickAddOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeQuickAdd}>
          <div
            aria-label="Añadir gasto rápido"
            aria-modal="true"
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Acción global</p>
                <h2>Añadir gasto</h2>
                <p className="muted">
                  Guarda un movimiento rápido sin salir de la pantalla actual.
                </p>
              </div>
              <button
                aria-label="Cerrar formulario"
                className="icon-button subtle"
                onClick={closeQuickAdd}
                type="button"
              >
                ×
              </button>
            </div>

            <QuickAddExpensePanel
              getIdToken={getIdToken}
              initialSelection={globalMonthSelection}
              onExpenseAdded={async (result, meta) => {
                registerQuickAddResult({
                  currentSelection: globalMonthSelection,
                  result
                });

                if (meta.saveMode === "single") {
                  closeQuickAdd();
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function EyeOpenIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path
        d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        fill="none"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path
        d="M3 3 21 21"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M10.6 5.2A12.4 12.4 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-3.7 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M6.1 6.1A18.3 18.3 0 0 0 2 12s3.6 7 10 7c1.8 0 3.4-.5 4.8-1.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
