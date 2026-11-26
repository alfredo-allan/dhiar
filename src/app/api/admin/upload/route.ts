import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { storageMode } from "@/lib/serverConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Fotos de produto.
 * - Produção (Vercel Blob): o navegador envia o arquivo direto para o Blob;
 *   aqui só autorizamos (pasta "produtos/", só imagens, até 8 MB).
 * - Desenvolvimento: grava em public/uploads/produtos para você testar.
 * A sessão do admin é conferida pelo `src/proxy.ts`.
 */
export async function POST(req: Request) {
  const mode = storageMode();

  if (mode === "blob") {
    try {
      const body = (await req.json()) as HandleUploadBody;
      const json = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          if (!pathname.startsWith("produtos/")) throw new Error("Pasta não permitida.");
          return {
            allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
            maximumSizeInBytes: MAX_IMAGE_BYTES,
            addRandomSuffix: true,
          };
        },
      });
      return NextResponse.json(json);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Falha no envio." }, { status: 400 });
    }
  }

  if (mode === "local") {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Envie uma imagem de até 8 MB." }, { status: 400 });
    }
    const ext = file.type === "image/png" ? ".png" : file.type === "image/jpeg" ? ".jpg" : ".webp";
    const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const dir = join(process.cwd(), "public", "uploads", "produtos");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/produtos/${name}` });
  }

  return NextResponse.json(
    { error: "Envio de fotos não configurado. Conecte um Vercel Blob ao projeto (cria BLOB_READ_WRITE_TOKEN)." },
    { status: 503 },
  );
}
