"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import type { Gender } from "@/types";
import type { CatalogFile, StoredProduct, StoredVariant } from "@/lib/catalog";
import { slugify } from "@/lib/adminDraft";
import { uploadProductImage } from "@/lib/adminUpload";
import { CONCENTRATION_OPTIONS } from "./adminOptions";

interface ProductEditorProps {
  product: StoredProduct;
  catalog: CatalogFile;
  storage: "blob" | "local" | "none";
  isNew: boolean;
  onSave: (product: StoredProduct) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

const input =
  "w-full rounded-app border border-line bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent";
const labelText = "text-[11px] font-semibold uppercase tracking-[0.18em] text-muted";

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className={labelText}>{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-app border border-line bg-surface/60 p-4 sm:p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-accent">{title}</h3>
      {children}
    </section>
  );
}

const notesToText = (list: string[]) => list.join(", ");
const textToNotes = (text: string) =>
  text
    .split(",")
    .map((note) => note.trim())
    .filter(Boolean)
    .slice(0, 20);

function nextVariantId(catalog: CatalogFile, local: StoredVariant[]) {
  const all = [...catalog.products.flatMap((p) => p.variants.map((v) => v.id)), ...local.map((v) => v.id)];
  return (all.length ? Math.max(...all) : 0) + 1;
}

/**
 * Formulário de um perfume: identidade, ficha olfativa, fotos (envio para o
 * Vercel Blob) e volumes com preço e estoque. "Salvar" só guarda no rascunho;
 * vai para a loja quando você clicar em "Publicar" na barra de baixo.
 */
