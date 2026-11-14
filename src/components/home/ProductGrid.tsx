"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { gsap, ScrollTrigger, useGSAP, MOTION_QUERIES } from "@/lib/motion";

interface ProductGridProps {
  title: string;
  eyebrow?: string;
  products: Product[];
  href?: string;
  freeShippingThreshold?: number;
  limit?: number;
}

/**
 * Vitrine da home. 2 colunas no celular, 3 no tablet, 4 no desktop.
 * Os cards entram em lotes com ScrollTrigger.batch (stagger), e o título
 * desliza junto - só transform/opacity.
 */
export function ProductGrid({ title, eyebrow, products, href, freeShippingThreshold = 0, limit = 8 }: ProductGridProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_QUERIES.small}, ${MOTION_QUERIES.medium}, ${MOTION_QUERIES.large}`, () => {
        gsap.from("[data-grid-heading]", {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 85%" },
        });
        gsap.set("[data-reveal]", { opacity: 0, y: 32 });
        ScrollTrigger.batch("[data-reveal]", {
          start: "top 90%",
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: "power3.out", overwrite: true }),
        });
      });
    },
    { scope: rootRef, dependencies: [products.length] },
  );

  if (products.length === 0) return null;

  return (
    <section ref={rootRef} className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div data-grid-heading className="mb-8 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{eyebrow}</p>}
          <h2 className="font-display mt-2 text-4xl sm:text-5xl">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="shrink-0 text-sm font-medium underline underline-offset-4 hover:text-accent">
            Ver todos
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {products.slice(0, limit).map((product) => (
          <ProductCard key={product.id} product={product} freeShippingThreshold={freeShippingThreshold} />
        ))}
      </div>
    </section>
  );
}
