import type { Category } from "@/types";

/**
 * Links de navegação do topo (não filtram por categoria de banco - levam a
 * listagens com filtro/ordenação).
 */
export const categories: Category[] = [
  { id: "todos", label: "Todos os Perfumes", href: "/shop/todos" },
  { id: "novidades", label: "Novidades", href: "/shop/todos?sort=newest" },
  { id: "mais-vendidos", label: "Mais Vendidos", href: "/shop/todos?sort=best_sellers" },
];

/**
 * Categorias de verdade - os `id` batem com `Category.id` no banco (ver
 * `api/seed.py`). Para criar uma nova: cadastre no painel E adicione aqui.
 * `todos` é especial: lista o catálogo inteiro, sem filtro de categoria.
 */
export const popularCategories: Category[] = [
  { id: "todos", label: "Todos os Perfumes", href: "/shop/todos" },
  { id: "perfume-masculino", label: "Masculino", href: "/shop/perfume-masculino" },
  { id: "perfume-feminino", label: "Feminino", href: "/shop/perfume-feminino" },
  { id: "perfume-unissex", label: "Unissex", href: "/shop/perfume-unissex" },
  { id: "perfume-de-nicho", label: "Nicho", href: "/shop/perfume-de-nicho" },
  { id: "perfumes-arabes", label: "Árabes", href: "/shop/perfumes-arabes" },
  { id: "kits-de-perfumes", label: "Kits", href: "/shop/kits-de-perfumes" },
  { id: "perfume-tester", label: "Tester", href: "/shop/perfume-tester" },
  { id: "body-splash", label: "Body Splash", href: "/shop/body-splash" },
];

export const ALL_PRODUCTS_CATEGORY_ID = "todos";

export function getCategoryBySlug(slug: string): Category | undefined {
  return popularCategories.find((category) => category.id === slug);
}
