import { NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_DAYS, checkPassword, createSessionToken } from "@/lib/adminAuth";

export const runtime = "nodejs";

// Freio contra chute de senha (melhor esforço: cada instância serverless tem a sua memória).
const attempts = new Map<string, { count: number; until: number }>();

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "O acesso de administrador não está configurado (ADMIN_PASSWORD)." }, { status: 503 });
  }
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const entry = attempts.get(ip);
  if (entry && entry.count >= 5 && entry.until > Date.now()) {
    return NextResponse.json({ error: "Muitas tentativas. Espere alguns minutos e tente de novo." }, { status: 429 });
  }

  let password = "";
  try {
    password = String((await req.json())?.password ?? "");
  } catch {}
  if (!(await checkPassword(password))) {
    const count = (entry && entry.until > Date.now() ? entry.count : 0) + 1;
    attempts.set(ip, { count, until: Date.now() + 10 * 60 * 1000 });
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }
  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}
