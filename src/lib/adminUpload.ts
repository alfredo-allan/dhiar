"use client";

import { upload } from "@vercel/blob/client";

/** Reduz a foto no navegador (máx. 1600 px, WebP) antes de enviar - fotos de celular chegam com 5-10 MB. */
async function shrink(file: File, maxDimension = 1600): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  return blob ?? file;
}

/**
 * Envia uma foto de produto e devolve o endereço público.
 * - "blob": direto do navegador para o Vercel Blob (a rota só autoriza);
 * - "local": grava em public/uploads/produtos (desenvolvimento).
 */
export async function uploadProductImage(file: File, slug: string, storage: "blob" | "local" | "none"): Promise<string> {
  if (storage === "none") {
    throw new Error("Envio de fotos não configurado: conecte um Vercel Blob ao projeto (BLOB_READ_WRITE_TOKEN).");
  }
  const image = await shrink(file);
  const name = `${slug || "produto"}.webp`;
  if (storage === "blob") {
    const result = await upload(`produtos/${name}`, image, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      contentType: "image/webp",
    });
    return result.url;
  }
  const form = new FormData();
  form.append("file", new File([image], name, { type: "image/webp" }));
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Falha no envio da foto.");
  return data.url;
}
