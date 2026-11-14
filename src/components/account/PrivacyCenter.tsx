"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { resetConsent } from "@/lib/consent";
import { STORE } from "@/lib/store";

/**
 * Central de privacidade (LGPD, art. 18): baixar uma cópia dos dados,
 * rever o consentimento de cookies e excluir a conta. A exclusão pede a
 * senha e anonimiza o cadastro; pedidos ficam guardados por obrigação
 * fiscal, sem dados de contato.
 */
export function PrivacyCenter() {
  const router = useRouter();
  const { isAuthenticated, token, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    setStatus(null);
    try {
      const data = await apiFetch<unknown>("/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meus-dados-${STORE.slug}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setStatus("Não foi possível gerar o arquivo agora. Tente de novo em instantes.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setStatus(null);
    try {
      await apiFetch("/me", { method: "DELETE", token, body: { password } });
      logout();
      router.push("/?conta=excluida");
    } catch (error) {
      setStatus(error instanceof ApiError && error.status === 401 ? "Senha incorreta." : "Não foi possível excluir agora.");
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl">Privacidade e meus dados</h1>
        <p className="mt-3 text-muted">Entre na sua conta para baixar ou excluir seus dados.</p>
        <Link href="/login?from=/account/privacidade" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-foreground px-6 text-sm font-semibold text-background">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Privacidade e meus dados</h1>
      <p className="mt-3 text-muted">
        Você controla seus dados. Saiba como tratamos cada um na{" "}
        <Link href="/politicas/privacidade" className="underline underline-offset-2">Política de Privacidade</Link>.
      </p>

      <section className="mt-10 space-y-3 rounded-app border border-line bg-surface p-6">
        <h2 className="font-display text-2xl">Baixar meus dados</h2>
        <p className="text-sm text-muted">Arquivo JSON com cadastro, endereços, pedidos, favoritos, avaliações e consentimentos.</p>
        <button type="button" onClick={handleExport} disabled={busy} className="min-h-11 rounded-full bg-foreground px-6 text-sm font-semibold text-background disabled:opacity-50">
          Baixar arquivo
        </button>
      </section>

      <section className="mt-6 space-y-3 rounded-app border border-line bg-surface p-6">
        <h2 className="font-display text-2xl">Cookies</h2>
        <p className="text-sm text-muted">Reveja o que você autorizou (análise e marketing).</p>
        <button type="button" onClick={resetConsent} className="min-h-11 rounded-full border border-foreground px-6 text-sm font-semibold">
          Alterar preferências de cookies
        </button>
      </section>

      <section className="mt-6 space-y-3 rounded-app border border-danger/40 bg-surface p-6">
        <h2 className="font-display text-2xl text-danger">Excluir minha conta</h2>
        <p className="text-sm text-muted">
          Apagamos endereços, favoritos e lista de espera, e anonimizamos seu cadastro. Pedidos já feitos ficam guardados sem
          seus dados de contato, porque a lei fiscal exige. Essa ação não pode ser desfeita.
        </p>
        {confirming ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              className="min-h-11 flex-1 rounded-full border border-line bg-background px-4 text-sm"
            />
            <button type="button" onClick={handleDelete} disabled={busy || !password} className="min-h-11 rounded-full bg-danger px-6 text-sm font-semibold text-white disabled:opacity-50">
              Excluir definitivamente
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-full border border-danger px-6 text-sm font-semibold text-danger">
            Quero excluir minha conta
          </button>
        )}
      </section>

      {status && <p role="status" className="mt-6 text-sm text-danger">{status}</p>}
    </div>
  );
}
