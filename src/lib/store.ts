/**
 * Identidade da loja num lugar só. Nome, logo e redes ainda não existem:
 * tudo vem de variáveis `NEXT_PUBLIC_*` (ver `.env.example`), então trocar
 * a marca é editar o `.env` na Vercel, sem mexer em código.
 */
export const STORE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME ?? "DHIAR Perfumes",
  slug: process.env.NEXT_PUBLIC_STORE_SLUG ?? "dhiar",
  tagline:
    process.env.NEXT_PUBLIC_STORE_TAGLINE ?? "Sinta a essência. Perfumes originais das grandes casas, com entrega para todo o Brasil.",
  contactEmail: process.env.NEXT_PUBLIC_STORE_CONTACT_EMAIL ?? "contato@dhiar.com.br",
  whatsapp: process.env.NEXT_PUBLIC_STORE_WHATSAPP ?? "",
  instagram: process.env.NEXT_PUBLIC_STORE_INSTAGRAM ?? "",
  tiktok: process.env.NEXT_PUBLIC_STORE_TIKTOK ?? "",
  /** Logo para fundo claro (vazio = wordmark em texto). */
  logoOnLight: process.env.NEXT_PUBLIC_STORE_LOGO_LIGHT_BG ?? "",
  /** Logo para fundo escuro (vazio = wordmark em texto). */
  logoOnDark: process.env.NEXT_PUBLIC_STORE_LOGO_DARK_BG ?? "",
  legalName: process.env.NEXT_PUBLIC_STORE_LEGAL_NAME ?? "",
  cnpj: process.env.NEXT_PUBLIC_STORE_CNPJ ?? "",
  /** Versão da política de privacidade/cookies - mudar força novo consentimento. */
  policyVersion: process.env.NEXT_PUBLIC_PRIVACY_POLICY_VERSION ?? "2026-11",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
} as const;

/** Prefixo único para chaves de localStorage/eventos (`perfumaria:cart`). */
export function storageKey(key: string): string {
  return `${STORE.slug}:${key}`;
}

export function pageTitle(title?: string): string {
  return title ? `${title} — ${STORE.name}` : STORE.name;
}
