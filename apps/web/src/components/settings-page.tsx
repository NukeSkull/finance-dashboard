"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";
import { useAuth } from "@/features/auth/auth-provider";
import {
  NumberFormatLocale,
  SectionDateRangePreset
} from "@/features/settings/settings";
import { useSettings } from "@/features/settings/settings-provider";
import { APP_API_URL } from "@/lib/api/client";

export function SettingsPage() {
  const router = useRouter();
  const { loading, user } = useAuth();
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

  if (loading || !user) {
    return (
      <main className="app-shell">
        <p className="muted">Comprobando sesión...</p>
      </main>
    );
  }

  return (
    <AuthenticatedAppShell
      description="Preferencias de uso diario y estado técnico de la app."
      eyebrow="Configuración"
      title="Ajustes de la app"
    >
      <section className="settings-grid" aria-label="Preferencias de configuración">
        <section className="detail-card">
          <header className="detail-card-header">
            <div>
              <p className="eyebrow">Uso diario</p>
              <h2>Secciones y navegación</h2>
            </div>
            <strong className="detail-total good">v2 local</strong>
          </header>

          <div className="settings-form-grid">
            <label className="settings-field">
              Rango por defecto para compras y ventas
              <select
                onChange={(event) =>
                  updateSettings({
                    defaultSectionDateRange: event.target.value as SectionDateRangePreset
                  })
                }
                value={settings.defaultSectionDateRange}
              >
                <option value="last_30_days">Últimos 30 días</option>
                <option value="last_90_days">Últimos 90 días</option>
                <option value="current_year">Año actual</option>
              </select>
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
              <span>Mostrar solo accesos disponibles</span>
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
              <span>Recordar la última tab de VT Markets</span>
            </label>
          </div>
        </section>

        <section className="detail-card">
          <header className="detail-card-header">
            <div>
              <p className="eyebrow">Formato y sesión</p>
              <h2>Presentación</h2>
            </div>
            <strong className="detail-total">{settings.numberFormatLocale}</strong>
          </header>

          <div className="settings-form-grid">
            <label className="settings-field">
              Locale numérico
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
              <span>Pedir confirmación antes de cerrar sesión</span>
            </label>
          </div>

          <div className="settings-actions">
            <button className="button secondary" onClick={restoreDefaultSettings} type="button">
              Restaurar ajustes por defecto
            </button>
          </div>
        </section>

        <section className="detail-card" aria-label="Estado técnico">
          <header className="detail-card-header">
            <div>
              <p className="eyebrow">Técnico</p>
              <h2>Estado actual</h2>
            </div>
            <strong className="detail-total good">Solo lectura</strong>
          </header>

          <div className="detail-table" role="table" aria-label="Estado técnico de la app">
            <div className="detail-row detail-row-head" role="row">
              <span role="columnheader">Campo</span>
              <span role="columnheader">Valor</span>
            </div>
            <div className="detail-row" role="row">
              <span role="cell">Usuario autenticado</span>
              <strong role="cell">{user.email ?? "Sin email"}</strong>
            </div>
            <div className="detail-row" role="row">
              <span role="cell">Estado de sesión</span>
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
            mediante variables de entorno y configuración del proyecto.
          </p>
          <p className="muted settings-note">
            Para el setup técnico completo, consulta el archivo README.md en la raíz del
            repositorio.
          </p>
        </section>
      </section>
    </AuthenticatedAppShell>
  );
}
