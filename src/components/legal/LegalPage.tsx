import Link from "next/link";
import type { ReactNode } from "react";

/** Moldura comum das páginas legais (privacidade, termos). */
export function LegalPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Você está em" className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">Início</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{title}</span>
      </nav>
      <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Atualizada em {updatedAt}</p>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}
