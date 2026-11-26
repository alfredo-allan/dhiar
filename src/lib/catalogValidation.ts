import type { CatalogFile } from "./catalog";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_OK = (url: string) => url.startsWith("https://") || url.startsWith("/");

/**
 * Confere o catálogo antes de publicar: um JSON quebrado derrubaria o build
 * da loja inteira, então qualquer problema volta como mensagem clara.
 */
export function validateCatalog(input: unknown): { ok: true; catalog: CatalogFile } | { ok: false; error: string } {
  const catalog = input as CatalogFile;
  if (!catalog || typeof catalog !== "object" || !Array.isArray(catalog.products) || !Array.isArray(catalog.brands)) {
    return { ok: false, error: "Formato de catálogo inválido." };
  }
  const s = catalog.settings;
  if (!s || [s.pixDiscountPercent, s.maxInstallments, s.minInstallmentValue, s.freeShippingThreshold].some((n) => typeof n !== "number" || n < 0)) {
    return { ok: false, error: "Configurações de preço inválidas." };
  }
  if (s.pixDiscountPercent > 50 || s.maxInstallments < 1 || s.maxInstallments > 24) {
    return { ok: false, error: "Desconto Pix até 50% e parcelas entre 1 e 24." };
  }
  const categoryIds = new Set((catalog.categories ?? []).map((c) => c.id));
  const brandIds = new Set(catalog.brands.map((b) => b.id));
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const skus = new Set<string>();

  for (const brand of catalog.brands) {
    if (!brand.name?.trim() || !SLUG.test(brand.slug ?? "")) return { ok: false, error: `Marca inválida: ${brand.name || brand.slug}` };
  }
  for (const p of catalog.products) {
    const label = p.title || p.id;
    if (!p.id || ids.has(p.id)) return { ok: false, error: `Produto com id repetido ou vazio: ${label}` };
    ids.add(p.id);
    if (!SLUG.test(p.slug ?? "") || p.slug.length > 140) return { ok: false, error: `Endereço (slug) inválido em "${label}". Use só letras minúsculas, números e hífens.` };
    if (slugs.has(p.slug)) return { ok: false, error: `Dois produtos com o mesmo endereço: ${p.slug}` };
    slugs.add(p.slug);
    if (!p.title?.trim() || p.title.length > 200) return { ok: false, error: `Nome vazio ou longo demais: ${label}` };
    if (!categoryIds.has(p.category)) return { ok: false, error: `Categoria desconhecida em "${label}".` };
    if (p.brandId != null && !brandIds.has(p.brandId)) return { ok: false, error: `Marca desconhecida em "${label}".` };
    for (const url of [p.coverImage, p.hoverImage, ...(p.images ?? [])]) {
      if (url && !URL_OK(url)) return { ok: false, error: `Foto com endereço inválido em "${label}".` };
    }
    if (!Array.isArray(p.variants) || p.variants.length === 0) return { ok: false, error: `"${label}" precisa de pelo menos um volume.` };
    for (const v of p.variants) {
      if (!v.sku?.trim() || skus.has(v.sku)) return { ok: false, error: `SKU vazio ou repetido em "${label}".` };
      skus.add(v.sku);
      if (!(v.price > 0)) return { ok: false, error: `Preço inválido em "${label}" (${v.label || v.volumeMl || v.sku}).` };
      if (v.compareAtPrice != null && v.compareAtPrice < 0) return { ok: false, error: `Preço "de" inválido em "${label}".` };
      if (!Number.isInteger(v.stock) || v.stock < 0) return { ok: false, error: `Estoque inválido em "${label}".` };
    }
  }
  return { ok: true, catalog };
}
