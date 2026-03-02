import { Metadata } from "next"
import CheckoutPage from "@/components/Checkout/checkoutPage"

export const metadata: Metadata = {
  title: "Finaliser ma Commande | Accessoires de Couture Premium",
  description:
    "Finalisez votre commande d'accessoires de couture en toute sécurité. Paiement sécurisé et livraison rapide.",
  robots: "noindex, follow", // Pas d'indexation pour les pages de checkout
  alternates: {
    canonical: "/checkout"
  }
}

export default function CheckoutPageRoute() {
  return <CheckoutPage />
}
