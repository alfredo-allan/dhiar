import { STORE } from "@/lib/store";
import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/data/categories";
import { getCommerceSettings, listProducts, type ProductSort } from "@/lib/products";
import { ALL_PRODUCTS_CATEGORY_ID } from "@/data/categories";

const UNISEX_CATEGORY_ID = "perfume-unissex";
import { PerfumeListing } from "@/components/category/PerfumeListing";

interface CategoryPageParams {
  category: string;
}

// Sem `generateStaticParams()` - o catálogo real (`@/lib/products`) muda
// conforme o painel admin cadastra/edita produtos, então cada categoria é
// renderizada sob demanda (Server Component assíncrono abaixo) em vez de
// pré-gerada no build com uma lista de slugs fixa. `getProductsByCategory`
// revalida a cada 60s, então um ajuste no admin ainda aparece rápido sem
// precisar de um novo deploy.
export async function generateMetadata({
  params,
}: {
  params: Promise<CategoryPageParams>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return { title: pageTitle("Categoria não encontrada") };
  }

  return {
    title: pageTitle(category.label),
    description: `${category.label} originais com entrega para todo o Brasil - ${STORE.name}.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<CategoryPageParams>;
  searchParams: Promise<{ sort?: string; marca?: string; q?: string }>;
}) {
  const { category: slug } = await params;
  const { sort, marca, q } = await searchParams;
  const search = q?.trim().slice(0, 80) || undefined;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [products, commerce] = await Promise.all([
    listProducts(
      category.id === UNISEX_CATEGORY_ID
        ? // "Unissex" é um estilo, não uma prateleira: junta os compartilháveis de todas as categorias
          { genders: ["unissex"], q: search, revalidate: 60 }
        : {
            category: category.id === ALL_PRODUCTS_CATEGORY_ID ? undefined : category.id,
            q: search,
            revalidate: 60,
          },
    ),
    getCommerceSettings().catch(() => null),
  ]);

  return (
    <PerfumeListing
      category={category}
      products={products}
      freeShippingThreshold={commerce?.freeShippingThreshold ?? 0}
      initialSort={(sort as ProductSort) ?? "best_sellers"}
      initialBrands={marca ? marca.split(",") : []}
      searchTerm={search}
    />
  );
}
