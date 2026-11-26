import { notFound, redirect } from "next/navigation";
import { getProductBySlug } from "@/lib/products";

/** Link curto de produto (usado nas mensagens de WhatsApp): /p/<slug> -> página do produto. */
export default async function ShortProductLink({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  redirect(`/shop/${product.category}/${product.slug}`);
}
