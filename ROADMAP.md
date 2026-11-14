# Roadmap

> Mesmo documento nos dois repositórios (`perfumaria` = front, `PerfumariaApi` = API). Ao atualizar um, copie para o outro.

Estado em 14/11/2026. Cada fase termina com algo testável.

## Fase 1 — Fundação (este zip) ✅

**Back-end (repositório `PerfumariaApi`)**
- [x] Marca da loja configurável (`STORE_*`): e-mails, cookie de sessão, Pix, User-Agent da Melhor Envio.
- [x] `Brand` (marcas) e `ProductVariant` (volume em ml com SKU, preço, preço "de", estoque, peso e medidas).
- [x] Campos de perfume: gênero, concentração, família olfativa, notas (saída/coração/fundo), perfumista, ano, tester, kit, SEO.
- [x] Migration `826beaf88005` (sobe e desce) sobre o schema herdado.
- [x] Checkout por variante: preço/estoque/peso vêm do volume escolhido; tudo recalculado no servidor.
- [x] Desconto Pix aplicado no servidor (`Order.discount_amount`), parcelamento e frete grátis configuráveis.
- [x] Cotação Melhor Envio com peso/medidas reais; etiqueta com caixa calculada a partir dos itens.
- [x] `flask expire-pending-orders`: cancela Pix não pago e devolve o estoque (cron na VPS a cada 10 min).
- [x] Filtros na API: marca, gênero, volume, faixa de preço, busca, ordenação; `/brands`, `/catalog/facets`, `/store/config`.
- [x] Admin: CRUD de marcas, variantes no produto, estoque por variante, aviso de "voltou ao estoque" corrigido.
- [x] LGPD: registro de consentimento, exportar dados (`GET /me/export`), excluir conta com anonimização (`DELETE /me`).
- [x] `SameSite` do cookie configurável; script da VPS com PostgreSQL por padrão.
- [x] 236 testes passando (os 21 que já falhavam no projeto original foram corrigidos).

**Front-end (repositório `perfumaria`)**
- [x] Identidade centralizada (`src/lib/store.ts`) e logo em texto até a marca existir.
- [x] Tema claro/escuro com paleta quente; `neutral-*` remapeado para as telas herdadas acompanharem.
- [x] Home: hero com SplitText + parallax, barra de vantagens, mais vendidos, categorias, guia olfativo com pin + scrub, marcas com rolagem horizontal presa, novidades.
- [x] Card de produto no padrão da referência: % OFF, frete grátis, seletor de ml, de/por, Pix, 12x, Comprar e Espiar.
- [x] Visualização rápida (bottom sheet no celular, modal no desktop).
- [x] PDP com seletor de volume, pirâmide olfativa, ficha técnica e barra fixa de compra no celular.
- [x] Listagem com filtros (gênero, volume, preço, ofertas, marca) — sidebar no desktop, gaveta no celular/tablet.
- [x] Admin: formulário com volumes, marca (com criação rápida), notas e SEO.
- [x] LGPD: banner com Recusar/Personalizar/Aceitar, Meta Pixel só após consentimento, Política de Privacidade, Termos, central "Meus dados".
- [x] Headers de segurança na Vercel (HSTS, Permissions-Policy, CSP em modo *report-only*).

## Fase 2 — Catálogo real e identidade
- [ ] Definir nome, domínio e logo → preencher `STORE_*` / `NEXT_PUBLIC_STORE_*`.
- [ ] Sessão de fotos (proporção 4:5, fundo neutro) e cadastro dos produtos pelo painel.
- [ ] Importação em lote por CSV (SKU, marca, ml, preço, estoque) para o catálogo inicial.
- [ ] Imagens fora do disco da VPS (Cloudflare R2 ou S3 + CDN) — hoje ficam em `instance/` como no Scathon.
- [ ] Revisão jurídica da Política de Privacidade, Termos e Trocas (são modelos).
- [ ] Confirmar regularização Anvisa dos importados e notas fiscais de entrada.

## Fase 3 — Pagamentos e operação em produção
- [ ] Credenciais reais do Mercado Pago (sandbox → produção) e teste de Pix e cartão ponta a ponta.
- [ ] Melhor Envio: conectar via OAuth no painel, cadastrar remetente (`STORE_SENDER_*`).
- [ ] SMTP da Hostinger (porta 465) + SPF/DKIM/DMARC no domínio.
- [ ] Cancelamento manual pelo admin devolvendo estoque (hoje só a recusa/expiração devolve).
- [ ] Paginação no servidor na listagem quando passar de ~300 produtos (os filtros já existem na API).
- [ ] CSP: trocar `Content-Security-Policy-Report-Only` por `Content-Security-Policy` depois de uma semana sem violações.

## Fase 4 — Conversão
- [ ] Checkout Transparente / Payment Brick (cartão sem sair do site).
- [ ] Cupons de desconto (o campo `discount_amount` já existe no pedido).
- [ ] Kits "monte o seu", amostras (decants) e recomendação por notas.
- [ ] Avaliações com foto em destaque na PDP; recuperação de carrinho abandonado por e-mail.
- [ ] 2FA por código de e-mail para contas admin.

## Pendências técnicas herdadas
- 20 avisos de lint do projeto original (`setState` dentro de `useEffect` em telas do admin/checkout) — não bloqueiam o build.

## Responsividade (regra do projeto)

| Faixa | Largura | Grade de produtos | Filtros | Movimento |
|---|---|---|---|---|
| Pequena | < 640 px | 2 colunas | gaveta inferior | entradas curtas, sem pin |
| Média | 640–1023 px | 3 colunas | painel lateral deslizante | pin no guia olfativo, parallax curto |
| Grande | ≥ 1024 px | 4 colunas (3 com sidebar) | sidebar fixa | pin + scrub, rolagem horizontal das marcas |

Alvos de toque ≥ 44 px; imagens com proporção fixa (sem CLS); `prefers-reduced-motion` desliga tudo.

## Movimento (GSAP)
- Importar sempre de `@/lib/motion` (registra ScrollTrigger, SplitText e useGSAP uma vez).
- Sempre dentro de `useGSAP(..., { scope })` e com `gsap.matchMedia()` usando `MOTION_QUERIES`.
- Animar só `transform` e `opacity`. Nunca esconder preço, botão de compra ou frete.
- Estado inicial invisível só via GSAP (nunca CSS) — sem JS, tudo aparece.

## Deploy

**Vercel (front)**: importe o repositório `perfumaria` (raiz do projeto), variáveis do `.env.example`,
`SESSION_SECRET` forte, `NEXT_PUBLIC_API_BASE_URL=https://api.seudominio.com.br/api/v1`.

**VPS (API, repositório `PerfumariaApi`)**:
```bash
sudo DOMAIN=api.seudominio.com.br FRONTEND_ORIGIN=https://www.seudominio.com.br bash deploy/provision_vps.sh
# copiar o código para /opt/perfumaria/app e rodar de novo
sudo certbot --nginx -d api.seudominio.com.br
```
Depois, no `.env` da VPS: `COOKIE_SAMESITE=Lax`, credenciais reais e
`STORE_*`. Webhooks: `https://api.seudominio.com.br/api/v1/webhooks/mercado-pago`
e `.../webhooks/melhor-envio`.
