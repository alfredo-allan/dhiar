"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Minus, Plus, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import type { Category, Product, ProductVariant } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useAddToCart";
import { defaultVariant } from "@/lib/catalog";
import { concentrationLabel, formatBRL, genderLabel } from "@/lib/format";
import { gsap, useGSAP, MOTION_QUERIES } from "@/lib/motion";
import { ProductGallery } from "./ProductGallery";
import { ProductImage } from "./ProductImage";
import { WhatsAppButton } from "./WhatsAppButton";
import { PriceBlock } from "./PriceBlock";
import { VariantSelector } from "./VariantSelector";
import { NotesPyramid } from "./NotesPyramid";
import { ProductCard } from "./ProductCard";

interface PerfumeDetailProps {
  product: Product;
  category: Category;
  relatedProducts: Product[];
}

/**
 * PDP de perfume.
 * - Pequenas (<640): galeria em swipe no topo, compra logo abaixo e uma
 *   barra fixa no rodapé (preço + Comprar) que aparece quando o botão
 *   principal sai da tela.
 * - Médias (640-1023): galeria e compra empilhadas, com mais respiro.
 * - Grandes (>=1024): duas colunas; a coluna de compra fica "sticky" enquanto
 *   a galeria rola.
 */
export function PerfumeDetail({ product, category, relatedProducts }: PerfumeDetailProps) {
  const [selected, setSelected] = useState<ProductVariant | undefined>(() => defaultVariant(product));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const buyButtonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { isSaved, toggleSaved } = useWishlist();
  const addToCart = useAddToCart();

  const variants = product.variants ?? [];
  const isComingSoon = product.availability === "coming_soon";
  const isUnavailable = isComingSoon || product.inStock === false || product.stock === 0;
  const maxQuantity = Math.max(1, Math.min(selected?.stock ?? 10, 10));

  const images = useMemo(
    () => [product.coverImage, product.imageUrl, ...(product.specimenImages ?? [])].filter(
      (url, index, list): url is string => Boolean(url) && list.indexOf(url) === index,
    ),
    [product],
  );

  // Barra fixa do celular: aparece quando o botão principal sai da tela.
  useEffect(() => {
    const button = buyButtonRef.current;
    if (!button) return;
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), {
      rootMargin: "0px 0px -40px 0px",
    });
    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  // Entrada suave da coluna de compra (só transform/opacity; com movimento
  // reduzido, nada anima).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.large, () => {
        gsap.fromTo("[data-pdp-reveal]", { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.7, ease: "power3.out" });
      });
      mm.add(`${MOTION_QUERIES.small}, ${MOTION_QUERIES.medium}`, () => {
        gsap.fromTo("[data-pdp-reveal]", { y: 12, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.45, ease: "power2.out" });
      });
    },
    { scope: rootRef },
  );

  function handleAdd() {
    addToCart(product, selected, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const facts = [
    ["Marca", product.brand?.name],
    ["Concentração", concentrationLabel(product.concentration)],
    ["Gênero", genderLabel(product.gender)],
    ["Família olfativa", product.olfactoryFamily],
    ["Perfumista", product.perfumer],
    ["Lançamento", product.launchYear ? String(product.launchYear) : null],
    ["SKU", selected?.sku],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const description = (product.description ?? "").split("\n\n").filter(Boolean);
  const isLiked = isSaved(product.id);

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16">
      <nav aria-label="Você está em" className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">Início</Link>
        <span className="mx-2">/</span>
        <Link href={category.href} className="hover:text-foreground">{category.label}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          {images.length > 0 ? (
            <ProductGallery images={images} title={product.title} />
          ) : (
            <div className="relative aspect-[4/5] overflow-hidden rounded-app bg-surface-2">
              <ProductImage alt={product.title} priority />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <header data-pdp-reveal>
            {product.brand && (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{product.brand.name}</p>
            )}
            <h1 className="font-display mt-2 text-4xl leading-[1.05] sm:text-5xl">{product.title}</h1>
            <p className="mt-2 text-sm text-muted">
              {[concentrationLabel(product.concentration), genderLabel(product.gender), product.olfactoryFamily]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </header>

          {!isUnavailable && (
            <div data-pdp-reveal>
              <VariantSelector
                variants={variants}
                selectedId={selected?.id}
                onSelect={(variant) => {
                  setSelected(variant);
                  setQuantity(1);
                }}
                size="lg"
              />
            </div>
          )}

          <div data-pdp-reveal className="rounded-app border border-line bg-surface p-5">
            <PriceBlock variant={selected} fallbackPrice={product.price} size="lg" />
            {selected && selected.stock > 0 && selected.stock <= 3 && (
              <p className="mt-3 text-sm font-medium text-danger">Só {selected.stock} em estoque neste volume.</p>
            )}
          </div>

          <div data-pdp-reveal className="flex flex-col gap-3">
            {isUnavailable ? (
              <WhatsAppButton product={product} unavailable size="lg" />
            ) : (
              <div className="flex gap-3">
                <div className="flex items-center rounded-full border border-line">
                  <button
                    type="button"
                    aria-label="Diminuir quantidade"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="tap-target flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                    className="tap-target flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  ref={buyButtonRef}
                  type="button"
                  onClick={handleAdd}
                  disabled={variants.length > 0 && !selected?.inStock}
                  className="min-h-12 flex-1 rounded-full bg-foreground px-6 text-sm font-semibold uppercase tracking-[0.14em] text-background transition-colors hover:bg-accent hover:text-accent-ink disabled:opacity-40"
                >
                  {added ? "Adicionado à sacola" : "Comprar"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSaved(product.id)}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? "Remover dos favoritos" : "Salvar nos favoritos"}
                  className="tap-target flex items-center justify-center rounded-full border border-line"
                >
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-danger text-danger" : ""}`} strokeWidth={1.75} />
                </button>
              </div>
            )}

            <ul className="grid gap-2 text-xs text-muted sm:grid-cols-3">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" />Produto original</li>
              <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-accent" />Envio para todo o Brasil</li>
              <li className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-accent" />7 dias para desistir</li>
            </ul>
          </div>

          <div data-pdp-reveal className="flex flex-col gap-3 rounded-app border border-line bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Frete e prazo para o seu CEP são combinados pelo WhatsApp ao fechar o pedido.
            </p>
            {!isUnavailable && <WhatsAppButton product={product} variantLabel={selected?.label} className="shrink-0" />}
          </div>

          {product.notes && (
            <section data-pdp-reveal aria-labelledby="notas" className="border-t border-line pt-6">
              <h2 id="notas" className="font-display mb-4 text-2xl">Pirâmide olfativa</h2>
              <NotesPyramid notes={product.notes} />
            </section>
          )}

          {description.length > 0 && (
            <section aria-labelledby="sobre" className="border-t border-line pt-6">
              <h2 id="sobre" className="font-display mb-3 text-2xl">Sobre o perfume</h2>
              <div className="space-y-3 text-[15px] leading-relaxed text-foreground/85">
                {description.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {facts.length > 0 && (
            <section aria-labelledby="ficha" className="border-t border-line pt-6">
              <h2 id="ficha" className="font-display mb-3 text-2xl">Ficha técnica</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                {facts.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section aria-labelledby="relacionados" className="mt-16">
          <h2 id="relacionados" className="font-display mb-6 text-3xl">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}

      {/* Barra fixa de compra - só telas pequenas e médias */}
      {!isUnavailable && (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur transition-transform duration-300 lg:hidden ${
            showStickyBar ? "translate-y-0" : "translate-y-full"
          }`}
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          aria-hidden={!showStickyBar}
        >
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted">{product.title} · {selected?.label}</p>
              <p className="text-base font-semibold">
                {formatBRL(selected?.price ?? product.price)}
                {selected?.pricing && (
                  <span className="ml-2 text-xs font-normal text-success">{formatBRL(selected.pricing.pixPrice)} no Pix</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              tabIndex={showStickyBar ? 0 : -1}
              className="min-h-11 rounded-full bg-foreground px-6 text-sm font-semibold text-background"
            >
              {added ? "Adicionado" : "Comprar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
