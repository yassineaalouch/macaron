// app/api/product-packs/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import ProductPack from "@/models/ProductPack"

interface PackItem {
  productId: string
  quantity: number
}

interface ProductPackData {
  name: {
    fr: string
    ar: string
  }
  description?: {
    fr: string
    ar: string
  }
  items: PackItem[]
  totalPrice: number
  discountPrice?: number
  images?: string[]
  isActive?: boolean
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

// GET - Récupérer tous les packs
export async function GET() {
  try {
    await connectToDatabase()

    const packs = await ProductPack.find({ isActive: true }).sort({
      createdAt: -1
    })

    return NextResponse.json({ success: true, data: packs }, { status: 200 })
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des packs:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau pack
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = (await request.json()) as ProductPackData

    // Validation des données
    if (
      !body.name?.fr ||
      !body.name?.ar ||
      !body.items ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Données manquantes. Le nom (FR et AR) et au moins un produit sont requis."
        },
        { status: 400 }
      )
    }

    // Créer le nouveau pack
    const newPack = await ProductPack.create({
      name: body.name,
      description: body.description || { fr: "", ar: "" },
      items: body.items,
      totalPrice: body.totalPrice,
      discountPrice: body.discountPrice,
      images: body.images || [],
      isActive: body.isActive !== undefined ? body.isActive : true
    })

    return NextResponse.json(
      {
        success: true,
        message: "Pack créé avec succès",
        data: newPack
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la création du pack:", error)

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
        message: "Erreur lors de la création du pack"
      },
      { status: 500 }
    )
  }
}
