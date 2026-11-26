import Image from "next/image";
import { STORE } from "@/lib/store";

/** Quantas vezes a marca se repete em cada metade da faixa (cobre telas de até ~2800 px). */
const REPEAT = 8;

function MarqueeItem() {
  return (
    <span className="flex shrink-0 items-center gap-4 pr-10 sm:gap-5 sm:pr-14 lg:gap-6 lg:pr-20">
      <Image
        src="/images/branding-logo.svg"
        alt=""
        width={886}
        height={966}
        unoptimized
        className="h-8 w-auto sm:h-10 lg:h-12"
      />
      <span className="whitespace-nowrap font-display text-lg uppercase tracking-[0.32em] text-foreground sm:text-2xl lg:text-3xl">
        {STORE.name}
      </span>
      <span aria-hidden className="text-xs text-accent sm:text-sm">
        ✦
      </span>
    </span>
  );
}

/**
 * Letreiro com o logo e o nome da loja passando sem parar, logo abaixo do hero.
 * Animação só em CSS (`animate-marquee` em globals.css): a faixa tem duas
 * metades iguais e anda -50%, então o fim emenda no começo sem salto.
 * Pausa ao passar o mouse e fica parada para quem prefere menos movimento.
 */
export function BrandMarquee() {
  const half = Array.from({ length: REPEAT }, (_, i) => <MarqueeItem key={i} />);

  return (
    <section data-brand-marquee aria-label={STORE.name} className="group relative overflow-hidden border-y border-line bg-surface py-5 sm:py-6 lg:py-7">
      {/* Esfumaça as bordas para o letreiro "entrar" e "sair" suave. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-surface to-transparent sm:w-24" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-surface to-transparent sm:w-24" />

      <div aria-hidden className="brand-marquee flex w-max group-hover:[animation-play-state:paused]">
        <div className="flex">{half}</div>
        <div className="flex">{half}</div>
      </div>
    </section>
  );
}
