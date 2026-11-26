# DHIAR Perfumes — vitrine e painel da loja

Next.js 16 (App Router, `src/proxy.ts`), React 19, Tailwind 4 e GSAP 3. Deploy na Vercel.

A loja roda **só no front-end**: os dados dos perfumes ficam em
[`content/catalog.json`](content/catalog.json), as fotos no Vercel Blob e o
pedido é fechado pelo **WhatsApp**. Não há conta de cliente; sacola e
favoritos ficam no aparelho de quem compra. A API Flask (PerfumariaApi) e o
banco continuam guardados, mas o site não depende deles.

## Como o painel publica

1. `/admin` pede a senha (`ADMIN_PASSWORD`).
2. As edições ficam num rascunho (salvo no navegador) até você clicar em **Publicar**.
3. Publicar grava `content/catalog.json` como um commit no GitHub (`GITHUB_TOKEN`).
4. A Vercel vê o commit e faz o deploy sozinha. A barra de status no rodapé do
   painel mostra: commit criado → Vercel publicando → no ar.

Sem `GITHUB_TOKEN` (no seu computador), Publicar grava o arquivo local direto.
Sem `ADMIN_PASSWORD` em desenvolvimento, o painel fica aberto.

## Rodar localmente

```bash
pnpm install
cp .env.example .env.local   # preencha NEXT_PUBLIC_STORE_WHATSAPP
pnpm dev                     # http://localhost:3000
```

## Fotos

As fotos do catálogo ficam no próprio repositório, em `public/media/products`
(o site não depende da API). Para trazê-las da pasta antiga da API:

```bash
node scripts/migrar-fotos.mjs --local   # copia de ../../PerfumariaApi/instance/product_images
git add public/media && git commit -m "Fotos do catálogo" && git push
```

Fotos novas sobem pelo painel direto para o Vercel Blob.

Para regerar o catálogo a partir do banco: `python scripts/export_to_front.py`
no repositório da API.

## Comandos

```bash
pnpm build                  # build de produção + checagem de tipos
pnpm exec eslint src        # lint
```

## Deploy na Vercel

Importe este repositório (raiz do projeto) e cadastre as variáveis do
`.env.example`: `ADMIN_PASSWORD` (forte), `ADMIN_SESSION_SECRET`
(`openssl rand -base64 32`), `GITHUB_TOKEN` (fine-grained, Contents: Read and
write só neste repositório), `GITHUB_REPO`, `GITHUB_BRANCH`,
`NEXT_PUBLIC_STORE_WHATSAPP` e conecte um Blob em Storage (cria o
`BLOB_READ_WRITE_TOKEN`).
