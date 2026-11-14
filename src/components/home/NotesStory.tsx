"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP, MOTION_QUERIES } from "@/lib/motion";

const STAGES = [
  {
    key: "saida",
    label: "Saída",
    time: "0 – 15 min",
    title: "O primeiro encontro",
    text: "Cítricos e especiarias leves que abrem o perfume e somem rápido.",
    notes: ["Bergamota", "Limão-siciliano", "Pimenta-rosa"],
  },
  {
    key: "coracao",
    label: "Coração",
    time: "15 min – 4 h",
    title: "A personalidade",
    text: "Flores e especiarias que definem o caráter da fragrância.",
    notes: ["Rosa", "Jasmim", "Lavanda"],
  },
  {
    key: "fundo",
    label: "Fundo",
    time: "4 h em diante",
    title: "O rastro que fica",
    text: "Madeiras, resinas e baunilha que fixam na pele e na memória.",
    notes: ["Oud", "Âmbar", "Baunilha"],
  },
];

/**
 * "Como um perfume evolui": seção educativa com a pirâmide olfativa.
 * - Grandes e médias: a seção fica PRESA (pin) enquanto o scroll avança as
 *   três camadas (scrub), com barra de progresso - storytelling que mantém
 *   o visitante na página.
 * - Pequenas: sem pin (prender a tela no celular atrapalha o scroll);
 *   cada camada só entra com fade ao aparecer.
 * - Movimento reduzido: tudo visível e estático.
 */
export function NotesStory() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(`${MOTION_QUERIES.large}, ${MOTION_QUERIES.medium}`, () => {
        const stages = gsap.utils.toArray<HTMLElement>("[data-stage]");
        gsap.set(stages.slice(1), { opacity: 0, yPercent: 12 });
        gsap.set("[data-layer]", { opacity: 0.25 });
        gsap.set("[data-layer='0']", { opacity: 1 });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: "[data-pin]",
            start: "top top",
            end: () => `+=${window.innerHeight * 2}`,
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        timeline.to("[data-progress]", { scaleX: 1, ease: "none", duration: stages.length }, 0);
        stages.forEach((stage, index) => {
          if (index === 0) return;
          timeline
            .to(stages[index - 1], { opacity: 0, yPercent: -12, duration: 0.5 }, index - 0.5)
            .to(`[data-layer='${index - 1}']`, { opacity: 0.25, duration: 0.5 }, index - 0.5)
            .to(stage, { opacity: 1, yPercent: 0, duration: 0.5 }, index - 0.25)
            .to(`[data-layer='${index}']`, { opacity: 1, duration: 0.5 }, index - 0.25);
        });
      });

      mm.add(MOTION_QUERIES.small, () => {
        gsap.utils.toArray<HTMLElement>("[data-stage]").forEach((stage) => {
          gsap.from(stage, {
            opacity: 0,
            y: 24,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: stage, start: "top 85%" },
          });
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} aria-labelledby="notes-story-title" className="bg-foreground text-background">
      <div data-pin className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Guia olfativo</p>
          <h2 id="notes-story-title" className="font-display mt-3 text-4xl leading-tight sm:text-5xl">
            Todo perfume conta uma história em três atos.
          </h2>
          <div className="mt-6 hidden h-px w-full bg-background/15 sm:block" aria-hidden>
            <div data-progress className="h-px w-full origin-left scale-x-0 bg-accent" />
          </div>
        </div>

        <div className="grid items-center gap-10 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Pirâmide - cada camada acende quando a etapa dela está ativa */}
          <svg viewBox="0 0 300 260" className="mx-auto hidden w-full max-w-sm sm:block" aria-hidden>
            <polygon data-layer="0" points="150,10 200,90 100,90" fill="var(--accent)" />
            <polygon data-layer="1" points="96,98 204,98 252,176 48,176" fill="var(--accent)" opacity="0.8" />
            <polygon data-layer="2" points="44,184 256,184 296,256 4,256" fill="var(--accent)" opacity="0.6" />
          </svg>

          <div className="relative grid">
            {STAGES.map((stage, index) => (
              <article
                key={stage.key}
                data-stage
                className="border-t border-background/15 py-6 sm:col-start-1 sm:row-start-1 sm:border-0 sm:py-0"
                aria-label={`Notas de ${stage.label.toLowerCase()}`}
              >
                <p className="text-xs uppercase tracking-[0.24em] text-accent">
                  {String(index + 1).padStart(2, "0")} · {stage.label} · {stage.time}
                </p>
                <h3 className="font-display mt-3 text-3xl sm:text-4xl">{stage.title}</h3>
                <p className="mt-3 max-w-md text-background/70">{stage.text}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {stage.notes.map((note) => (
                    <li key={note} className="rounded-full border border-background/20 px-3 py-1.5 text-xs uppercase tracking-[0.14em]">
                      {note}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <Link
          href="/shop/todos"
          className="inline-flex min-h-12 w-fit items-center rounded-full bg-background px-8 text-sm font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-accent hover:text-accent-ink"
        >
          Descobrir pelo cheiro
        </Link>
      </div>
    </section>
  );
}
