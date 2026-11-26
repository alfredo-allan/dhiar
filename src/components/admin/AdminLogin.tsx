"use client";

import { useState, type FormEvent } from "react";
import { MONOGRAM_PATH, MONOGRAM_VIEWBOX } from "@/data/brandPaths";

/** Entrada do painel: só a senha do administrador (ADMIN_PASSWORD). */
export function AdminLogin({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Não foi possível entrar.");
      window.location.href = next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-app border border-line bg-surface p-8 text-center">
        <svg viewBox={MONOGRAM_VIEWBOX} className="mx-auto h-14 w-auto" aria-hidden>
          <path d={MONOGRAM_PATH} fill="#c27b45" fillRule="evenodd" />
        </svg>
        <h1 className="font-display mt-4 text-3xl">Painel DHIAR</h1>
        <p className="mt-1 text-sm text-muted">Área restrita ao administrador.</p>
        <label className="mt-6 flex flex-col gap-1.5 text-left">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-app border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-accent"
          />
        </label>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 min-h-12 w-full rounded-full bg-accent text-sm font-semibold uppercase tracking-[0.14em] text-accent-ink hover:bg-accent-strong disabled:opacity-50"
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
