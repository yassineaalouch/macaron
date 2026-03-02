// app/api/categories/[categoryId]/products-count/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Product from "@/models/Product"
import mongoose from "mongoose"

// GET - Compter les produits d'une catégorie
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    await connectToDatabase()
    const { categoryId } = await params

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de catégorie invalide",
          count: 0
        },
        { status: 400 }
      )
    }

    const count = await Product.countDocuments({
      category: categoryId,
      inStock: true // Optionnel : compter seulement les produits en stock
    })

    return NextResponse.json(
      {
        success: true,
        count
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors du comptage des produits:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        count: 0,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

