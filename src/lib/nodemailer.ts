import nodemailer, { Transporter } from "nodemailer"
import { isColorCharacteristic, isValidHexColor, normalizeHexColor } from "@/utils/colorCharacteristic"

interface OrderItem {
  id: string
  name: string
  category?: string
  price: number
  quantity: number
  image: string
  characteristic?: Array<{ name: string; value: string }>
  type?: "product" | "pack"
  discountPrice?: number
  items?: Array<{
    id: string
    name: string
    quantity: number
    price: number
    image: string
  }>
}

interface OrderData {
  customerName: string
  customerAddress: string
  customerPhone: string
  subtotal: number
  shipping: number
  total: number
  items: OrderItem[]
  status: string
  coupon: { code: string; discountType: string; value: number } | null
}

interface LowStockProductData {
  id: string
  nameFr: string
  nameAr?: string
  image?: string
  quantity: number
}

// Configuration Nodemailer
export const transporter: Transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER as string,
    pass: process.env.EMAIL_PASS as string
  }
})

export const sendOrderEmail = async (orderData: OrderData): Promise<void> => {
  // Liste des produits et packs avec caractéristiques
  const itemsList = orderData.items
    .map((item) => {
      // Générer le HTML des caractéristiques si elles existent (uniquement pour les produits)
      let characteristicsHtml = ""
      if (item.type !== "pack" && item.characteristic && item.characteristic.length > 0) {
        const characteristicsList = item.characteristic
          .slice(0, 3) // Limiter à 3 caractéristiques pour l'email
          .map((char) => {
            const isColor = isColorCharacteristic(char.name)
            const isHexColor = isValidHexColor(char.value)
            
            if (isColor && isHexColor) {
              // Afficher un cercle coloré pour les couleurs
              return `
                <span style="display:inline-block; margin-right:8px; margin-bottom:4px;">
                  <span style="font-size:11px; color:#666;">${char.name}:</span>
                  <span 
                    style="display:inline-block; width:16px; height:16px; border-radius:50%; border:1px solid #ddd; background-color:${normalizeHexColor(char.value)}; vertical-align:middle; margin-left:4px;"
                    title="${char.value}"
                  ></span>
                </span>
              `
            } else {
              // Afficher le texte normal pour les autres caractéristiques
              return `
                <span style="display:inline-block; margin-right:8px; margin-bottom:4px; font-size:11px; color:#666;">
                  <strong>${char.name}:</strong> ${char.value}
                </span>
              `
            }
          })
          .join("")
        
        if (characteristicsList) {
          characteristicsHtml = `
            <div style="margin-top:4px; padding-top:4px; border-top:1px solid #f0f0f0;">
              ${characteristicsList}
            </div>
          `
        }
      }
      
      // Gérer l'affichage du prix (avec réduction pour les packs si applicable)
      let priceHtml = ""
      if (item.type === "pack" && item.discountPrice) {
        const totalOriginal = item.price * item.quantity
        const totalDiscount = item.discountPrice * item.quantity
        priceHtml = `
          <div style="text-align:right;">
            <div style="color:#10b981; font-weight:bold;">${totalDiscount.toFixed(2)} MAD</div>
            <div style="color:#999; font-size:11px; text-decoration:line-through;">${totalOriginal.toFixed(2)} MAD</div>
          </div>
        `
      } else {
        priceHtml = `<div style="text-align:right;">${(item.price * item.quantity).toFixed(2)} MAD</div>`
      }
      
      // Informations supplémentaires pour les packs
      let packInfoHtml = ""
      if (item.type === "pack") {
        const packItemsCount = item.items?.length || 0
        packInfoHtml = `
          <div style="margin-top:4px; padding-top:4px; border-top:1px solid #f0f0f0;">
            <span style="font-size:11px; color:#9333ea; font-weight:bold;">📦 PACK</span>
            ${packItemsCount > 0 ? `<span style="font-size:11px; color:#666; margin-left:8px;">${packItemsCount} produit${packItemsCount > 1 ? "s" : ""} inclus</span>` : ""}
          </div>
        `
      }
      
      return `
      <tr style="border-bottom:1px solid #eee; ${item.type === "pack" ? "background-color:#faf5ff;" : ""}">
        <td style="padding:8px;">
          <img src="${item.image}" alt="${
        item.name
      }" width="50" style="border-radius:6px; ${item.type === "pack" ? "border:2px solid #9333ea;" : ""}" />
        </td>
        <td style="padding:8px;">
          <div style="font-weight:${item.type === "pack" ? "bold" : "normal"}; color:${item.type === "pack" ? "#9333ea" : "#333"};">
            ${item.name}
          </div>
          ${packInfoHtml}
          ${characteristicsHtml}
        </td>
        <td style="padding:8px; text-align:center;">${item.quantity}</td>
        <td style="padding:8px;">
          ${priceHtml}
        </td>
      </tr>`
    })
    .join("")

  // Coupon info
  const couponHtml = orderData.coupon
    ? (() => {
        const { code, value, discountType } = orderData.coupon
        let typeText = ""
        let valueText = ""

        switch (discountType) {
          case "PERCENTAGE":
            typeText = "Pourcentage"
            valueText = `${value}%`
            break
          case "BUY_X_GET_Y":
            typeText = "Offre X acheté / Y offert"
            valueText = `${value}` // ou mettre les détails exacts si disponibles
            break
          case "COUPON":
            typeText = "Réduction fixe"
            valueText = `${value} MAD`
            break
          default:
            typeText = "Inconnu"
            valueText = value ? `${value}` : "--"
        }

        return `<p><strong>Coupon :</strong> ${code ?? "--"}
        - <strong>Valeur :</strong> ${valueText} 
        - <strong>Type :</strong> ${typeText}</p>`
      })()
    : "<p><strong>Coupon :</strong> Aucun</p>"

  const mailOptions = {
    from: `"Sweet Macaron" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL as string,
    subject: `🛒 Nouvelle commande de ${orderData.customerName}`,
    html: `
      <div style="font-family:Arial, sans-serif; color:#333;">
        <h2 style="color:#FBBF24;">Nouvelle commande reçue !</h2>
        <p><strong>Nom :</strong> ${orderData.customerName}</p>
        <p><strong>Adresse :</strong> ${orderData.customerAddress}</p>
        <p><strong>Téléphone :</strong> ${orderData.customerPhone}</p>
        <hr style="border:none; border-top:1px solid #eee; margin:10px 0;"/>
        <p><strong>Sous-total :</strong> ${orderData.subtotal.toFixed(
          2
        )} MAD</p>
        <p><strong>Livraison :</strong> ${orderData.shipping.toFixed(2)} MAD</p>
        ${couponHtml}
        <p><strong>Total :</strong> <span style="color:#FBBF24; font-weight:bold;">${orderData.total.toFixed(
          2
        )} MAD</span></p>
        <p><strong>Status :</strong> ${orderData.status}</p>
        <hr style="border:none; border-top:1px solid #eee; margin:10px 0;"/>
        <h3>🧾 Détails des produits :</h3>
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
          <thead>
            <tr style="background:#FBBF24; color:white;">
              <th style="padding:8px;">Image</th>
              <th style="padding:8px;">Produit</th>
              <th style="padding:8px;">Quantité</th>
              <th style="padding:8px;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
        <p style="margin-top:20px; font-size:12px; color:#888;">Sweet Macaron - Merci pour votre confiance !</p>
      </div>
    `
  }

  await transporter.sendMail(mailOptions)
}

/**
 * Envoie un email à l'administrateur lorsqu'un produit passe en stock bas
 * (quantité inférieure au seuil défini, ex: 15).
 */
export const sendLowStockEmail = async (
  product: LowStockProductData
): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn(
      "ADMIN_EMAIL n'est pas défini dans les variables d'environnement. Impossible d'envoyer l'email de stock bas."
    )
    return
  }

  const imageUrl = product.image

  const mailOptions = {
    from: `"Sweet Macaron" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `⚠️ Stock bas pour le produit: ${product.nameFr}`,
    html: `
      <div style="font-family:Arial, sans-serif; color:#333;">
        <h2 style="color:#DC2626;">Alerte stock bas</h2>
        <p>Le stock d'un produit est passé en dessous du seuil défini.</p>
        <hr style="border:none; border-top:1px solid #eee; margin:10px 0;"/>
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
          <tr>
            <td style="padding:8px; width:80px;">
              ${
                imageUrl
                  ? `<img src="${imageUrl}" alt="${product.nameFr}" width="70" style="border-radius:6px;" />`
                  : ""
              }
            </td>
            <td style="padding:8px; vertical-align:top;">
              <p><strong>Nom (FR) :</strong> ${product.nameFr}</p>
              ${
                product.nameAr
                  ? `<p><strong>Nom (AR) :</strong> ${product.nameAr}</p>`
                  : ""
              }
              <p><strong>ID produit :</strong> ${product.id}</p>
              <p><strong>Quantité actuelle :</strong> ${product.quantity}</p>
            </td>
          </tr>
        </table>
        <hr style="border:none; border-top:1px solid #eee; margin:10px 0;"/>
        <p style="color:#DC2626;"><strong>Action recommandée :</strong> mettre à jour la quantité en stock dans le back-office.</p>
        <p style="margin-top:16px; font-size:12px; color:#888;">Sweet Macaron - Notification automatique de gestion de stock.</p>
      </div>
    `
  }

  await transporter.sendMail(mailOptions)
}
