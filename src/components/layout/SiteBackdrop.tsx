/**
 * Fundo da marca (fumaça + madeira) atrás do site inteiro, no tema escuro.
 *
 * É uma camada `position: fixed` (e não `background-attachment: fixed`,
 * que o Safari do iPhone ignora): fica parada enquanto o conteúdo rola, sem
 * custo de repintura. Um véu em degradê por cima garante contraste do texto
 * nas seções de produto. No tema claro a camada some (papel creme).
 *
 * `image-set` entrega a versão de 1280 px em telas pequenas e a de 2400 px
 * no desktop.
 */
export function SiteBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 hidden bg-[#0b0b0c] dark:block">
      <div
        className="absolute inset-0 bg-cover bg-[position:20%_center] opacity-70 sm:bg-left"
        style={{
          backgroundImage:
            "image-set(url('/images/bg-texture-smoke-1280.webp') 1x, url('/images/bg-texture-smoke.webp') 2x)",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,12,0.55)_0%,rgba(11,11,12,0.82)_45%,rgba(11,11,12,0.9)_100%)]" />
    </div>
  );
}
