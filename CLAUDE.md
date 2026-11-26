@AGENTS.md

# Convenções do front-end (repositório dhiar)

A loja roda só no front: catálogo em `content/catalog.json`, fotos no Vercel
Blob, pedido fechado pelo WhatsApp (`src/lib/whatsapp.ts`). Sem conta de cliente.

- Catálogo: tipos e regras em `src/lib/catalog.ts` (preço Pix, parcelas, variante padrão); leitura no servidor por `src/lib/products.ts`; no cliente por `src/lib/clientCatalog.ts` (`/api/catalog`).
- O painel (`/admin`) é o único que altera o catálogo: valida (`src/lib/catalogValidation.ts`) e publica como commit no GitHub (`src/lib/github.ts`). Senha e tokens só em variáveis de ambiente.
- Variantes (volumes) nunca são apagadas, só desativadas.
- Identidade só via `@/lib/store` (`STORE`, `storageKey`, `pageTitle`). Nada de nome de loja ou número de WhatsApp fixo no código.
- Cores via tokens (`bg-surface`, `text-muted`, `text-accent`...) de `src/app/globals.css`.
- Perfume vai para a sacola pela variante (`variantId`), via `useAddToCart`.
- Imagem de produto sempre por `ProductImage` (tem placeholder quando não há foto).
- GSAP só via `@/lib/motion`, dentro de `useGSAP(..., { scope })` e com `gsap.matchMedia()` + `MOTION_QUERIES`. Animar só `transform`/`opacity`; nunca esconder preço ou botão de compra.
- Scripts de terceiros (Meta Pixel etc.) só depois do consentimento (`src/lib/consent.ts`).
- Responsividade: pequenas < 640 px (2 colunas, gaveta), médias 640–1023 (3 colunas), grandes ≥ 1024 (4 colunas, sidebar, pin). Alvos de toque ≥ 44 px.

Antes de entregar: `pnpm build && pnpm exec eslint src`.
