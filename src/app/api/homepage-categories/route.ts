// app/api/homepage-categories/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import HomePageCategory from "@/models/HomePageCategory"
import { HomePageCategoryRequestBody } from "@/types/category"

// GET - Récupérer toutes les catégories
export async function GET() {
  try {
    await connectToDatabase()

    const categories = await HomePageCategory.find()
      .sort({ order: 1, createdAt: -1 })
      .lean()

    return NextResponse.json(
      {
        success: true,
        categories: categories.map((cat) => ({
          _id: cat._id.toString(),
          name: cat.name,
          image: cat.image,
          productCount: cat.productCount,
          url: cat.url,
          order: cat.order,
          isActive: cat.isActive,
          createdAt: cat.createdAt.toISOString(),
          updatedAt: cat.updatedAt.toISOString()
        }))
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des catégories:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la récupération des catégories",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle catégorie
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = (await request.json()) as HomePageCategoryRequestBody

    // Validation
    if (!body.name?.fr || !body.name?.ar) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nom en français et en arabe est requis",
          errors: ["name.fr et name.ar sont requis"]
        },
        { status: 400 }
      )
    }

    if (!body.image) {
      return NextResponse.json(
        {
          success: false,
          message: "L'image est requise",
          errors: ["image est requis"]
        },
        { status: 400 }
      )
    }

    if (body.productCount === undefined || body.productCount < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nombre de produits doit être un nombre positif",
          errors: ["productCount doit être >= 0"]
        },
        { status: 400 }
      )
    }

    if (!body.url) {
      return NextResponse.json(
        {
          success: false,
          message: "L'URL est requise",
          errors: ["url est requis"]
        },
        { status: 400 }
      )
    }

    // Créer la catégorie
    const newCategory = await HomePageCategory.create({
      name: {
        fr: body.name.fr.trim(),
        ar: body.name.ar.trim()
      },
      image: body.image.trim(),
      productCount: body.productCount,
      url: body.url.trim(),
      order: body.order ?? 0,
      isActive: body.isActive ?? true
    })

    return NextResponse.json(
      {
        success: true,
        message: "Catégorie créée avec succès",
        category: {
          _id: newCategory._id.toString(),
          name: newCategory.name,
          image: newCategory.image,
          productCount: newCategory.productCount,
          url: newCategory.url,
          order: newCategory.order,
          isActive: newCategory.isActive,
          createdAt: newCategory.createdAt.toISOString(),
          updatedAt: newCategory.updatedAt.toISOString()
        }
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la création de la catégorie:", error)

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
        message: "Erreur serveur lors de la création de la catégorie",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

