"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogFile, StoredBrand, StoredProduct } from "@/lib/catalog";
import { formatBRL } from "@/lib/format";
import {
  commitMessage,
  loadDraft,
  loadLastPublish,
  saveDraft,
  saveLastPublish,
  slugify,
  summarizeChanges,
  type DraftState,
  type LastPublish,
} from "@/lib/adminDraft";
import { ProductEditor } from "./ProductEditor";
import { PublishBar, type PublishPhase } from "./PublishBar";

interface Session {
  admin: boolean;
  devOpen?: boolean;
  publish: "github" | "local" | "none";
  storage: "blob" | "local" | "none";
  repo: string | null;
  branch: string;
  deployedCommit: string | null;
}

type Tab = "produtos" | "marcas" | "config";

const input =
  "w-full rounded-app border border-line bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent";

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function blankProduct(catalog: CatalogFile): StoredProduct {
  const nextVariant = Math.max(0, ...catalog.products.flatMap((p) => p.variants.map((v) => v.id))) + 1;
  return {
    id: `dh-${Date.now().toString(36)}`,
    slug: "",
    title: "",
    category: catalog.categories[0]?.id ?? "perfume-masculino",
    brandId: null,
    gender: null,
    concentration: "edp",
    isTester: false,
    isKit: false,
    isNew: true,
    isBestSeller: false,
    availability: "in_stock",
    description: null,
    olfactoryFamily: null,
    notes: { top: [], heart: [], base: [] },
    perfumer: null,
    launchYear: null,
    metaTitle: null,
    metaDescription: null,
    coverImage: null,
    hoverImage: null,
    images: [],
    createdAt: new Date().toISOString(),
    variants: [
      { id: nextVariant, sku: `dh-${Date.now().toString(36)}-1`, volumeMl: 100, label: null, price: 0, compareAtPrice: null, stock: 0, isActive: true, weightGrams: null },
    ],
  };
}

/**
 * Painel admin da DHIAR, 100% no front.
 *
 * Fluxo: abre o catálogo (versão mais recente do GitHub) → você edita
 * perfumes, marcas e preços (tudo fica num rascunho no navegador) →
 * "Publicar" grava `content/catalog.json` num commit → a Vercel publica a
 * loja nova. A barra de baixo acompanha cada etapa até entrar no ar.
 */
