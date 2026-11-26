import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminOpenInDev, isAdminRequest } from "@/lib/adminAuth";
import { publishMode, storageMode } from "@/lib/serverConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const admin = await isAdminRequest(jar.get(ADMIN_COOKIE)?.value);
  const headers = { "Cache-Control": "no-store" };
  if (!admin) return NextResponse.json({ admin: false }, { headers });
  return NextResponse.json(
    {
      admin: true,
      devOpen: adminOpenInDev(),
      publish: publishMode(),
      storage: storageMode(),
      repo: process.env.GITHUB_REPO ?? null,
      branch: process.env.GITHUB_BRANCH || "main",
      // commit que está no ar (a Vercel expõe esta variável sozinha)
      deployedCommit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    },
    { headers },
  );
}
