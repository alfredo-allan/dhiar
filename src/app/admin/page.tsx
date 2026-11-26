import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: pageTitle("Painel"),
  description: "Catálogo, preços e fotos da loja.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
