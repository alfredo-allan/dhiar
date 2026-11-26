import type { Brand, Gender, OlfactoryNotes, PriceBreakdown, Product, ProductVariant } from "@/types";

/**
 * Catálogo da DHIAR guardado no próprio repositório (`content/catalog.json`).
 *
 * Este arquivo é só lógica (sem ler o JSON), então serve tanto para a loja
 * (Server Components) quanto para o painel admin no navegador:
 * - `StoredProduct` é o formato gravado (o que o admin edita e publica);
 * - `hydrateProduct` monta o `Product` que os componentes usam, calculando
 *   preço "a partir de", desconto, Pix e parcelas com as mesmas regras que
 *   a API usava (`app/pricing.py`).
 */

export interface CommerceSettings {
  pixDiscountPercent: number;
  maxInstallments: number;
  minInstallmentValue: number;
  freeShippingThreshold: number;
}

export interface StoredVariant {
  id: number;
  sku: string;
  volumeMl: number | null;
  label: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  weightGrams?: number | null;
}

export interface StoredProduct {
  id: string;
  slug: string;
  title: string;
  category: string;
  brandId: number | null;
  gender: Gender | null;
  concentration: string | null;
  isTester: boolean;
  isKit: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  availability: "in_stock" | "coming_soon";
  description: string | null;
  olfactoryFamily: string | null;
  notes: OlfactoryNotes;
  perfumer: string | null;
  launchYear: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  coverImage: string | null;
  hoverImage: string | null;
  images: string[];
  createdAt: string | null;
  variants: StoredVariant[];
}

export interface StoredBrand {
  id: number;
  slug: string;
  name: string;
  country: string | null;
  description: string | null;
  isFeatured: boolean;
}

export interface StoredCategory {
  id: string;
  label: string;
}

export interface CatalogFile {
  version: 1;
  updatedAt: string;
  settings: CommerceSettings;
  categories: StoredCategory[];
  brands: StoredBrand[];
  products: StoredProduct[];
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc" | "best_sellers";

export interface CategoryShowcase {
  slug: string;
  total: number;
  /** Fotos dos produtos mais vendidos da categoria (até 3), para ilustrar o atalho. */
  covers: string[];
  /** Menor preço da categoria (para o "a partir de"). */
  fromPrice?: number;
}

// ---------------------------------------------------------------------------
// Preço (mesmas regras de app/pricing.py)
// ---------------------------------------------------------------------------

const round2 = (value: number) => Math.round(value * 100) / 100;

export function priceBreakdown(amount: number, settings: CommerceSettings): PriceBreakdown {
  const minValue = settings.minInstallmentValue;
  const count = Math.max(
    1,
    Math.min(settings.maxInstallments, minValue > 0 ? Math.floor(amount / minValue) : settings.maxInstallments),
  );
  return {
    pixPrice: round2(amount * (1 - settings.pixDiscountPercent / 100)),
    pixDiscountPercent: settings.pixDiscountPercent,
    installments: { count, value: round2(amount / count) },
  };
}

function discountPercent(price: number, compareAt: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

// ---------------------------------------------------------------------------
// Stored -> Product
// ---------------------------------------------------------------------------

export function variantLabel(variant: StoredVariant): string {
  if (variant.label) return variant.label;
  return variant.volumeMl ? `${variant.volumeMl} ml` : variant.sku;
}

export function hydrateProduct(
  stored: StoredProduct,
  brandsById: Map<number, StoredBrand>,
  settings: CommerceSettings,
): Product {
  const active = stored.variants.filter((variant) => variant.isActive);
  const variants: ProductVariant[] = active.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    volumeMl: variant.volumeMl,
    label: variantLabel(variant),
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    discountPercent: discountPercent(variant.price, variant.compareAtPrice),
    stock: variant.stock,
    inStock: variant.stock > 0,
    isActive: true,
    weightGrams: variant.weightGrams ?? undefined,
    pricing: priceBreakdown(variant.price, settings),
  }));

  const inStockPool = variants.filter((variant) => variant.stock > 0);
  const pool = inStockPool.length > 0 ? inStockPool : variants;
  const defaultVariant = pool.reduce<ProductVariant | undefined>(
    (best, variant) => (!best || variant.price < best.price ? variant : best),
    undefined,
  );
  const fromPrice = variants.length ? Math.min(...variants.map((variant) => variant.price)) : 0;
  const stock = variants.reduce((total, variant) => total + variant.stock, 0);
  const brand = stored.brandId != null ? brandsById.get(stored.brandId) : undefined;
  const cover = stored.coverImage ?? stored.images[0] ?? "";

  return {
    id: stored.id,
    slug: stored.slug,
    title: stored.title,
    price: defaultVariant?.price ?? fromPrice,
    compareAtPrice: defaultVariant?.compareAtPrice ?? undefined,
    currency: "BRL",
    category: stored.category,
    rating: 0,
    reviewCount: 0,
    isNew: stored.isNew,
    isBestSeller: stored.isBestSeller,
    availability: stored.availability,
    stock,
    imageUrl: cover,
    coverImage: cover || undefined,
    hoverImageUrl: stored.hoverImage ?? stored.images[1] ?? undefined,
    specimenImages: stored.images.length > 0 ? stored.images : undefined,
    colors: [],
    brand: brand
      ? {
          id: brand.id,
          slug: brand.slug,
          name: brand.name,
          country: brand.country,
          description: brand.description,
          isFeatured: brand.isFeatured,
        }
      : null,
    gender: stored.gender,
    concentration: stored.concentration,
    isTester: stored.isTester,
    isKit: stored.isKit,
    fromPrice,
    variants,
    defaultVariantId: defaultVariant?.id ?? null,
    inStock: stock > 0,
    olfactoryFamily: stored.olfactoryFamily,
    notes: stored.notes,
    description: stored.description ?? undefined,
    perfumer: stored.perfumer,
    launchYear: stored.launchYear,
    metaTitle: stored.metaTitle,
    metaDescription: stored.metaDescription,
  };
}

