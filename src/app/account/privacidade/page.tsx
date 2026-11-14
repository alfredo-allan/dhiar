import type { Metadata } from "next";
import { pageTitle } from "@/lib/store";
import { PrivacyCenter } from "@/components/account/PrivacyCenter";

export const metadata: Metadata = {
  title: pageTitle("Privacidade e meus dados"),
  robots: { index: false },
};

export default function AccountPrivacyPage() {
  return <PrivacyCenter />;
}
