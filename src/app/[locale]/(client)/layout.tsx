import type { Metadata } from "next"
import "@/app/globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import WhatsAppButton from "@/components/WhatsAppButton"
import SocialMediaCard from "@/components/contact/SocialMediaCard"
import { CartProvider } from "../../context/CartContext"
import { ReactNode, ReactElement } from "react"

export const metadata: Metadata = {
  title: "Sweet Macaron",
  description:
    "Votre spécialiste en accessoires de couture au Maroc. Fils, aiguilles, ciseaux, machines à coudre et fournitures de qualité. Livraison rapide, conseils d'experts et service client 7j/7.",
  keywords: [
    "accessoires couture",
    "fournitures couture Maroc",
    "fils à coudre",
    "aiguilles couture",
    "ciseaux couture",
    "machines à coudre",
    "mercerie en ligne",
    "couture Maroc",
    "DIY couture",
    "matériel couture"
  ]
}

export default async function ClientLayout({
  children
}: {
  children: ReactNode
}): Promise<ReactElement> {
  return (
    <CartProvider>
      <Header />
      <div className="min-h-screen md:mt-5">{children}</div>
      <SocialMediaCard />
      <WhatsAppButton />
      <Footer />
    </CartProvider>
  )
}