export function ProductEditor({ product, catalog, storage, isNew, onSave, onCancel, onDelete }: ProductEditorProps) {
  const [p, setP] = useState<StoredProduct>(product);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<"cover" | "hover" | "gallery">("cover");

  const set = <K extends keyof StoredProduct>(key: K, value: StoredProduct[K]) => setP((prev) => ({ ...prev, [key]: value }));
  const setVariant = (index: number, patch: Partial<StoredVariant>) =>
    setP((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) }));

  function addVariant() {
    setP((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: nextVariantId(catalog, prev.variants),
          sku: `dh-${prev.slug || "novo"}-${prev.variants.length + 1}`.slice(0, 60),
          volumeMl: null,
          label: null,
          price: 0,
          compareAtPrice: null,
          stock: 0,
          isActive: true,
          weightGrams: null,
        },
      ],
    }));
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(uploadTarget.current);
    try {
      const url = await uploadProductImage(file, p.slug, storage);
      if (uploadTarget.current === "cover") set("coverImage", url);
      else if (uploadTarget.current === "hover") set("hoverImage", url);
      else set("images", [...p.images, url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio da foto.");
    } finally {
      setUploading(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function pick(target: "cover" | "hover" | "gallery") {
    uploadTarget.current = target;
    fileRef.current?.click();
  }

  function handleSave() {
    setError(null);
    const title = p.title.trim();
    if (!title) return setError("Dê um nome ao perfume.");
    const slug = slugify(p.slug || title);
    if (!slug) return setError("Endereço (slug) inválido.");
    if (catalog.products.some((other) => other.id !== p.id && other.slug === slug)) {
      return setError("Já existe outro perfume com esse endereço. Ajuste o slug.");
    }
    if (p.variants.length === 0) return setError("Cadastre pelo menos um volume com preço.");
    if (p.variants.some((v) => v.isActive && !(v.price > 0))) return setError("Todo volume ativo precisa de preço.");
    onSave({ ...p, title, slug });
  }

  const visible = p.variants.some((v) => v.isActive);
  const photo = (url: string | null, label: string, target: "cover" | "hover") => (
    <div className="flex flex-col gap-2">
      <span className={labelText}>{label}</span>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-app border border-line bg-[#0b0b0c]">
        {url ? (
          <Image src={url} alt="" fill unoptimized sizes="200px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-muted">Sem foto</span>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => pick(target)} disabled={!!uploading} className="flex-1 rounded-full border border-line px-3 py-2 text-xs hover:border-accent hover:text-accent disabled:opacity-50">
          {uploading === target ? "Enviando…" : url ? "Trocar" : "Enviar"}
        </button>
        {url && (
          <button type="button" onClick={() => set(target === "cover" ? "coverImage" : "hoverImage", null)} className="rounded-full border border-line px-3 py-2 text-xs text-muted hover:border-danger hover:text-danger">
            Tirar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={onCancel} className="text-xs text-muted hover:text-foreground">
            ← Voltar para a lista
          </button>
          <h2 className="font-display mt-1 text-3xl">{isNew ? "Novo perfume" : p.title || "Sem nome"}</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-full border border-line px-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-foreground">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} className="min-h-11 rounded-full bg-foreground px-6 text-xs font-semibold uppercase tracking-[0.14em] text-background hover:bg-accent hover:text-accent-ink">
            Salvar no rascunho
          </button>
        </div>
      </div>
      {error && <p className="rounded-app border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Section title="Identificação">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" className="sm:col-span-2">
                <input
                  className={input}
                  value={p.title}
                  maxLength={200}
                  onChange={(e) => {
                    set("title", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Endereço (slug)" hint={`Aparece na URL: /shop/${p.category}/${p.slug || "…"}`} className="sm:col-span-2">
                <input
                  className={input}
                  value={p.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Categoria">
                <select className={input} value={p.category} onChange={(e) => set("category", e.target.value)}>
                  {catalog.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Marca">
                <select className={input} value={p.brandId ?? ""} onChange={(e) => set("brandId", e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Sem marca</option>
                  {[...catalog.brands].sort((a, b) => a.name.localeCompare(b.name)).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Gênero">
                <select className={input} value={p.gender ?? ""} onChange={(e) => set("gender", (e.target.value || null) as Gender | null)}>
                  <option value="">-</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="unissex">Unissex</option>
                </select>
              </Field>
              <Field label="Concentração">
                <select className={input} value={p.concentration ?? ""} onChange={(e) => set("concentration", e.target.value || null)}>
                  <option value="">-</option>
                  {CONCENTRATION_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {(
                [
                  ["isBestSeller", "Mais vendido (aparece na home)"],
                  ["isNew", "Selo NOVO"],
                  ["isTester", "Tester"],
                  ["isKit", "Kit"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={p[key]} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-[#c27b45]" />
                  {label}
                </label>
              ))}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={p.availability === "coming_soon"}
                  onChange={(e) => set("availability", e.target.checked ? "coming_soon" : "in_stock")}
                  className="h-4 w-4 accent-[#c27b45]"
                />
                Em breve
              </label>
            </div>
          </Section>

          <Section title="Volumes, preço e estoque">
            <div className="flex flex-col gap-3">
              {p.variants.map((v, index) => (
                <div key={v.id} className={`grid grid-cols-2 gap-3 rounded-app border border-line p-3 sm:grid-cols-6 ${v.isActive ? "" : "opacity-55"}`}>
                  <Field label="ml">
                    <input className={input} inputMode="numeric" value={v.volumeMl ?? ""} onChange={(e) => setVariant(index, { volumeMl: e.target.value ? Math.max(0, Number(e.target.value.replace(/\D/g, ""))) : null })} />
                  </Field>
                  <Field label="Rótulo">
                    <input className={input} placeholder={v.volumeMl ? `${v.volumeMl} ml` : "ex.: Kit"} value={v.label ?? ""} onChange={(e) => setVariant(index, { label: e.target.value || null })} />
                  </Field>
                  <Field label="Preço (R$)">
                    <input className={input} inputMode="decimal" value={v.price || ""} onChange={(e) => setVariant(index, { price: Number(e.target.value.replace(",", ".")) || 0 })} />
                  </Field>
                  <Field label="De (R$)">
                    <input className={input} inputMode="decimal" value={v.compareAtPrice ?? ""} onChange={(e) => setVariant(index, { compareAtPrice: e.target.value ? Number(e.target.value.replace(",", ".")) || null : null })} />
                  </Field>
                  <Field label="Estoque">
                    <input className={input} inputMode="numeric" value={v.stock} onChange={(e) => setVariant(index, { stock: Math.max(0, Math.floor(Number(e.target.value.replace(/\D/g, "")) || 0)) })} />
                  </Field>
                  <div className="flex flex-col justify-end gap-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={v.isActive} onChange={(e) => setVariant(index, { isActive: e.target.checked })} className="h-4 w-4 accent-[#c27b45]" />
                      Ativo
                    </label>
                    <span className="truncate text-[10px] text-muted" title={v.sku}>
                      {v.sku}
                    </span>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addVariant} className="self-start rounded-full border border-dashed border-line px-4 py-2 text-xs text-muted hover:border-accent hover:text-accent">
                + Adicionar volume
              </button>
              <p className="text-[11px] text-muted">
                Volumes não são apagados - desmarque &quot;Ativo&quot; para tirar da loja. {visible ? "" : "Sem volume ativo, o perfume fica oculto."}
              </p>
            </div>
          </Section>

          <Section title="Ficha olfativa e descrição">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Família olfativa">
                <input className={input} maxLength={60} value={p.olfactoryFamily ?? ""} onChange={(e) => set("olfactoryFamily", e.target.value || null)} />
              </Field>
              <Field label="Perfumista">
                <input className={input} maxLength={120} value={p.perfumer ?? ""} onChange={(e) => set("perfumer", e.target.value || null)} />
              </Field>
              <Field label="Notas de topo" hint="Separe por vírgula" className="sm:col-span-2">
                <input className={input} defaultValue={notesToText(p.notes.top)} onBlur={(e) => set("notes", { ...p.notes, top: textToNotes(e.target.value) })} />
              </Field>
              <Field label="Notas de coração" className="sm:col-span-2">
                <input className={input} defaultValue={notesToText(p.notes.heart)} onBlur={(e) => set("notes", { ...p.notes, heart: textToNotes(e.target.value) })} />
              </Field>
              <Field label="Notas de fundo" className="sm:col-span-2">
                <input className={input} defaultValue={notesToText(p.notes.base)} onBlur={(e) => set("notes", { ...p.notes, base: textToNotes(e.target.value) })} />
              </Field>
              <Field label="Ano de lançamento">
                <input className={input} inputMode="numeric" value={p.launchYear ?? ""} onChange={(e) => set("launchYear", e.target.value ? Number(e.target.value.replace(/\D/g, "").slice(0, 4)) : null)} />
              </Field>
              <Field label="Título para o Google">
                <input className={input} maxLength={160} value={p.metaTitle ?? ""} onChange={(e) => set("metaTitle", e.target.value || null)} />
              </Field>
              <Field label="Descrição" hint="Linha em branco separa parágrafos" className="sm:col-span-2">
                <textarea className={`${input} min-h-40`} value={p.description ?? ""} onChange={(e) => set("description", e.target.value || null)} />
              </Field>
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-5">
          <Section title="Fotos (4:5)">
            <div className="grid grid-cols-2 gap-3">
              {photo(p.coverImage, "Capa", "cover")}
              {photo(p.hoverImage, "Ao passar o mouse", "hover")}
            </div>
            <div className="mt-5">
              <span className={labelText}>Galeria</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {p.images.map((url, index) => (
                  <div key={url + index} className="group relative aspect-[4/5] overflow-hidden rounded-app border border-line">
                    <Image src={url} alt="" fill unoptimized sizes="120px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => set("images", p.images.filter((_, i) => i !== index))}
                      aria-label="Remover da galeria"
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#0b0b0c]/80 text-sm text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => pick("gallery")}
                  disabled={!!uploading}
                  className="flex aspect-[4/5] items-center justify-center rounded-app border border-dashed border-line text-xs text-muted hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {uploading === "gallery" ? "Enviando…" : "+ Foto"}
                </button>
              </div>
              <p className="mt-3 text-[11px] text-muted">
                As fotos são reduzidas para 1600 px (WebP) e vão para o {storage === "blob" ? "Vercel Blob" : storage === "local" ? "public/uploads (modo local)" : "armazenamento - não configurado"}.
              </p>
            </div>
          </Section>

          {!isNew && (
            <Section title="Zona de perigo">
              <p className="text-sm text-muted">Para tirar da loja sem apagar, desative todos os volumes.</p>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Excluir "${p.title}" do catálogo? Isso só vale depois de publicar.`)) onDelete(p.id);
                }}
                className="mt-3 rounded-full border border-danger/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-danger hover:bg-danger/10"
              >
                Excluir perfume
              </button>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
