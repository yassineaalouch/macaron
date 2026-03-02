// app/api/discounts/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Discount from "@/models/Discount"
import { DiscountRequestBody, DiscountResponse } from "@/types/discount"
import mongoose from "mongoose"
// import Category from "@/models/Category"
// import Product from "@/models/Product"
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

export async function GET(
  request: NextRequest
): Promise<NextResponse<DiscountResponse>> {
  try {
    await connectToDatabase()

    // Récupération des paramètres de requête
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("active")
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const excludeCoupon = searchParams.get("excludeCoupon") // 👈 nouveau paramètre

    // Construction de la requête
    const query: Record<string, unknown> = {}

    // Filtre actif / inactif
    if (isActive !== null) {
      query.isActive = isActive === "true"
    }

    // Filtre par type spécifique
    if (type && type !== "all") {
      query.type = type
    }

    // 👇 Nouveau filtre : exclure les COUPON si demandé
    if (excludeCoupon === "true") {
      query.type = { $ne: "COUPON" }
    }

    // Filtrage par statut
    const now = new Date()
    if (status && status !== "all") {
      switch (status) {
        case "active":
          query.isActive = true
          query.$or = [
            { startDate: null, endDate: null },
            { startDate: { $lte: now }, endDate: null },
            { startDate: null, endDate: { $gte: now } },
            { startDate: { $lte: now }, endDate: { $gte: now } }
          ]
          break
        case "inactive":
          query.isActive = false
          break
        case "expired":
          query.endDate = { $lt: now }
          break
        case "upcoming":
          query.startDate = { $gt: now }
          break
      }
    }

    const discounts = await Discount.find(query).sort({ createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        discounts: discounts.map((discount) => ({
          _id: discount._id as string,
          name: discount.name,
          type: discount.type,
          value: discount.value ?? undefined,
          buyQuantity: discount.buyQuantity ?? undefined,
          getQuantity: discount.getQuantity ?? undefined,
          couponCode: discount.couponCode ?? undefined,
          description: discount.description,
          startDate: discount.startDate?.toISOString(),
          endDate: discount.endDate?.toISOString(),
          isActive: discount.isActive,
          usageLimit: discount.usageLimit ?? undefined,
          usageCount: discount.usageCount,
          minimumPurchase: discount.minimumPurchase ?? undefined,
          createdAt: discount.createdAt.toISOString(),
          updatedAt: discount.updatedAt.toISOString()
        }))
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des promotions:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle promotion
export async function POST(
  request: NextRequest
): Promise<NextResponse<DiscountResponse>> {
  try {
    await connectToDatabase()

    const body = (await request.json()) as DiscountRequestBody
    const {
      name,
      type,
      value,
      buyQuantity,
      getQuantity,
      couponCode,
      description,
      startDate,
      endDate,
      isActive,
      usageLimit,
      minimumPurchase
    } = body

    // Validation des données
    if (!name?.fr || !name?.ar) {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la sauvegarde : les noms en français et en arabe sont requis"
        },
        { status: 400 }
      )
    }

    // Validation de la longueur du nom (plus de 5 caractères)
    if (name.fr.trim().length <= 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la sauvegarde : le nom (français) doit être composé de plus de 5 caractères"
        },
        { status: 400 }
      )
    }

    if (name.ar.trim().length <= 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la sauvegarde : le nom (arabe) doit être composé de plus de 5 caractères"
        },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la sauvegarde : le type de promotion est requis"
        },
        { status: 400 }
      )
    }

    // Validation spécifique selon le type
    if (type === "PERCENTAGE") {
      if (!value || value <= 0 || value > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : le pourcentage doit être entre 1 et 100"
          },
          { status: 400 }
        )
      }
    } else if (type === "BUY_X_GET_Y") {
      if (!buyQuantity || buyQuantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : la quantité à acheter doit être supérieure à 0"
          },
          { status: 400 }
        )
      }
      if (!getQuantity || getQuantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : la quantité offerte doit être supérieure à 0"
          },
          { status: 400 }
        )
      }
    } else if (type === "COUPON") {
      if (!couponCode || couponCode.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : le code promo est requis"
          },
          { status: 400 }
        )
      }
      
      // Validation de la longueur du code promo (plus de 4 caractères)
      if (couponCode.trim().length <= 4) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : le coupon name doit être composé de plus de 4 caractères"
          },
          { status: 400 }
        )
      }

      if (!value || value <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : la valeur du coupon doit être positive"
          },
          { status: 400 }
        )
      }

      // Validation : usageLimit est obligatoire pour les codes promo
      if (!usageLimit || usageLimit <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : le nombre d'utilisation limit est requis pour les codes promo"
          },
          { status: 400 }
        )
      }

      // Validation : minimumPurchase est obligatoire pour les codes promo
      if (!minimumPurchase || minimumPurchase <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : le montant minimum du panier est requis pour les codes promo"
          },
          { status: 400 }
        )
      }

      // Validation : le montant de réduction doit être inférieur au montant minimum du panier
      if (value >= minimumPurchase) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : le montant de réduction doit être inférieur au montant minimum du panier"
          },
          { status: 400 }
        )
      }

      // Vérifier l'unicité du code promo
      const existingCoupon = await Discount.findOne({
        couponCode: couponCode.toUpperCase().trim()
      })
      if (existingCoupon) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : ce code promo existe déjà"
          },
          { status: 400 }
        )
      }
    }

    // Gestion automatique des dates
    const now = new Date()
    const finalStartDate = startDate ? new Date(startDate) : now // Si pas de date de début, utiliser aujourd'hui
    const finalEndDate = endDate ? new Date(endDate) : null // Si pas de date de fin, null = indéfini
    
    // Déterminer automatiquement isActive selon les dates
    let finalIsActive = isActive !== undefined ? isActive : true
    
    // Si la date de début est dans le futur, désactiver automatiquement
    if (finalStartDate > now) {
      finalIsActive = false
    }
    // Si la date de fin est passée, désactiver automatiquement
    if (finalEndDate && finalEndDate < now) {
      finalIsActive = false
    }
    
    // Pour les types autres que COUPON, ignorer usageLimit et minimumPurchase
    // Pour COUPON, ces champs sont obligatoires (déjà validés ci-dessus)
    const finalUsageLimit = type === "COUPON" ? usageLimit : null
    const finalMinimumPurchase = type === "COUPON" ? minimumPurchase : null

    // Créer la nouvelle promotion
    const newDiscount = await Discount.create({
      name: {
        fr: name.fr.trim(),
        ar: name.ar.trim()
      },
      type,
      value: value || undefined,
      buyQuantity: buyQuantity || undefined,
      getQuantity: getQuantity || undefined,
      couponCode: couponCode?.toUpperCase() || undefined,
      description: description
        ? {
            fr: description.fr.trim(),
            ar: description.ar.trim()
          }
        : undefined,
      startDate: finalStartDate,
      endDate: finalEndDate,
      isActive: finalIsActive,
      usageLimit: finalUsageLimit,
      minimumPurchase: finalMinimumPurchase
    })

    return NextResponse.json(
      {
        success: true,
        message: "Promotion créée avec succès",
        discount: {
          _id: newDiscount._id as string,
          name: newDiscount.name,
          type: newDiscount.type,
          value: newDiscount.value,
          buyQuantity: newDiscount.buyQuantity ?? undefined,
          getQuantity: newDiscount.getQuantity ?? undefined,
          couponCode: newDiscount.couponCode ?? undefined,
          description: newDiscount.description,
          startDate: newDiscount.startDate?.toISOString(),
          endDate: newDiscount.endDate?.toISOString(),
          isActive: newDiscount.isActive,
          usageLimit: newDiscount.usageLimit ?? undefined,
          usageCount: newDiscount.usageCount,
          minimumPurchase: newDiscount.minimumPurchase ?? undefined,
          applicableCategories: newDiscount.applicableCategories?.map(
            (c: mongoose.Types.ObjectId) => c.toString()
          ),
          applicableProducts: newDiscount.applicableProducts?.map(
            (p: mongoose.Types.ObjectId) => p.toString()
          ),
          createdAt: newDiscount.createdAt.toISOString(),
          updatedAt: newDiscount.updatedAt.toISOString()
        }
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la création de la promotion:", error)

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

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        {
          success: false,
          message: "Ce code promo existe déjà"
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la création de la promotion"
      },
      { status: 500 }
    )
  }
}
