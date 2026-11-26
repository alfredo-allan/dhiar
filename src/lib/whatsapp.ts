import { STORE } from "@/lib/store";
import { formatBRL } from "@/lib/format";
import type { CartItem } from "@/types";

/**
 * Pedido e atendimento pelo WhatsApp. O número vem de
 * `NEXT_PUBLIC_STORE_WHATSAPP` (só dígitos, com DDI e DDD: 5511999998888).
 *
 * O preço que aparece na mensagem é o da vitrine; o valor final (frete,
 * forma de pagamento) é combinado na conversa.
 */

export function whatsappNumber(): string {
  return STORE.whatsapp.replace(/\D/g, "");
}

export function isWhatsAppConfigured(): boolean {
  return whatsappNumber().length >= 12;
}

/** Link `wa.me` com a mensagem já escrita (abre o app no celular ou o WhatsApp Web). */
export function whatsappUrl(message: string): string {
  const number = whatsappNumber();
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

export interface OrderContact {
  name?: string;
  cep?: string;
  note?: string;
}

/** Mensagem do pedido a partir da sacola. */
export function orderMessage(
  items: CartItem[],
  options: { pixDiscountPercent?: number; contact?: OrderContact; siteUrl?: string } = {},
): string {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const lines = items.map((item, index) => {
    const volume = item.variantLabel ? ` - ${item.variantLabel}` : "";
    const link = options.siteUrl ? `\n   ${options.siteUrl}/p/${item.slug}` : "";
    return `${index + 1}. ${item.quantity}x ${item.title}${volume}\n   ${formatBRL(item.price)} cada${link}`;
  });
  const pix = options.pixDiscountPercent
    ? `\nNo Pix (${options.pixDiscountPercent}% off): ${formatBRL(subtotal * (1 - options.pixDiscountPercent / 100))}`
    : "";
  const contact = options.contact ?? {};
  const extra = [
    contact.name ? `Nome: ${contact.name}` : "",
    contact.cep ? `CEP para o frete: ${contact.cep}` : "",
    contact.note ? `Observação: ${contact.note}` : "",
  ].filter(Boolean);

  return [
    `Olá, ${STORE.name}! Quero fazer este pedido:`,
    "",
    ...lines,
    "",
    `Subtotal: ${formatBRL(subtotal)}${pix}`,
    ...(extra.length ? ["", ...extra] : []),
    "",
    "Pode me passar o valor do frete e as formas de pagamento?",
  ].join("\n");
}

/** "Tenho interesse" / "avise-me quando chegar" de um produto. */
export function productMessage(
  product: { title: string; slug: string },
  options: { variantLabel?: string | null; unavailable?: boolean; siteUrl?: string } = {},
): string {
  const volume = options.variantLabel ? ` (${options.variantLabel})` : "";
  const link = options.siteUrl ? `\n${options.siteUrl}/p/${product.slug}` : "";
  return options.unavailable
    ? `Olá! Quero ser avisado(a) quando o ${product.title}${volume} voltar ao estoque.${link}`
    : `Olá! Tenho interesse no ${product.title}${volume}. Pode me ajudar?${link}`;
}
