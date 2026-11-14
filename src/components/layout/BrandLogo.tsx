import Image from "next/image";
import { STORE } from "@/lib/store";
import { DhiarWordmark } from "@/components/brand/DhiarWordmark";

type Size = "sm" | "md" | "lg";

const IMAGE_HEIGHT: Record<Size, string> = {
  sm: "h-6",
  md: "h-8 sm:h-10",
  lg: "h-10 sm:h-12",
};

const WORDMARK_HEIGHT: Record<Size, string> = {
  sm: "h-4",
  md: "h-5 sm:h-6",
  lg: "h-6 sm:h-7",
};

/**
 * Logo da loja com troca automática claro/escuro. Enquanto a marca não
 * existe em arquivo (`NEXT_PUBLIC_STORE_LOGO_*` vazios), usa o wordmark
 * DHIAR em vetor (`DhiarWordmark`).
 */
export function BrandLogo({ size = "md", priority = false }: { size?: Size; priority?: boolean }) {
  if (STORE.logoOnLight && STORE.logoOnDark) {
    return (
      <>
        <Image
          src={STORE.logoOnLight}
          alt={STORE.name}
          width={500}
          height={200}
          priority={priority}
          className={`block w-auto object-contain dark:hidden ${IMAGE_HEIGHT[size]}`}
        />
        <Image
          src={STORE.logoOnDark}
          alt={STORE.name}
          width={500}
          height={200}
          priority={priority}
          className={`hidden w-auto object-contain dark:block ${IMAGE_HEIGHT[size]}`}
        />
      </>
    );
  }

  // Sem arquivos de logo configurados: wordmark DHIAR em vetor, na cor do
  // texto (funciona no claro e no escuro).
  return <DhiarWordmark tone="current" title={STORE.name} className={`w-auto text-foreground ${WORDMARK_HEIGHT[size]}`} />;
}
