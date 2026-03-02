import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectToDatabase } from "@/lib/mongodb"
import Order from "@/models/Order"
import Discount from "@/models/Discount"
import Product from "@/models/Product"
import { sendOrderEmail } from "@/lib/nodemailer"
import { OrderRequestBody } from "@/types/order"

// Types pour les données de commande

interface ValidationError extends Error {
  name: "ValidationError"
  errors: {
    [key: string]: {
      message: string
    }
  }
}

// Type guard pour vérifier si c'est une ValidationError
function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ValidationError"
  )
}

export async function POST(request: NextRequest) {
  try {
    // Connexion à la base de données
    await connectToDatabase()

    // Récupérer les données de la requête
    const body = (await request.json()) as OrderRequestBody

    const {
      customerName,
      customerAddress,
      customerPhone,
      items,
      subtotal,
      shipping,
      total,
      coupon
    } = body

    // Validation des données
    if (
      !customerName ||
      !customerAddress ||
      !customerPhone ||
      !items ||
      items.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Données manquantes" },
        { status: 400 }
      )
    }

    // Vérifier et gérer le coupon si présent
    let couponDiscount = null
    if (coupon && coupon.code) {
      // Chercher le coupon par code
      couponDiscount = await Discount.findOne({
        couponCode: coupon.code.toUpperCase(),
        type: "COUPON"
      })

      if (couponDiscount) {
        const now = new Date()
        
        // Vérifier les dates
        if (couponDiscount.startDate && new Date(couponDiscount.startDate) > now) {
          return NextResponse.json(
            { success: false, message: "Ce coupon n'est pas encore valide" },
            { status: 400 }
          )
        }
        
        if (couponDiscount.endDate && new Date(couponDiscount.endDate) < now) {
          return NextResponse.json(
            { success: false, message: "Ce coupon a expiré" },
            { status: 400 }
          )
        }

        // Vérifier le montant minimum du panier
        if (couponDiscount.minimumPurchase && couponDiscount.minimumPurchase > 0) {
          if (subtotal < couponDiscount.minimumPurchase) {
            return NextResponse.json(
              { 
                success: false, 
                message: `Montant minimum requis pour ce coupon: ${couponDiscount.minimumPurchase} MAD` 
              },
              { status: 400 }
            )
          }
        }

        // Vérifier la limite d'utilisation
        if (couponDiscount.usageLimit && couponDiscount.usageLimit > 0) {
          if (couponDiscount.usageCount >= couponDiscount.usageLimit) {
            return NextResponse.json(
              { success: false, message: "Ce coupon a atteint sa limite d'utilisation" },
              { status: 400 }
            )
          }
        }

        // Vérifier que le coupon est actif
        if (!couponDiscount.isActive) {
          return NextResponse.json(
            { success: false, message: "Ce coupon n'est pas actif" },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { success: false, message: "Coupon invalide" },
          { status: 400 }
        )
      }
    }
    // Build order data - handle optional fields from admin form
    const orderData: {
      customerName: string
      customerAddress: string
      customerPhone: string
      items: typeof items
      subtotal: number
      shipping: number
      total: number
      status: string
      coupon: string | null
      paymentMethod?: string
      shippingMethod?: string
      notes?: string
    } = {
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      customerPhone: customerPhone.trim(),
      items,
      subtotal,
      shipping,
      total,
      status: "pending",
      coupon: coupon || null
    }

    // Add optional fields if present in request body
    const bodyData = body as OrderRequestBody & {
      paymentMethod?: string
      shippingMethod?: string
      notes?: string
    }
    if (bodyData.paymentMethod) {
      orderData.paymentMethod = bodyData.paymentMethod
    }
    if (bodyData.shippingMethod) {
      orderData.shippingMethod = bodyData.shippingMethod
    }
    if (bodyData.notes !== undefined) {
      orderData.notes = bodyData.notes
    }

    // Créer la nouvelle commande
    const newOrder = await Order.create(orderData)

    // Si un coupon a été utilisé, incrémenter usageCount de façon atomique (pour que la limite d'utilisation diminue bien)
    if (couponDiscount) {
      const couponId = typeof couponDiscount._id === "string" ? couponDiscount._id : couponDiscount._id.toString()
      const updatedDiscount = await Discount.findByIdAndUpdate(
        couponId,
        { $inc: { usageCount: 1 } },
        { new: true, runValidators: false }
      )
      if (updatedDiscount && updatedDiscount.usageLimit != null && updatedDiscount.usageCount >= updatedDiscount.usageLimit) {
        await Discount.findByIdAndUpdate(couponId, { isActive: false })
      }
    }

    // await sendOrderEmail(newOrder)
    await sendOrderEmail({ ...newOrder.toObject(), coupon })
    return NextResponse.json(
      {
        success: true,
        message: "Commande enregistrée avec succès",
        orderId: newOrder._id.toString(),
        order: newOrder
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la création de la commande:", error)

    // Gestion des erreurs de validation Mongoose
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
        message: "Erreur lors de l'enregistrement de la commande"
      },
      { status: 500 }
    )
  }
}

