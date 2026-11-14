"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DhiarMonogram3D } from "@/components/brand/DhiarMonogram3D";
import { DhiarWordmark } from "@/components/brand/DhiarWordmark";
import { LivingSmoke } from "@/components/brand/LivingSmoke";
import { useEntrySeen } from "@/lib/entry";
import { gsap, useGSAP, MOTION_QUERIES } from "@/lib/motion";

/* ============================================================================
   AJUSTE DO PARALLAX - mexa só aqui.

   `speed` é a velocidade APARENTE de cada camada em relação ao scroll:
     1    = acompanha a página normalmente
     < 1  = mais lenta (fica "mais longe", tipo fundo)
     > 1  = mais rápida (fica "mais perto", tipo primeiro plano)
   A distância percorrida é (1 - speed) x altura do hero.

   `small` sobrescreve os valores em telas < 640 px (movimento mais curto,
   para não brigar com o gesto de rolagem no celular).

   Por que o monograma é mais rápido que o nome: ele fica ACIMA do nome.
   Se o nome (embaixo) andasse mais rápido, subiria por cima do logo logo no
   primeiro scroll. Com a camada de cima mais rápida, as duas se afastam -
   o efeito de "descolar" acontece sem sobreposição. O fundo continua sendo
   a camada mais lenta (profundidade).
   ============================================================================ */
const PARALLAX = {
  /** Camada 1 - fundo (fumaça + madeira): a mais lenta, com zoom 1 -> 1.08. */
  bg: { speed: 0.4, scaleFrom: 1, scaleTo: 1.08 },
  /** Camada 2 - monograma "DA" 3D: sobe mais rápido e diminui um pouco. */
  logo: { speed: 1.22, scaleTo: 0.86 },
  /** Camada 3 - nome + PERFUMES + assinatura: elevação suave e fade-out. */
  name: { speed: 0.82, fadeOutStart: 0.05, fadeOutEnd: 0.6, lift: -30 },
  /** Deslocamento máximo (px) seguindo o mouse, por camada - só desktop. */
  pointer: { bg: 14, logo: 22, name: 10 },
  small: { bg: 0.55, logo: 1.15, name: 0.88 },
} as const;

const PERFUMES = "PERFUMES".split("");
const TAGLINE = "SINTA A ESSÊNCIA";

/**
 * Hero da marca DHIAR com parallax em 3 camadas.
 *  z-1  fundo `bg-texture-smoke.webp` (100vw x 100svh, object-cover)
 *  z-2  monograma "DA" em 3D (`DhiarMonogram3D`)
 *  z-3  wordmark DHIAR + PERFUMES + "Sinta a essência" + chamadas
 *
 * Entrada: o fundo acende saindo do escuro com um zoom-out, um halo de
 * cobre se abre, o monograma gira até a posição, as letras de DHIAR sobem
 * desfocando para nítido, a gota cai no "A", as linhas de PERFUMES se
 * abrem do centro e um feixe de luz atravessa o nome.
 *
 * Desempenho: só `transform`/`opacity` (translate3d via GSAP, `will-change`
 * nas camadas), imagem do fundo com `priority`, three.js carregado sob
 * demanda. Com `prefers-reduced-motion` tudo fica parado e visível.
 */
