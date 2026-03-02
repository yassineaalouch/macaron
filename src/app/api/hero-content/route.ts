// app/api/hero-content/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import HeroContent from "@/models/HeroContent"

interface HeroContentData {
  title: {
    ar: string
    fr: string
  }
  description: {
    ar: string
    fr: string
  }
  button: {
    ar: string
    fr: string
  }
  images: string[]
  socialLinks: Array<{
    id: string
    url: string
    icon: string
    className: string
    name: string
    isActive: boolean
    order: number
  }>
}

interface ValidationError extends Error {
  name: "ValidationError"
  errors: {
    [key: string]: {
      message: string
    }
  }
}

function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ValidationError"
  )
}

// GET - Récupérer le contenu Hero (un seul document)
export async function GET() {
  try {
    await connectToDatabase()

    // Récupérer le document unique
    let heroContent = await HeroContent.findOne({ singleton: "hero_content" })

    // Si aucun document n'existe, créer les données par défaut
    if (!heroContent) {
      const defaultContent = {
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
        ],
        socialLinks: [
          {
            id: "1",
            url: "https://facebook.com/strassshop",
            icon: "Facebook",
            className: "text-blue-600 hover:text-blue-800",
            name: "Facebook",
            isActive: true,
            order: 1
          },
          {
            id: "2",
            url: "https://twitter.com/strassshop",
            icon: "Twitter",
            className: "text-black hover:text-gray-700",
            name: "Twitter",
            isActive: true,
            order: 2
          },
          {
            id: "3",
            url: "https://instagram.com/strassshop",
            icon: "Instagram",
            className: "text-pink-500 hover:text-pink-700",
            name: "Instagram",
            isActive: true,
            order: 3
          },
          {
            id: "4",
            url: "https://youtube.com/strassshop",
            icon: "Youtube",
            className: "text-red-600 hover:text-red-800",
            name: "YouTube",
            isActive: true,
            order: 4
          },
          {
            id: "5",
            url: "https://linkedin.com/company/strassshop",
            icon: "Linkedin",
            className: "text-blue-700 hover:text-blue-900",
            name: "LinkedIn",
            isActive: false,
            order: 5
          }
        ],
        singleton: "hero_content"
      }

      heroContent = await HeroContent.create(defaultContent)
    }

    return NextResponse.json(
      { success: true, data: heroContent },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération du contenu Hero:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour le contenu Hero (un seul document)
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = (await request.json()) as HeroContentData

    // Validation des données
    if (!body.title || !body.description || !body.button || !body.images) {
      return NextResponse.json(
        { success: false, message: "Données manquantes" },
        { status: 400 }
      )
    }

    if (body.images.length === 0) {
      return NextResponse.json(
        { success: false, message: "Au moins une image est requise" },
        { status: 400 }
      )
    }

    // Mettre à jour ou créer le document unique
    const heroContent = await HeroContent.findOneAndUpdate(
      { singleton: "hero_content" },
      {
        title: body.title,
        description: body.description,
        button: body.button,
        images: body.images,
        socialLinks: body.socialLinks || []
      },
      {
        new: true, // Retourner le document mis à jour
        upsert: true, // Créer si n'existe pas
        runValidators: true // Exécuter les validations
      }
    )

    return NextResponse.json(
      {
        success: true,
        message: "Contenu Hero mis à jour avec succès",
        data: heroContent
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour du contenu Hero:", error)

    if (isValidationError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur de validation",
          errors: Object.values(error.errors).map((e) => e.message)
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la mise à jour du contenu Hero"
      },
      { status: 500 }
    )
  }
}
