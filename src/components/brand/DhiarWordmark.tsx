import { useId } from "react";
import { WORDMARK_DROP, WORDMARK_LETTERS, WORDMARK_VIEWBOX } from "@/data/brandPaths";

interface DhiarWordmarkProps {
  /**
   * "brand": letras champagne em degradê + faixa de brilho (hero).
   * "current": letras na cor do texto (`currentColor`) - cabeçalho e rodapé,
   * funciona nos temas claro e escuro.
   */
  tone?: "brand" | "current";
  className?: string;
  title?: string;
}

/**
 * Wordmark "DHIAR" em vetor. Cada letra é um <path data-letter> para a
 * animação letra a letra do hero; a gota do "A" é `data-drop` e o feixe de
 * brilho é o gradiente `data-shine` (o GSAP anima o atributo x1/x2).
 */
export function DhiarWordmark({ tone = "brand", className = "", title = "DHIAR" }: DhiarWordmarkProps) {
  const uid = useId().replace(/:/g, "");
  const cream = `cream-${uid}`;
  const copper = `copper-${uid}`;
  const shine = `shine-${uid}`;
  const letterFill = tone === "brand" ? `url(#${cream})` : "currentColor";

  return (
    <svg viewBox={WORDMARK_VIEWBOX} role="img" aria-label={title} className={className}>
      <defs>
        <linearGradient id={cream} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e3cc" />
          <stop offset="1" stopColor="#e2be9a" />
        </linearGradient>
        <linearGradient id={copper} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e7a673" />
          <stop offset=".5" stopColor="#b9703d" />
          <stop offset="1" stopColor="#8e4c22" />
        </linearGradient>
        <linearGradient id={shine} data-shine gradientUnits="userSpaceOnUse" x1="-900" y1="0" x2="-300" y2="0">
          <stop offset="0" stopColor="#fff6ea" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff6ea" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff6ea" stopOpacity="0" />
        </linearGradient>
      </defs>
      {WORDMARK_LETTERS.map((letter) => (
        <path key={letter.id} data-letter={letter.id} fillRule="evenodd" fill={letterFill} d={letter.d} />
      ))}
      <path data-drop fillRule="evenodd" fill={`url(#${copper})`} d={WORDMARK_DROP} />
      {tone === "brand" && (
        <g aria-hidden style={{ mixBlendMode: "soft-light" }}>
          {WORDMARK_LETTERS.map((letter) => (
            <path key={letter.id} fillRule="evenodd" fill={`url(#${shine})`} d={letter.d} />
          ))}
        </g>
      )}
    </svg>
  );
}
