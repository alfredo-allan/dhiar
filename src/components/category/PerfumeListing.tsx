"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category, Gender, Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { genderLabel } from "@/lib/format";
import { gsap, ScrollTrigger, useGSAP, MOTION_QUERIES } from "@/lib/motion";
import type { ProductSort } from "@/lib/products";

interface PerfumeListingProps {
  category: Category;
  products: Product[];
  freeShippingThreshold?: number;
  initialSort?: ProductSort;
  /** Slugs de marca vindos da URL (`?marca=lattafa,armaf`). */
  initialBrands?: string[];
}

const PRICE_RANGES = [
  { id: "ate-150", label: "Até R$ 150", min: 0, max: 150 },
  { id: "150-300", label: "R$ 150 a R$ 300", min: 150, max: 300 },
  { id: "300-600", label: "R$ 300 a R$ 600", min: 300, max: 600 },
  { id: "600+", label: "Acima de R$ 600", min: 600, max: Infinity },
];

const SORTS: Array<{ id: ProductSort; label: string }> = [
  { id: "best_sellers", label: "Mais vendidos" },
  { id: "newest", label: "Novidades" },
  { id: "price_asc", label: "Menor preço" },
  { id: "price_desc", label: "Maior preço" },
  { id: "name_asc", label: "A–Z" },
];

const PAGE_SIZE = 24;

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/**
 * Catálogo com filtros laterais (desktop) ou gaveta inferior (celular/tablet).
 * Filtra no cliente sobre a lista já carregada - suficiente pras primeiras
 * centenas de produtos; quando o catálogo crescer, os mesmos filtros já
 * existem na API (`GET /products?brand=&volumeMl=&minPrice=...`).
 */
