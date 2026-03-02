import { ArrowRight, Sparkles } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import Image from "next/image"

// Fonction pour récupérer les données Hero depuis la base de données
async function getHeroContent() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000"
    const response = await fetch(`${baseUrl}/api/hero-content`)

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des données")
    }

    const result = await response.json()

    if (result.success) {
      return result.data
    }

    return null
  } catch (error) {
    // Erreur silencieuse pour le contenu Hero
    return null
  }
}

export default async function HeroSection() {
  const t = await getTranslations("HomePage")
  const locale = await getLocale()

  // Récupérer les données depuis la base de données
  const heroData = await getHeroContent()

  // Données par défaut (fallback)
  const HeroSectionContent = heroData || {
    title: {
      ar: "اكتشف إكسسوارات الخياطة عالية الجودة لدينا",
      fr: "Découvrez nos accessoires de couture de qualité"
    },
    description: {
      ar: "خيوط، إبر، مقصات وكل ما تحتاجه لمشاريع الخياطة. توصيل سريع وموثوق.",
      fr: "Fils, aiguilles, ciseaux et tout le nécessaire pour vos projets de couture. Livraison rapide et fiable."
    },
    button: {
      ar: "شاهد منتجاتنا",
      fr: "Voir nos produits"
    },
    images: [
      "https://static.mapetitemercerie.com/56855-large_default/mannequin-de-couture-prymadonna-multi-taille-s.jpg",
      "https://static.mapetitemercerie.com/200778-large_default/fil-macaroni-coton-recycle-cachou-100m.jpg",
      "https://static.mapetitemercerie.com/191023-large_default/aiguille-circulaire-bois-d-erable-80-cm-n15.jpg",
      "https://static.mapetitemercerie.com/242692-large_default/boutons-pressions-15-mm-outillage-couture-loisirs.jpg"
    ]
  }

  const firstImage = HeroSectionContent.images?.[0]

  return (
    <section className="relative min-h-[90vh] lg:min-h-screen overflow-hidden bg-paletteCream">
      {/* Background image façon Ladurée */}
      {firstImage && (
        <div className="absolute inset-0">
          <Image
            src={firstImage}
            alt={HeroSectionContent.title[locale as "fr" | "ar"]}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Contenu centré */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[90vh] px-4">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-firstColor/30 rounded-full text-[11px] tracking-[0.35em] uppercase text-gray-700">
            <Sparkles className="w-3 h-3" />
            <span>Sweet Macaron</span>
          </div>
        </div>

        <h1 className="font-lux text-3xl sm:text-4xl lg:text-5xl xl:text-[3.4rem] text-white leading-tight mb-4 max-w-3xl">
          {HeroSectionContent.title[locale as "fr" | "ar"]}
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-white max-w-2xl mx-auto mb-6">
          {HeroSectionContent.description[locale as "fr" | "ar"]}
        </p>

        <p className="uppercase tracking-[0.35em] text-[11px] text-white mb-8">
          {t("sinceLabel", { year: 2023 })}
        </p>

        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3 bg-white/90 text-gray-900 hover:text-white border border-firstColor/40 rounded-full text-sm font-semibold tracking-wide hover:bg-firstColor/10 hover:border-firstColor transition-colors duration-300"
        >
          {HeroSectionContent.button[locale as "fr" | "ar"]}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
