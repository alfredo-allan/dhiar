'use client'

import { STORE } from "@/lib/store";
import { whatsappUrl } from "@/lib/whatsapp";
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faTiktok, faPinterest } from '@fortawesome/free-brands-svg-icons'
import { ContactModal } from './ContactModal'
import { DhiarWordmark } from '@/components/brand/DhiarWordmark'

// Ícones dimensionados só pelas nossas classes (sem o <style> automático do FontAwesome).
config.autoAddCss = false

interface FooterLink {
  label: string
  href?: string
  /** Abre em nova aba (sites externos, como o rastreio). */
  external?: boolean
  /** "Contato" abre o <ContactModal/> em vez de navegar. */
  isContactTrigger?: boolean
}

interface FooterSection {
  id: string
  title: string
  links: FooterLink[]
}

const sections: FooterSection[] = [
  {
    id: 'loja',
    title: 'Loja',
    links: [
      { label: 'Todos os perfumes', href: '/shop/todos' },
      { label: 'Mais vendidos', href: '/shop/todos?sort=best_sellers' },
      { label: 'Novidades', href: '/shop/todos?sort=newest' },
      { label: 'Perfumes árabes', href: '/shop/perfumes-arabes' },
      { label: 'Kits', href: '/shop/kits-de-perfumes' },
    ],
  },
  {
    id: 'ajuda',
    title: 'Ajuda',
    links: [
      { label: 'Contato', isContactTrigger: true },
      { label: 'Pedir pelo WhatsApp', href: whatsappUrl(`Olá, ${STORE.name}! Vim pelo site e queria uma ajuda.`), external: true },
      { label: 'Trocas e devoluções', href: '/politicas/trocas-e-devolucoes' },
      { label: 'Envio e entrega', href: '/politicas/envio-e-entrega' },
    ],
  },
  {
    id: 'politicas',
    title: 'Políticas',
    links: [
      { label: 'Pagamento e segurança', href: '/politicas/pagamento-e-seguranca' },
      { label: 'Política de privacidade', href: '/politicas/privacidade' },
      { label: 'Termos de uso', href: '/politicas/termos' },
    ],
  },
]

// Redes vêm de NEXT_PUBLIC_STORE_* - só aparece o que estiver preenchido.
const socials = [
  { label: 'Instagram', href: STORE.instagram, icon: faInstagram },
  { label: 'TikTok', href: STORE.tiktok, icon: faTiktok },
  { label: 'Pinterest', href: process.env.NEXT_PUBLIC_STORE_PINTEREST ?? '', icon: faPinterest },
].filter((social) => social.href)

function TrustItem({ icon, title, children }: { icon: ReactNode; title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{children}</p>
      </div>
    </div>
  )
}

const iconProps = { viewBox: '0 0 24 24', className: 'h-5 w-5', fill: 'none', 'aria-hidden': true } as const

/**
 * Rodapé da DHIAR.
 * - Faixa de confiança no topo: pedido pelo WhatsApp, envio para todo o
 *   Brasil e compra protegida (originais, HTTPS/LGPD).
 * - Marca + redes, e três colunas (Loja, Ajuda, Políticas); no celular as
 *   colunas viram acordeão.
 * - Formas de pagamento escritas por extenso (sem logos de bandeiras) e a linha
 *   legal (razão social/CNPJ).
 */
export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [isContactOpen, setIsContactOpen] = useState(false)

  return (
    <footer className="relative border-t border-line bg-[#0b0b0c] px-4 pb-8 pt-12 text-sm text-muted md:px-8">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="mx-auto max-w-[1200px]">
        {/* faixa de confiança */}
        <div className="grid gap-6 rounded-app border border-line bg-surface/60 p-5 sm:grid-cols-3 sm:gap-8 sm:p-6">
          <TrustItem
            icon={
              <svg {...iconProps}>
                <path d="M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M12 15v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            }
            title={<span>Pedido pelo WhatsApp</span>}
          >
            Monte a sacola e envie o pedido: combinamos frete, Pix com desconto ou cartão e entrega direto com você.{' '}
            <Link href="/politicas/pagamento-e-seguranca" className="text-foreground/80 underline underline-offset-2 hover:text-accent">
              Como funciona
            </Link>
          </TrustItem>
          <TrustItem
            icon={
              <svg {...iconProps}>
                <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="7" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            }
            title={<span>Envio para todo o Brasil</span>}
          >
            Com código de rastreio e embalagem que protege o frasco.{' '}
            <Link href="/politicas/envio-e-entrega" className="text-foreground/80 underline underline-offset-2 hover:text-accent">
              Prazos e frete
            </Link>
          </TrustItem>
          <TrustItem
            icon={
              <svg {...iconProps}>
                <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title={<span>Compra protegida</span>}
          >
            Perfumes 100% originais, site criptografado (HTTPS), dados tratados conforme a LGPD e 7 dias para
            desistir.{' '}
            <Link href="/politicas/trocas-e-devolucoes" className="text-foreground/80 underline underline-offset-2 hover:text-accent">
              Trocas
            </Link>
          </TrustItem>
        </div>

        <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
          {/* marca */}
          <div className="max-w-xs">
            <Link href="/" aria-label={`${STORE.name} - página inicial`} className="inline-block text-foreground">
              <DhiarWordmark tone="current" className="h-7 w-auto" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              Perfumes originais das grandes casas, com curadoria e entrega para todo o Brasil.
            </p>
            {socials.length > 0 && (
              <div className="mt-5 flex items-center gap-3">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-foreground/80 transition-colors hover:border-accent hover:text-accent"
                  >
                    <FontAwesomeIcon icon={social.icon} className="h-4 w-4" aria-hidden />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* colunas (acordeão no celular) */}
          <div className="flex flex-col sm:flex-row sm:gap-12 lg:gap-20">
            {sections.map((section) => {
              const isOpen = openSection === section.id
              return (
                <div key={section.id} className="border-b border-line sm:border-none">
                  <button
                    type="button"
                    onClick={() => setOpenSection((current) => (current === section.id ? null : section.id))}
                    aria-expanded={isOpen}
                    className="flex min-h-12 w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:pointer-events-none sm:mb-4 sm:min-h-0"
                  >
                    {section.title}
                    <span className="text-lg text-foreground/60 sm:hidden" aria-hidden>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  <ul
                    className={`flex flex-col gap-3 overflow-hidden transition-all sm:max-h-none sm:overflow-visible sm:pb-0 ${
                      isOpen ? 'max-h-96 pb-5' : 'max-h-0'
                    }`}
                  >
                    {section.links.map((link) => (
                      <li key={link.label}>
                        {link.isContactTrigger ? (
                          <button type="button" onClick={() => setIsContactOpen(true)} className="transition-colors hover:text-foreground">
                            {link.label}
                          </button>
                        ) : link.external ? (
                          <a href={link.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href ?? '/'} className="transition-colors hover:text-foreground">
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        {/* formas de pagamento + linha legal */}
        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-xs lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap gap-2" aria-label="Formas de pagamento">
            {['Pix', 'Cartão de crédito'].map((method) => (
              <li key={method} className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-foreground/70">
                {method}
              </li>
            ))}
          </ul>
          <p>
            &copy; {new Date().getFullYear()} {STORE.legalName || STORE.name}
            {STORE.cnpj ? ` · CNPJ ${STORE.cnpj}` : ''}. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <ContactModal open={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </footer>
  )
}
