import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { STORE, pageTitle } from "@/lib/store";

export const metadata: Metadata = {
  title: pageTitle("Política de Privacidade"),
  description: `Como a ${STORE.name} trata seus dados pessoais, de acordo com a LGPD.`,
};

/**
 * MODELO de política de privacidade alinhado à LGPD (Lei 13.709/2018).
 * Revisar com um advogado antes de publicar: razão social, CNPJ, endereço,
 * encarregado (DPO) e prazos de retenção vêm das variáveis da loja e
 * precisam estar preenchidos.
 */
export default function PrivacyPolicyPage() {
  const controller = STORE.legalName || STORE.name;
  return (
    <LegalPage title="Política de Privacidade" updatedAt={STORE.policyVersion}>
      <section>
        <h2>1. Quem somos</h2>
        <p>
          {controller}
          {STORE.cnpj ? `, CNPJ ${STORE.cnpj},` : ""} é a controladora dos dados pessoais tratados nesta loja. Para
          qualquer assunto sobre privacidade, fale com o nosso encarregado pelo e-mail{" "}
          <a href={`mailto:${STORE.contactEmail}`} className="underline">{STORE.contactEmail}</a>.
        </p>
      </section>

      <section>
        <h2>2. Quais dados coletamos e para quê</h2>
        <ul>
          <li><strong>Pedido pelo WhatsApp</strong> (nome, telefone, CEP e o que você escrever na mensagem): atender e entregar o pedido. Base legal: execução de contrato. O site não tem cadastro nem senha de cliente.</li>
          <li><strong>Endereço e CPF/CNPJ</strong>: entregar o pedido e emitir a etiqueta de envio. Base legal: execução de contrato e obrigação legal.</li>
          <li><strong>Pedidos e pagamentos</strong>: processar a compra, emitir nota fiscal e atender trocas. Os dados do cartão ficam só com a operadora do link de pagamento; nós não os recebemos nem armazenamos.</li>
          <li><strong>Cookies necessários</strong> (sacola, favoritos e tema, guardados no seu aparelho): fazer a loja funcionar. Não dependem de consentimento.</li>
          <li><strong>Cookies de análise e marketing</strong>: só com o seu consentimento, que você pode retirar a qualquer momento.</li>
        </ul>
      </section>

      <section>
        <h2>3. Com quem compartilhamos</h2>
        <ul>
          <li>WhatsApp (Meta), onde o pedido é conversado.</li>
          <li>Operadora de pagamento (link de cartão), quando você escolhe pagar com cartão.</li>
          <li>Correios e transportadoras (entrega).</li>
          <li>Meta (anúncios), apenas se você aceitar cookies de marketing.</li>
        </ul>
        <p>Não vendemos seus dados.</p>
      </section>

      <section>
        <h2>4. Por quanto tempo guardamos</h2>
        <p>
          Conversas e dados do pedido: pelo tempo necessário para atender, entregar e cuidar de trocas. Pedidos e notas
          fiscais: 5 anos, por obrigação fiscal. Registros de consentimento: enquanto forem necessários para
          comprovar a sua escolha.
        </p>
      </section>

      <section>
        <h2>5. Seus direitos</h2>
        <p>
          Você pode confirmar o tratamento, acessar, corrigir, baixar (portabilidade) e excluir seus dados, além de revogar
          consentimentos. Faça isso pelo WhatsApp ou pelo e-mail do encarregado.
          Você também pode reclamar à ANPD.
        </p>
      </section>

      <section>
        <h2>6. Segurança</h2>
        <p>
          Usamos conexão criptografada (HTTPS) e o painel administrativo é protegido por senha, com sessão em cookie
          protegido contra acesso por scripts e limite de tentativas de login.
        </p>
      </section>
    </LegalPage>
  );
}
