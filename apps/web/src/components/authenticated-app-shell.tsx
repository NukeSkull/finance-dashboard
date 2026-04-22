"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { GlobalPeriodControl } from "@/components/global-period-control";
import { QuickAddExpensePanel } from "@/components/quick-add-expense-panel";
import { StatusPanel } from "@/components/status-panel";
import { AppSectionNav } from "@/components/app-section-nav";
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
  const { globalMonthSelection, settings } = useSettings();
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
    <main className="app-shell">
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
              <button className="button" onClick={openQuickAdd} type="button">
                Añadir gasto
              </button>
              <Link className="button secondary" href="/settings">
                Configuración
              </Link>
              <button className="button secondary" onClick={handleLogout} type="button">
                Cerrar sesión
              </button>
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
