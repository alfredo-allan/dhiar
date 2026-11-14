# perfumaria — vitrine e painel da loja de perfumes

Front-end da loja: Next.js 16 (App Router, `src/proxy.ts`), React 19,
Tailwind 4 e GSAP 3 (ScrollTrigger + SplitText). Deploy na Vercel.

A API fica no repositório separado **PerfumariaApi** (Flask). Nome, domínio
e logo ainda não existem: a identidade vem de variáveis `NEXT_PUBLIC_STORE_*`.

## Rodar localmente

Suba a API primeiro (ver README do PerfumariaApi), depois:

```bash
pnpm install
cp .env.example .env.local
pnpm dev        # http://localhost:3000 (API em http://localhost:5000)
```

Use `localhost` nos dois lados (não `127.0.0.1`): front e API precisam ser o
mesmo "site" para o cookie de sessão funcionar sem HTTPS.

Contas de teste (criadas pelo `seed.py` da API): `admin@loja.dev` e
`cliente@loja.dev`, senha `senha-dev-123`. Painel em `/admin`.

## Comandos

```bash
pnpm build                  # build de produção + checagem de tipos
pnpm exec eslint src        # lint
```

## Onde fica cada coisa

- Identidade da loja: `src/lib/store.ts` (lê `NEXT_PUBLIC_STORE_*`).
- Cores e fontes: `src/app/globals.css`.
- Movimento: `src/lib/motion.ts` + `src/components/home/`.
- Produto: `src/components/product/` (card, PDP, Espiar, seletor de volume).
- LGPD: `src/lib/consent.ts`, `src/components/legal/`, `/politicas/*`, `/account/privacidade`.

## Deploy na Vercel

Importe este repositório (raiz do projeto, sem subpasta), cadastre as
variáveis do `.env.example` e um `SESSION_SECRET` forte
(`openssl rand -base64 32`). Fases e checklist em [ROADMAP.md](ROADMAP.md).
