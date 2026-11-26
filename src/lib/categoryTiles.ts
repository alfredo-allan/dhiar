/**
 * Atalhos de categoria da home. Fica fora do componente ("use client") para a
 * página (server) também poder ler a lista e buscar capa e contagem de cada uma.
 */
export const CATEGORY_TILES = [
  { slug: "perfume-masculino", label: "Masculino", hint: "Amadeirados, aromáticos, frescos" },
  { slug: "perfume-feminino", label: "Feminino", hint: "Florais, gourmands, frutados" },
  { slug: "perfumes-arabes", label: "Árabes", hint: "Oud, âmbar e especiarias" },
  { slug: "perfume-de-nicho", label: "Nicho", hint: "Raros e autorais" },
] as const;
