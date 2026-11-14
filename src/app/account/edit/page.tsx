import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { AccountEditView } from "@/components/account/AccountEditView";

export const metadata: Metadata = {
  title: pageTitle("Editar Perfil"),
  description: "Atualize sua foto e seus dados cadastrais.",
};

export default function AccountEditPage() {
  return <AccountEditView />;
}
