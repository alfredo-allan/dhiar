import catalogJson from "@content/catalog.json";
import type { Brand, Product } from "@/types";
import {
  brandsWithCounts,
  filterProducts,
  hydrateProduct,
  isListed,
  type CatalogFile,
  type CategoryShowcase,
  type CommerceSettings,
  type ListProductsParams,
} from "./catalog";

export type { CategoryShowcase, CommerceSettings, ListProductsParams, ProductSort } from "./catalog";
export { defaultVariant } from "./catalog";

/**
 * Catálogo da loja lido de `content/catalog.json` (no próprio repositório).
 *
 * SÓ PARA O SERVIDOR (páginas e rotas): o JSON entra no build e cada
 * publicação do painel admin vira um commit no GitHub, que a Vercel
 * transforma num novo deploy. Componentes do navegador usam
 * `@/lib/clientCatalog`, que busca a versão enxuta em `/api/catalog`.
 *
 * As funções continuam `async` e com os mesmos nomes da época da API, para
 * as páginas não precisarem mudar.
 */

const catalog = catalogJson as unknown as CatalogFile;

let cache: { products: Product[]; bySlug: Map<string, Product> } | null = null;

function hydrated() {
  if (!cache) {
    const brandsById = new Map(catalog.brands.map((brand) => [brand.id, brand]));
    const products = catalog.products
      .filter(isListed)
      .map((product) => hydrateProduct(product, brandsById, catalog.settings));
    cache = { products, bySlug: new Map(products.map((product) => [product.slug, product])) };
  }
  return cache;
}

/** Todos os produtos visíveis, já com preço, Pix e parcelas calculados. */
export function allProducts(): Product[] {
  return hydrated().products;
}

export async function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
  return filterProducts(hydrated().products, params);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return hydrated().bySlug.get(slug);
}

export async function getBestSellers(): Promise<Product[]> {
  return listProducts({ isBestSeller: true });
}

export async function getNewArrivals(): Promise<Product[]> {
  return listProducts({ isNew: true });
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  return listProducts({ category: categorySlug });
}

/** Quantos perfumes a busca encontra (título, marca, família ou notas). */
export async function countProducts(q: string): Promise<number> {
  return filterProducts(hydrated().products, { q }).length;
}

/** Resumo por categoria para os atalhos da home: total, capas e "a partir de". */
export async function getCategoryShowcase(slugs: string[]): Promise<Record<string, CategoryShowcase>> {
  return Object.fromEntries(
    slugs.map((slug) => {
      const inCategory = filterProducts(hydrated().products, { category: slug, sort: "best_sellers" });
      const covers = inCategory
        .slice(0, 3)
        .map((product) => product.coverImage ?? product.imageUrl)
        .filter((url): url is string => Boolean(url));
      const prices = inCategory.map((product) => product.fromPrice ?? product.price).filter((price) => price > 0);
      return [
        slug,
        { slug, total: inCategory.length, covers, fromPrice: prices.length ? Math.min(...prices) : undefined },
      ];
    }),
  );
}

export async function listBrands(): Promise<Brand[]> {
  return brandsWithCounts(catalog);
}

export async function getCommerceSettings(): Promise<CommerceSettings> {
  return catalog.settings;
}

export interface CatalogFacets {
  volumes: Array<{ volumeMl: number; productCount: number }>;
  price: { min: number; max: number };
}

export async function getCatalogFacets(): Promise<CatalogFacets> {
  const counts = new Map<number, number>();
  const prices: number[] = [];
  for (const product of hydrated().products) {
    prices.push(product.fromPrice ?? product.price);
    const volumes = new Set((product.variants ?? []).map((v) => v.volumeMl).filter((v): v is number => v != null));
    volumes.forEach((volume) => counts.set(volume, (counts.get(volume) ?? 0) + 1));
  }
  return {
    volumes: [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([volumeMl, productCount]) => ({ volumeMl, productCount })),
    price: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
  };
}

export const CATALOG_CATEGORIES = catalog.categories;