// Récupérer les commandes avec pagination et filtres côté serveur
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "30")
    const skip = (page - 1) * limit

    // Filtres
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const minAmount = searchParams.get("minAmount")
    const maxAmount = searchParams.get("maxAmount")
    const itemType = searchParams.get("itemType")

    // Construire la requête de filtrage
    const query: {
      status?: string
      createdAt?: { $gte?: Date; $lte?: Date }
      total?: { $gte?: number; $lte?: number }
      $or?: Array<
        | { orderNumber?: { $regex: string; $options: string } }
        | { customerName?: { $regex: string; $options: string } }
      >
    } = {}

    // Filtre par statut
    if (status) {
      query.status = status
    }

    // Filtre par date
    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        query.createdAt.$lte = toDate
      }
    }

    // Filtre par montant
    if (minAmount || maxAmount) {
      query.total = {}
      if (minAmount) {
        query.total.$gte = parseFloat(minAmount)
      }
      if (maxAmount) {
        query.total.$lte = parseFloat(maxAmount)
      }
    }

    // Recherche dans orderNumber et customerName
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } }
      ]
    }

    // Compter le total pour la pagination
    const total = await Order.countDocuments(query)

    // Récupérer les commandes avec pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // Tri par date décroissante (newest first)
      .skip(skip)
      .limit(limit)
      .lean()

    // Si filtre par type d'item, filtrer en JavaScript (car MongoDB ne peut pas facilement filtrer sur les arrays imbriqués)
    let filteredOrders = orders
    if (itemType && itemType !== "") {
      filteredOrders = orders.filter((order: any) => {
        if (itemType === "products") {
          return order.items.some((item) => item.type === "product")
        } else if (itemType === "packs") {
          return order.items.some((item) => item.type === "pack")
        } else if (itemType === "mixed") {
          const hasProducts = order.items.some(
            (item) => item.type === "product"
          )
          const hasPacks = order.items.some((item) => item.type === "pack")
          return hasProducts && hasPacks
        }
        return true
      })
    }

    // Enrichir les items produit : si discount BUY_X_GET_Y sans buyQuantity/getQuantity, les récupérer depuis le produit
    const productIdsToEnrich = new Set<string>()
    for (const order of filteredOrders as any[]) {
      for (const item of order.items || []) {
        if (
          item.type === "product" &&
          item.discount === "BUY_X_GET_Y" &&
          (item.buyQuantity == null || item.getQuantity == null) &&
          item.id
        ) {
          productIdsToEnrich.add(String(item.id))
        }
      }
    }
    const productDiscountMap = new Map<string, { buyQuantity: number; getQuantity: number }>()
    if (productIdsToEnrich.size > 0) {
      const products = await Product.find({
        _id: { $in: Array.from(productIdsToEnrich).map((id) => new mongoose.Types.ObjectId(id)) }
      })
        .populate("discount")
        .lean()
      for (const p of products as any[]) {
        const discount = p.discount
        if (discount && discount.type === "BUY_X_GET_Y" && discount.buyQuantity != null && discount.getQuantity != null) {
          productDiscountMap.set(String(p._id), {
            buyQuantity: discount.buyQuantity,
            getQuantity: discount.getQuantity
          })
        }
      }
    }
    for (const order of filteredOrders as any[]) {
      for (const item of order.items || []) {
        if (item.type === "product" && item.discount === "BUY_X_GET_Y" && (item.buyQuantity == null || item.getQuantity == null) && item.id) {
          const enriched = productDiscountMap.get(String(item.id))
          if (enriched) {
            item.buyQuantity = enriched.buyQuantity
            item.getQuantity = enriched.getQuantity
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        orders: filteredOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(filteredOrders.length / limit)
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des commandes:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}
