import Image from "next/image";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Foto do produto com placeholder elegante enquanto a produção de fotos não
 * chega: silhueta de frasco em SVG sobre o tom de superfície da marca, com
 * o mesmo enquadramento da foto real (sem salto de layout quando trocar).
 */
export function ProductImage({ src, alt, sizes, priority, className = "" }: ProductImageProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-b from-surface-2 to-surface ${className}`}
    >
      <svg viewBox="0 0 120 180" className="h-3/5 w-auto text-line" aria-hidden>
        <rect x="48" y="8" width="24" height="22" rx="3" fill="currentColor" />
        <rect x="54" y="30" width="12" height="14" fill="currentColor" opacity="0.7" />
        <rect x="18" y="44" width="84" height="128" rx="14" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="32" y="92" width="56" height="34" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
      </svg>
    </div>
  );
}
