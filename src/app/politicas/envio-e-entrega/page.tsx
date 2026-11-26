import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { getCommerceSettings } from "@/lib/products";
import { formatBRL } from "@/lib/format";
import { STORE, pageTitle } from "@/lib/store";

export const metadata: Metadata = {
  title: pageTitle("Envio e Entrega"),
  description: `Prazos, frete e rastreamento dos pedidos da ${STORE.name}.`,
};

/** MODELO de política de envio. Os valores de frete grátis vêm do catálogo (content/catalog.json). */
export default async function EnvioEEntregaPage() {
  const commerce = await getCommerceSettings().catch(() => null);
  const freeShipping = commerce?.freeShippingThreshold ?? 0;

  return (
    <LegalPage title="Envio e Entrega" updatedAt={STORE.policyVersion}>
      <section>
        <h2>1. Para onde enviamos</h2>
        <p>
          Entregamos em todo o Brasil, pelos Correios ou por transportadora, conforme a melhor opção de preço e
          prazo para o seu CEP.
        </p>
      </section>

      <section>
        <h2>2. Frete e prazo</h2>
        <ul>
          <li>
            Frete e prazo são calculados para o seu CEP e informados pelo WhatsApp antes do pagamento; você escolhe a
            opção que preferir.
          </li>
          {freeShipping > 0 && (
            <li>
              <strong>Frete grátis</strong> em compras a partir de {formatBRL(freeShipping)}, na opção indicada no
              atendimento.
            </li>
          )}
          <li>
            O prazo começa a contar depois da <strong>confirmação do pagamento</strong>. Pix é confirmado na hora;
            cartão, normalmente em poucos minutos.
          </li>
          <li>Separamos e embalamos em até 2 dias úteis após a confirmação.</li>
        </ul>
      </section>

      <section>
        <h2>3. Embalagem</h2>
        <p>
          Perfume viaja protegido: o frasco vai na caixa original, envolto em material de proteção, dentro de uma
          caixa de envio resistente e lacrada. Sem nenhuma identificação do conteúdo do lado de fora.
        </p>
      </section>

      <section>
        <h2>4. Rastreamento</h2>
        <p>
          Assim que o pedido é postado, você recebe o código de rastreio pelo WhatsApp para acompanhar a entrega.
        </p>
      </section>

      <section>
        <h2>5. Se algo der errado</h2>
        <ul>
          <li>
            <strong>Ninguém em casa:</strong> a transportadora tenta novamente ou deixa o pacote em um ponto de
            retirada, avisando pelo rastreio.
          </li>
          <li>
            <strong>Pacote atrasado ou extraviado:</strong> fale com a gente - acionamos a transportadora e, se o
            pacote não for localizado, reenviamos o pedido ou devolvemos o valor integral.
          </li>
          <li>
            <strong>Endereço errado:</strong> confira o endereço antes de pagar. Se perceber um erro, avise logo pelo WhatsApp ou em{" "}
            <a href={`mailto:${STORE.contactEmail}`} className="underline">{STORE.contactEmail}</a>; tentamos corrigir
            antes da postagem.
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
