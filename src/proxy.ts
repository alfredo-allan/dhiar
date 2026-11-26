import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isAdminRequest } from "@/lib/adminAuth";

/**
 * Portão do painel admin (no Next 16 o "middleware" se chama `proxy`).
 * Protege /admin e todas as rotas /api/admin/* - menos login, sessão e
 * saída. Sem sessão válida: páginas vão para /admin/entrar, APIs recebem 401.
 */
const OPEN_API = ["/api/admin/login", "/api/admin/session", "/api/admin/logout"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (OPEN_API.includes(pathname) || pathname === "/admin/entrar") return NextResponse.next();

  const ok = await isAdminRequest(request.cookies.get(ADMIN_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/admin/entrar";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
