"use client";

import { Plus, Trash2 } from "lucide-react";
import type { AdminBrand, AdminPerfumeFields, AdminVariantDraft } from "@/lib/adminProducts";

const inputClass =
  "w-full rounded-app border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400";

const CONCENTRATIONS = [
  ["", "—"],
  ["extrait", "Extrait de Parfum"],
  ["parfum", "Parfum"],
  ["edp", "Eau de Parfum"],
  ["edt", "Eau de Toilette"],
  ["edc", "Eau de Cologne"],
  ["body_splash", "Body Splash"],
  ["outro", "Outro"],
] as const;

/** Campos de perfume: marca, gênero, concentração, família, notas e SEO. */
export function PerfumeFieldsEditor({
  value,
  onChange,
  brands,
}: {
  value: AdminPerfumeFields;
  onChange: (next: AdminPerfumeFields) => void;
  brands: AdminBrand[];
}) {
  const set = <K extends keyof AdminPerfumeFields>(key: K, v: AdminPerfumeFields[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4 border-t border-neutral-200 pt-5 dark:border-neutral-800">
      <p className={labelClass}>Perfume</p>
      <div className="grid gap-4 md:grid-cols-3">
        <label>
          <span className={labelClass}>Marca</span>
          <select className={inputClass} value={value.brandId ?? ""} onChange={(e) => set("brandId", e.target.value ? Number(e.target.value) : null)}>
            <option value="">Sem marca</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Gênero</span>
          <select className={inputClass} value={value.gender ?? ""} onChange={(e) => set("gender", (e.target.value || null) as AdminPerfumeFields["gender"])}>
            <option value="">—</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="unissex">Unissex</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>Concentração</span>
          <select className={inputClass} value={value.concentration ?? ""} onChange={(e) => set("concentration", e.target.value || null)}>
            {CONCENTRATIONS.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Família olfativa</span>
          <input className={inputClass} value={value.olfactoryFamily ?? ""} onChange={(e) => set("olfactoryFamily", e.target.value || null)} placeholder="Amadeirado, Floral..." />
        </label>
        <label>
          <span className={labelClass}>Perfumista</span>
          <input className={inputClass} value={value.perfumer ?? ""} onChange={(e) => set("perfumer", e.target.value || null)} />
        </label>
        <label>
          <span className={labelClass}>Ano de lançamento</span>
          <input className={inputClass} inputMode="numeric" value={value.launchYear ?? ""} onChange={(e) => set("launchYear", e.target.value ? Number(e.target.value) : null)} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(["topNotes", "heartNotes", "baseNotes"] as const).map((key) => (
          <label key={key}>
            <span className={labelClass}>
              {key === "topNotes" ? "Notas de saída" : key === "heartNotes" ? "Notas de coração" : "Notas de fundo"}
            </span>
            <input
              className={inputClass}
              value={value[key].join(", ")}
              onChange={(e) => set(key, e.target.value.split(",").map((note) => note.trimStart()))}
              placeholder="Separadas por vírgula"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-6 text-sm text-neutral-700 dark:text-neutral-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={value.isTester} onChange={(e) => set("isTester", e.target.checked)} /> Tester
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={value.isKit} onChange={(e) => set("isKit", e.target.checked)} /> Kit
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>Título para o Google (opcional)</span>
          <input className={inputClass} maxLength={160} value={value.metaTitle ?? ""} onChange={(e) => set("metaTitle", e.target.value || null)} />
        </label>
        <label>
          <span className={labelClass}>Descrição para o Google (opcional)</span>
          <input className={inputClass} maxLength={320} value={value.metaDescription ?? ""} onChange={(e) => set("metaDescription", e.target.value || null)} />
        </label>
      </div>
    </div>
  );
}

let variantKeySeq = 1;

export function newVariantDraft(productSlug: string): AdminVariantDraft {
  return {
    _key: variantKeySeq++,
    id: null,
    sku: productSlug ? `${productSlug}-` : "",
    volumeMl: "",
    label: "",
    price: "",
    compareAtPrice: "",
    stock: "0",
    weightGrams: "400",
    isActive: true,
  };
}

export function draftFromVariant(variant: {
  id: number;
  sku: string;
  volumeMl: number | null;
  label: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  weightGrams?: number;
  isActive?: boolean;
}): AdminVariantDraft {
  return {
    _key: variantKeySeq++,
    id: variant.id,
    sku: variant.sku,
    volumeMl: variant.volumeMl ? String(variant.volumeMl) : "",
    label: variant.volumeMl ? "" : variant.label,
    price: String(variant.price),
    compareAtPrice: variant.compareAtPrice ? String(variant.compareAtPrice) : "",
    stock: String(variant.stock),
    weightGrams: String(variant.weightGrams ?? 400),
    isActive: variant.isActive ?? true,
  };
}

/**
 * Volumes vendáveis do perfume. Cada linha tem SKU, ml, preço, preço "de",
 * estoque e peso (o peso vai pra cotação da Melhor Envio). Remover uma linha
 * DESATIVA o volume no servidor - pedidos antigos continuam apontando pra ele.
 */
export function VariantsEditor({
  variants,
  onChange,
  productSlug,
}: {
  variants: AdminVariantDraft[];
  onChange: (next: AdminVariantDraft[]) => void;
  productSlug: string;
}) {
  const update = (key: number, patch: Partial<AdminVariantDraft>) =>
    onChange(variants.map((variant) => (variant._key === key ? { ...variant, ...patch } : variant)));

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-5 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <p className={labelClass}>Volumes, preços e estoque</p>
        <button
          type="button"
          onClick={() => onChange([...variants, newVariantDraft(productSlug)])}
          className="inline-flex items-center gap-1 rounded-app border border-neutral-300 px-3 py-1.5 text-xs font-semibold dark:border-neutral-700"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar volume
        </button>
      </div>

      {variants.length === 0 && (
        <p className="text-xs text-neutral-500">
          Nenhum volume ainda. Perfumes precisam de pelo menos um (ex.: 100 ml) - é ele que vai pro carrinho.
        </p>
      )}

      <div className="space-y-3">
        {variants.map((variant) => (
          <div key={variant._key} className="grid grid-cols-2 gap-2 rounded-app border border-neutral-200 p-3 dark:border-neutral-800 md:grid-cols-[1.6fr_0.7fr_0.9fr_0.9fr_0.9fr_0.7fr_0.8fr_auto] md:items-end">
            <label className="col-span-2 md:col-span-1">
              <span className={labelClass}>SKU</span>
              <input className={inputClass} value={variant.sku} onChange={(e) => update(variant._key, { sku: e.target.value })} />
            </label>
            <label>
              <span className={labelClass}>ml</span>
              <input className={inputClass} inputMode="numeric" value={variant.volumeMl} onChange={(e) => update(variant._key, { volumeMl: e.target.value })} placeholder="100" />
            </label>
            <label>
              <span className={labelClass}>Rótulo</span>
              <input className={inputClass} value={variant.label} onChange={(e) => update(variant._key, { label: e.target.value })} placeholder="(se não for ml)" />
            </label>
            <label>
              <span className={labelClass}>Preço R$</span>
              <input className={inputClass} inputMode="decimal" value={variant.price} onChange={(e) => update(variant._key, { price: e.target.value })} />
            </label>
            <label>
              <span className={labelClass}>Preço &quot;de&quot;</span>
              <input className={inputClass} inputMode="decimal" value={variant.compareAtPrice} onChange={(e) => update(variant._key, { compareAtPrice: e.target.value })} placeholder="opcional" />
            </label>
            <label>
              <span className={labelClass}>Estoque</span>
              <input className={inputClass} inputMode="numeric" value={variant.stock} onChange={(e) => update(variant._key, { stock: e.target.value })} />
            </label>
            <label>
              <span className={labelClass}>Peso (g)</span>
              <input className={inputClass} inputMode="numeric" value={variant.weightGrams} onChange={(e) => update(variant._key, { weightGrams: e.target.value })} />
            </label>
            <button
              type="button"
              onClick={() => onChange(variants.filter((item) => item._key !== variant._key))}
              aria-label="Remover volume"
              className="flex h-10 w-10 items-center justify-center self-end rounded-app border border-neutral-300 text-neutral-600 hover:text-red-600 dark:border-neutral-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