export function AdminApp() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<DraftState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<PublishPhase>({ kind: "idle" });
  const [lastPublish, setLastPublish] = useState<LastPublish | null>(null);
  const [tab, setTab] = useState<Tab>("produtos");
  const [editing, setEditing] = useState<{ product: StoredProduct; isNew: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState<"" | "best" | "new" | "hidden" | "nophoto" | "nostock">("");

  /** Lê o catálogo publicado. `keepDraft`: mantém o rascunho guardado se existir. */
  const loadCatalog = useCallback(async (keepDraft: boolean) => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/catalog", { cache: "no-store" });
      const data = (await res.json()) as { catalog?: CatalogFile; baseSha?: string | null; error?: string };
      if (!res.ok || !data.catalog) throw new Error(data.error ?? "Não foi possível ler o catálogo.");
      const saved = keepDraft ? loadDraft() : null;
      if (saved && summarizeChanges(saved.base, saved.draft).total > 0) {
        // Rascunho de antes: reaplica as SUAS mudanças sobre a versão nova publicada.
        const fresh = data.catalog;
        const changes = summarizeChanges(saved.base, saved.draft);
        const removed = new Set(changes.removed.map((p) => p.id));
        const edited = new Map([...changes.changed, ...changes.added].map((p) => [p.id, p]));
        const merged: CatalogFile = {
          ...fresh,
          settings: changes.settings ? saved.draft.settings : fresh.settings,
          brands: changes.brands ? saved.draft.brands : fresh.brands,
          categories: changes.brands ? saved.draft.categories : fresh.categories,
          products: [
            ...changes.added,
            ...fresh.products.filter((p) => !removed.has(p.id)).map((p) => edited.get(p.id) ?? p),
          ].filter((p, i, list) => list.findIndex((o) => o.id === p.id) === i),
        };
        setState({ base: fresh, baseSha: data.baseSha ?? null, draft: merged });
      } else {
        setState({ base: data.catalog, baseSha: data.baseSha ?? null, draft: data.catalog });
      }
      setPhase({ kind: "idle" });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Falha ao abrir o catálogo.");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: Session) => {
        if (!alive) return;
        if (!s.admin) {
          router.replace("/admin/entrar");
          return;
        }
        setSession(s);
        setLastPublish(loadLastPublish());
        loadCatalog(true);
      })
      .catch(() => alive && setLoadError("Sem conexão com o painel."));
    return () => {
      alive = false;
    };
  }, [loadCatalog, router]);

  // rascunho sempre guardado no navegador
  useEffect(() => {
    if (state) saveDraft(state);
  }, [state]);

  const summary = useMemo(() => (state ? summarizeChanges(state.base, state.draft) : null), [state]);
  const pendingCount = summary?.total ?? 0;

  // aviso ao fechar a aba com alterações não publicadas
  useEffect(() => {
    if (!pendingCount) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pendingCount]);

  const updateDraft = (fn: (draft: CatalogFile) => CatalogFile) =>
    setState((prev) => (prev ? { ...prev, draft: fn(prev.draft) } : prev));

  async function publish() {
    if (!state || !summary || summary.total === 0) return;
    setPhase({ kind: "publishing" });
    const message = commitMessage(summary);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalog: state.draft, message, baseSha: state.baseSha }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        commit?: string | null;
        url?: string;
        mode?: "github" | "local";
        error?: string;
        code?: string;
        updatedAt?: string;
      };
      if (!res.ok || !data.ok) {
        setPhase({ kind: "error", message: data.error ?? "Falha ao publicar.", conflict: data.code === "conflict" });
        return;
      }
      const published: CatalogFile = { ...state.draft, updatedAt: data.updatedAt ?? state.draft.updatedAt };
      setState({ base: published, baseSha: data.commit ?? state.baseSha, draft: published });
      const record: LastPublish = { commit: data.commit ?? null, url: data.url ?? null, at: new Date().toISOString(), summary: message, mode: data.mode ?? "local" };
      setLastPublish(record);
      saveLastPublish(record);
      setPhase({ kind: "idle" });
    } catch {
      setPhase({ kind: "error", message: "Sem conexão. Suas alterações continuam guardadas - tente publicar de novo." });
    }
  }

  function discard() {
    if (!state) return;
    if (!window.confirm("Descartar todas as alterações não publicadas?")) return;
    setState({ ...state, draft: state.base });
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/entrar");
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-danger">{loadError}</p>
        <button type="button" onClick={() => loadCatalog(true)} className="mt-4 rounded-full border border-line px-5 py-2 text-sm hover:border-accent">
          Tentar de novo
        </button>
      </div>
    );
  }
  if (!session || !state) {
    return <p className="px-4 py-20 text-center text-sm text-muted">Abrindo o catálogo…</p>;
  }

  const catalog = state.draft;
  const brandsById = new Map(catalog.brands.map((b) => [b.id, b]));

  if (editing) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-32 pt-6 md:px-8">
        <ProductEditor
          key={editing.product.id}
          product={editing.product}
          catalog={catalog}
          storage={session.storage}
          isNew={editing.isNew}
          onCancel={() => setEditing(null)}
          onSave={(saved) => {
            updateDraft((draft) => ({
              ...draft,
              products: editing.isNew ? [saved, ...draft.products] : draft.products.map((p) => (p.id === saved.id ? saved : p)),
            }));
            setEditing(null);
          }}
          onDelete={(id) => {
            updateDraft((draft) => ({ ...draft, products: draft.products.filter((p) => p.id !== id) }));
            setEditing(null);
          }}
        />
        <PublishBar pendingCount={pendingCount} phase={phase} lastPublish={lastPublish} publishMode={session.publish} repo={session.repo} onPublish={publish} onDiscard={discard} onReload={() => loadCatalog(true)} />
      </div>
    );
  }

  const term = normalize(search.trim());
  const changedIds = new Set([...(summary?.changed ?? []), ...(summary?.added ?? [])].map((p) => p.id));
  const visibleProducts = catalog.products.filter((p) => {
    const active = p.variants.filter((v) => v.isActive);
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (flagFilter === "best" && !p.isBestSeller) return false;
    if (flagFilter === "new" && !p.isNew) return false;
    if (flagFilter === "hidden" && active.length > 0) return false;
    if (flagFilter === "nophoto" && p.coverImage) return false;
    if (flagFilter === "nostock" && active.some((v) => v.stock > 0)) return false;
    if (!term) return true;
    return normalize(`${p.title} ${p.slug} ${brandsById.get(p.brandId ?? -1)?.name ?? ""}`).includes(term);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-32 pt-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Painel</p>
          <h1 className="font-display mt-1 text-4xl">Catálogo DHIAR</h1>
          <p className="mt-1 text-xs text-muted">
            {session.publish === "github" ? `Publica em ${session.repo} (${session.branch})` : session.publish === "local" ? "Modo local: grava content/catalog.json" : "Publicação não configurada"}
            {session.deployedCommit ? ` · no ar: ${session.deployedCommit.slice(0, 7)}` : ""}
            {session.devOpen ? " · sem senha (desenvolvimento)" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/" target="_blank" rel="noreferrer" className="min-h-10 rounded-full border border-line px-4 py-2 text-xs text-muted hover:text-foreground">
            Ver loja
          </a>
          {!session.devOpen && (
            <button type="button" onClick={logout} className="min-h-10 rounded-full border border-line px-4 py-2 text-xs text-muted hover:text-foreground">
              Sair
            </button>
          )}
        </div>
      </div>

      <div role="tablist" aria-label="Seções do painel" className="mt-6 flex gap-1 border-b border-line">
        {(
          [
            ["produtos", `Perfumes (${catalog.products.length})`],
            ["marcas", `Marcas (${catalog.brands.length})`],
            ["config", "Preços e Pix"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            type="button"
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm transition-colors ${tab === id ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "produtos" && (
        <div className="mt-5 flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, marca ou slug" aria-label="Buscar perfume" className={input} />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Categoria" className={input}>
              <option value="">Todas as categorias</option>
              {catalog.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <select value={flagFilter} onChange={(e) => setFlagFilter(e.target.value as typeof flagFilter)} aria-label="Filtro" className={input}>
              <option value="">Todos</option>
              <option value="best">Mais vendidos</option>
              <option value="new">Com selo NOVO</option>
              <option value="nostock">Sem estoque</option>
              <option value="nophoto">Sem foto</option>
              <option value="hidden">Ocultos</option>
            </select>
            <button
              type="button"
              onClick={() => setEditing({ product: blankProduct(catalog), isNew: true })}
              className="min-h-11 rounded-full bg-accent px-5 text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink hover:bg-accent-strong"
            >
              + Novo perfume
            </button>
          </div>
          <p className="text-xs text-muted">
            {visibleProducts.length} de {catalog.products.length} perfumes
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-app border border-line">
            {visibleProducts.slice(0, 200).map((p) => {
              const active = p.variants.filter((v) => v.isActive);
              const price = active.length ? Math.min(...active.map((v) => v.price)) : 0;
              const stock = active.reduce((total, v) => total + v.stock, 0);
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => setEditing({ product: p, isNew: false })} className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-surface sm:px-4">
                    <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-md bg-surface">
                      {p.coverImage && <Image src={p.coverImage} alt="" fill unoptimized sizes="44px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">
                        {p.title}
                        {changedIds.has(p.id) && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">editado</span>}
                        {p.isBestSeller && <span className="ml-2 rounded-full border border-accent/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">mais vendido</span>}
                        {active.length === 0 && <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">oculto</span>}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {brandsById.get(p.brandId ?? -1)?.name ?? "Sem marca"} · {catalog.categories.find((c) => c.id === p.category)?.label ?? p.category}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm text-foreground">{price ? formatBRL(price) : "-"}</span>
                      <span className={`block text-xs ${stock > 0 ? "text-muted" : "text-danger"}`}>{stock > 0 ? `${stock} em estoque` : "sem estoque"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {visibleProducts.length > 200 && <p className="text-xs text-muted">Mostrando 200. Use a busca para achar os demais.</p>}
        </div>
      )}

      {tab === "marcas" && <BrandsPanel catalog={catalog} onChange={(brands) => updateDraft((d) => ({ ...d, brands }))} />}

      {tab === "config" && <SettingsPanel catalog={catalog} onChange={(settings) => updateDraft((d) => ({ ...d, settings }))} />}

      <PublishBar pendingCount={pendingCount} phase={phase} lastPublish={lastPublish} publishMode={session.publish} repo={session.repo} onPublish={publish} onDiscard={discard} onReload={() => loadCatalog(true)} />
    </div>
  );
}

function BrandsPanel({ catalog, onChange }: { catalog: CatalogFile; onChange: (brands: StoredBrand[]) => void }) {
  const [name, setName] = useState("");
  const counts = new Map<number, number>();
  catalog.products.forEach((p) => p.brandId != null && counts.set(p.brandId, (counts.get(p.brandId) ?? 0) + 1));
  const brands = [...catalog.brands].sort((a, b) => a.name.localeCompare(b.name));

  function add() {
    const clean = name.trim();
    const slug = slugify(clean);
    if (!clean || !slug || catalog.brands.some((b) => b.slug === slug)) return;
    const id = Math.max(0, ...catalog.brands.map((b) => b.id)) + 1;
    onChange([...catalog.brands, { id, slug, name: clean, country: null, description: null, isFeatured: false }]);
    setName("");
  }

  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nova marca" aria-label="Nova marca" className={input} />
        <button type="button" onClick={add} className="shrink-0 rounded-full bg-accent px-5 text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
          Adicionar
        </button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <li key={brand.id} className="flex items-center gap-2 rounded-app border border-line px-3 py-2">
            <input
              defaultValue={brand.name}
              aria-label={`Nome da marca ${brand.name}`}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== brand.name) onChange(catalog.brands.map((b) => (b.id === brand.id ? { ...b, name: value } : b)));
              }}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <span className="text-xs text-muted">{counts.get(brand.id) ?? 0}</span>
            {(counts.get(brand.id) ?? 0) === 0 && (
              <button type="button" onClick={() => onChange(catalog.brands.filter((b) => b.id !== brand.id))} aria-label={`Remover ${brand.name}`} className="text-muted hover:text-danger">
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">Marcas com perfumes não podem ser removidas. Renomear muda o nome em toda a loja.</p>
    </div>
  );
}

function SettingsPanel({ catalog, onChange }: { catalog: CatalogFile; onChange: (settings: CatalogFile["settings"]) => void }) {
  const s = catalog.settings;
  const field = (key: keyof typeof s, label: string, hint: string, step = "1") => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        value={s[key]}
        onChange={(e) => onChange({ ...s, [key]: Number(e.target.value) || 0 })}
        className={input}
      />
      <span className="text-[11px] text-muted">{hint}</span>
    </label>
  );
  return (
    <div className="mt-5 grid max-w-3xl gap-5 sm:grid-cols-2">
      {field("pixDiscountPercent", "Desconto no Pix (%)", "Aparece como “R$ X no Pix” em todos os perfumes.", "0.5")}
      {field("maxInstallments", "Parcelas sem juros (máx.)", "Ex.: 12 → “ou 12x de R$ Y”.")}
      {field("minInstallmentValue", "Parcela mínima (R$)", "Limita o número de parcelas em perfumes baratos.", "0.01")}
      {field("freeShippingThreshold", "Frete grátis a partir de (R$)", "0 = sem frete grátis. Aparece no card e nas políticas.", "0.01")}
    </div>
  );
}
