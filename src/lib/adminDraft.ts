"use client";

import { storageKey } from "@/lib/store";
import type { CatalogFile, StoredProduct } from "@/lib/catalog";

/**
 * Rascunho do painel: as alterações ficam no navegador até você clicar em
 * "Publicar". Assim dá para editar vários perfumes e publicar tudo em UM
 * commit, e nada se perde se a aba fechar.
 */

export interface DraftState {
  /** Catálogo como estava ao abrir (base da comparação). */
  base: CatalogFile;
  /** Commit da branch em que a base foi lida (detecta conflito ao publicar). */
  baseSha: string | null;
  /** Catálogo com as suas alterações. */
  draft: CatalogFile;
}

export interface LastPublish {
  commit: string | null;
  url?: string | null;
  at: string;
  summary: string;
  mode: "github" | "local";
}

const DRAFT_KEY = storageKey("admin-draft");
const LAST_PUBLISH_KEY = storageKey("admin-last-publish");

export function loadDraft(): DraftState | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftState) : null;
  } catch {
    return null;
  }
}

export function saveDraft(state: DraftState | null): void {
  try {
    if (state) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // armazenamento cheio: o rascunho continua só na memória desta aba
  }
}

export function loadLastPublish(): LastPublish | null {
  try {
    const raw = window.localStorage.getItem(LAST_PUBLISH_KEY);
    return raw ? (JSON.parse(raw) as LastPublish) : null;
  } catch {
    return null;
  }
}

export function saveLastPublish(value: LastPublish): void {
  try {
    window.localStorage.setItem(LAST_PUBLISH_KEY, JSON.stringify(value));
  } catch {}
}

export interface ChangeSummary {
  added: StoredProduct[];
  removed: StoredProduct[];
  changed: StoredProduct[];
  brands: boolean;
  settings: boolean;
  total: number;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function summarizeChanges(base: CatalogFile, draft: CatalogFile): ChangeSummary {
  const baseById = new Map(base.products.map((p) => [p.id, p]));
  const draftById = new Map(draft.products.map((p) => [p.id, p]));
  const added = draft.products.filter((p) => !baseById.has(p.id));
  const removed = base.products.filter((p) => !draftById.has(p.id));
  const changed = draft.products.filter((p) => baseById.has(p.id) && !same(p, baseById.get(p.id)));
  const brands = !same(base.brands, draft.brands) || !same(base.categories, draft.categories);
  const settings = !same(base.settings, draft.settings);
  return {
    added,
    removed,
    changed,
    brands,
    settings,
    total: added.length + removed.length + changed.length + (brands ? 1 : 0) + (settings ? 1 : 0),
  };
}

/** Mensagem do commit, em português, listando o que mudou. */
export function commitMessage(summary: ChangeSummary): string {
  const parts: string[] = [];
  const names = (list: StoredProduct[]) =>
    list.slice(0, 3).map((p) => p.title).join(", ") + (list.length > 3 ? ` e mais ${list.length - 3}` : "");
  if (summary.changed.length) parts.push(`edita ${names(summary.changed)}`);
  if (summary.added.length) parts.push(`adiciona ${names(summary.added)}`);
  if (summary.removed.length) parts.push(`remove ${names(summary.removed)}`);
  if (summary.brands) parts.push("atualiza marcas");
  if (summary.settings) parts.push("atualiza configurações de preço");
  return parts.join("; ") || "atualiza o catálogo";
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
