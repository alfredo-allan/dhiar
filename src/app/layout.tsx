import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { ConsentBanner } from "@/components/legal/ConsentBanner";
import { ConsentedMetaPixel } from "@/components/analytics/ConsentedMetaPixel";
import { STORE, storageKey } from "@/lib/store";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { EntryGate } from "@/components/entry/EntryGate";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // As páginas já montam "Título — Loja" com `pageTitle()`; aqui só o padrão.
  title: STORE.name,
  description: STORE.tagline,
  openGraph: { siteName: STORE.name, locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b0b0c" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

// Chave do portal de entrada (mesma de `@/lib/entry`, sem importar código client).
const ENTRY_KEY = storageKey("entry-seen");

// O site é só tema escuro (classe `dark` fixa no <html>). Este script só
// marca o portal de entrada como visto antes da primeira pintura.
const themeInitScript = `
  (function () {
    try {
      if (window.sessionStorage.getItem(${JSON.stringify(ENTRY_KEY)}) === "1") {
        document.documentElement.classList.add("entry-seen");
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className="dark h-full antialiased" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteBackdrop />
        <Providers>
          <SiteChrome>{children}</SiteChrome>
          <EntryGate />
          <ConsentBanner />
          <ConsentedMetaPixel />
        </Providers>
      </body>
    </html>
  );
}
