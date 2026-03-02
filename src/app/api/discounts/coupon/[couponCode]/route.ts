// app/api/discounts/coupon/[couponCode]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Discount from "@/models/Discount"
import { Discount as DiscountType } from "@/types/discount"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ couponCode: string }> }
) {
  const { couponCode } = await context.params

  try {
    await connectToDatabase()

    if (!couponCode) {
      return NextResponse.json(
        { success: false, message: "Code coupon requis" },
        { status: 400 }
      )
    }

    // Rechercher le coupon par code (case insensitive)
    const discount = await Discount.findOne({
      couponCode: couponCode.toUpperCase(),
      type: "COUPON"
    })

    if (!discount) {
      return NextResponse.json(
        { success: false, message: "Coupon non trouvé" },
        { status: 404 }
      )
    }

    const now = new Date()
    
    // Vérifier d'abord si le coupon est actif par l'admin (priorité à la décision de l'admin)
    if (!discount.isActive) {
      return NextResponse.json(
        { success: false, message: "Ce coupon n'est pas actif" },
        { status: 400 }
      )
    }
    
    // Vérification automatique des dates et activation/désactivation
    let shouldBeActive = discount.isActive
    
    // Si la date de début est dans le futur, le coupon n'est pas encore valide
    if (discount.startDate && new Date(discount.startDate) > now) {
      // Désactiver automatiquement si pas encore valide
      if (discount.isActive) {
        await Discount.findByIdAndUpdate(discount._id, { isActive: false })
      }
      return NextResponse.json(
        { success: false, message: "Ce coupon n'est pas encore valide" },
        { status: 400 }
      )
    }
    
    // Si la date de fin est passée, le coupon a expiré
    if (discount.endDate && new Date(discount.endDate) < now) {
      // Désactiver automatiquement si expiré
      if (discount.isActive) {
        await Discount.findByIdAndUpdate(discount._id, { isActive: false })
      }
      return NextResponse.json(
        { success: false, message: "Ce coupon a expiré" },
        { status: 400 }
      )
    }
    
    // Si la date de début est passée ou aujourd'hui et pas de date de fin ou date de fin future, activer automatiquement
    // MAIS seulement si l'admin ne l'a pas désactivé manuellement
    if (discount.startDate && new Date(discount.startDate) <= now && 
        (!discount.endDate || new Date(discount.endDate) >= now)) {
      if (!discount.isActive) {
        await Discount.findByIdAndUpdate(discount._id, { isActive: true })
        shouldBeActive = true
      }
    }
    
    // Si pas de date de début, considérer comme valide à partir d'aujourd'hui
    // MAIS seulement si l'admin ne l'a pas désactivé manuellement
    if (!discount.startDate && !discount.isActive) {
      await Discount.findByIdAndUpdate(discount._id, { 
        isActive: true,
        startDate: now
      })
      shouldBeActive = true
    }

    // Vérifier que le coupon est actif (après les vérifications automatiques)
    if (!shouldBeActive) {
      return NextResponse.json(
        { success: false, message: "Ce coupon n'est pas actif" },
        { status: 400 }
      )
    }

    // Vérifier la limite d'utilisation
    if (discount.usageLimit && discount.usageLimit > 0 && discount.usageCount >= discount.usageLimit) {
      // Désactiver automatiquement si la limite est atteinte
      if (discount.isActive) {
        await Discount.findByIdAndUpdate(discount._id, { isActive: false })
      }
      return NextResponse.json(
        {
          success: false,
          message: "Ce coupon a atteint sa limite d'utilisation"
        },
        { status: 400 }
      )
    }

    // Recharger le discount pour avoir les valeurs mises à jour
    const updatedDiscount = await Discount.findById(discount._id)

    const discountData: DiscountType = {
      _id: updatedDiscount!._id as string,
      name: updatedDiscount!.name,
      type: updatedDiscount!.type,
      value: updatedDiscount!.value ?? undefined,
      buyQuantity: updatedDiscount!.buyQuantity ?? undefined,
      getQuantity: updatedDiscount!.getQuantity ?? undefined,
      couponCode: updatedDiscount!.couponCode ?? undefined,
      description: updatedDiscount!.description,
      startDate: updatedDiscount!.startDate?.toISOString(),
      endDate: updatedDiscount!.endDate?.toISOString(),
      isActive: updatedDiscount!.isActive,
      usageLimit: updatedDiscount!.usageLimit ?? undefined,
      usageCount: updatedDiscount!.usageCount,
      minimumPurchase: updatedDiscount!.minimumPurchase ?? undefined,
      createdAt: updatedDiscount!.createdAt.toISOString(),
      updatedAt: updatedDiscount!.updatedAt.toISOString()
    }

    return NextResponse.json(
      { success: true, discount: discountData },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la recherche du coupon:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}
