// app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Category from "@/models/Category"
import { CategoryRequestBody, CategoryResponse } from "@/types/category"

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

// GET - Récupérer toutes les catégories
export async function GET(): Promise<NextResponse<CategoryResponse>> {
  try {
    await connectToDatabase()

    const categories = await Category.find().sort({ order: 1, createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        categories: categories.map((cat) => ({
          _id: cat._id.toString(),
          name: cat.name,
          description: cat.description,
          parentId: cat.parentId?.toString(),
          isActive: cat.isActive,
          slug: cat.slug,
          order: cat.order,
          createdAt: cat.createdAt.toISOString(),
          updatedAt: cat.updatedAt.toISOString()
        }))
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des catégories:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle catégorie
export async function POST(
  request: NextRequest
): Promise<NextResponse<CategoryResponse>> {
  try {
    await connectToDatabase()

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

    // Vérifier que la catégorie parent existe si spécifiée
    if (parentId) {
      const parentExists = await Category.findById(parentId)
      if (!parentExists) {
        return NextResponse.json(
          { success: false, message: "La catégorie parent n'existe pas" },
          { status: 400 }
        )
      }
    }

    // Générer des slugs uniques pour éviter les conflits
    const generateUniqueSlug = async (baseText: string, field: "fr" | "ar", excludeId?: string): Promise<string> => {
      // Générer le slug de base
      let slug = baseText
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9ء-ي]+/g, "-")
        .replace(/(^-|-$)/g, "")
      
      // Si le slug est vide, utiliser un identifiant unique avec timestamp et random
      if (!slug || slug.trim() === "") {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        slug = `cat-${field}-${uniqueId}`
      }
      
      // Vérifier d'abord si le slug de base est disponible
      let query: any = { [`slug.${field}`]: slug }
      if (excludeId) {
        query._id = { $ne: excludeId }
      }
      let existing = await Category.findOne(query)
      
      if (!existing) {
        // Le slug de base est disponible
        return slug
      }
      
      // Le slug existe déjà, chercher un slug unique avec un suffixe
      let finalSlug = slug
      let counter = 1
      const maxAttempts = 1000
      
      while (counter <= maxAttempts) {
        finalSlug = `${slug}-${counter}`
        query = { [`slug.${field}`]: finalSlug }
        if (excludeId) {
          query._id = { $ne: excludeId }
        }
        
        existing = await Category.findOne(query)
        if (!existing) {
          // Slug unique trouvé
          return finalSlug
        }
        
        counter++
      }
      
      // Si on arrive ici (très improbable), utiliser un timestamp + random pour garantir l'unicité
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 9)
      return `${slug}-${timestamp}-${random}`
    }
    
    // Générer les slugs uniques AVANT de créer la catégorie
    const slugFr = await generateUniqueSlug(name.fr, "fr")
    const slugAr = await generateUniqueSlug(name.ar, "ar")
    
    
    // Vérifier une dernière fois que les slugs sont vraiment uniques avant création
    const finalCheckFr = await Category.findOne({ "slug.fr": slugFr })
    const finalCheckAr = await Category.findOne({ "slug.ar": slugAr })
    
    let finalSlugFr = slugFr
    let finalSlugAr = slugAr
    
    if (finalCheckFr || finalCheckAr) {
      // Si conflit détecté au dernier moment, régénérer avec timestamp unique
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 9)
      finalSlugFr = finalCheckFr ? `${slugFr}-${timestamp}-${random}` : slugFr
      finalSlugAr = finalCheckAr ? `${slugAr}-${timestamp}-${random}` : slugAr
    }
    
    // Créer la nouvelle catégorie avec les slugs garantis uniques
    const newCategory = await Category.create({
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
      isActive: isActive !== undefined ? isActive : true,
      slug: {
        fr: finalSlugFr,
        ar: finalSlugAr
      }
    })
    

    return NextResponse.json(
      {
        success: true,
        message: "Catégorie créée avec succès",
        category: {
          _id: newCategory._id.toString(),
          name: newCategory.name,
          description: newCategory.description,
          parentId: newCategory.parentId?.toString(),
          isActive: newCategory.isActive,
          slug: newCategory.slug,
          order: newCategory.order,
          createdAt: newCategory.createdAt.toISOString(),
          updatedAt: newCategory.updatedAt.toISOString()
        }
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la création de la catégorie:", error)

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

    // Gérer les erreurs de clé dupliquée MongoDB
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const duplicateKey = error.keyPattern ? Object.keys(error.keyPattern)[0] : "slug"
      return NextResponse.json(
        {
          success: false,
          message: `Une catégorie avec ce ${duplicateKey} existe déjà. Veuillez choisir un nom différent.`
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erreur lors de la création de la catégorie"
      },
      { status: 500 }
    )
  }
}
