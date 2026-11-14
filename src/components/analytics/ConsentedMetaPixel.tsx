"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { consentStore, hasValidConsent } from "@/lib/consent";
import { STORE } from "@/lib/store";
import { MetaPixelRouteTracker } from "./MetaPixelRouteTracker";

/**
 * Meta Pixel SÓ depois do consentimento de marketing (LGPD) e só se houver
 * `NEXT_PUBLIC_META_PIXEL_ID`. Antes disso, nenhum script de terceiro
 * carrega e nenhum cookie de rastreamento é criado.
 */
export function ConsentedMetaPixel() {
  const consent = useSyncExternalStore(consentStore.subscribe, consentStore.getSnapshot, consentStore.getServerSnapshot);
  if (!STORE.metaPixelId || !hasValidConsent(consent) || !consent.marketing) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${STORE.metaPixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <MetaPixelRouteTracker />
    </>
  );
}
