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
const SKIP_PREFIXES = ["/admin", "/api"];

/**
 * Portal de entrada da DHIAR (uma vez por sessão, como no Scathon).
 *
 * Composição igual à peça da marca: fumaça viva + madeira à esquerda,
 * monograma "DA" em 3D (gira com o dedo ou o mouse), DHIAR, PERFUMES entre
 * linhas de cobre, "Sinta a essência", moldura fina à direita e embaixo.
 * Enquanto a página carrega, uma linha de progresso preenche; depois aparece
 * ENTRAR. Ao entrar, a cortina sobe e o hero da home começa a animação.
 *
 * O ENTRAR foi pensado para o toque (no celular não existe hover): é uma
 * pílula de cobre preenchida com uma seta, com anéis que "respiram" em volta,
 * um brilho que passa de tempos em tempos e uma resposta visível ao toque.
 * A linha de carregamento se recolhe e o botão nasce no mesmo lugar.
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

  // A linha de carregamento se recolhe e o botão "nasce" no lugar dela.
  useEffect(() => {
    if (!canEnter) return;
    const q = gsap.utils.selector(rootRef.current);
    gsap
      .timeline()
      .to(q("[data-gate-loader]"), { scaleX: 0, autoAlpha: 0, duration: 0.45, ease: "power2.in" })
      .fromTo(
        q("[data-gate-enter]"),
        { autoAlpha: 0, scale: 0.6 },
        { autoAlpha: 1, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.6)" },
        0.25,
      )
      .fromTo(q("[data-gate-hint]"), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.6);
    buttonRef.current?.focus({ preventScroll: true });
  }, [canEnter]);

  const enter = useCallback(() => {
    const root = rootRef.current;
    if (!root || !canEnter || exitingRef.current) return;
    exitingRef.current = true;
    if (reducedMotion) {
      markEntrySeen();
      return;
    }
    // Vibração curtinha no Android (o iOS ignora) confirma o toque.
    navigator.vibrate?.(12);
    const q = gsap.utils.selector(root);
    gsap
      .timeline({ onComplete: markEntrySeen })
      // Resposta ao toque: o botão "afunda", acende e solta uma onda de cobre.
      .to(q("[data-gate-button]"), { scale: 0.93, filter: "brightness(1.25)", duration: 0.12, ease: "power2.out" }, 0)
      .to(q("[data-gate-button]"), { scale: 1, duration: 0.35, ease: "back.out(3)" }, 0.12)
      .fromTo(q("[data-gate-burst]"), { autoAlpha: 0.9, scale: 1 }, { autoAlpha: 0, scale: 3.2, duration: 0.8, ease: "power2.out" }, 0.05)
      .to(q("[data-gate-content]"), { scale: 1.08, autoAlpha: 0, duration: 0.9, ease: "power3.in" }, 0.25)
      .to(root, { yPercent: -100, duration: 1.1, ease: "power4.inOut" }, 0.8);
  }, [reducedMotion, canEnter]);

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

        <div className="mt-10 flex flex-col items-center gap-5 sm:mt-12">
          {/* Mesmo lugar: primeiro a linha de carregamento, depois o botão. */}
          <div className="relative flex h-16 items-center justify-center">
            <div data-gate-loader className="absolute h-px w-40 overflow-hidden bg-[#c27b45]/20" aria-hidden>
              <div data-gate-progress className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-[#8e4c22] via-[#de9966] to-[#c27b45]" />
            </div>

            <div data-gate-enter className="relative" style={{ visibility: "hidden" }}>
              {/* Anéis que "respiram" em volta: chamam o dedo sem precisar de hover */}
              <span aria-hidden className="gate-ring pointer-events-none absolute inset-0 rounded-full border border-[#de9966]/80" />
              <span aria-hidden className="gate-ring gate-ring--late pointer-events-none absolute inset-0 rounded-full border border-[#de9966]/80" />
              {/* Onda disparada no toque */}
              <span data-gate-burst aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-[#de9966]/40 opacity-0" />

              <button
                ref={buttonRef}
                data-gate-button
                type="button"
                onClick={enter}
                // aria-disabled em vez de disabled: o Firefox restaura o estado
                // "disabled" ao recarregar a página e isso quebrava a hidratação.
                aria-disabled={!canEnter}
                className="group relative flex min-h-14 touch-manipulation select-none items-center gap-5 overflow-hidden rounded-full bg-[linear-gradient(135deg,#f3bd8c_0%,#de9966_25%,#c27b45_58%,#8e4c22_100%)] py-2 pl-10 pr-2 text-[13px] font-semibold uppercase tracking-[0.42em] text-[#140c07] shadow-[0_12px_32px_-10px_rgba(222,153,102,0.7),inset_0_1px_0_rgba(255,236,214,0.65),inset_0_-1px_0_rgba(60,28,10,0.55)] transition-[transform,filter] duration-200 [-webkit-tap-highlight-color:transparent] hover:brightness-110 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#de9966] sm:text-sm"
              >
                {/* Brilho metálico que atravessa o botão de tempos em tempos */}
                <span aria-hidden className="gate-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#fff3e4]/60 to-transparent" />
                <span className="relative">Entrar</span>
                <span
                  aria-hidden
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#140c07] text-[#de9966] shadow-[inset_0_1px_0_rgba(222,153,102,0.25)]"
                >
                  <svg viewBox="0 0 24 24" className="gate-arrow h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1" fill="none">
                    <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <p data-gate-hint className="text-[10px] uppercase tracking-[0.3em] text-[#a8927e]/80" style={{ visibility: "hidden" }}>
            <span className="pointer-coarse:hidden">Clique em entrar · arraste o logo para girar</span>
            <span className="hidden pointer-coarse:inline">Toque em entrar · gire o logo</span>
          </p>
        </div>
      </div>

      <div data-gate-curtain aria-hidden className="pointer-events-none absolute inset-0 bg-[#0b0b0c]" />
      <noscript>
        <style>{"[data-entry-gate]{display:none!important}"}</style>
      </noscript>
    </div>
  );
}
