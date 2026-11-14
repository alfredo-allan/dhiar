@AGENTS.md

# Convenções do front-end (repositório perfumaria)

A API fica no repositório **PerfumariaApi**. Regras de negócio (preço,
desconto Pix, frete, estoque) são SEMPRE calculadas lá; o front só exibe.

- Identidade só via `@/lib/store` (`STORE`, `storageKey`, `pageTitle`). Nada de nome de loja fixo no código.
- Cores via tokens (`bg-surface`, `text-muted`, `text-accent`...) de `src/app/globals.css`.
- Perfume vai para o carrinho pela variante (`variantId`), via `useAddToCart`.
- Imagem de produto sempre por `ProductImage` (tem placeholder quando não há foto).
- GSAP só via `@/lib/motion`, dentro de `useGSAP(..., { scope })` e com `gsap.matchMedia()` + `MOTION_QUERIES`. Animar só `transform`/`opacity`; nunca esconder preço, botão de compra ou frete.
- Scripts de terceiros (Meta Pixel etc.) só depois do consentimento (`src/lib/consent.ts`).
- Responsividade: pequenas < 640 px (2 colunas, gaveta), médias 640–1023 (3 colunas), grandes ≥ 1024 (4 colunas, sidebar, pin). Alvos de toque ≥ 44 px.

Antes de entregar: `pnpm build && pnpm exec eslint src`.
