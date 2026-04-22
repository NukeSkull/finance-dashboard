"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import {
  DashboardPeriodMode,
  NumberFormatLocale,
  SectionDateRangePreset
} from "@/features/settings/settings";
import { useSettings } from "@/features/settings/settings-provider";
import { APP_API_URL } from "@/lib/api/client";

export function SettingsPage() {
  const router = useRouter();
  const { loading, logout, user } = useAuth();
  const {
    settings,
    updateSettings,
    restoreDefaultSettings
  } = useSettings();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

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
            <p className="eyebrow">Configuracion</p>
            <h1>Ajustes de la app</h1>
            <p className="lede">
              Preferencias de uso diario con un pequeno bloque tecnico en solo lectura.
            </p>
            <p className="user-line">{user.email}</p>
          </div>
          <div className="page-actions">
            <Link className="button secondary" href="/">
              Volver al dashboard
            </Link>
            <button className="button secondary" onClick={handleLogout} type="button">
              Cerrar sesion
            </button>
          </div>
        </header>

        <section className="settings-grid" aria-label="Preferencias de configuracion">
          <section className="detail-card">
            <header className="detail-card-header">
              <div>
                <p className="eyebrow">Uso diario</p>
                <h2>Dashboard y secciones</h2>
              </div>
              <strong className="detail-total good">v1 local</strong>
            </header>

            <div className="settings-form-grid">
              <label className="settings-field">
                Periodo por defecto del dashboard
                <select
                  onChange={(event) =>
                    updateSettings({
                      defaultDashboardPeriodMode: event.target
                        .value as DashboardPeriodMode
                    })
                  }
                  value={settings.defaultDashboardPeriodMode}
                >
                  <option value="current_month">Mes actual</option>
                  <option value="last_visited">Ultimo periodo visitado</option>
                </select>
              </label>

              <label className="settings-field">
                Rango por defecto para compras y ventas
                <select
                  onChange={(event) =>
                    updateSettings({
                      defaultSectionDateRange: event.target
                        .value as SectionDateRangePreset
                    })
                  }
                  value={settings.defaultSectionDateRange}
                >
                  <option value="last_30_days">Ultimos 30 dias</option>
                  <option value="last_90_days">Ultimos 90 dias</option>
                  <option value="current_year">{"A\u00f1o actual"}</option>
                </select>
              </label>

              <label className="settings-toggle">
                <input
                  checked={settings.showQuickAddOnHome}
                  onChange={(event) =>
                    updateSettings({ showQuickAddOnHome: event.target.checked })
                  }
                  type="checkbox"
                />
                <span>Mostrar Quick add en la home</span>
              </label>

              <label className="settings-toggle">
                <input
                  checked={settings.showNetWorthOnHome}
                  onChange={(event) =>
                    updateSettings({ showNetWorthOnHome: event.target.checked })
                  }
                  type="checkbox"
                />
                <span>Mostrar patrimonio total en la home</span>
              </label>

              <label className="settings-toggle">
                <input
                  checked={settings.showSectionCardsCompletedOnly}
                  onChange={(event) =>
                    updateSettings({
                      showSectionCardsCompletedOnly: event.target.checked
                    })
                  }
                  type="checkbox"
                />
                <span>Mostrar solo cards de secciones disponibles</span>
              </label>

              <label className="settings-toggle">
                <input
                  checked={settings.rememberLastVisitedVtTab}
                  onChange={(event) =>
                    updateSettings({
                      rememberLastVisitedVtTab: event.target.checked
                    })
                  }
                  type="checkbox"
                />
                <span>Recordar la ultima tab de VT Markets</span>
              </label>
            </div>
          </section>

          <section className="detail-card">
            <header className="detail-card-header">
              <div>
                <p className="eyebrow">Formato y sesion</p>
                <h2>Presentacion</h2>
              </div>
              <strong className="detail-total">{settings.numberFormatLocale}</strong>
            </header>

            <div className="settings-form-grid">
              <label className="settings-field">
                Locale numerico
                <select
                  onChange={(event) =>
                    updateSettings({
                      numberFormatLocale: event.target.value as NumberFormatLocale
                    })
                  }
                  value={settings.numberFormatLocale}
                >
                  <option value="es-ES">es-ES</option>
                  <option value="en-US">en-US</option>
                </select>
              </label>

              <label className="settings-toggle">
                <input
                  checked={settings.confirmBeforeLogout}
                  onChange={(event) =>
                    updateSettings({ confirmBeforeLogout: event.target.checked })
                  }
                  type="checkbox"
                />
                <span>Pedir confirmacion antes de cerrar sesion</span>
              </label>
            </div>

            <div className="settings-actions">
              <button className="button secondary" onClick={restoreDefaultSettings} type="button">
                Restaurar ajustes por defecto
              </button>
            </div>
          </section>

          <section className="detail-card" aria-label="Estado tecnico">
            <header className="detail-card-header">
              <div>
                <p className="eyebrow">Tecnico</p>
                <h2>Estado actual</h2>
              </div>
              <strong className="detail-total good">Solo lectura</strong>
            </header>

            <div className="detail-table" role="table" aria-label="Estado tecnico de la app">
              <div className="detail-row detail-row-head" role="row">
                <span role="columnheader">Campo</span>
                <span role="columnheader">Valor</span>
              </div>
              <div className="detail-row" role="row">
                <span role="cell">Usuario autenticado</span>
                <strong role="cell">{user.email ?? "Sin email"}</strong>
              </div>
              <div className="detail-row" role="row">
                <span role="cell">Estado de sesion</span>
                <strong role="cell">Autenticado</strong>
              </div>
              <div className="detail-row" role="row">
                <span role="cell">API configurada</span>
                <strong role="cell">{APP_API_URL}</strong>
              </div>
              <div className="detail-row" role="row">
                <span role="cell">Persistencia de ajustes</span>
                <strong role="cell">localStorage del navegador</strong>
              </div>
            </div>

            <p className="muted settings-note">
              Firebase, Google Sheets y las credenciales se gestionan fuera de la UI,
              mediante variables de entorno y configuracion del proyecto.
            </p>
            <p className="muted settings-note">
              Para el setup tecnico completo, consulta el archivo README.md en la raiz
              del repositorio.
            </p>
          </section>
        </section>
      </section>
    </main>
  );
}
