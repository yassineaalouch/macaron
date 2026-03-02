import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import AppSettings from "@/models/AppSettings"

export async function GET() {
  try {
    await connectToDatabase()
    let settings = await AppSettings.findOne()
    if (!settings) {
      settings = await AppSettings.create({ lowStockThreshold: 15 })
    }
    return NextResponse.json(
      { success: true, settings: { lowStockThreshold: settings.lowStockThreshold } },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des paramètres:", error)
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

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { lowStockThreshold } = body

    const value =
      typeof lowStockThreshold === "string"
        ? parseInt(lowStockThreshold, 10)
        : Number(lowStockThreshold)

    if (Number.isNaN(value) || value < 1 || value > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "Le seuil doit être un nombre entre 1 et 1000"
        },
        { status: 400 }
      )
    }

    const settings = await AppSettings.findOneAndUpdate(
      {},
      { lowStockThreshold: value },
      { upsert: true, new: true, runValidators: true }
    )

    return NextResponse.json(
      {
        success: true,
        message: "Seuil de stock bas mis à jour",
        settings: { lowStockThreshold: settings?.lowStockThreshold ?? value }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour des paramètres:", error)
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
