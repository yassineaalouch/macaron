// app/api/homepage-categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import HomePageCategory from "@/models/HomePageCategory"
import mongoose from "mongoose"
import { HomePageCategoryRequestBody } from "@/types/category"

// GET - Récupérer une catégorie par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de catégorie invalide"
        },
        { status: 400 }
      )
    }

    const category = await HomePageCategory.findById(id).lean()

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Catégorie non trouvée"
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        category: {
          _id: category._id.toString(),
          name: category.name,
          image: category.image,
          productCount: category.productCount,
          url: category.url,
          order: category.order,
          isActive: category.isActive,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString()
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération de la catégorie:", error)
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

// PUT - Mettre à jour une catégorie
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de catégorie invalide"
        },
        { status: 400 }
      )
    }

    const body = (await request.json()) as HomePageCategoryRequestBody

    // Validation
    if (body.name && (!body.name.fr || !body.name.ar)) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nom en français et en arabe est requis",
          errors: ["name.fr et name.ar sont requis"]
        },
        { status: 400 }
      )
    }

    if (body.productCount !== undefined && body.productCount < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nombre de produits doit être un nombre positif",
          errors: ["productCount doit être >= 0"]
        },
        { status: 400 }
      )
    }

    const updateData: {
      name?: { fr: string; ar: string }
      image?: string
      productCount?: number
      url?: string
      order?: number
      isActive?: boolean
    } = {}
    if (body.name) {
      updateData.name = {
        fr: body.name.fr.trim(),
        ar: body.name.ar.trim()
      }
    }
    if (body.image !== undefined) updateData.image = body.image.trim()
    if (body.productCount !== undefined)
      updateData.productCount = body.productCount
    if (body.url !== undefined) updateData.url = body.url.trim()
    if (body.order !== undefined) updateData.order = body.order
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updatedCategory = await HomePageCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean()

    if (!updatedCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Catégorie non trouvée"
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Catégorie mise à jour avec succès",
        category: {
          _id: updatedCategory._id.toString(),
          name: updatedCategory.name,
          image: updatedCategory.image,
          productCount: updatedCategory.productCount,
          url: updatedCategory.url,
          order: updatedCategory.order,
          isActive: updatedCategory.isActive,
          createdAt: updatedCategory.createdAt.toISOString(),
          updatedAt: updatedCategory.updatedAt.toISOString()
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour de la catégorie:", error)

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
        message: "Erreur serveur lors de la mise à jour",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une catégorie
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de catégorie invalide"
        },
        { status: 400 }
      )
    }

    const deletedCategory = await HomePageCategory.findByIdAndDelete(id).lean()

    if (!deletedCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Catégorie non trouvée"
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Catégorie supprimée avec succès"
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression de la catégorie:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la suppression",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

