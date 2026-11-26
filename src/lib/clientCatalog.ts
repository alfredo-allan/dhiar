"use client";

import type { Product } from "@/types";

/**
 * Catálogo no navegador (busca, favoritos, sacola). Busca `/api/catalog`
 * uma vez por visita e guarda em memória.
 */
let cached: Promise<Product[]> | null = null;

function load(): Promise<Product[]> {
  cached ??= fetch("/api/catalog")
    .then((response) => {
      if (!response.ok) throw new Error(`Catálogo indisponível (${response.status})`);
      return response.json() as Promise<{ products: Product[] }>;
    })
    .then((data) => data.products)
    .catch((error) => {
      cached = null; // tenta de novo na próxima chamada
      throw error;
    });
  return cached;
}

/** Catálogo completo - usado pela busca para filtrar enquanto o visitante digita. */
export async function searchableCatalog(): Promise<Product[]> {
  return load();
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const all = await load();
  const byId = new Map(all.map((product) => [product.id, product]));
  return ids.map((id) => byId.get(id)).filter((product): product is Product => product !== undefined);
}
