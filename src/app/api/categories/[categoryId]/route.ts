// app/api/categories/[categoryId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Category from "@/models/Category"
import { CategoryResponse, CategoryRequestBody } from "@/types/category"
import mongoose from "mongoose"

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

// GET - Récupérer une catégorie par ID
export async function GET(
  _: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
): Promise<NextResponse<CategoryResponse>> {
  const { categoryId } = await context.params

  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { success: false, message: "ID de catégorie invalide" },
        { status: 400 }
      )
    }

    const category = await Category.findById(categoryId)

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Catégorie introuvable" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        category: {
          _id: category._id.toString(),
          name: category.name,
          description: category.description,
          parentId: category.parentId?.toString(),
          isActive: category.isActive,
          slug: category.slug,
          order: category.order,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString()
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération de la catégorie:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour une catégorie
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
): Promise<NextResponse<CategoryResponse>> {
  const { categoryId } = await context.params
  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { success: false, message: "ID de catégorie invalide" },
        { status: 400 }
      )
    }

    const body = (await request.json()) as CategoryRequestBody
    const { name, description, parentId, isActive } = body

    // Validation des données
    if (!name?.fr || !name?.ar) {
      return NextResponse.json(
        {
          success: false,
          message: "Les noms en français et en arabe sont requis"
        },
        { status: 400 }
      )
    }

    // Vérifier que la catégorie existe
    const existingCategory = await Category.findById(categoryId)
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "Catégorie introuvable" },
        { status: 404 }
      )
    }

    // Empêcher une catégorie d'être son propre parent
    if (parentId === categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Une catégorie ne peut pas être son propre parent"
        },
        { status: 400 }
      )
    }

    // Vérifier que la catégorie parent existe si spécifiée
    if (parentId) {
      const parentExists = await Category.findById(parentId)
      if (!parentExists) {
        return NextResponse.json(
          { success: false, message: "La catégorie parent n'existe pas" },
          { status: 400 }
        )
      }

      // Empêcher les boucles : vérifier que le parent n'est pas un descendant
      const descendants = await existingCategory.getAllDescendants()
      const descendantIds = descendants.map((d) => d._id.toString())
      if (descendantIds.includes(parentId)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Impossible de créer une boucle : la catégorie parent ne peut pas être un descendant"
          },
          { status: 400 }
        )
      }
    }

    // Mettre à jour la catégorie
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      {
        name: {
          fr: name.fr.trim(),
          ar: name.ar.trim()
        },
        description: description
          ? {
              fr: description.fr.trim(),
              ar: description.ar.trim()
            }
          : undefined,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive
      },
      { new: true, runValidators: true }
    )

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, message: "Erreur lors de la mise à jour" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Catégorie mise à jour avec succès",
        category: {
          _id: updatedCategory._id.toString(),
          name: updatedCategory.name,
          description: updatedCategory.description,
          parentId: updatedCategory.parentId?.toString(),
          isActive: updatedCategory.isActive,
          slug: updatedCategory.slug,
          order: updatedCategory.order,
          createdAt: updatedCategory.createdAt.toISOString(),
          updatedAt: updatedCategory.updatedAt.toISOString()
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour de la catégorie:", error)

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
        message: "Erreur lors de la mise à jour de la catégorie"
      },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une catégorie
export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
): Promise<NextResponse<CategoryResponse>> {
  const { categoryId } = await context.params
  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { success: false, message: "ID de catégorie invalide" },
        { status: 400 }
      )
    }

    const category = await Category.findById(categoryId)

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Catégorie introuvable" },
        { status: 404 }
      )
    }

    // Vérifier si la catégorie a des enfants
    const hasChildren = await category.hasChildren()
    if (hasChildren) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de supprimer cette catégorie car elle contient des sous-catégories"
        },
        { status: 400 }
      )
    }

    await Category.findByIdAndDelete(categoryId)

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
        message: "Erreur lors de la suppression de la catégorie"
      },
      { status: 500 }
    )
  }
}

// PATCH - Basculer le statut actif/inactif
export async function PATCH(
  _: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
): Promise<NextResponse<CategoryResponse>> {
  const { categoryId } = await context.params
  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { success: false, message: "ID de catégorie invalide" },
        { status: 400 }
      )
    }

    const category = await Category.findById(categoryId)

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Catégorie introuvable" },
        { status: 404 }
      )
    }

    category.isActive = !category.isActive
    await category.save()

    return NextResponse.json(
      {
        success: true,
        message: `Catégorie ${
          category.isActive ? "activée" : "désactivée"
        } avec succès`,
        category: {
          _id: category._id.toString(),
          name: category.name,
          description: category.description,
          parentId: category.parentId?.toString(),
          isActive: category.isActive,
          slug: category.slug,
          order: category.order,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString()
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors du changement de statut:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du changement de statut"
      },
      { status: 500 }
    )
  }
}
