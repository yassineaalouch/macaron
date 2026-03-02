// app/api/featured-products/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import "@/models/Category"
import "@/models/Characteristic"
import "@/models/Discount"
import FeaturedProducts from "@/models/FeaturedProducts"
import Product from "@/models/Product"
import mongoose from "mongoose"

// GET - Récupérer les produits en vedette
export async function GET() {
  try {
    await connectToDatabase()

    const featuredProducts = await FeaturedProducts.findOne({
      singleton: "featured_products"
    }).lean()

    if (!featuredProducts) {
      return NextResponse.json(
        {
          success: true,
          productIds: [],
          products: []
        },
        { status: 200 }
      )
    }

    // Récupérer les détails des produits
    const products = await Product.find({
      _id: { $in: featuredProducts.productIds }
    })
      .populate("category")
      .populate("discount") 
      .populate("Characteristic.name")
      .lean()

    // Trier selon l'ordre défini
    const orderedProducts = featuredProducts.productIds
      .map((id) => {
        const product = products.find(
          (p) => p._id.toString() === id.toString()
        )
        return product
          ? {
              ...product,
              _id: product._id.toString(),
              createdAt: product.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt: product.updatedAt?.toISOString() || new Date().toISOString()
            }
          : null
      })
      .filter((p) => p !== null)

    return NextResponse.json(
      {
        success: true,
        productIds: featuredProducts.productIds.map((id) => id.toString()),
        products: orderedProducts
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des produits en vedette:", error)
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

// PUT - Mettre à jour les produits en vedette
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { productIds, isActive } = body

    // Validation
    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        {
          success: false,
          message: "productIds doit être un tableau"
        },
        { status: 400 }
      )
    }

    if (productIds.length > 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum 10 produits peuvent être en vedette"
        },
        { status: 400 }
      )
    }

    // Vérifier que tous les IDs sont valides
    const validIds = productIds.filter((id: string) =>
      mongoose.Types.ObjectId.isValid(id)
    )

    if (validIds.length !== productIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Certains IDs de produits sont invalides"
        },
        { status: 400 }
      )
    }

    // Convertir en ObjectIds
    const objectIds = validIds.map((id: string) => new mongoose.Types.ObjectId(id))

    // Vérifier que les produits existent
    const existingProducts = await Product.find({
      _id: { $in: objectIds }
    }).select("_id")

    if (existingProducts.length !== objectIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Certains produits n'existent pas"
        },
        { status: 400 }
      )
    }

    // Mettre à jour ou créer
    const updated = await FeaturedProducts.findOneAndUpdate(
      { singleton: "featured_products" },
      {
        productIds: objectIds,
        order: objectIds.map((_, index) => index),
        isActive: isActive !== undefined ? isActive : true
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    )

    return NextResponse.json(
      {
        success: true,
        message: "Produits en vedette mis à jour avec succès",
        data: {
          productIds: updated.productIds.map((id) => id.toString()),
          isActive: updated.isActive
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour des produits en vedette:", error)

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur de validation",
          error: error.message
        },
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

// DELETE - Supprimer tous les produits en vedette
export async function DELETE() {
  try {
    await connectToDatabase()

    const result = await FeaturedProducts.deleteOne({
      singleton: "featured_products"
    })

    return NextResponse.json(
      {
        success: true,
        message: "Tous les produits en vedette ont été supprimés",
        deletedCount: result.deletedCount
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression des produits en vedette:", error)
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

