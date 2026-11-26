import Link from "next/link";
import { DhiarWordmark } from "@/components/brand/DhiarWordmark";

/** Topo enxuto do painel (sem sacola, busca nem menu da loja). */
export function AdminHeader() {
  return (
    <header className="border-b border-line bg-[#0b0b0c]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/admin" className="flex items-center gap-3 text-foreground" aria-label="Painel DHIAR">
          <DhiarWordmark tone="current" className="h-5 w-auto" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">Painel</span>
        </Link>
      </div>
    </header>
  );
}
