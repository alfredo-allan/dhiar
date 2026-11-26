import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { STORE, pageTitle } from "@/lib/store";

export const metadata: Metadata = {
  title: pageTitle("Trocas e Devoluções"),
  description: `Direito de arrependimento, trocas por defeito e reembolso na ${STORE.name}.`,
};

/**
 * MODELO de política de trocas e devoluções para perfumaria on-line, alinhado
 * ao Código de Defesa do Consumidor (art. 49 - arrependimento; arts. 18 e 26
 * - vício do produto) e ao Decreto 7.962/2013 (comércio eletrônico).
 * Revisar com um advogado antes de publicar, em especial o prazo de reembolso
 * (aqui 10 dias úteis, prática de mercado) e o endereço de devolução.
 */
export default function TrocasEDevolucoesPage() {
  return (
    <LegalPage title="Trocas e Devoluções" updatedAt={STORE.policyVersion}>
      <section>
        <p>
          Todos os perfumes da {STORE.name} são originais e conferidos antes do envio. Se algo não sair como você
          esperava, resolvemos de forma simples - e sempre dentro do que o Código de Defesa do Consumidor garante.
        </p>
      </section>

      <section>
        <h2>1. Arrependimento: 7 dias para desistir</h2>
        <p>
          Como a compra é feita pela internet, você pode desistir em até <strong>7 (sete) dias corridos</strong> a
          partir do recebimento, sem precisar explicar o motivo (CDC, art. 49).
        </p>
        <p>
          Devolvemos <strong>100% do valor pago, incluindo o frete</strong>, e o envio de volta é por nossa conta:
          mandamos um código de postagem para você levar o pacote aos Correios ou a um ponto parceiro.
        </p>
        <p>
          Por se tratar de produto de uso pessoal e higiene, pedimos que o perfume volte <strong>sem uso</strong>,
          com o <strong>lacre (celofane) intacto</strong> e na embalagem original, junto com os brindes e amostras que
          vieram no pedido. Assim conseguimos garantir a procedência para todos os clientes.
        </p>
      </section>

      <section>
        <h2>2. Produto com defeito ou avariado</h2>
        <p>
          Se o perfume chegar com defeito (vazamento, válvula que não borrifa, frasco trincado) ou diferente do que
          você comprou, avise em até <strong>30 (trinta) dias corridos</strong> do recebimento (CDC, art. 26). Neste
          caso o lacre pode estar aberto - o defeito já garante o seu direito.
        </p>
        <ul>
          <li>Envie fotos ou um vídeo curto do problema e da embalagem; isso agiliza muito a análise.</li>
          <li>Você escolhe: troca pelo mesmo produto, troca por outro de mesmo valor ou reembolso integral.</li>
          <li>O frete de ida e volta é sempre por nossa conta.</li>
        </ul>
        <p>
          <strong>Pacote danificado na entrega?</strong> Se puder, recuse o recebimento ou anote a avaria no
          comprovante do entregador, e fale com a gente no mesmo dia.
        </p>
      </section>

      <section>
        <h2>3. Testers, kits e promoções</h2>
        <ul>
          <li>
            <strong>Testers</strong> são perfumes originais que vêm sem a caixa de vitrine e, às vezes, sem tampa. Isso
            é característica do produto, não defeito. O direito de arrependimento e a garantia contra defeitos valem
            igualmente.
          </li>
          <li>
            <strong>Kits</strong> devem ser devolvidos completos (todos os itens), pois são vendidos como um conjunto.
          </li>
          <li>
            Produtos <strong>em promoção</strong> têm os mesmos direitos de troca e devolução dos demais.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Como solicitar</h2>
        <ul>
          <li>
            Chame no WhatsApp, escreva para <a href={`mailto:${STORE.contactEmail}`} className="underline">{STORE.contactEmail}</a>{" "}
            ou use o botão <strong>Contato</strong> no rodapé, informando o pedido e o motivo.
          </li>
          <li>Respondemos em até 2 dias úteis com o passo a passo e o código de postagem, quando for o caso.</li>
          <li>Ao recebermos o produto, conferimos e confirmamos pelo WhatsApp ou e-mail.</li>
        </ul>
      </section>

      <section>
        <h2>5. Reembolso</h2>
        <ul>
          <li>
            <strong>Cartão de crédito:</strong> pedimos o estorno à operadora do pagamento em até 10 dias úteis após a
            conferência. O valor aparece na fatura conforme o calendário do seu banco (normalmente em 1 ou 2 faturas).
          </li>
          <li>
            <strong>Pix:</strong> devolvemos para a mesma conta de origem, em até 10 dias úteis após a conferência.
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
