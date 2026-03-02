import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import SiteInfo from "@/models/SiteInfo"

export async function GET() {
  try {
    await connectToDatabase()
    const siteInfo = await SiteInfo.findOne() || await SiteInfo.getSiteInfo()
    return NextResponse.json({ success: true, siteInfo }, { status: 200 })
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des informations du site:", error)
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

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { email, phone, location } = body

    // Validation
    if (!email || !phone || !location?.fr || !location?.ar) {
      return NextResponse.json(
        { success: false, message: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    // Update or create site info
    const siteInfo = await SiteInfo.findOneAndUpdate(
      {},
      {
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        location: {
          fr: location.fr.trim(),
          ar: location.ar.trim()
        }
      },
      { upsert: true, new: true, runValidators: true }
    )

    return NextResponse.json(
      { success: true, message: "Informations mises à jour avec succès", siteInfo },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour:", error)
    
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: "Erreur de validation", error: error.message },
        { status: 400 }
      )
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

