import { BrandHero } from "@/components/home/BrandHero";
import { TrustBar } from "@/components/home/TrustBar";
import { ProductGrid } from "@/components/home/ProductGrid";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { NotesStory } from "@/components/home/NotesStory";
import { BrandRail } from "@/components/home/BrandRail";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { getCommerceSettings, listBrands, listProducts } from "@/lib/products";
import { getFeaturedReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

/**
 * Home de alta conversão: hero com chamada clara → argumentos de compra →
 * mais vendidos (produto acima da dobra no desktop) → categorias → guia
 * olfativo (storytelling com pin) → marcas (scroll horizontal) →
 * novidades → avaliações reais. Cada seção falha sozinha: se a API cair,
 * a página ainda renderiza o que tiver.
 */
export default async function Home() {
  const [bestSellers, newest, brands, commerce, featuredReviews] = await Promise.all([
    listProducts({ isBestSeller: true, perPage: 8, revalidate: 60 }).catch(() => []),
    listProducts({ sort: "newest", perPage: 8, revalidate: 60 }).catch(() => []),
    listBrands().catch(() => []),
    getCommerceSettings().catch(() => null),
    getFeaturedReviews().catch(() => []),
  ]);

  const freeShippingThreshold = commerce?.freeShippingThreshold ?? 0;
  const brandsWithProducts = brands.filter((brand) => (brand.productCount ?? 0) > 0);

  return (
    <>
      <BrandHero />
      <TrustBar commerce={commerce} />
      <ProductGrid
        eyebrow="Os favoritos"
        title="Mais vendidos"
        products={bestSellers}
        href="/shop/todos?sort=best_sellers"
        freeShippingThreshold={freeShippingThreshold}
      />
      <CategoryTiles />
      <NotesStory />
      <BrandRail brands={brandsWithProducts.length > 0 ? brandsWithProducts : brands.slice(0, 10)} />
      <ProductGrid
        eyebrow="Acabaram de chegar"
        title="Novidades"
        products={newest}
        href="/shop/todos?sort=newest"
        freeShippingThreshold={freeShippingThreshold}
      />
      {featuredReviews.length > 0 && <TestimonialsCarousel reviews={featuredReviews} />}
    </>
  );
}
