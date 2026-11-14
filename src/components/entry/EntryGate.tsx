"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DhiarMonogram3D } from "@/components/brand/DhiarMonogram3D";
import { DhiarWordmark } from "@/components/brand/DhiarWordmark";
import { LivingSmoke } from "@/components/brand/LivingSmoke";
import { markEntrySeen, useEntrySeen } from "@/lib/entry";
import { gsap, useGSAP, MOTION_QUERIES } from "@/lib/motion";

const PERFUMES = "PERFUMES".split("");

/** Rotas onde o portal nunca aparece (trabalho interno). */
const SKIP_PREFIXES = ["/admin", "/login", "/api"];

/**
 * Portal de entrada da DHIAR (uma vez por sessão, como no Scathon).
 *
 * Composição igual à peça da marca: fumaça viva + madeira à esquerda,
 * monograma "DA" em 3D (gira com o dedo ou o mouse), DHIAR, PERFUMES entre
 * linhas de cobre, "Sinta a essência", moldura fina à direita e embaixo.
 * Enquanto a página carrega, uma linha de progresso preenche; depois aparece
 * ENTRAR. Ao entrar, a cortina sobe e o hero da home começa a animação.
 *
 * Acessível: é um diálogo modal com foco no botão; Enter/Esc também entram.
 */
export function EntryGate() {
  const pathname = usePathname();
  const seen = useEntrySeen();
  const skip = SKIP_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  if (seen || skip) return null;
  return <EntryGateScreen />;
}

function EntryGateScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [playIntro, setPlayIntro] = useState(false);
  const [canEnter, setCanEnter] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const exitingRef = useRef(false);

  // Trava o scroll da página por baixo enquanto o portal está aberto.
  useEffect(() => {
    const original = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = original;
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_QUERIES.reduce, () => {
        setReducedMotion(true);
        gsap.set("[data-gate-progress]", { scaleX: 1 });
        setCanEnter(true);
      });

      mm.add(`${MOTION_QUERIES.small}, ${MOTION_QUERIES.medium}, ${MOTION_QUERIES.large}`, () => {
        // Progresso: anda até 85% sozinho e completa quando a página termina de carregar.
        const progress = gsap.fromTo("[data-gate-progress]", { scaleX: 0 }, { scaleX: 0.85, duration: 2.4, ease: "power2.out" });
        const finish = () => {
          progress.kill();
          gsap.to("[data-gate-progress]", {
            scaleX: 1,
            duration: 0.6,
            ease: "power2.inOut",
            onComplete: () => setCanEnter(true),
          });
        };
        const minimum = gsap.delayedCall(2.2, () => {
          if (document.readyState === "complete") finish();
          else window.addEventListener("load", finish, { once: true });
        });

        const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
        intro
          .fromTo("[data-gate-curtain]", { autoAlpha: 1 }, { autoAlpha: 0, duration: 1.8, ease: "power2.inOut" }, 0)
          .fromTo("[data-gate-frame]", { scaleY: 0 }, { scaleY: 1, duration: 1.6, ease: "power3.inOut" }, 0.4)
          .call(() => setPlayIntro(true), [], 0.4)
          .fromTo(
            "[data-gate] [data-letter]",
            { yPercent: 70, autoAlpha: 0, filter: "blur(14px)" },
            { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1.3, stagger: 0.09 },
            1.1,
          )
          .fromTo(
            "[data-gate] [data-drop]",
            { y: -260, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.9, ease: "bounce.out" },
            1.6,
          )
          .fromTo("[data-gate-line]", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power3.inOut" }, 1.8)
          .fromTo(
            "[data-gate-perfumes] span",
            { autoAlpha: 0, x: (i: number) => (i - 3.5) * 18 },
            { autoAlpha: 1, x: 0, duration: 1, stagger: 0.04 },
            1.9,
          )
          .fromTo("[data-gate-tagline]", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 2.2)
          .fromTo("[data-gate] [data-shine]", { attr: { x1: -900, x2: -300 } }, { attr: { x1: 3000, x2: 3600 }, duration: 1.6, ease: "power2.inOut" }, 2.1);

        return () => {
          minimum.kill();
          window.removeEventListener("load", finish);
        };
      });
    },
    { scope: rootRef },
  );

  useEffect(() => {
    if (!canEnter) return;
    gsap.fromTo("[data-gate-enter]", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" });
    buttonRef.current?.focus({ preventScroll: true });
  }, [canEnter]);

  const enter = useCallback(() => {
    const root = rootRef.current;
    if (!root || exitingRef.current) return;
    exitingRef.current = true;
    if (reducedMotion) {
      markEntrySeen();
      return;
    }
    const q = gsap.utils.selector(root);
    gsap
      .timeline({ onComplete: markEntrySeen })
      .to(q("[data-gate-content]"), { scale: 1.08, autoAlpha: 0, duration: 0.9, ease: "power3.in" }, 0)
      .to(q("[data-gate-enter]"), { autoAlpha: 0, duration: 0.3 }, 0)
      .to(root, { yPercent: -100, duration: 1.1, ease: "power4.inOut" }, 0.55);
  }, [reducedMotion]);

  useEffect(() => {
    if (!canEnter) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape") enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canEnter, enter]);

  return (
    <div
      ref={rootRef}
      data-gate
      data-entry-gate
      role="dialog"
      aria-modal="true"
      aria-label="Bem-vindo à DHIAR Perfumes"
      className="fixed inset-0 z-[100] overflow-hidden bg-[#0b0b0c] text-[#efdcc6] will-change-transform"
    >
      <LivingSmoke focus={[0.02, 0.5]} priority />
      {/* Vinheta: escurece a direita para o logo respirar */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,rgba(11,11,12,0.1)_0%,rgba(11,11,12,0.3)_65%,rgba(11,11,12,0.6)_100%)]" />

      {/* Moldura fina de cobre (direita e base), como na peça da marca */}
      <span data-gate-frame aria-hidden className="absolute right-[3.5%] top-[6%] hidden h-[88%] w-px origin-top bg-gradient-to-b from-transparent via-[#c27b45]/70 to-transparent sm:block" />
      <span aria-hidden className="absolute inset-x-[2%] bottom-[1.5%] h-px bg-gradient-to-r from-transparent via-[#c27b45]/40 to-transparent" />

      <div data-gate-content className="relative flex h-full flex-col items-center justify-center px-6 pb-10 pt-6 text-center sm:pl-[12vw] lg:pl-[16vw]">
        <div className="relative">
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -z-10 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(194,123,69,0.32)_0%,rgba(194,123,69,0.1)_40%,transparent_70%)] blur-2xl"
          />
          <DhiarMonogram3D
            playIntro={playIntro}
            reducedMotion={reducedMotion}
            className="h-[clamp(200px,36svh,400px)] w-[clamp(220px,40svh,440px)]"
          />
        </div>

        <h1 className="mt-2 w-[min(84vw,820px)]">
          <DhiarWordmark className="h-auto w-full overflow-visible drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)]" title="DHIAR Perfumes" />
        </h1>

        <div className="mt-5 flex w-[min(90vw,860px)] items-center gap-4 sm:mt-7 sm:gap-8" aria-hidden>
          <span data-gate-line className="h-px flex-1 origin-right bg-gradient-to-l from-[#c27b45] to-transparent" />
          <p data-gate-perfumes className="font-display whitespace-nowrap pl-[0.6em] text-base tracking-[0.6em] text-[#c27b45] sm:text-2xl">
            {PERFUMES.map((char, index) => (
              <span key={index} className="inline-block">{char}</span>
            ))}
          </p>
          <span data-gate-line className="h-px flex-1 origin-left bg-gradient-to-r from-[#c27b45] to-transparent" />
        </div>

        <p data-gate-tagline className="mt-8 pl-[0.45em] text-[11px] tracking-[0.45em] text-[#e2c9ae] sm:mt-12 sm:text-sm">
          SINTA A ESSÊNCIA
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:mt-12">
          <div className="h-px w-40 overflow-hidden bg-[#c27b45]/20" aria-hidden>
            <div data-gate-progress className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-[#8e4c22] via-[#de9966] to-[#c27b45]" />
          </div>
          <button
            ref={buttonRef}
            data-gate-enter
            type="button"
            onClick={enter}
            disabled={!canEnter}
            style={{ visibility: "hidden" }}
            className="group relative min-h-12 overflow-hidden rounded-full border border-[#c27b45]/70 px-12 text-xs font-semibold uppercase tracking-[0.5em] text-[#efdcc6] transition-colors hover:border-[#de9966] hover:text-[#120b07] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#de9966]"
          >
            <span className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-[#de9966] to-[#c27b45] transition-transform duration-500 group-hover:scale-x-100" />
            Entrar
          </button>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#a8927e]/80">Arraste o monograma para girar</p>
        </div>
      </div>

      <div data-gate-curtain aria-hidden className="pointer-events-none absolute inset-0 bg-[#0b0b0c]" />
      <noscript>
        <style>{"[data-entry-gate]{display:none!important}"}</style>
      </noscript>
    </div>
  );
}
