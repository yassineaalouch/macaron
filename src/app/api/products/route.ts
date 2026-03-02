import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import "@/models/Characteristic"
import "@/models/Category"
import "@/models/Discount"
import Product from "@/models/Product"
import { ProductResponse, ProductRequestBody } from "@/types/product"
import mongoose from "mongoose"
import { FilterQuery, SortOptions } from "@/types/searchParams"
import { updateHomePageCategoryCountByCategoryId } from "@/lib/updateHomePageCategoryCount"

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

// GET - Récupérer tous les produits avec filtrage et pagination
export async function GET(
  request: NextRequest
): Promise<NextResponse<ProductResponse>> {
  try {
    await connectToDatabase()

    // Récupérer les paramètres de recherche
    const searchParams = request.nextUrl.searchParams

    // Paramètres de filtrage (client shop)
    const categories = searchParams.getAll("category")
    const characteristics = searchParams.getAll("characteristics")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const inStock = searchParams.get("inStock")
    const isNew = searchParams.get("isNew")
    const isOnSale = searchParams.get("onSale")

    // Paramètres de filtrage (dashboard)
    const search = searchParams.get("search") // Search in product names
    const categoryName = searchParams.get("categoryName") // Category by name (dashboard)
    const discountName = searchParams.get("discountName") // Discount by name (dashboard)
    const status = searchParams.get("status") // Status filter (dashboard)
    const minQuantity = searchParams.get("minQuantity")
    const maxQuantity = searchParams.get("maxQuantity")
    const language = searchParams.get("language") || "fr" // Language for sorting

    // Paramètres de tri
    const sortBy = searchParams.get("sortBy") || "newest"
    const sortField = searchParams.get("sortField") // For dashboard: name, price, quantity, category, createdAt
    const sortDirection = searchParams.get("sortDirection") || "asc" // asc or desc

    // Paramètres de pagination
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const skip = (page - 1) * limit

    // Filtre par ID de catégorie (ex: produits similaires) : catégorie exacte + sous-catégories
    const categoryIdParam = searchParams.get("categoryId")

    // Construire la requête de filtrage
    const query: FilterQuery = {}
    const orConditions: Array<{ "name.fr"?: { $regex: string; $options: string } } | { "name.ar"?: { $regex: string; $options: string } } | { inStock?: boolean } | { quantity?: number }> = []

    // Filtre par recherche de nom (dashboard)
    if (search) {
      orConditions.push(
        { "name.fr": { $regex: search, $options: "i" } },
        { "name.ar": { $regex: search, $options: "i" } }
      )
    }

    // Filtre par ID de catégorie (catégorie exacte + sous-catégories)
    if (categoryIdParam && mongoose.Types.ObjectId.isValid(categoryIdParam)) {
      const Category = mongoose.model("Category")
      const rootId = new mongoose.Types.ObjectId(categoryIdParam)
      const allCategoryIds: mongoose.Types.ObjectId[] = [rootId]

      const getDescendantIds = async (parentId: mongoose.Types.ObjectId) => {
        const children = await Category.find({ parentId }).select("_id").lean()
        for (const child of children) {
          allCategoryIds.push(child._id as mongoose.Types.ObjectId)
          await getDescendantIds(child._id as mongoose.Types.ObjectId)
        }
      }
      await getDescendantIds(rootId)

      const uniqueIds = [...new Set(allCategoryIds.map((id) => id.toString()))].map(
        (id) => new mongoose.Types.ObjectId(id)
      )
      query.category = { $in: uniqueIds }
    }

    // Filtre par catégories (client shop - multiple categories par nom)
    if (categories.length > 0 && !categoryIdParam) {
      const Category = mongoose.model("Category")
      const categoryDocs = await Category.find({
        $or: [
          { "name.fr": { $in: categories } },
          { "name.ar": { $in: categories } }
        ]
      })

      const allCategoryIds: mongoose.Types.ObjectId[] = []

      const getAllDescendantIds = async (categoryId: mongoose.Types.ObjectId) => {
        const children = await Category.find({ parentId: categoryId })
        for (const child of children) {
          allCategoryIds.push(child._id)
          await getAllDescendantIds(child._id)
        }
      }

      for (const categoryDoc of categoryDocs) {
        allCategoryIds.push(categoryDoc._id)
        await getAllDescendantIds(categoryDoc._id)
      }

      const uniqueCategoryIds = [...new Set(allCategoryIds.map((id) => id.toString()))].map(
        (id) => new mongoose.Types.ObjectId(id)
      )

      if (uniqueCategoryIds.length > 0) {
        query.category = { $in: uniqueCategoryIds }
      }
    }

    // Filtre par nom de catégorie (dashboard - single category)
    if (categoryName) {
      const Category = mongoose.model("Category")
      const categoryDoc = await Category.findOne({
        $or: [{ "name.fr": categoryName }, { "name.ar": categoryName }]
      })
      if (categoryDoc) {
        query.category = categoryDoc._id
      }
    }

    // Filtre par nom de discount (dashboard)
    if (discountName) {
      const Discount = mongoose.model("Discount")
      const discountDoc = await Discount.findOne({
        $or: [{ "name.fr": discountName }, { "name.ar": discountName }]
      })
      if (discountDoc) {
        query.discount = discountDoc._id
      }
    }

    // Filtre par caractéristiques
    if (characteristics.length > 0) {
      query["Characteristic.values"] = {
        $elemMatch: {
          $or: [
            { fr: { $in: characteristics } },
            { ar: { $in: characteristics } }
          ]
        }
      }
    }

    // Filtre par prix
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = parseFloat(minPrice)
      if (maxPrice) query.price.$lte = parseFloat(maxPrice)
    }

    // Filtre par statut (dashboard) - doit être fait avant la quantité pour éviter les conflits
    if (status && status !== "all") {
      switch (status) {
        case "inStock":
          query.inStock = true
          break
        case "outOfStock":
          orConditions.push({ inStock: false }, { quantity: 0 })
          break
        case "lowStock":
          query.inStock = true
          break
        case "new":
          query.isNewProduct = true
          break
        case "onSale":
          query.isOnSale = true
          break
      }
    }

    // Filtre par quantité (dashboard) - après le statut
    const quantityConditions: { $gte?: number; $lte?: number; $gt?: number } =
      {}
    if (minQuantity) quantityConditions.$gte = parseInt(minQuantity)
    if (maxQuantity) quantityConditions.$lte = parseInt(maxQuantity)

    // Add status-specific quantity conditions
    if (status === "inStock") {
      quantityConditions.$gt = 0
    } else if (status === "lowStock") {
      quantityConditions.$lte = 10
      quantityConditions.$gt = 0
    }

    // Only set quantity if we have conditions
    if (Object.keys(quantityConditions).length > 0) {
      query.quantity = quantityConditions
    }

    // Ajouter les conditions $or si nécessaire
    if (orConditions.length > 0) {
      query.$or = orConditions
    }

    // Filtres booléens (client shop)
    if (inStock !== null) query.inStock = inStock === "true"
    if (isNew !== null) query.isNewProduct = isNew === "true"
    if (isOnSale !== null) query.isOnSale = isOnSale === "true"

    // Définir l'ordre de tri
    let sortOptions: SortOptions = {}

    // Dashboard sort (using sortField and sortDirection)
    if (sortField) {
      switch (sortField) {
        case "name":
          sortOptions = {
            [`name.${language}`]: sortDirection === "desc" ? -1 : 1
          }
          break
        case "price":
          sortOptions = { price: sortDirection === "desc" ? -1 : 1 }
          break
        case "quantity":
          sortOptions = { quantity: sortDirection === "desc" ? -1 : 1 }
          break
        case "category":
          // Sort by category name requires aggregation, simplified to createdAt
          sortOptions = { createdAt: sortDirection === "desc" ? -1 : 1 }
          break
        case "createdAt":
          sortOptions = { createdAt: sortDirection === "desc" ? -1 : 1 }
          break
        default:
          sortOptions = { createdAt: -1 }
      }
    } else {
      // Client shop sort (using sortBy)
      switch (sortBy) {
        case "name-asc":
          sortOptions = { "name.fr": 1 }
          break
        case "name-desc":
          sortOptions = { "name.fr": -1 }
          break
        case "price-asc":
          sortOptions = { price: 1 }
          break
        case "price-desc":
          sortOptions = { price: -1 }
          break
        case "newest":
        default:
          sortOptions = { createdAt: -1 }
          break
      }
    }

    // Compter le nombre total de produits correspondant aux filtres
    const totalProducts = await Product.countDocuments(query)
    const totalPages = Math.ceil(totalProducts / limit)

    // Récupérer les produits avec pagination
    const products = await Product.find(query)
      .populate("category")
      .populate("discount")
      .populate("Characteristic.name")
      .sort(sortOptions as Record<string, 1 | -1>)
      .skip(skip)
      .limit(limit)

    // Détecter si c'est une requête du dashboard (présence de paramètres spécifiques au dashboard)
    // OU si le paramètre forDashboard est explicitement défini
    const forDashboardParam = searchParams.get("forDashboard")
    const isDashboardRequest = forDashboardParam === "true" || !!(sortField || categoryName || discountName || status || minQuantity || maxQuantity)

    // Fonction helper pour vérifier si un discount est valide (non expiré et actif) pour PERCENTAGE et BUY_X_GET_Y
    // Cette fonction ne doit être utilisée QUE pour les requêtes côté client (shop), pas pour le dashboard
    const isDiscountValid = (discount: any): boolean => {
      if (!discount) return false
      
      // Seulement pour PERCENTAGE et BUY_X_GET_Y
      if (discount.type !== "PERCENTAGE" && discount.type !== "BUY_X_GET_Y") {
        return true // Les coupons sont gérés différemment
      }

      const now = new Date()
      
      // Vérifier si le discount est actif (décision de l'admin)
      if (!discount.isActive) return false
      
      // Vérifier si la date de fin est passée
      if (discount.endDate) {
        const endDate = new Date(discount.endDate)
        if (endDate < now) return false
      }
      
      // Vérifier si la date de début est dans le futur
      if (discount.startDate) {
        const startDate = new Date(discount.startDate)
        if (startDate > now) return false
      }
      
      return true
    }

    return NextResponse.json(
      {
        success: true,
        products: products.map((product) => {
          // Filtrer les discounts expirés/inactifs UNIQUEMENT pour les requêtes côté client (shop)
          // Pour le dashboard, garder tous les discounts pour permettre la gestion
          const validDiscount = isDashboardRequest
            ? product.discount // Dashboard : garder tous les discounts
            : (product.discount && isDiscountValid(product.discount) ? product.discount : null) // Shop : filtrer strictement

          // Gestion du prix original :
          // - Si le discount était PERCENTAGE et est maintenant expiré/inactif → supprimer originalPrice
          // - Si le discount n'est pas PERCENTAGE ou n'existe pas → garder originalPrice s'il existe (entré manuellement par l'admin)
          let finalOriginalPrice = product.originalPrice
          if (!isDashboardRequest && product.originalPrice) {
            // Vérifier si le discount était PERCENTAGE et est maintenant filtré
            const wasPercentageDiscount = product.discount && product.discount.type === "PERCENTAGE"
            const isNowFiltered = !validDiscount && wasPercentageDiscount
            
            if (isNowFiltered) {
              // Si le discount PERCENTAGE a été filtré (expiré/inactif), supprimer le prix original
              // pour ne pas afficher de réduction obsolète
              finalOriginalPrice = undefined
            }
            // Sinon, garder le originalPrice (soit il n'y a pas de discount, soit c'est un autre type, soit il est valide)
          }

          // Vérifier si le produit a plus de 20 jours pour décocher automatiquement "Nouveau produit"
          const now = new Date()
          const productCreatedAt = product.createdAt ? new Date(product.createdAt) : now
          const daysSinceCreation = Math.floor((now.getTime() - productCreatedAt.getTime()) / (1000 * 60 * 60 * 24))
          const shouldBeNewProduct = isDashboardRequest 
            ? (product.isNewProduct && daysSinceCreation <= 20) // Dashboard : décocher si > 20 jours
            : product.isNewProduct // Shop : garder la valeur pour l'affichage

          // Si c'est le dashboard et que le produit a plus de 20 jours, mettre à jour dans la base de données
          if (isDashboardRequest && product.isNewProduct && daysSinceCreation > 20) {
            // Mettre à jour en arrière-plan (ne pas attendre)
            Product.findByIdAndUpdate(product._id, { isNewProduct: false }).catch(console.error)
          }

          return {
            _id: product._id.toString(),
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: finalOriginalPrice,
            images: product.images,
            mainImageIndex: product.mainImageIndex ?? 0,
            category: product.category,
            discount: validDiscount,
            Characteristic: product.Characteristic,
            inStock: product.inStock,
            quantity: product.quantity,
            isNewProduct: shouldBeNewProduct,
            isOnSale: product.isOnSale,
            slug: product.slug,
            createdAt: product.createdAt
              ? product.createdAt.toISOString()
              : new Date().toISOString(),
            updatedAt: product.updatedAt
              ? product.updatedAt.toISOString()
              : new Date().toISOString()
          }
        }),
        pagination: {
          page,
          limit,
          totalProducts,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des produits:", error)
    if (error instanceof Error)
      console.error("Message d'erreur:", error.message)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau produit
export async function POST(
  request: NextRequest
): Promise<NextResponse<ProductResponse>> {
  try {
    await connectToDatabase()

    const body = (await request.json()) as ProductRequestBody

    const {
      name,
      description,
      price,
      originalPrice,
      images,
      mainImageIndex,
      category,
      discount,
      Characteristic,
      inStock,
      quantity,
      isNewProduct,
      isOnSale
    } = body

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

    if (!description?.fr || !description?.ar) {
      return NextResponse.json(
        {
          success: false,
          message: "Les descriptions en français et en arabe sont requises"
        },
        { status: 400 }
      )
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, message: "Au moins une image est requise" },
        { status: 400 }
      )
    }

    if (price <= 0) {
      return NextResponse.json(
        { success: false, message: "Le prix doit être supérieur à 0" },
        { status: 400 }
      )
    }

    // Normaliser les URLs d'images : remplacer + par %20 pour les espaces
    const normalizedImages = images.map((url: string) => 
      url.replace(/\+/g, '%2B')
    )

    // Créer le nouveau produit
    const newProduct = await Product.create({
      name: {
        fr: name.fr.trim(),
        ar: name.ar.trim()
      },
      description: {
        fr: description.fr.trim(),
        ar: description.ar.trim()
      },
      price,
      originalPrice,
      images: normalizedImages,
      mainImageIndex:
        typeof mainImageIndex === "number" && mainImageIndex >= 0
          ? Math.min(mainImageIndex, normalizedImages.length - 1)
          : 0,
      category: mongoose.Types.ObjectId.isValid(category) ? category : null,
      discount: mongoose.Types.ObjectId.isValid(discount) ? discount : null,
      Characteristic: Characteristic,
      inStock: inStock !== undefined ? inStock : quantity > 0,
      quantity: quantity || 0,
      isNewProduct: isNewProduct || false,
      isOnSale: isOnSale || false
    })

    // Mettre à jour le productCount des HomePageCategory si le produit a une catégorie
    if (newProduct.category) {
      updateHomePageCategoryCountByCategoryId(newProduct.category).catch(
        (error) => {
          console.error(
            "Erreur lors de la mise à jour du productCount après création:",
            error
          )
        }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Produit créé avec succès",
        product: {
          _id: newProduct._id.toString(),
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          originalPrice: newProduct.originalPrice,
          images: newProduct.images,
          mainImageIndex: newProduct.mainImageIndex ?? 0,
          category: newProduct.category ? newProduct.category.toString() : "",
          discount: newProduct.discount ? newProduct.discount.toString() : "",
          Characteristic: newProduct.Characteristic,
          inStock: newProduct.inStock,
          quantity: newProduct.quantity,
          isNewProduct: newProduct.isNewProduct,
          isOnSale: newProduct.isOnSale,
          slug: newProduct.slug,
          createdAt: newProduct.createdAt
            ? newProduct.createdAt.toISOString()
            : new Date().toISOString(),
          updatedAt: newProduct.updatedAt
            ? newProduct.updatedAt.toISOString()
            : new Date().toISOString()
        }
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la création du produit:", error)

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
        message: "Erreur lors de la création du produit"
      },
      { status: 500 }
    )
  }
}
