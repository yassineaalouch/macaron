// app/api/discounts/[discountId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Discount from "@/models/Discount"
import { DiscountRequestBody, Discount as DiscountType } from "@/types/discount"
import mongoose from "mongoose"

interface ValidationError extends Error {
  name: "ValidationError"
  errors: {
    [key: string]: {
      message: string
    }
  }
}

interface ValidationError extends Error {
  name: "ValidationError"
  errors: Record<string, { message: string }>
}

function isValidationError(error: unknown): error is ValidationError {
  if (typeof error !== "object" || error === null) return false
  // Vérifier que 'name' est une clé de l'objet et que c'est bien une string
  if (!("name" in error)) return false
  const e = error as Record<string, unknown>
  return e.name === "ValidationError"
}

// --- GET - Récupérer une promotion par ID ---
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ discountId: string }> }
) {
  const { discountId } = await context.params
  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(discountId)) {
      return NextResponse.json(
        { success: false, message: "ID de promotion invalide" },
        { status: 400 }
      )
    }

    const discount = await Discount.findById(discountId)
      .populate("Category", "name")
      .populate("Product", "name")

    if (!discount) {
      return NextResponse.json(
        { success: false, message: "Promotion introuvable" },
        { status: 404 }
      )
    }

    const discountData: DiscountType = {
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
    }

    return NextResponse.json(
      { success: true, discount: discountData },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération de la promotion:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// --- PUT - Mettre à jour une promotion ---
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ discountId: string }> }
) {
  const { discountId } = await context.params
  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(discountId)) {
      return NextResponse.json(
        { success: false, message: "ID de promotion invalide" },
        { status: 400 }
      )
    }

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

    const existingDiscount = await Discount.findById(discountId)
    if (!existingDiscount) {
      return NextResponse.json(
        { success: false, message: "Erreur lors de la sauvegarde : promotion introuvable" },
        { status: 404 }
      )
    }

    // Validation spécifique selon le type
    if (type === "PERCENTAGE" && (!value || value <= 0 || value > 100)) {
      return NextResponse.json(
        { success: false, message: "Erreur lors de la sauvegarde : le pourcentage doit être entre 1 et 100" },
        { status: 400 }
      )
    }
    if (type === "BUY_X_GET_Y") {
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
    }
    if (type === "COUPON") {
      if (!couponCode || couponCode.trim().length === 0)
        return NextResponse.json(
          { success: false, message: "Erreur lors de la sauvegarde : le code promo est requis" },
          { status: 400 }
        )
      
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

      if (!value || value <= 0)
        return NextResponse.json(
          { success: false, message: "Erreur lors de la sauvegarde : la valeur du coupon doit être positive" },
          { status: 400 }
        )

      // Déterminer les valeurs finales pour usageLimit et minimumPurchase
      const finalUsageLimit = usageLimit !== undefined ? usageLimit : existingDiscount.usageLimit
      const finalMinimumPurchase = minimumPurchase !== undefined ? minimumPurchase : existingDiscount.minimumPurchase

      // Validation : usageLimit est obligatoire pour les codes promo
      if (!finalUsageLimit || finalUsageLimit <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : le nombre d'utilisation limit est requis pour les codes promo"
          },
          { status: 400 }
        )
      }

      // Validation : minimumPurchase est obligatoire pour les codes promo
      if (!finalMinimumPurchase || finalMinimumPurchase <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : le montant minimum du panier est requis pour les codes promo"
          },
          { status: 400 }
        )
      }

      // Validation : le montant de réduction doit être inférieur au montant minimum du panier
      if (value >= finalMinimumPurchase) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la sauvegarde : le montant de réduction doit être inférieur au montant minimum du panier"
          },
          { status: 400 }
        )
      }

      if (couponCode.toUpperCase().trim() !== existingDiscount.couponCode) {
        const duplicateCoupon = await Discount.findOne({
          couponCode: couponCode.toUpperCase().trim(),
          _id: { $ne: discountId }
        })
        if (duplicateCoupon)
          return NextResponse.json(
            { success: false, message: "Erreur lors de la sauvegarde : ce code promo existe déjà" },
            { status: 400 }
          )
      }
    }

    // Gestion automatique des dates
    const now = new Date()
    // Si startDate n'est pas fourni et qu'il n'existe pas, utiliser aujourd'hui
    const finalStartDate = startDate 
      ? new Date(startDate) 
      : (existingDiscount.startDate ? new Date(existingDiscount.startDate) : now)
    // Si endDate n'est pas fourni, garder l'existant ou null (indéfini)
    const finalEndDate = endDate ? new Date(endDate) : (existingDiscount.endDate ? new Date(existingDiscount.endDate) : null)
    
    // Déterminer automatiquement isActive selon les dates
    let finalIsActive = isActive !== undefined ? isActive : existingDiscount.isActive
    
    // Si la date de début est dans le futur, désactiver automatiquement
    if (finalStartDate > now) {
      finalIsActive = false
    }
    // Si la date de fin est passée, désactiver automatiquement
    if (finalEndDate && finalEndDate < now) {
      finalIsActive = false
    }
    // Si la date de début est passée ou aujourd'hui et pas de date de fin ou date de fin future, activer
    if (finalStartDate <= now && (!finalEndDate || finalEndDate >= now)) {
      // Ne pas forcer l'activation si l'admin l'a désactivé manuellement
      if (isActive === undefined) {
        finalIsActive = true
      }
    }
    
    // Pour les types autres que COUPON, ignorer usageLimit et minimumPurchase
    // Pour COUPON, ces champs sont obligatoires (déjà validés ci-dessus)
    const finalUsageLimit = type === "COUPON" 
      ? (usageLimit !== undefined ? usageLimit : existingDiscount.usageLimit)
      : null
    const finalMinimumPurchase = type === "COUPON"
      ? (minimumPurchase !== undefined ? minimumPurchase : existingDiscount.minimumPurchase)
      : null

    const updatedDiscount = await Discount.findByIdAndUpdate(
      discountId,
      {
        name: { fr: name.fr.trim(), ar: name.ar.trim() },
        type,
        value: value ?? undefined,
        buyQuantity: buyQuantity ?? undefined,
        getQuantity: getQuantity ?? undefined,
        couponCode: couponCode?.toUpperCase() ?? undefined,
        description: description
          ? { fr: description.fr.trim(), ar: description.ar.trim() }
          : undefined,
        startDate: finalStartDate,
        endDate: finalEndDate,
        isActive: finalIsActive,
        usageLimit: finalUsageLimit,
        minimumPurchase: finalMinimumPurchase
      },
      { new: true, runValidators: true }
    )

    if (!updatedDiscount)
      return NextResponse.json(
        { success: false, message: "Erreur lors de la mise à jour" },
        { status: 500 }
      )

    const discountData: DiscountType = {
      _id: updatedDiscount._id as string,
      name: updatedDiscount.name,
      type: updatedDiscount.type,
      value: updatedDiscount.value ?? undefined,
      buyQuantity: updatedDiscount.buyQuantity ?? undefined,
      getQuantity: updatedDiscount.getQuantity ?? undefined,
      couponCode: updatedDiscount.couponCode ?? undefined,
      description: updatedDiscount.description,
      startDate: updatedDiscount.startDate?.toISOString(),
      endDate: updatedDiscount.endDate?.toISOString(),
      isActive: updatedDiscount.isActive,
      usageLimit: updatedDiscount.usageLimit ?? undefined,
      usageCount: updatedDiscount.usageCount,
      minimumPurchase: updatedDiscount.minimumPurchase ?? undefined,
      createdAt: updatedDiscount.createdAt.toISOString(),
      updatedAt: updatedDiscount.updatedAt.toISOString()
    }

    return NextResponse.json(
      {
        success: true,
        message: "Promotion mise à jour avec succès",
        discount: discountData
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour de la promotion:", error)

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
        { success: false, message: "Ce code promo existe déjà" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// --- DELETE - Supprimer une promotion ---
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ discountId: string }> }
) {
  const { discountId } = await context.params
  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(discountId)) {
      return NextResponse.json(
        { success: false, message: "ID de promotion invalide" },
        { status: 400 }
      )
    }

    const deletedDiscount = await Discount.findByIdAndDelete(discountId)
    if (!deletedDiscount)
      return NextResponse.json(
        { success: false, message: "Promotion introuvable" },
        { status: 404 }
      )

    return NextResponse.json(
      { success: true, message: "Promotion supprimée avec succès" },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression de la promotion:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un discount
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ discountId: string }> }
) {
  const { discountId } = await context.params
  try {
    await connectToDatabase()

    const { isActive } = await request.json()
    if (!mongoose.Types.ObjectId.isValid(discountId)) {
      return NextResponse.json(
        { success: false, message: "ID invalide" },
        { status: 401 }
      )
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { success: false, message: "isActive doit être un booléen" },
        { status: 402 }
      )
    }

    const discount = await Discount.findById(discountId)
    if (!discount) {
      return NextResponse.json(
        { success: false, message: "Promotion introuvable" },
        { status: 404 }
      )
    }

    discount.isActive = isActive
    await discount.save()

    return NextResponse.json({ success: true, discount })
  } catch (error) {
    console.error("Erreur lors de la modification du discount:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}