export function PerfumeListing({
  category,
  products,
  freeShippingThreshold = 0,
  initialSort = "best_sellers",
  initialBrands = [],
}: PerfumeListingProps) {
  const [brands, setBrands] = useState<Set<string>>(() => new Set(initialBrands));
  const [genders, setGenders] = useState<Set<Gender>>(new Set());
  const [volumes, setVolumes] = useState<Set<number>>(new Set());
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [sort, setSort] = useState<ProductSort>(initialSort);
  // "Mostrar mais" volta pro início sempre que um filtro muda - derivado
  // da chave dos filtros, sem efeito.
  const filtersKey = [...brands, "|", ...genders, "|", ...volumes, "|", priceRange, onlyDiscount, sort].join(",");
  const [paging, setPaging] = useState({ key: filtersKey, visible: PAGE_SIZE });
  const visible = paging.key === filtersKey ? paging.visible : PAGE_SIZE;
  const setVisible = (update: (value: number) => number) =>
    setPaging({ key: filtersKey, visible: update(visible) });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    const brandCounts = new Map<string, { name: string; count: number }>();
    const volumeCounts = new Map<number, number>();
    const genderCounts = new Map<Gender, number>();
    for (const product of products) {
      if (product.brand) {
        const entry = brandCounts.get(product.brand.slug) ?? { name: product.brand.name, count: 0 };
        brandCounts.set(product.brand.slug, { ...entry, count: entry.count + 1 });
      }
      if (product.gender) genderCounts.set(product.gender, (genderCounts.get(product.gender) ?? 0) + 1);
      const seen = new Set<number>();
      for (const variant of product.variants ?? []) {
        if (variant.volumeMl && !seen.has(variant.volumeMl)) {
          seen.add(variant.volumeMl);
          volumeCounts.set(variant.volumeMl, (volumeCounts.get(variant.volumeMl) ?? 0) + 1);
        }
      }
    }
    return {
      brands: [...brandCounts.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name)),
      volumes: [...volumeCounts.entries()].sort((a, b) => a[0] - b[0]),
      genders: [...genderCounts.entries()],
    };
  }, [products]);

  const filtered = useMemo(() => {
    const range = PRICE_RANGES.find((item) => item.id === priceRange);
    const list = products.filter((product) => {
      const price = product.fromPrice ?? product.price;
      if (brands.size && !(product.brand && brands.has(product.brand.slug))) return false;
      if (genders.size && !(product.gender && genders.has(product.gender))) return false;
      if (volumes.size && !(product.variants ?? []).some((v) => v.volumeMl && volumes.has(v.volumeMl))) return false;
      if (range && (price < range.min || price > range.max)) return false;
      if (onlyDiscount && !(product.variants ?? []).some((v) => v.discountPercent > 0)) return false;
      return true;
    });
    const priceOf = (product: Product) => product.fromPrice ?? product.price;
    switch (sort) {
      case "price_asc":
        return list.sort((a, b) => priceOf(a) - priceOf(b));
      case "price_desc":
        return list.sort((a, b) => priceOf(b) - priceOf(a));
      case "name_asc":
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case "best_sellers":
        return list.sort((a, b) => Number(b.isBestSeller ?? false) - Number(a.isBestSeller ?? false));
      case "newest":
        return list.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
      default:
        return list;
    }
  }, [products, brands, genders, volumes, priceRange, onlyDiscount, sort]);

  const activeCount = brands.size + genders.size + volumes.size + (priceRange ? 1 : 0) + (onlyDiscount ? 1 : 0);

  function clearAll() {
    setBrands(new Set());
    setGenders(new Set());
    setVolumes(new Set());
    setPriceRange(null);
    setOnlyDiscount(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [drawerOpen]);

  // Cards entram em lotes conforme o scroll (ScrollTrigger.batch); com
  // movimento reduzido, aparecem direto.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_QUERIES.small}, ${MOTION_QUERIES.medium}, ${MOTION_QUERIES.large}`, () => {
        gsap.set("[data-reveal]", { opacity: 0, y: 28 });
        ScrollTrigger.batch("[data-reveal]", {
          start: "top 92%",
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.06, duration: 0.6, ease: "power3.out", overwrite: true }),
        });
      });
      mm.add(MOTION_QUERIES.reduce, () => {
        gsap.set("[data-reveal]", { opacity: 1, y: 0 });
      });
    },
    { scope: gridRef, dependencies: [filtered, visible], revertOnUpdate: true },
  );

  const filters = (
    <div className="flex flex-col gap-7 text-sm">
      {options.genders.length > 0 && (
        <FilterGroup title="Gênero">
          {options.genders.map(([gender, count]) => (
            <Check key={gender} checked={genders.has(gender)} onChange={() => setGenders((s) => toggle(s, gender))} label={genderLabel(gender)} count={count} />
          ))}
        </FilterGroup>
      )}
      {options.volumes.length > 0 && (
        <FilterGroup title="Volume">
          <div className="flex flex-wrap gap-2">
            {options.volumes.map(([ml]) => (
              <button
                key={ml}
                type="button"
                aria-pressed={volumes.has(ml)}
                onClick={() => setVolumes((s) => toggle(s, ml))}
                className={`min-h-9 rounded-full border px-3 text-xs ${volumes.has(ml) ? "border-foreground bg-foreground text-background" : "border-line hover:border-foreground"}`}
              >
                {ml} ml
              </button>
            ))}
          </div>
        </FilterGroup>
      )}
      <FilterGroup title="Preço">
        {PRICE_RANGES.map((range) => (
          <label key={range.id} className="flex min-h-9 cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="price"
              checked={priceRange === range.id}
              onChange={() => setPriceRange(range.id)}
              onClick={() => priceRange === range.id && setPriceRange(null)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {range.label}
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title="Ofertas">
        <Check checked={onlyDiscount} onChange={() => setOnlyDiscount((v) => !v)} label="Só com desconto" />
      </FilterGroup>
      {options.brands.length > 0 && (
        <FilterGroup title="Marca">
          <div className="max-h-72 space-y-1 overflow-y-auto pr-2">
            {options.brands.map(([slug, { name, count }]) => (
              <Check key={slug} checked={brands.has(slug)} onChange={() => setBrands((s) => toggle(s, slug))} label={name} count={count} />
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Coleção</p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">{category.label}</h1>
        <p className="mt-2 text-sm text-muted">{filtered.length} {filtered.length === 1 ? "perfume" : "perfumes"}</p>
      </header>

      <div className="mb-6 flex items-center justify-between gap-3 border-y border-line py-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtrar{activeCount > 0 && ` (${activeCount})`}
        </button>
        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="hidden text-sm text-muted underline underline-offset-4 hover:text-foreground lg:inline">
            Limpar filtros ({activeCount})
          </button>
        )}
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">Ordenar por</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as ProductSort)}
            className="min-h-11 rounded-full border border-line bg-surface px-4 text-sm"
          >
            {SORTS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-24">{filters}</div>
        </aside>

        <div ref={gridRef}>
          {filtered.length === 0 ? (
            <div className="rounded-app border border-dashed border-line p-10 text-center">
              <p className="font-display text-2xl">Nenhum perfume com esses filtros.</p>
              <button type="button" onClick={clearAll} className="mt-4 min-h-11 rounded-full bg-foreground px-6 text-sm font-semibold text-background">
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                {filtered.slice(0, visible).map((product, index) => (
                  <ProductCard key={product.id} product={product} freeShippingThreshold={freeShippingThreshold} priority={index < 4} />
                ))}
              </div>
              {visible < filtered.length && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisible((value) => value + PAGE_SIZE)}
                    className="min-h-12 rounded-full border border-foreground px-8 text-sm font-semibold hover:bg-foreground hover:text-background"
                  >
                    Mostrar mais perfumes
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <button type="button" aria-label="Fechar filtros" onClick={() => setDrawerOpen(false)} className="animate-fade-in absolute inset-0 bg-black/50" />
          <div className="animate-slide-up absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-surface sm:inset-x-auto sm:right-0 sm:top-0 sm:max-h-none sm:w-96 sm:rounded-none">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="font-display text-2xl">Filtrar</p>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Fechar" className="tap-target flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{filters}</div>
            <div className="grid grid-cols-2 gap-3 border-t border-line p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              <button type="button" onClick={clearAll} className="min-h-12 rounded-full border border-line text-sm font-medium">
                Limpar
              </button>
              <button type="button" onClick={() => setDrawerOpen(false)} className="min-h-12 rounded-full bg-foreground text-sm font-semibold text-background">
                Ver {filtered.length}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function Check({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-3">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-[var(--accent)]" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-muted">{count}</span>}
    </label>
  );
}
