"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MONOGRAM_PATH, MONOGRAM_VIEWBOX } from "@/data/brandPaths";
import { gsap, useGSAP, MOTION_QUERIES } from "@/lib/motion";

export interface FilmClip {
  src: string;
  poster: string;
  /** Linha pequena acima do nome (ex.: "Lattafa"). */
  brand: string;
  /** Nome do perfume. */
  title: string;
  /** Página do produto, para o "Ver perfume". */
  href?: string;
}

/**
 * Vitrine de filmes: os vídeos tocam em sequência, sem som, em loop.
 *
 * Entre um filme e outro entra a mesma cortina do portal de entrada: o filme
 * atual cresce e escurece, uma cortina preto-café com o monograma de cobre
 * sobe e cobre a tela, troca o filme e sai por cima revelando o próximo, que
 * assenta de 1.08 para 1.
 *
 * - Dois <video> empilhados: o próximo já fica carregado, a troca não pisca.
 * - Barras de progresso (como stories) mostram o tempo e trocam o filme no toque.
 * - Fora da tela, com a aba escondida ou com movimento reduzido: pausa
 *   (movimento reduzido mostra só a capa, com os controles de troca).
 * - Celular: quadro 4:5 (vertical, imersivo, recorta o centro do filme);
 *   tablet/desktop: 16:9.
 */
export function FilmReel({ clips }: { clips: FilmClip[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const curtainRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const activeRef = useRef(0);
  const transitioningRef = useRef(false);
  const visibleRef = useRef(false);

  useGSAP(
    () => {
      // cortina começa escondida abaixo do quadro (só aparece na troca)
      gsap.set(curtainRef.current, { yPercent: 100, opacity: 1 });
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.reduce, () => {
        setReduced(true);
        return () => setReduced(false);
      });
    },
    { scope: rootRef },
  );

  const playActive = useCallback(() => {
    const video = videoRefs.current[activeRef.current];
    if (!video || reduced || !visibleRef.current || document.hidden) return;
    video.play().catch(() => {
      /* autoplay bloqueado: fica a capa */
    });
  }, [reduced]);

  const goTo = useCallback(
    (next: number) => {
      const current = activeRef.current;
      if (transitioningRef.current || next === current || clips.length < 2) return;
      const from = videoRefs.current[current];
      const to = videoRefs.current[next];
      const curtain = curtainRef.current;
      if (!from || !to || !curtain) return;

      const swap = () => {
        from.pause();
        gsap.set(from, { autoAlpha: 0, scale: 1 });
        to.currentTime = 0;
        gsap.set(to, { autoAlpha: 1, scale: 1.08 });
        activeRef.current = next;
        setActive(next);
        setProgress(0);
        playActive();
      };

      if (reduced) {
        swap();
        gsap.set(to, { scale: 1 });
        return;
      }

      transitioningRef.current = true;
      const q = gsap.utils.selector(curtain);
      gsap
        .timeline({ onComplete: () => (transitioningRef.current = false) })
        // o filme atual cresce e escurece (como o conteúdo do portal ao entrar)
        .to(from, { scale: 1.08, autoAlpha: 0.35, duration: 0.8, ease: "power3.in" }, 0)
        // a cortina sobe e cobre
        .fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: "power4.inOut" }, 0.1)
        .fromTo(q("[data-curtain-mark]"), { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power2.out" }, 0.45)
        .call(swap, [], 0.9)
        // e sai por cima revelando o próximo, que assenta
        .to(q("[data-curtain-mark]"), { autoAlpha: 0, duration: 0.3 }, 1.05)
        .to(curtain, { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, 1.1)
        .to(to, { scale: 1, duration: 1.4, ease: "power3.out" }, 1.1);
    },
    [clips.length, playActive, reduced],
  );

  // tempo do filme -> barra de progresso; perto do fim, puxa a transição
  useEffect(() => {
    const videos = videoRefs.current;
    const onTime = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      if (videos.indexOf(video) !== activeRef.current || !video.duration) return;
      setProgress(video.currentTime / video.duration);
      if (clips.length > 1 && video.duration - video.currentTime < 0.9) {
        goTo((activeRef.current + 1) % clips.length);
      }
    };
    const onEnded = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      if (clips.length === 1) {
        video.currentTime = 0;
        playActive();
      }
    };
    videos.forEach((video) => {
      video?.addEventListener("timeupdate", onTime);
      video?.addEventListener("ended", onEnded);
    });
    return () =>
      videos.forEach((video) => {
        video?.removeEventListener("timeupdate", onTime);
        video?.removeEventListener("ended", onEnded);
      });
  }, [clips.length, goTo, playActive]);

  // só toca visível e com a aba ativa
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pauseAll = () => videoRefs.current.forEach((video) => video?.pause());
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) playActive();
        else pauseAll();
      },
      { threshold: 0.25 },
    );
    observer.observe(root);
    const onVisibility = () => (document.hidden ? pauseAll() : playActive());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [playActive]);

  if (clips.length === 0) return null;
  const clip = clips[active];

  return (
    <div
      ref={rootRef}
      className="relative isolate aspect-[4/5] w-full overflow-hidden rounded-app border border-line bg-[#0b0b0c] sm:aspect-video sm:max-h-[72vh]"
      role="region"
      aria-roledescription="carrossel de filmes"
      aria-label="Filmes das fragrâncias"
    >
      {clips.map((item, index) => (
        <video
          key={item.src}
          ref={(node) => {
            videoRefs.current[index] = node;
          }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: index === 0 ? 1 : 0, visibility: index === 0 ? "visible" : "hidden" }}
          src={item.src}
          poster={item.poster}
          muted
          playsInline
          // carrega o atual e o próximo; os demais só os metadados (poupa dados no celular)
          preload={index === active || index === (active + 1) % clips.length ? "auto" : "metadata"}
          aria-hidden
          tabIndex={-1}
        />
      ))}

      {/* vinheta: funde o filme no fundo escuro da página (filmes de fundo claro também) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(11,11,12,0.75)_100%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/60 to-transparent" />
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      {/* legenda + "Ver perfume" */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 pb-7 sm:p-6 sm:pb-9 lg:p-8 lg:pb-10">
        <div key={clip.src} className="min-w-0 animate-[reel-in_0.8s_ease-out_both]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">Em cena · {clip.brand}</p>
          <p className="font-display mt-1 truncate text-2xl text-foreground sm:text-3xl lg:text-4xl">{clip.title}</p>
        </div>
        {clip.href && (
          <Link
            href={clip.href}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-foreground/30 bg-[#0b0b0c]/50 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent"
          >
            Ver perfume
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </div>

      {/* barras de progresso: mostram o tempo e trocam o filme no toque */}
      {clips.length > 1 && (
        <div className="absolute inset-x-4 bottom-3 flex gap-2 sm:inset-x-6 sm:bottom-4 lg:inset-x-8">
          {clips.map((item, index) => (
            <button
              key={item.src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ver filme ${index + 1}: ${item.title}`}
              aria-current={index === active}
              className="group relative h-6 flex-1"
            >
              <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-foreground/20">
                <span
                  className="block h-full origin-left bg-accent"
                  style={{ transform: `scaleX(${index < active ? 1 : index === active ? (reduced ? 1 : progress) : 0})` }}
                />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* cortina da transição (mesma linguagem do portal de entrada) */}
      <div
        ref={curtainRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#0b0b0c] opacity-0"
      >
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
        <svg data-curtain-mark viewBox={MONOGRAM_VIEWBOX} className="h-16 w-auto opacity-0 sm:h-20" aria-hidden>
          <path d={MONOGRAM_PATH} fill="#c27b45" fillRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}
