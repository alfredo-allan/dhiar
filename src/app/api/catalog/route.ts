import { NextResponse } from "next/server";
import { allProducts } from "@/lib/products";

// Gerado no build (muda a cada publicação do admin = novo deploy).
export const dynamic = "force-static";

/**
 * Catálogo enxuto para o navegador (busca, favoritos, sacola): tudo que o
 * card precisa, sem a descrição longa.
 */
export function GET() {
  const products = allProducts().map((product) => {
    const { description: _description, metaDescription: _meta, ...rest } = product;
    void _description;
    void _meta;
    return rest;
  });
  return NextResponse.json({ products });
}
