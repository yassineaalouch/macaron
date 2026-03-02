// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Order from "@/models/Order"
import Product from "@/models/Product"
import ProductPack from "@/models/ProductPack"
import { sendLowStockEmail } from "@/lib/nodemailer"
import { getLowStockThreshold } from "@/lib/getLowStockThreshold"
import { getMainImage } from "@/lib/getMainImage"

// Types pour la mise à jour
type OrderStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
type PaymentMethod =
  | "Carte bancaire"
  | "PayPal"
  | "Virement bancaire"
  | "À la livraison"
  | "Chèque"

interface UpdateOrderData {
  status?: OrderStatus
  paymentMethod?: PaymentMethod
}

// Fonction de validation
function isValidStatus(status: string): status is OrderStatus {
  const validStatuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "rejected",
    "processing",
    "shipped",
    "delivered",
    "cancelled"
  ]
  return validStatuses.includes(status as OrderStatus)
}

function isValidPaymentMethod(method: string): method is PaymentMethod {
  const validMethods: PaymentMethod[] = [
    "Carte bancaire",
    "PayPal",
    "Virement bancaire",
    "À la livraison",
    "Chèque"
  ]
  return validMethods.includes(method as PaymentMethod)
}

/**
 * Vérifie si le stock est bas et envoie un email si nécessaire
 * @param productId - L'ID du produit à vérifier
 * @param oldQuantity - L'ancienne quantité (pour éviter les emails en double)
 */
async function checkAndSendLowStockAlert(
  productId: string,
  oldQuantity: number
): Promise<void> {
  try {
    const lowStockThreshold = await getLowStockThreshold()
    const product = await Product.findById(productId)
    
    if (!product) {
      return
    }

    const currentQuantity = product.quantity ?? 0

    // Envoyer l'email seulement si:
    // 1. La quantité actuelle est entre 0 et le seuil
    // 2. L'ancienne quantité était >= au seuil (pour éviter les emails en double)
    if (
      currentQuantity > 0 &&
      currentQuantity < lowStockThreshold &&
      oldQuantity >= lowStockThreshold
    ) {
      try {
        await sendLowStockEmail({
          id: product._id?.toString() ?? "",
          nameFr: product.name?.fr ?? "Produit sans nom",
          nameAr: product.name?.ar,
          image: getMainImage(product),
          quantity: currentQuantity
        })
      } catch (emailError) {
        console.error(
          "Erreur lors de l'envoi de l'email de stock bas:",
          emailError
        )
      }
    }
  } catch (error) {
    console.error(
      `Erreur lors de la vérification du stock bas pour le produit ${productId}:`,
      error
    )
  }
}

/**
 * Met à jour les quantités des produits et packs selon le statut de la commande
 * @param order - La commande à traiter
 * @param isRestore - Si true, restaure les quantités (annulation), sinon les déduit (confirmation)
 */
