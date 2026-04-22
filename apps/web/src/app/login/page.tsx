"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";

const LOGIN_COOLDOWN_STORAGE_KEY = "finance-dashboard.login.blocked-until";
const LOGIN_COOLDOWN_SECONDS = 10;

export default function LoginPage() {
  const router = useRouter();
  const { loading, login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(
    readStoredBlockedUntil
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!blockedUntil || blockedUntil <= Date.now()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [blockedUntil]);

  useEffect(() => {
    if (blockedUntil && blockedUntil <= now && typeof window !== "undefined") {
      window.localStorage.removeItem(LOGIN_COOLDOWN_STORAGE_KEY);
    }
  }, [blockedUntil, now]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (blockedUntil && blockedUntil > Date.now()) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LOGIN_COOLDOWN_STORAGE_KEY);
      }

      router.replace("/");
    } catch {
      const nextBlockedUntil = Date.now() + LOGIN_COOLDOWN_SECONDS * 1000;

      setBlockedUntil(nextBlockedUntil);
      setNow(Date.now());

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          LOGIN_COOLDOWN_STORAGE_KEY,
          String(nextBlockedUntil)
        );
      }

      setError("No se ha podido iniciar sesion. Revisa email y contrasena.");
    } finally {
      setSubmitting(false);
    }
  }

  const cooldownSeconds =
    blockedUntil && blockedUntil > now
      ? Math.max(1, Math.ceil((blockedUntil - now) / 1000))
      : 0;

  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Acceso privado</p>
        <h1>Finance Dashboard</h1>
        <p className="lede">
          Entra con el usuario creado en Firebase para consultar tus finanzas.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Contrasena
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}
          {cooldownSeconds > 0 ? (
            <p className="muted">
              Espera {cooldownSeconds}s antes de volver a intentarlo.
            </p>
          ) : null}

          <button
            className="button"
            disabled={submitting || loading || cooldownSeconds > 0}
            type="submit"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

function readStoredBlockedUntil() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(LOGIN_COOLDOWN_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  const parsedValue = Number(storedValue);

  if (Number.isFinite(parsedValue) && parsedValue > Date.now()) {
    return parsedValue;
  }

  window.localStorage.removeItem(LOGIN_COOLDOWN_STORAGE_KEY);
  return null;
}
