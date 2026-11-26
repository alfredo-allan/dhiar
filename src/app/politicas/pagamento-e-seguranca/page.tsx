import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { getCommerceSettings } from "@/lib/products";
import { STORE, pageTitle } from "@/lib/store";

export const metadata: Metadata = {
  title: pageTitle("Pagamento e Segurança"),
  description: `Como funciona o pedido e o pagamento na ${STORE.name}: sacola no site, fechamento pelo WhatsApp.`,
};

/** Explica como o pedido é fechado pelo WhatsApp. Desconto Pix e parcelas vêm do catálogo (content/catalog.json). */
export default async function PagamentoESegurancaPage() {
  const commerce = await getCommerceSettings().catch(() => null);
  const pix = commerce?.pixDiscountPercent ?? 0;
  const installments = commerce?.maxInstallments ?? 0;

  return (
    <LegalPage title="Pagamento e Segurança" updatedAt={STORE.policyVersion}>
      <section>
        <h2>1. Como funciona o pedido</h2>
        <p>
          Você escolhe os perfumes e monta a sacola aqui no site. Ao finalizar, o pedido vai como mensagem para o
          WhatsApp oficial da {STORE.name}, com os produtos, volumes e valores. Por lá confirmamos o estoque, calculamos
          o frete para o seu CEP e combinamos o pagamento e a entrega.
        </p>
        <p>
          <strong>Não pedimos nem guardamos dados de cartão pelo site.</strong> O site não tem cadastro nem senha de
          cliente: sacola e favoritos ficam salvos só no seu aparelho.
        </p>
      </section>

      <section>
        <h2>2. Formas de pagamento</h2>
        <ul>
          <li>
            <strong>Pix</strong>
            {pix > 0 ? ` com ${pix}% de desconto` : ""}: enviamos a chave ou o QR Code pelo WhatsApp, em nome de{" "}
            {STORE.legalName || STORE.name}.
          </li>
          <li>
            <strong>Cartão de crédito</strong>
            {installments > 1 ? ` em até ${installments}x` : ""}: enviamos um link de pagamento seguro. Os dados do
            cartão são digitados só na página da operadora, nunca na conversa.
          </li>
        </ul>
        <p>Os preços exibidos no site valem para o pedido enviado; frete e prazo são informados antes do pagamento.</p>
      </section>

      <section>
        <h2>3. Como protegemos sua compra</h2>
        <ul>
          <li>Site inteiro com conexão criptografada (HTTPS).</li>
          <li>Perfumes 100% originais, com nota fiscal.</li>
          <li>Seus dados pessoais são tratados conforme a LGPD (veja a Política de Privacidade).</li>
        </ul>
      </section>

      <section>
        <h2>4. Cuidados contra golpes</h2>
        <ul>
          <li>
            Fale só com o WhatsApp oficial, aberto pelos botões deste site. Nunca pedimos senhas, códigos de
            verificação ou dados do cartão por mensagem.
          </li>
          <li>
            No Pix, confira se o recebedor exibido no app do seu banco é {STORE.legalName || STORE.name}
            {STORE.cnpj ? ` (CNPJ ${STORE.cnpj})` : ""}.
          </li>
          <li>
            Recebeu uma mensagem estranha em nosso nome? Fale com a gente em{" "}
            <a href={`mailto:${STORE.contactEmail}`} className="underline">{STORE.contactEmail}</a>.
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