async function updateProductQuantities(
  order: any,
  isRestore: boolean = false
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []
  const multiplier = isRestore ? 1 : -1

  try {
    // Parcourir tous les items de la commande
    for (const item of order.items) {
      if (item.type === "product") {
        // Gestion des produits simples
        try {
          const product = await Product.findById(item.id)
          if (!product) {
            errors.push(`Produit introuvable: ${item.name} (ID: ${item.id})`)
            continue
          }

          const oldQuantity = product.quantity
          const newQuantity = product.quantity + multiplier * item.quantity

          // Vérifier que la quantité ne devient pas négative lors de la déduction
          if (!isRestore && newQuantity < 0) {
            errors.push(
              `Stock insuffisant pour le produit "${item.name}". Stock disponible: ${product.quantity}, demandé: ${item.quantity}`
            )
            continue
          }

          await Product.findByIdAndUpdate(item.id, {
            $inc: { quantity: multiplier * item.quantity }
          })

          // Vérifier le stock bas après la mise à jour (seulement si on déduit, pas si on restaure)
          if (!isRestore) {
            await checkAndSendLowStockAlert(item.id, oldQuantity)
          }
        } catch (error) {
          console.error(
            `Erreur lors de la mise à jour du produit ${item.id}:`,
            error
          )
          errors.push(
            `Erreur lors de la mise à jour du produit "${item.name}"`
          )
        }
      } else if (item.type === "pack") {
        // Gestion des packs
        try {
          const pack = await ProductPack.findById(item.id)
          if (!pack) {
            errors.push(`Pack introuvable: ${item.name} (ID: ${item.id})`)
            continue
          }

          // Parcourir tous les produits du pack
          for (const packItem of pack.items) {
            try {
              const product = await Product.findById(packItem.productId)
              if (!product) {
                errors.push(
                  `Produit du pack introuvable (ID: ${packItem.productId})`
                )
                continue
              }

              const oldQuantity = product.quantity
              // Calculer la quantité totale à déduire/restaurer
              // quantité_produit_dans_pack × quantité_pack_commandé
              const totalQuantityToUpdate =
                packItem.quantity * item.quantity
              const newQuantity =
                product.quantity + multiplier * totalQuantityToUpdate

              // Vérifier que la quantité ne devient pas négative lors de la déduction
              if (!isRestore && newQuantity < 0) {
                errors.push(
                  `Stock insuffisant pour le produit "${product.name.fr}" dans le pack "${item.name}". Stock disponible: ${product.quantity}, demandé: ${totalQuantityToUpdate}`
                )
                continue
              }

              await Product.findByIdAndUpdate(packItem.productId, {
                $inc: { quantity: multiplier * totalQuantityToUpdate }
              })

              // Vérifier le stock bas après la mise à jour (seulement si on déduit, pas si on restaure)
              if (!isRestore) {
                await checkAndSendLowStockAlert(packItem.productId, oldQuantity)
              }
            } catch (error) {
              console.error(
                `Erreur lors de la mise à jour du produit ${packItem.productId} du pack:`,
                error
              )
              errors.push(
                `Erreur lors de la mise à jour d'un produit du pack "${item.name}"`
              )
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du pack ${item.id}:`, error)
          errors.push(`Erreur lors du traitement du pack "${item.name}"`)
        }
      }
    }

    return {
      success: errors.length === 0,
      errors
    }
  } catch (error) {
    console.error("Erreur générale lors de la mise à jour des quantités:", error)
    return {
      success: false,
      errors: ["Erreur lors de la mise à jour des quantités"]
    }
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    await connectToDatabase()

    const body = await request.json()
    const { status, paymentMethod } = body

    const updateData: UpdateOrderData = {}
    const errors: string[] = []

    // Validation et préparation des données
    if (status) {
      if (isValidStatus(status)) {
        updateData.status = status
      } else {
        errors.push(`Statut invalide: ${status}`)
      }
    }

    if (paymentMethod) {
      if (isValidPaymentMethod(paymentMethod)) {
        updateData.paymentMethod = paymentMethod
      } else {
        errors.push(`Méthode de paiement invalide: ${paymentMethod}`)
      }
    }

    // Retourner les erreurs de validation
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, message: "Données invalides", errors },
        { status: 400 }
      )
    }

    // Vérifier si au moins un champ est fourni
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "Aucune donnée valide à mettre à jour" },
        { status: 400 }
      )
    }

    // Récupérer l'ancien statut avant la mise à jour
    const oldOrder = await Order.findById(id)
    if (!oldOrder) {
      return NextResponse.json(
        { success: false, message: "Commande non trouvée" },
        { status: 404 }
      )
    }

    const oldStatus = oldOrder.status
    const newStatus = updateData.status

    // Mettre à jour la commande
    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Commande non trouvée" },
        { status: 404 }
      )
    }

    // Gérer la mise à jour des quantités selon le changement de statut
    if (newStatus && newStatus !== oldStatus) {
      // Si la commande passe à "confirmed", déduire les stocks
      if (newStatus === "confirmed" && oldStatus !== "confirmed") {
        const quantityUpdate = await updateProductQuantities(
          updatedOrder,
          false
        )

        if (!quantityUpdate.success) {
          // Si la mise à jour des stocks échoue, restaurer le statut précédent
          await Order.findByIdAndUpdate(id, { status: oldStatus })
          return NextResponse.json(
            {
              success: false,
              message: "Erreur lors de la mise à jour des stocks",
              errors: quantityUpdate.errors
            },
            { status: 400 }
          )
        }
      }
      // Si une commande confirmée est annulée ou rejetée, restaurer les stocks
      else if (
        oldStatus === "confirmed" &&
        (newStatus === "rejected" || newStatus === "cancelled")
      ) {
        const quantityUpdate = await updateProductQuantities(
          updatedOrder,
          true
        )

        if (!quantityUpdate.success) {
          console.error(
            "Erreur lors de la restauration des stocks:",
            quantityUpdate.errors
          )
          // On continue quand même car la commande est déjà annulée
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Commande mise à jour avec succès",
      order: updatedOrder
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande:", error)

    // Gestion des erreurs de validation Mongoose
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
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}
