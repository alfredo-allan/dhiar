import { STORE } from "@/lib/store";
import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";

export const metadata: Metadata = {
  title: pageTitle("Entrar"),
  description: `Entre na sua conta ou crie uma nova conta ${STORE.name}.`,
};

export default function LoginPage() {
  return <LoginView />;
}
