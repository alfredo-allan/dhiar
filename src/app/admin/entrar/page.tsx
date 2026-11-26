import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin/AdminLogin";

export const metadata: Metadata = {
  title: pageTitle("Entrar no painel"),
  robots: { index: false, follow: false },
};

/** Só aceita voltar para dentro do painel (nunca para outro site). */
function safeNext(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  return path && path.startsWith("/admin") && !path.startsWith("//") ? path : "/admin";
}

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/entrar">) {
  const params = await searchParams;
  return <AdminLogin next={safeNext(params.next)} />;
}
