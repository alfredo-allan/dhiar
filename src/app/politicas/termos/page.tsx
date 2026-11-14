import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { STORE, pageTitle } from "@/lib/store";

export const metadata: Metadata = {
  title: pageTitle("Termos de Uso"),
};

/** MODELO de termos de uso (CDC + Decreto 7.962/2013). Revisar com advogado. */
export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso" updatedAt={STORE.policyVersion}>
      <section>
        <h2>1. Sobre a loja</h2>
        <p>
          {STORE.legalName || STORE.name}
          {STORE.cnpj ? `, CNPJ ${STORE.cnpj}` : ""}. Contato: {STORE.contactEmail}.
        </p>
      </section>
      <section>
        <h2>2. Produtos</h2>
        <p>
          Vendemos perfumes e cosméticos originais. Fotos são ilustrativas; volume, concentração e notas estão descritos em
          cada produto. Produtos &quot;tester&quot; podem vir sem caixa ou tampa, conforme indicado na página.
        </p>
      </section>
      <section>
        <h2>3. Preços e pagamento</h2>
        <p>
          Os preços valem no momento da compra. O desconto no Pix é aplicado no fechamento do pedido. Pedidos via Pix não
          pagos no prazo exibido são cancelados automaticamente.
        </p>
      </section>
      <section>
        <h2>4. Entrega</h2>
        <p>Prazo e valor do frete são informados antes do pagamento e contam a partir da aprovação.</p>
      </section>
      <section>
        <h2>5. Trocas e arrependimento</h2>
        <p>
          Você pode desistir em até 7 dias do recebimento. Veja a{" "}
          <Link href="/politicas/trocas-e-devolucoes" className="underline">Política de Trocas e Devoluções</Link>.
        </p>
      </section>
      <section>
        <h2>6. Privacidade</h2>
        <p>
          O tratamento de dados segue a <Link href="/politicas/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
