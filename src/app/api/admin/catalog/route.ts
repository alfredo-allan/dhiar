import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CATALOG_PATH, publishMode } from "@/lib/serverConfig";
import { readFileAtHead } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Catálogo para o painel editar. Com GitHub configurado, lê a versão MAIS
 * RECENTE da branch (pode estar à frente do que está no ar, enquanto a Vercel
 * publica) e devolve o commit-base, para a publicação detectar conflito.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    if (publishMode() === "github") {
      const { content, headSha } = await readFileAtHead(CATALOG_PATH);
      return NextResponse.json({ catalog: JSON.parse(content), baseSha: headSha }, { headers });
    }
    const content = await readFile(join(process.cwd(), "content", "catalog.json"), "utf8");
    return NextResponse.json({ catalog: JSON.parse(content), baseSha: null }, { headers });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Falha ao ler o catálogo." }, { status: 502, headers });
  }
}
