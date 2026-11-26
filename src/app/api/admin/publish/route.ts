import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CATALOG_PATH, publishMode } from "@/lib/serverConfig";
import { commitFiles, ConflictError } from "@/lib/github";
import { validateCatalog } from "@/lib/catalogValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4_000_000; // corpo das funções da Vercel vai até ~4,5 MB

/**
 * Publica o catálogo: valida, grava `content/catalog.json` e faz o commit no
 * GitHub (produção) ou grava o arquivo direto (desenvolvimento).
 * A sessão do admin é conferida pelo `src/proxy.ts` antes de chegar aqui.
 */
export async function POST(req: Request) {
  const mode = publishMode();
  if (mode === "none") {
    return NextResponse.json(
      { error: "Publicação não configurada. Defina GITHUB_TOKEN e GITHUB_REPO nas variáveis de ambiente da Vercel." },
      { status: 503 },
    );
  }
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "Catálogo grande demais para um envio." }, { status: 413 });

  let body: { catalog?: unknown; message?: string; baseSha?: string | null };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const checked = validateCatalog(body.catalog);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const catalog = { ...checked.catalog, updatedAt: new Date().toISOString() };
  const content = JSON.stringify(catalog, null, 1) + "\n";
  const summary = (typeof body.message === "string" && body.message.trim().slice(0, 300)) || "Atualiza o catálogo";

  try {
    if (mode === "github") {
      const result = await commitFiles(
        [{ path: CATALOG_PATH, content }],
        `Admin: ${summary}\n\nPublicado pelo painel da DHIAR.`,
        body.baseSha ?? null,
      );
      return NextResponse.json({ ok: true, mode, commit: result.sha, url: result.url, updatedAt: catalog.updatedAt });
    }
    await writeFile(join(process.cwd(), "content", "catalog.json"), content, "utf8");
    return NextResponse.json({ ok: true, mode, commit: null, updatedAt: catalog.updatedAt });
  } catch (e) {
    if (e instanceof ConflictError) {
      return NextResponse.json(
        { error: "O catálogo foi alterado em outro lugar (outra aba ou outra pessoa). Recarregue para trazer a versão nova - suas alterações pendentes continuam guardadas.", code: "conflict", headSha: e.headSha },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Falha ao publicar." }, { status: 502 });
  }
}
