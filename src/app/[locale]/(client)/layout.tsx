import type { Metadata } from "next"
import "@/app/globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import WhatsAppButton from "@/components/WhatsAppButton"
import SocialMediaCard from "@/components/contact/SocialMediaCard"
import { CartProvider } from "../../context/CartContext"
import { ReactNode, ReactElement } from "react"

export const metadata: Metadata = {
  metadataBase: new URL("https://sweet-macaron.ma"), // mets ici ton vrai domaine
  title: "Sweet Macaron – Macarons & pâtisseries fines",
  description:
    "Sweet Macaron, spécialiste des macarons et pâtisseries fines au Maroc. Recettes artisanales, ingrédients de qualité, commandes personnalisées pour vos événements et livraison rapide.",
  keywords: [
    "macarons",
    "pâtisserie",
    "pâtisserie fine",
    "gâteaux",
    "desserts",
    "macarons Maroc",
    "commande macarons",
    "pâtisserie en ligne",
    "anniversaire",
    "mariage",
    "événements"
  ],
  openGraph: {
    title: "Sweet Macaron – Macarons & pâtisseries fines",
    description:
      "Découvrez nos macarons artisanaux et pâtisseries fines, préparés avec soin pour toutes vos occasions.",
    url: "https://sweet-macaron.ma",
    siteName: "Sweet Macaron",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/puck.jpg", // ou une image dédiée OG dans /public, ex: "/og-macaron.jpg"
        width: 1200,
        height: 630,
        alt: "Plateau de macarons colorés Sweet Macaron"
      }
    ]
  }, 
  twitter: {
    card: "summary_large_image",
    title: "Sweet Macaron – Macarons & pâtisseries fines",
    description:
      "Macarons colorés, pâtisseries élégantes et livraison pour toutes vos occasions.",
    images: ["/puck.jpg"] // même image que ci‑dessus
  }
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
