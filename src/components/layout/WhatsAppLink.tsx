'use client'

import { STORE } from '@/lib/store'
import { whatsappUrl } from '@/lib/whatsapp'
import { ChatIcon } from '@/components/product/WhatsAppButton'

/**
 * Atalho para o WhatsApp da loja no topo (no lugar do antigo avatar de
 * login - a loja não tem conta de cliente; atendimento e pedido são por lá).
 */
export function WhatsAppLink() {
  return (
    <a
      href={whatsappUrl(`Olá, ${STORE.name}! Vim pelo site e queria uma ajuda.`)}
      target="_blank"
      rel="noreferrer"
      aria-label={`Falar com a ${STORE.name} no WhatsApp`}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition-colors hover:border-accent hover:text-accent dark:border-neutral-700 dark:text-neutral-300"
    >
      <ChatIcon className="h-4 w-4" />
    </a>
  )
}
