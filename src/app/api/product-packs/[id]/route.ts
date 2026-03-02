// app/api/product-packs/[id]/route.ts
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

// GET - Récupérer un pack spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    await connectToDatabase()

    const pack = await ProductPack.findById(id)

    if (!pack) {
      return NextResponse.json(
        { success: false, message: "Pack non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: pack }, { status: 200 })
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération du pack:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un pack
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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
          message: "Données manquantes"
        },
        { status: 400 }
      )
    }

    const updatedPack = await ProductPack.findByIdAndUpdate(
      id,
      {
        _id: id,
        name: body.name,
        description: body.description || { fr: "", ar: "" },
        items: body.items,
        totalPrice: body.totalPrice,
        discountPrice: body.discountPrice,
        images: body.images || [],
        isActive: body.isActive !== undefined ? body.isActive : true
      },
      { new: true, runValidators: true }
    )

    if (!updatedPack) {
      return NextResponse.json(
        { success: false, message: "Pack non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pack mis à jour avec succès",
        data: updatedPack
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour du pack:", error)

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
        message: "Erreur lors de la mise à jour du pack"
      },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un pack (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    await connectToDatabase()

    // Soft delete: on met isActive à false au lieu de supprimer
    const deletedPack = await ProductPack.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    )

    if (!deletedPack) {
      return NextResponse.json(
        { success: false, message: "Pack non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pack supprimé avec succès"
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression du pack:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la suppression du pack"
      },
      { status: 500 }
    )
  }
}
