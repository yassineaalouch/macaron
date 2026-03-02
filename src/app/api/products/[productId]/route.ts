//api/products/[productId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Product from "@/models/Product"
import "@/models/Category"
import "@/models/Characteristic"
import "@/models/Discount";
import { ProductRequestBody } from "@/types/product"
import mongoose from "mongoose"
import { sendLowStockEmail } from "@/lib/nodemailer"
import { getLowStockThreshold } from "@/lib/getLowStockThreshold"
import { getMainImage } from "@/lib/getMainImage"
import { updateHomePageCategoryCountByCategoryId } from "@/lib/updateHomePageCategoryCount"
import { deleteMultipleFilesFromS3 } from "@/lib/s3"

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

// GET - Récupérer un produit par ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params
  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "ID de produit invalide" },
        { status: 400 }
      )
    }

    const product = await Product.findById(productId)
      .populate("category")
      .populate("discount")
      .populate("Characteristic.name")

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Produit introuvable" },
        { status: 404 }
      )
    }

    // Détecter si c'est une requête du dashboard (via un paramètre de requête)
    const searchParams = request.nextUrl.searchParams
    const isDashboardRequest = searchParams.get("forDashboard") === "true"

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

    return NextResponse.json(
      {
        success: true,
        product: {
          _id: product._id.toString(),
          name: product.name,
          description: product.description,
          price: product.price,
          originalPrice: finalOriginalPrice,
          images: product.images,
          mainImageIndex: product.mainImageIndex ?? 0,
          category: product.category ?? null,
          discount: validDiscount,
          // category: product.category ? product.category.toString() : null,
          // discount: product.discount ? product.discount.toString() : null,
          Characteristic: product.Characteristic,
          inStock: product.inStock,
          quantity: product.quantity,
          isNewProduct: product.isNewProduct,
          isOnSale: product.isOnSale,
          slug: product.slug,
          createdAt: product.createdAt
            ? product.createdAt.toISOString()
            : new Date().toISOString(),
          updatedAt: product.updatedAt
            ? product.updatedAt.toISOString()
            : new Date().toISOString()
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération du produit:", error)
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un produit
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params
  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "ID de produit invalide" },
        { status: 400 }
      )
    }

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

    // Vérifier que le produit existe
    const existingProduct = await Product.findById(productId)
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Produit introuvable" },
        { status: 404 }
      )
    }

    // Sauvegarder l'ancienne catégorie et quantité pour vérifier les changements
    const oldCategoryId = existingProduct.category
      ? existingProduct.category.toString()
      : null
    const oldQuantity = existingProduct.quantity ?? 0
    const newQuantity = quantity || 0
    const newCategoryId = mongoose.Types.ObjectId.isValid(category)
      ? category
      : null

    // Normaliser les URLs d'images : remplacer + par %20 pour les espaces
    const normalizedImages = images.map((url: string) => 
      url.replace(/\+/g, '%2B')
    )

    // Accepter mainImageIndex en number ou string (ex: envoyé depuis le formulaire)
    const mainImageIndexNum =
      typeof mainImageIndex === "number"
        ? mainImageIndex
        : typeof mainImageIndex === "string"
          ? parseInt(mainImageIndex, 10)
          : 0
    const safeMainImageIndex =
      !Number.isNaN(mainImageIndexNum) && mainImageIndexNum >= 0
        ? Math.min(mainImageIndexNum, Math.max(0, normalizedImages.length - 1))
        : 0

    // Mettre à jour le produit
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
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
        mainImageIndex: safeMainImageIndex,
        category: mongoose.Types.ObjectId.isValid(category)
          ? new mongoose.Types.ObjectId(category)
          : null,
        discount: mongoose.Types.ObjectId.isValid(discount)
          ? new mongoose.Types.ObjectId(discount)
          : null,
        Characteristic: Characteristic,
        inStock: inStock !== undefined ? inStock : quantity > 0,
        quantity: quantity || 0,
        isNewProduct: isNewProduct || false,
        isOnSale: isOnSale || false
      },
      { new: true, runValidators: true }
    )

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: "Erreur lors de la mise à jour" },
        { status: 500 }
      )
    }

    // Vérifier le stock bas après la mise à jour
    const lowStockThreshold = await getLowStockThreshold()
    if (
      newQuantity > 0 &&
      newQuantity < lowStockThreshold &&
      oldQuantity >= lowStockThreshold
    ) {
      try {
        await sendLowStockEmail({
          id: updatedProduct._id?.toString() ?? "",
          nameFr: updatedProduct.name?.fr ?? "Produit sans nom",
          nameAr: updatedProduct.name?.ar,
          image: getMainImage(updatedProduct),
          quantity: newQuantity
        })
      } catch (emailError) {
        console.error(
          "Erreur lors de l'envoi de l'email de stock bas:",
          emailError
        )
      }
    }

    // Mettre à jour le productCount des HomePageCategory si la catégorie a changé
    if (oldCategoryId !== newCategoryId) {
      // Mettre à jour l'ancienne catégorie si elle existait
      if (oldCategoryId) {
        updateHomePageCategoryCountByCategoryId(oldCategoryId).catch(
          (error) => {
            console.error(
              "Erreur lors de la mise à jour du productCount (ancienne catégorie):",
              error
            )
          }
        )
      }
      // Mettre à jour la nouvelle catégorie si elle existe
      if (newCategoryId) {
        updateHomePageCategoryCountByCategoryId(newCategoryId).catch(
          (error) => {
            console.error(
              "Erreur lors de la mise à jour du productCount (nouvelle catégorie):",
              error
            )
          }
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Produit mis à jour avec succès",
        product: {
          _id: updatedProduct._id.toString(),
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          originalPrice: updatedProduct.originalPrice,
          images: updatedProduct.images,
          mainImageIndex: updatedProduct.mainImageIndex ?? 0,
          category: updatedProduct.category
            ? updatedProduct.category.toString()
            : "",
          discount: updatedProduct.discount
            ? updatedProduct.discount.toString()
            : "",
          Characteristic: updatedProduct.Characteristic,
          inStock: updatedProduct.inStock,
          quantity: updatedProduct.quantity,
          isNewProduct: updatedProduct.isNewProduct,
          isOnSale: updatedProduct.isOnSale,
          slug: updatedProduct.slug,
          createdAt: updatedProduct.createdAt
            ? updatedProduct.createdAt.toISOString()
            : new Date().toISOString(),
          updatedAt: updatedProduct.updatedAt
            ? updatedProduct.updatedAt.toISOString()
            : new Date().toISOString()
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour du produit:", error)

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
        message: "Erreur lors de la mise à jour du produit"
      },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un produit
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params
  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "ID de produit invalide" },
        { status: 400 }
      )
    }

    const product = await Product.findById(productId)

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Produit introuvable" },
        { status: 404 }
      )
    }

    // Sauvegarder la catégorie et les images avant la suppression
    const categoryId = product.category ? product.category.toString() : null
    const productImages = product.images && Array.isArray(product.images) ? product.images : []

    // Supprimer toutes les images du produit de S3
    if (productImages.length > 0) {
      try {
        await deleteMultipleFilesFromS3(productImages)
      } catch (error) {
        console.error(
          `Erreur lors de la suppression des images de S3 pour le produit ${productId}:`,
          error
        )
        // Continuer avec la suppression du produit même si la suppression des images échoue
      }
    }

    // Supprimer le produit de la base de données
    await Product.findByIdAndDelete(productId)

    // Mettre à jour le productCount des HomePageCategory si le produit avait une catégorie
    if (categoryId) {
      updateHomePageCategoryCountByCategoryId(categoryId).catch((error) => {
        console.error(
          "Erreur lors de la mise à jour du productCount après suppression:",
          error
        )
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Produit supprimé avec succès"
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression du produit:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la suppression du produit"
      },
      { status: 500 }
    )
  }
}
