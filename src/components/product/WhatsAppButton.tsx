"use client";

import { STORE } from "@/lib/store";
import { productMessage, whatsappUrl } from "@/lib/whatsapp";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

interface WhatsAppButtonProps {
  product: { title: string; slug: string };
  variantLabel?: string | null;
  /** Produto esgotado/em breve: a mensagem vira "me avise quando chegar". */
  unavailable?: boolean;
  size?: "md" | "lg";
  className?: string;
}

/** Ícone do WhatsApp desenhado em traço simples (não é o logotipo oficial). */
function ChatIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1L4 20z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 9.5c.3 2 2.2 4 4.5 4.6l1-1 1.6.8c-.2.9-1 1.6-2 1.6-3 0-6-3-6-6 0-1 .7-1.8 1.6-2l.8 1.6-1 1" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Botão "Falar no WhatsApp" de um produto. Esgotado/em breve vira
 * "Avise-me no WhatsApp" (substitui o avise-me por e-mail da época da API).
 */
export function WhatsAppButton({ product, variantLabel, unavailable = false, size = "md", className = "" }: WhatsAppButtonProps) {
  const href = whatsappUrl(productMessage(product, { variantLabel, unavailable, siteUrl: SITE_URL }));
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-foreground/25 font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-accent hover:text-accent active:scale-[0.97] ${
        size === "lg" ? "min-h-12 px-6 text-sm" : "min-h-11 px-4 text-xs"
      } ${className}`}
      aria-label={`${unavailable ? "Avise-me" : "Falar"} no WhatsApp da ${STORE.name} sobre ${product.title}`}
    >
      <ChatIcon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      {unavailable ? "Avise-me no WhatsApp" : "Tirar dúvida no WhatsApp"}
    </a>
  );
}

export { ChatIcon };
