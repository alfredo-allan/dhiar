import { STORE } from "@/lib/store";
import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/data/categories";
import { getProductBySlug, listProducts } from "@/lib/products";
import { PerfumeDetail } from "@/components/product/PerfumeDetail";
import { ALL_PRODUCTS_CATEGORY_ID } from "@/data/categories";

interface ProductPageParams {
  category: string;
  product: string;
}

// Sem `generateStaticParams()` - mesma razão de `/shop/[category]`: o
// catálogo agora vem do backend real (`@/lib/products`), então uma lista de
// slugs fixa no build ficaria desatualizada assim que um produto novo fosse
// cadastrado no painel admin. Cada produto é buscado sob demanda abaixo.
export async function generateMetadata({
  params,
}: {
  params: Promise<ProductPageParams>;
}): Promise<Metadata> {
  const { product: slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: pageTitle("Produto não encontrado") };
  }

  const brand = product.brand?.name ? `${product.brand.name} ` : "";
  return {
    title: product.metaTitle ?? pageTitle(`${brand}${product.title}`),
    description:
      product.metaDescription ??
      product.description?.split("\n\n")[0] ??
      `${brand}${product.title} original na ${STORE.name}.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<ProductPageParams>;
}) {
  const { category: categorySlug, product: productSlug } = await params;

  const category = getCategoryBySlug(categorySlug);
  const product = await getProductBySlug(productSlug);

  // A valid product under the wrong category slug (typo'd or stale link)
  // 404s too, same as a completely unknown slug - the URL's category
  // segment is source of truth for where the product "lives", not just a
  // label.
  if (
    !category ||
    !product ||
    (category.id !== ALL_PRODUCTS_CATEGORY_ID && product.category !== category.id)
  ) {
    notFound();
  }

  // "Você também pode gostar" rail: same-category products first (most
  // relevant), padded out with anything else if the category is thin - caps
  // at 4 so it stays a quick horizontal glance, not another grid. Busca o
  // catálogo completo (revalidado a cada 60s) em vez de um array estático em
  // memória - mesma fonte de dados que todo o resto do catálogo agora usa.
  const allProducts = await listProducts({ revalidate: 60 });
  const sameCategory = allProducts.filter((p) => p.id !== product.id && p.category === product.category);
  const otherCategories = allProducts.filter((p) => p.id !== product.id && p.category !== product.category);
  const relatedProducts = [...sameCategory, ...otherCategories].slice(0, 4);

  return <PerfumeDetail product={product} category={category} relatedProducts={relatedProducts} />;
}
