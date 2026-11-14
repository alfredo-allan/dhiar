import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/WishlistView";

export const metadata: Metadata = {
  title: pageTitle("Curtidos"),
  description: "Os produtos que você curtiu ou salvou como favoritos.",
};

export default function WishlistPage() {
  return <WishlistView />;
}
