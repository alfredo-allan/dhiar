import { NextResponse } from "next/server";
import { commitDeployState } from "@/lib/github";
import { publishMode } from "@/lib/serverConfig";

export const dynamic = "force-dynamic";

/** Barra de status: em que pé está o deploy da Vercel para um commit publicado. */
export async function GET(req: Request) {
  const sha = new URL(req.url).searchParams.get("sha") ?? "";
  const headers = { "Cache-Control": "no-store" };
  const live = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  if (!/^[0-9a-f]{7,40}$/.test(sha) || publishMode() !== "github") {
    return NextResponse.json({ state: "unknown", live, url: null }, { headers });
  }
  try {
    const { state, url } = await commitDeployState(sha);
    return NextResponse.json({ state, url, live }, { headers });
  } catch {
    return NextResponse.json({ state: "unknown", live, url: null }, { headers });
  }
}