/** Variante que o card/PDP mostram por padrão (mais barata com estoque). */
export function defaultVariant(product: Product): ProductVariant | undefined {
  const variants = product.variants ?? [];
  return variants.find((variant) => variant.id === product.defaultVariantId) ?? variants[0];
}

// ---------------------------------------------------------------------------
// Filtro e ordenação (mesma semântica de GET /products)
// ---------------------------------------------------------------------------

export interface ListProductsParams {
  category?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  brands?: string[];
  genders?: Gender[];
  volumesMl?: number[];
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort?: ProductSort;
  perPage?: number;
  /** Mantido por compatibilidade (era o cache da API); não faz nada aqui. */
  revalidate?: number | false;
  includeStock?: boolean;
}

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Busca por nome, marca, família olfativa ou notas, sem diferenciar acento. */
export function matchesSearch(product: Product, q: string): boolean {
  const term = normalize(q.trim());
  if (!term) return true;
  const haystack = [
    product.title,
    product.brand?.name ?? "",
    product.olfactoryFamily ?? "",
    ...(product.notes?.top ?? []),
    ...(product.notes?.heart ?? []),
    ...(product.notes?.base ?? []),
  ].join(" | ");
  return normalize(haystack).includes(term);
}

export function filterProducts(products: Product[], params: ListProductsParams): Product[] {
  const brandSet = params.brands?.length ? new Set(params.brands) : null;
  const genderSet = params.genders?.length ? new Set(params.genders) : null;
  const volumeSet = params.volumesMl?.length ? new Set(params.volumesMl) : null;

  const filtered = products.filter((product) => {
    if (params.category && product.category !== params.category) return false;
    if (params.isNew && !product.isNew) return false;
    if (params.isBestSeller && !product.isBestSeller) return false;
    if (brandSet && !(product.brand && brandSet.has(product.brand.slug))) return false;
    if (genderSet && !(product.gender && genderSet.has(product.gender))) return false;
    if (volumeSet && !(product.variants ?? []).some((v) => v.volumeMl != null && volumeSet.has(v.volumeMl))) {
      return false;
    }
    const price = product.fromPrice ?? product.price;
    if (params.minPrice !== undefined && price < params.minPrice) return false;
    if (params.maxPrice !== undefined && price > params.maxPrice) return false;
    if (params.q && !matchesSearch(product, params.q)) return false;
    return true;
  });

  const created = (product: Product) => product.id; // ordem do arquivo = mais novo primeiro
  const order = new Map(products.map((product, index) => [created(product), index]));
  const byNewest = (a: Product, b: Product) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
  const price = (product: Product) => product.fromPrice ?? product.price;

  const sorters: Record<ProductSort, (a: Product, b: Product) => number> = {
    newest: byNewest,
    price_asc: (a, b) => price(a) - price(b) || byNewest(a, b),
    price_desc: (a, b) => price(b) - price(a) || byNewest(a, b),
    name_asc: (a, b) => a.title.localeCompare(b.title, "pt-BR") || byNewest(a, b),
    best_sellers: (a, b) => Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller)) || byNewest(a, b),
  };
  const sorted = [...filtered].sort(sorters[params.sort ?? "newest"]);
  return params.perPage ? sorted.slice(0, params.perPage) : sorted;
}

/** Marcas com a contagem de produtos visíveis (para filtros e o trilho de marcas). */
export function brandsWithCounts(catalog: CatalogFile): Brand[] {
  const counts = new Map<number, number>();
  for (const product of catalog.products) {
    if (product.brandId != null && product.variants.some((v) => v.isActive)) {
      counts.set(product.brandId, (counts.get(product.brandId) ?? 0) + 1);
    }
  }
  return catalog.brands.map((brand) => ({
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    country: brand.country,
    description: brand.description,
    isFeatured: brand.isFeatured,
    productCount: counts.get(brand.id) ?? 0,
  }));
}

/** Produto aparece na loja se tiver ao menos uma variante ativa. */
export function isListed(product: StoredProduct): boolean {
  return product.variants.some((variant) => variant.isActive);
}
