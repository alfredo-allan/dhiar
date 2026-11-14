import { STORE } from "@/lib/store";
import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: pageTitle("Minha Conta"),
  description: `Seus dados, pedidos e favoritos na ${STORE.name}.`,
};

export default function AccountPage() {
  return <AccountView />;
}
