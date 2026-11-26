"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/hooks/useCart";
import { CartLineItem } from "./CartLineItem";
import { formatBRL } from "@/lib/format";
import { STORE } from "@/lib/store";
import { isWhatsAppConfigured, orderMessage, whatsappUrl } from "@/lib/whatsapp";
import { ChatIcon } from "@/components/product/WhatsAppButton";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/**
 * Sacola: revisa os itens e fecha o pedido pelo WhatsApp.
 *
 * O botão monta a mensagem com cada perfume (volume, quantidade, preço),
 * subtotal e o valor no Pix; nome, CEP e observação são opcionais e entram
 * na mensagem se preenchidos. Frete e forma de pagamento são combinados na
 * conversa. Nada sai do aparelho antes do clique, e não é preciso conta.
 */
export function CartView({ pixDiscountPercent = 0 }: { pixDiscountPercent?: number }) {
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const [name, setName] = useState("");
  const [cep, setCep] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const pixTotal = totalAmount * (1 - pixDiscountPercent / 100);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const message = orderMessage(items, {
      pixDiscountPercent,
      contact: { name: name.trim(), cep: cep.trim(), note: note.trim() },
      siteUrl: SITE_URL,
    });
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-3xl">Sua sacola está vazia</p>
        <p className="text-sm text-muted">Escolha seus perfumes e feche o pedido pelo WhatsApp em poucos toques.</p>
        <Link
          href="/shop/todos"
          className="mt-2 inline-flex min-h-12 items-center rounded-full bg-accent px-7 text-sm font-semibold uppercase tracking-[0.14em] text-accent-ink hover:bg-accent-strong"
        >
          Ver perfumes
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-app border border-line bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-muted focus:border-accent";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">
          Início
        </Link>{" "}
        / <span className="text-foreground">Sacola</span>
      </nav>
      <h1 className="font-display text-4xl">Sua sacola</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <div className="flex flex-col divide-y divide-line border-t border-line">
          {items.map((item) => (
            <CartLineItem
              key={`${item.productId}-${item.color}-${item.size}`}
              item={item}
              onIncrease={() => updateQuantity(item.productId, item.color, item.size, item.quantity + 1)}
              onDecrease={() => updateQuantity(item.productId, item.color, item.size, item.quantity - 1)}
              onRemove={() => removeItem(item.productId, item.color, item.size)}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-app border border-line bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Resumo</h2>
            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatBRL(totalAmount)}</dd>
              </div>
              {pixDiscountPercent > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">No Pix ({pixDiscountPercent}% off)</dt>
                  <dd className="font-semibold text-success">{formatBRL(pixTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Frete</dt>
                <dd className="text-right text-muted">combinado no WhatsApp</dd>
              </div>
            </dl>
          </div>

          <fieldset className="flex flex-col gap-3 rounded-app border border-line p-5">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              Para agilizar (opcional)
            </legend>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Seu nome" aria-label="Seu nome" className={inputClass} autoComplete="name" />
            <input
              value={cep}
              onChange={(e) => setCep(formatCep(e.target.value))}
              inputMode="numeric"
              placeholder="CEP para calcular o frete"
              aria-label="CEP"
              className={inputClass}
              autoComplete="postal-code"
            />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} rows={2} placeholder="Observação (ex.: é para presente)" aria-label="Observação" className={`${inputClass} resize-none`} />
          </fieldset>

          <button
            type="submit"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-accent px-6 text-sm font-semibold uppercase tracking-[0.14em] text-accent-ink transition-[background-color,transform] hover:bg-accent-strong active:scale-[0.97]"
          >
            <ChatIcon className="h-5 w-5" />
            Finalizar pelo WhatsApp
          </button>
          <p className="text-center text-xs leading-relaxed text-muted">
            {sent
              ? "Abrimos o WhatsApp com o seu pedido. É só tocar em enviar por lá - respondemos com o frete e as formas de pagamento."
              : `O pedido vai como mensagem para a ${STORE.name}. Lá combinamos frete, pagamento (Pix ou cartão) e entrega.`}
          </p>
          {!isWhatsAppConfigured() && (
            <p className="rounded-app border border-danger/40 p-3 text-xs text-danger">
              Configuração pendente: defina NEXT_PUBLIC_STORE_WHATSAPP (ex.: 5511999998888) na Vercel.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
