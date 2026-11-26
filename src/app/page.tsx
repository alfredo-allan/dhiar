import { BrandHero } from "@/components/home/BrandHero";
import { TrustBar } from "@/components/home/TrustBar";
import { ProductGrid } from "@/components/home/ProductGrid";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { CATEGORY_TILES } from "@/lib/categoryTiles";
import { ArabSpotlight } from "@/components/home/ArabSpotlight";
import type { FilmClip } from "@/components/home/FilmReel";
import { BrandRail } from "@/components/home/BrandRail";
import { existsSync } from "node:fs";
import path from "node:path";
import { getCategoryShowcase, getCommerceSettings, listBrands, listProducts, type CategoryShowcase } from "@/lib/products";

// Estática: o catálogo vem de content/catalog.json; cada publicação do admin gera um deploy novo.

/** Coloque um .mp4 curto (10-20 s, mudo) aqui e a seção árabe passa a usá-lo de fundo. */
const ARAB_VIDEO = "/videos/perfumaria-arabe.mp4";

/**
 * Filmes da vitrine (public/videos/reel). Entram só os que existem no disco.
 * ATENÇÃO: são filmes publicitários das marcas - antes do site ir ao ar, use
 * material com autorização (kit de imprensa via distribuidor) ou próprio.
 */
const REEL: FilmClip[] = [
  {
    src: "/videos/reel/asad-lattafa.mp4",
    poster: "/videos/reel/asad-lattafa.jpg",
    brand: "Lattafa",
    title: "Asad",
    href: "/shop/perfumes-arabes/asad-elixir-masculino-100ml-178xp",
  },
  {
    src: "/videos/reel/good-girl.mp4",
    poster: "/videos/reel/good-girl.jpg",
    brand: "Carolina Herrera",
    title: "Good Girl",
    href: "/shop/perfume-feminino/good-girl-carolina-herrera-eau-de-parfum",
  },
  {
    // o filme é do Sauvage Elixir, que não está no catálogo: leva ao Sauvage Eau de Parfum
    src: "/videos/reel/sauvage.mp4",
    poster: "/videos/reel/sauvage.jpg",
    brand: "Dior",
    title: "Sauvage",
    href: "/shop/perfume-masculino/sauvage-eau-de-parfum-dior",
  },
  {
    src: "/videos/reel/yara.mp4",
    poster: "/videos/reel/yara.jpg",
    brand: "Lattafa",
    title: "Yara",
    href: "/shop/perfumes-arabes/yara-lattafa-eau-de-parfum-100ml-11xtr",
  },
  {
    src: "/videos/reel/bleu-de-chanel.mp4",
    poster: "/videos/reel/bleu-de-chanel.jpg",
    brand: "Chanel",
    title: "Bleu de Chanel",
    href: "/shop/perfume-masculino/bleu-de-chanel-eau-de-parfum-masculino-100ml-17d83",
  },
  {
    src: "/videos/reel/libre-intense.mp4",
    poster: "/videos/reel/libre-intense.jpg",
    brand: "Yves Saint Laurent",
    title: "Libre Intense",
    href: "/shop/perfume-feminino/libre-intense-yves-saint-laurent-perfume-feminino-edp",
  },
];

/**
 * Home de alta conversão: hero → argumentos de compra → mais vendidos →
 * categorias (com foto e contagem) → perfumaria árabe (vitrine editorial) →
 * guia olfativo (storytelling com pin) → marcas (scroll horizontal) →
 * novidades → avaliações reais. Cada seção falha sozinha: se a API cair,
 * a página ainda renderiza o que tiver.
 */
export default async function Home() {
  const [bestSellers, newArrivals, newest, arab, brands, commerce, showcase] = await Promise.all([
    listProducts({ isBestSeller: true, perPage: 8, revalidate: 60 }).catch(() => []),
    listProducts({ isNew: true, perPage: 8, revalidate: 60 }).catch(() => []),
    listProducts({ sort: "newest", perPage: 8, revalidate: 60 }).catch(() => []),
    listProducts({ category: "perfumes-arabes", sort: "best_sellers", perPage: 6, revalidate: 60 }).catch(() => []),
    listBrands().catch(() => []),
    getCommerceSettings().catch(() => null),
    getCategoryShowcase(CATEGORY_TILES.map((tile) => tile.slug)).catch(() => ({}) as Record<string, CategoryShowcase>),
  ]);
  const arabInfo = showcase["perfumes-arabes"];
  const inPublic = (file: string) => existsSync(path.join(process.cwd(), "public", file));
  const arabVideo = inPublic(ARAB_VIDEO) ? ARAB_VIDEO : null;
  const reel = REEL.filter((clip) => inPublic(clip.src));

  const freeShippingThreshold = commerce?.freeShippingThreshold ?? 0;
  // As 12 casas com mais perfumes no catálogo (com 60+ marcas, o trilho inteiro cansaria).
  const brandsWithProducts = brands
    .filter((brand) => (brand.productCount ?? 0) > 0)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 12);

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
      <CategoryTiles showcase={showcase} />
      <ArabSpotlight
        products={arab}
        total={arabInfo?.total ?? arab.length}
        fromPrice={arabInfo?.fromPrice}
        freeShippingThreshold={freeShippingThreshold}
        videoSrc={arabVideo}
        reel={reel}
      />
      <BrandRail brands={brandsWithProducts.length > 0 ? brandsWithProducts : brands.slice(0, 10)} />
      <ProductGrid
        eyebrow="Acabaram de chegar"
        title="Novidades"
        products={newArrivals.length > 0 ? newArrivals : newest}
        href="/shop/todos?sort=newest"
        freeShippingThreshold={freeShippingThreshold}
      />
    </>
  );
}
