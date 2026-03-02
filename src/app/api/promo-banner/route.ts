// app/api/promo-banner/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import PromoBanner from "@/models/PromoBanner"

interface PromoBannerRequestBody {
  // Images responsive
  imageDesktop?: string
  imageMobile?: string

  // Contenu multilingue
  title?: {
    fr?: string
    ar?: string
  }
  description?: {
    fr?: string
    ar?: string
  }

  // Lien de destination
  link: string
  linkType?: "product" | "pack" | "custom" | "category"
  linkId?: string

  // Statut et dates
  isActive?: boolean
  startDate?: string | null
  endDate?: string | null
  priority?: number
}

// GET - Récupérer la bannière publicitaire active
export async function GET() {
  try {
    await connectToDatabase()

    const now = new Date()

    // Récupérer la bannière active avec vérification des dates
    const banner = await PromoBanner.findOne({
      singleton: "promo_banner",
      isActive: true,
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } }
      ]
    })
      .sort({ priority: -1 })
      .lean()

    if (!banner) {
      return NextResponse.json(
        {
          success: true,
          banner: null
        },
        { status: 200 }
      )
    }

    // Gérer la compatibilité avec l'ancien format (champ "image")
    const imageDesktop = banner.imageDesktop || (banner as any).image || null
    const imageMobile = banner.imageMobile || null

    return NextResponse.json(
      {
        success: true,
        banner: {
          imageDesktop: imageDesktop,
          imageMobile: imageMobile,
          title: banner.title || null,
          description: banner.description || null,
          link: banner.link,
          linkType: banner.linkType || "custom",
          linkId: banner.linkId || null,
          isActive: banner.isActive,
          startDate: banner.startDate ? banner.startDate.toISOString() : null,
          endDate: banner.endDate ? banner.endDate.toISOString() : null,
          priority: banner.priority || 0,
          clickCount: banner.clickCount || 0,
          createdAt: banner.createdAt.toISOString(),
          updatedAt: banner.updatedAt.toISOString()
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération de la bannière:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour ou créer la bannière publicitaire
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = (await request.json()) as PromoBannerRequestBody

    // Validation : au moins une image doit être fournie
    if (!body.imageDesktop && !body.imageMobile) {
      return NextResponse.json(
        {
          success: false,
          message: "Au moins une image (desktop ou mobile) est requise"
        },
        { status: 400 }
      )
    }

    // Validation : le lien est requis
    if (!body.link || !body.link.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Le lien est requis"
        },
        { status: 400 }
      )
    }

    // Validation : format du lien
    if (!body.link.startsWith("/") && !body.link.startsWith("http")) {
      return NextResponse.json(
        {
          success: false,
          message: "Le lien doit commencer par / ou http"
        },
        { status: 400 }
      )
    }

    // Préparer les dates
    const startDate = body.startDate ? new Date(body.startDate) : null
    const endDate = body.endDate ? new Date(body.endDate) : null

    // Validation : endDate doit être après startDate si les deux sont définis
    if (startDate && endDate && endDate <= startDate) {
      return NextResponse.json(
        {
          success: false,
          message: "La date de fin doit être après la date de début"
        },
        { status: 400 }
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      link: body.link.trim(),
      linkType: body.linkType || "custom",
      imageMobile: body.imageMobile || "",
      imageDesktop: body.imageDesktop || "",
      linkId: body.linkId || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      priority: body.priority !== undefined ? body.priority : 0,
      startDate: startDate,
      endDate: endDate
    }

    // Ajouter les images si fournies (même chaînes vides pour permettre la suppression)
    if (body.imageDesktop !== undefined) {
      updateData.imageDesktop = body.imageDesktop
        ? body.imageDesktop.trim()
        : null
    }
    if (body.imageMobile !== undefined) {
      updateData.imageMobile = body.imageMobile ? body.imageMobile.trim() : null
    }

    // Ajouter le titre et la description si fournis
    if (body.title) {
      updateData.title = {
        fr: body.title.fr?.trim() || "",
        ar: body.title.ar?.trim() || ""
      }
    }
    if (body.description) {
      updateData.description = {
        fr: body.description.fr?.trim() || "",
        ar: body.description.ar?.trim() || ""
      }
    }

    // Mettre à jour ou créer
    const banner = await PromoBanner.findOneAndUpdate(
      { singleton: "promo_banner" },
      updateData,
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    )

    return NextResponse.json(
      {
        success: true,
        message: "Bannière mise à jour avec succès",
        banner: {
          imageDesktop: banner.imageDesktop || null,
          imageMobile: banner.imageMobile || null,
          title: banner.title || null,
          description: banner.description || null,
          link: banner.link,
          linkType: banner.linkType,
          linkId: banner.linkId || null,
          isActive: banner.isActive,
          startDate: banner.startDate ? banner.startDate.toISOString() : null,
          endDate: banner.endDate ? banner.endDate.toISOString() : null,
          priority: banner.priority || 0,
          clickCount: banner.clickCount || 0,
          createdAt: banner.createdAt.toISOString(),
          updatedAt: banner.updatedAt.toISOString()
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour de la bannière:", error)

    if (error instanceof Error) {
      // Erreur de validation Mongoose
      if (error.name === "ValidationError") {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur de validation",
            error: error.message
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer la bannière
export async function DELETE() {
  try {
    await connectToDatabase()

    const banner = await PromoBanner.findOneAndDelete({
      singleton: "promo_banner"
    })

    if (!banner) {
      return NextResponse.json(
        {
          success: false,
          message: "Bannière non trouvée"
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Bannière supprimée avec succès"
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression de la bannière:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

// PATCH - Activer/Désactiver rapidement la bannière
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Le paramètre isActive doit être un boolean"
        },
        { status: 400 }
      )
    }

    const banner = await PromoBanner.findOneAndUpdate(
      { singleton: "promo_banner" },
      { isActive },
      { new: true, runValidators: true }
    )

    if (!banner) {
      return NextResponse.json(
        {
          success: false,
          message: "Bannière non trouvée"
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: `Bannière ${isActive ? "activée" : "désactivée"} avec succès`,
        banner: {
          isActive: banner.isActive
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour du statut:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}