export function BrandHero() {
  const rootRef = useRef<HTMLElement>(null);
  const [playIntro, setPlayIntro] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const introRef = useRef<gsap.core.Timeline | null>(null);
  // O hero só começa depois que o portal de entrada fecha (ou na hora, se
  // o portal já foi visto nesta sessão).
  const entrySeen = useEntrySeen();

  useEffect(() => {
    if (entrySeen) introRef.current?.play();
  }, [entrySeen]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();

      mm.add(MOTION_QUERIES.reduce, () => {
        setReducedMotion(true);
        gsap.set("[data-curtain]", { autoAlpha: 0 });
      });

      mm.add(
        { small: MOTION_QUERIES.small, medium: MOTION_QUERIES.medium, large: MOTION_QUERIES.large },
        (context) => {
          const { small, large } = context.conditions as { small: boolean; medium: boolean; large: boolean };
          const speed = small
            ? { bg: PARALLAX.small.bg, logo: PARALLAX.small.logo, name: PARALLAX.small.name }
            : { bg: PARALLAX.bg.speed, logo: PARALLAX.logo.speed, name: PARALLAX.name.speed };
          const travel = (layerSpeed: number) => () => (1 - layerSpeed) * root.offsetHeight;

          /* ---------------- Entrada ---------------- */
          const intro = gsap.timeline({ defaults: { ease: "expo.out" }, paused: true });
          introRef.current = intro;
          intro
            .to("[data-curtain]", { autoAlpha: 0, duration: 1.6, ease: "power2.inOut" }, 0)
            .fromTo("[data-bg-inner]", { scale: 1.22 }, { scale: 1, duration: 2.8 }, 0)
            .fromTo("[data-halo]", { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 2.2 }, 0.2)
            .call(() => setPlayIntro(true), [], 0.3)
            .fromTo(
              "[data-letter]",
              { yPercent: 70, autoAlpha: 0, filter: "blur(14px)" },
              { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1.3, stagger: 0.09 },
              small ? 0.7 : 1.0,
            )
            .fromTo(
              "[data-drop]",
              { y: -260, autoAlpha: 0, transformOrigin: "50% 100%" },
              { y: 0, autoAlpha: 1, duration: 0.9, ease: "bounce.out" },
              small ? 1.2 : 1.55,
            )
            .fromTo("[data-line]", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power3.inOut" }, small ? 1.3 : 1.7)
            .fromTo(
              "[data-perfumes] span",
              { autoAlpha: 0, x: (i: number) => (i - 3.5) * 18 },
              { autoAlpha: 1, x: 0, duration: 1, stagger: 0.04 },
              small ? 1.4 : 1.85,
            )
            .fromTo("[data-tagline]", { autoAlpha: 0, y: 10, scaleX: 1.25 }, { autoAlpha: 1, y: 0, scaleX: 1, duration: 1.4 }, small ? 1.6 : 2.1)
            .fromTo("[data-cta]", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 }, small ? 1.8 : 2.3)
            .fromTo("[data-scroll-cue]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 2.6)
            // Feixe de luz atravessando o nome.
            .fromTo("[data-shine]", { attr: { x1: -900, x2: -300 } }, { attr: { x1: 3000, x2: 3600 }, duration: 1.6, ease: "power2.inOut" }, 2.0);

          if (document.documentElement.classList.contains("entry-seen")) intro.play();

          // Halo de cobre "respirando" e brilho recorrente no nome.
          gsap.to("[data-halo]", { scale: 1.08, autoAlpha: 0.75, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2.4 });
          gsap.timeline({ repeat: -1, repeatDelay: 6, delay: 7 })
            .fromTo("[data-shine]", { attr: { x1: -900, x2: -300 } }, { attr: { x1: 3000, x2: 3600 }, duration: 1.8, ease: "power2.inOut" });

          /* ---------------- Parallax no scroll ---------------- */
          const scrub = { trigger: root, start: "top top", end: "bottom top", scrub: true } as const;
          gsap.fromTo(
            "[data-layer='bg']",
            { y: 0, scale: PARALLAX.bg.scaleFrom, force3D: true },
            { y: travel(speed.bg), scale: PARALLAX.bg.scaleTo, ease: "none", force3D: true, scrollTrigger: { ...scrub, invalidateOnRefresh: true } },
          );
          gsap.fromTo(
            "[data-layer='logo']",
            { y: 0, scale: 1, force3D: true },
            { y: travel(speed.logo), scale: PARALLAX.logo.scaleTo, ease: "none", force3D: true, scrollTrigger: { ...scrub, invalidateOnRefresh: true } },
          );
          gsap.fromTo(
            "[data-layer='name']",
            { y: 0, force3D: true },
            { y: () => travel(speed.name)() + PARALLAX.name.lift, ease: "none", force3D: true, scrollTrigger: { ...scrub, invalidateOnRefresh: true } },
          );
          gsap.to("[data-layer='name']", {
            autoAlpha: 0,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: `${PARALLAX.name.fadeOutStart * 100}% top`,
              end: `${PARALLAX.name.fadeOutEnd * 100}% top`,
              scrub: true,
            },
          });
          gsap.to("[data-scroll-cue]", { autoAlpha: 0, scrollTrigger: { trigger: root, start: "top top", end: "15% top", scrub: true } });

          /* ---------------- Parallax pelo mouse (desktop) ---------------- */
          if (large) {
            const movers = (["bg", "logo", "name"] as const).map((layer) => ({
              x: gsap.quickTo(`[data-pointer='${layer}']`, "x", { duration: 1.2, ease: "power3.out" }),
              y: gsap.quickTo(`[data-pointer='${layer}']`, "y", { duration: 1.2, ease: "power3.out" }),
              amount: PARALLAX.pointer[layer] * (layer === "bg" ? -1 : 1),
            }));
            const onMove = (event: PointerEvent) => {
              const nx = event.clientX / window.innerWidth - 0.5;
              const ny = event.clientY / window.innerHeight - 0.5;
              movers.forEach((mover) => {
                mover.x(nx * mover.amount);
                mover.y(ny * mover.amount);
              });
            };
            window.addEventListener("pointermove", onMove, { passive: true });
            return () => window.removeEventListener("pointermove", onMove);
          }
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      aria-label="DHIAR Perfumes"
      className="relative isolate flex h-[100svh] min-h-[620px] w-full items-center justify-center overflow-hidden bg-[#0b0b0c] text-[#efdcc6]"
    >
      {/* Camada 1 - fundo */}
      <div data-layer="bg" className="absolute inset-0 z-[1] will-change-transform">
        <div data-pointer="bg" className="absolute -inset-[4%]">
          <div data-bg-inner className="absolute inset-0">
            <LivingSmoke focus={[0.12, 0.5]} paused={!entrySeen} priority />
          </div>
        </div>
        {/* Vinheta + transição suave para o resto da página */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_0%,rgba(11,11,12,0.35)_55%,rgba(11,11,12,0.85)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0b0b0c]" />
      </div>

      {/* Cortina de entrada: começa preta e se abre (evita flash). Sem JS, some. */}
      <div data-curtain aria-hidden className="pointer-events-none absolute inset-0 z-[4] bg-[#0b0b0c]" />
      <noscript>
        <style>{"[data-curtain]{display:none}"}</style>
      </noscript>

      {/* Coluna central: logo e nome sempre alinhados no mesmo eixo. */}
      <div className="relative flex w-full max-w-5xl flex-col items-center px-6 pt-6 text-center">
        {/* Camada 2 - monograma 3D */}
        <div data-layer="logo" className="relative z-[2] will-change-transform">
          <div data-pointer="logo" className="relative">
            <div
              data-halo
              aria-hidden
              className="absolute left-1/2 top-1/2 -z-10 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(194,123,69,0.38)_0%,rgba(194,123,69,0.12)_38%,transparent_68%)] blur-2xl"
            />
            <DhiarMonogram3D
              playIntro={playIntro}
              reducedMotion={reducedMotion}
              paused={!entrySeen}
              className="h-[clamp(190px,33svh,380px)] w-[clamp(210px,37svh,420px)]"
            />
          </div>
        </div>

        {/* Camada 3 - nome, PERFUMES, assinatura, chamadas */}
        <div data-layer="name" className="relative z-[3] -mt-3 flex w-full flex-col items-center will-change-transform">
          <div data-pointer="name" className="flex w-full flex-col items-center">
            <h1 className="w-[min(78vw,640px)]">
              <DhiarWordmark className="h-auto w-full overflow-visible drop-shadow-[0_6px_24px_rgba(0,0,0,0.55)]" title="DHIAR Perfumes" />
            </h1>

            <div className="mt-4 flex w-[min(86vw,640px)] items-center gap-4 sm:mt-6 sm:gap-6" aria-hidden>
              <span data-line className="h-px flex-1 origin-right bg-gradient-to-l from-[#c27b45] to-transparent" />
              <p data-perfumes className="font-display whitespace-nowrap pl-[0.55em] text-sm tracking-[0.55em] text-[#c27b45] sm:text-lg">
                {PERFUMES.map((char, index) => (
                  <span key={index} className="inline-block">{char}</span>
                ))}
              </p>
              <span data-line className="h-px flex-1 origin-left bg-gradient-to-r from-[#c27b45] to-transparent" />
            </div>

            <p data-tagline className="mt-5 text-[10px] font-medium tracking-[0.42em] text-[#e2c9ae] sm:mt-7 sm:text-xs">
              {TAGLINE}
            </p>

            <p data-cta className="mt-6 max-w-md text-sm leading-relaxed text-[#bfa891] sm:mt-8 sm:text-base">
              Curadoria de perfumes originais das grandes casas - nicho, árabes e clássicos - com desconto no Pix.
            </p>

            <div className="mt-6 flex w-full flex-col items-center gap-3 sm:mt-8 sm:w-auto sm:flex-row">
              <Link
                data-cta
                href="/shop/todos"
                className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-gradient-to-r from-[#de9966] via-[#c27b45] to-[#9a5a2b] px-8 text-sm font-semibold uppercase tracking-[0.16em] text-[#120b07] shadow-[0_10px_30px_-10px_rgba(194,123,69,0.7)] transition-transform hover:scale-[1.03] sm:w-auto"
              >
                Explorar perfumes
              </Link>
              <Link
                data-cta
                href="/shop/todos?sort=best_sellers"
                className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full border border-[#c27b45]/60 px-8 text-sm font-semibold uppercase tracking-[0.16em] text-[#efdcc6] backdrop-blur-sm transition-colors hover:border-[#de9966] hover:text-[#de9966] sm:w-auto"
              >
                Mais vendidos
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Indicação de rolagem */}
      <div data-scroll-cue aria-hidden className="absolute bottom-6 left-1/2 z-[3] hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex">
        <span className="text-[10px] uppercase tracking-[0.4em] text-[#a8927e]">Role</span>
        <span className="relative h-10 w-px overflow-hidden bg-[#c27b45]/25">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_1.8s_ease-in-out_infinite] bg-[#de9966]" />
        </span>
      </div>
    </section>
  );
}
