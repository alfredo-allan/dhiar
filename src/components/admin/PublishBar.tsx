"use client";

import { useEffect, useRef, useState } from "react";
import type { LastPublish } from "@/lib/adminDraft";

export type PublishPhase =
  | { kind: "idle" }
  | { kind: "publishing" }
  | { kind: "error"; message: string; conflict?: boolean };

type DeployState = "pending" | "success" | "failure" | "unknown";

interface PublishBarProps {
  pendingCount: number;
  phase: PublishPhase;
  lastPublish: LastPublish | null;
  publishMode: "github" | "local" | "none";
  repo: string | null;
  onPublish: () => void;
  onDiscard: () => void;
  onReload: () => void;
}

const POLL_MS = 6000;
const GIVE_UP_MS = 10 * 60 * 1000;

function shortSha(sha: string | null | undefined) {
  return sha ? sha.slice(0, 7) : "";
}

function Spinner() {
  return <span aria-hidden className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}

function Step({ state, label }: { state: "done" | "active" | "todo" | "fail"; label: string }) {
  const tone =
    state === "done" ? "text-success" : state === "active" ? "text-accent" : state === "fail" ? "text-danger" : "text-muted";
  return (
    <li className={`flex items-center gap-2 ${tone}`}>
      {state === "done" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : state === "active" ? (
        <Spinner />
      ) : state === "fail" ? (
        <span aria-hidden className="text-base leading-none">×</span>
      ) : (
        <span aria-hidden className="h-2 w-2 rounded-full bg-current opacity-50" />
      )}
      <span className="text-xs font-medium">{label}</span>
    </li>
  );
}

/**
 * Barra de status fixa no rodapé do painel. Mostra, em sequência:
 * 1. alterações pendentes (com Publicar / Descartar);
 * 2. "Enviando para o GitHub…" durante o commit;
 * 3. commit feito (com link) → Vercel publicando → No ar,
 *    consultando o GitHub e a própria loja a cada 6 s até o site novo entrar.
 */
export function PublishBar({ pendingCount, phase, lastPublish, publishMode, repo, onPublish, onDiscard, onReload }: PublishBarProps) {
  // Acompanhamento do deploy, sempre "amarrado" ao commit que ele descreve.
  const [track, setTrack] = useState<{ commit: string; deploy: DeployState; live: boolean; url: string | null } | null>(null);
  const startedAt = useRef<number>(0);

  const commit = lastPublish?.mode === "github" ? lastPublish.commit : null;
  const current = track && track.commit === commit ? track : null;
  const deploy: DeployState = current?.deploy ?? "pending";
  const live = current?.live ?? false;
  const deployUrl = current?.url ?? null;

  // Acompanha o deploy do último commit publicado.
  useEffect(() => {
    if (!commit) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    startedAt.current = Date.now();

    const check = async () => {
      try {
        const [statusRes, sessionRes] = await Promise.all([
          fetch(`/api/admin/status?sha=${commit}`, { cache: "no-store" }),
          fetch("/api/admin/session", { cache: "no-store" }),
        ]);
        const status = (await statusRes.json()) as { state: DeployState; url: string | null };
        const session = (await sessionRes.json()) as { deployedCommit?: string | null };
        if (stopped) return;
        const isLive = session.deployedCommit === commit;
        setTrack({
          commit,
          live: isLive,
          url: status.url,
          deploy: isLive ? "success" : status.state === "unknown" ? "pending" : status.state,
        });
        if (isLive || status.state === "failure" || Date.now() - startedAt.current > GIVE_UP_MS) return;
      } catch {
        // rede instável: tenta de novo no próximo ciclo
      }
      timer = setTimeout(check, POLL_MS);
    };
    check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [commit]);

  const publishing = phase.kind === "publishing";
  const disabled = publishMode === "none";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#0b0b0c]/95 backdrop-blur" role="region" aria-label="Publicação">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="min-w-0 text-sm" aria-live="polite">
          {phase.kind === "error" ? (
            <p className="text-danger">
              {phase.message}{" "}
              {phase.conflict && (
                <button type="button" onClick={onReload} className="underline underline-offset-2">
                  Recarregar a versão nova
                </button>
              )}
            </p>
          ) : publishing ? (
            <p className="flex items-center gap-2 text-accent">
              <Spinner />
              {publishMode === "github" ? `Enviando para o GitHub${repo ? ` (${repo})` : ""}…` : "Salvando o arquivo do catálogo…"}
            </p>
          ) : pendingCount > 0 ? (
            <p>
              <span className="font-semibold text-foreground">
                {pendingCount} {pendingCount === 1 ? "alteração pendente" : "alterações pendentes"}
              </span>
              <span className="text-muted"> - ficam guardadas neste navegador até você publicar.</span>
            </p>
          ) : lastPublish ? (
            lastPublish.mode === "github" ? (
              <ol className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <Step state="done" label={`Commit ${shortSha(lastPublish.commit)} no GitHub`} />
                <Step
                  state={live ? "done" : deploy === "failure" ? "fail" : "active"}
                  label={deploy === "failure" ? "Deploy da Vercel falhou" : live ? "Vercel publicou" : "Vercel publicando"}
                />
                <Step state={live ? "done" : "todo"} label={live ? "No ar na loja" : "Entrar no ar"} />
                {lastPublish.url && (
                  <li>
                    <a href={lastPublish.url} target="_blank" rel="noreferrer" className="text-xs text-muted underline underline-offset-2 hover:text-accent">
                      ver commit
                    </a>
                  </li>
                )}
                {deployUrl && !live && (
                  <li>
                    <a href={deployUrl} target="_blank" rel="noreferrer" className="text-xs text-muted underline underline-offset-2 hover:text-accent">
                      ver deploy
                    </a>
                  </li>
                )}
              </ol>
            ) : (
              <p className="text-success">Catálogo salvo no arquivo local (modo desenvolvimento). Faça o commit pelo Git quando quiser.</p>
            )
          ) : (
            <p className="text-muted">Tudo publicado. As edições ficam pendentes aqui até você publicar.</p>
          )}
          {disabled && (
            <p className="mt-1 text-xs text-danger">Publicação desligada: faltam GITHUB_TOKEN e GITHUB_REPO na Vercel.</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {pendingCount > 0 && !publishing && (
            <button
              type="button"
              onClick={onDiscard}
              className="min-h-11 rounded-full border border-line px-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:border-danger hover:text-danger"
            >
              Descartar
            </button>
          )}
          <button
            type="button"
            onClick={onPublish}
            disabled={pendingCount === 0 || publishing || disabled}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-40"
          >
            {publishing && <Spinner />}
            {publishing ? "Publicando…" : pendingCount > 0 ? `Publicar ${pendingCount}` : "Publicado"}
          </button>
        </div>
      </div>
    </div>
  );
}
