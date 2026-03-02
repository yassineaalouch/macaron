
"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import axios from "axios"
import CheckoutForm from "@/components/Checkout/CheckoutForm"
import CartSummary from "@/components/Checkout/CartSummary"
import { ShoppingBag, CheckCircle, XCircle } from "lucide-react"
import { CheckoutFormData } from "@/types/type"
import { useCartContext } from "@/app/context/CartContext"
import { useToast } from "@/components/ui/Toast"

export default function CheckoutPage() {
  const t = useTranslations("CheckoutPage")
  const router = useRouter()
  const { showToast } = useToast()

  // Utilisez useCartContext comme avant
  const {
    cartItems,
    totalPrice,
    subtotal,
    shipping,
    discountAmount,
    coupon,
    couponData,
    couponError,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    hasFreeShipping,
    calculateItemTotal
  } = useCartContext()

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [orderId, setOrderId] = useState<string>("")

  const handleCheckout = async (formData: CheckoutFormData): Promise<void> => {
    setIsProcessing(true)
    setErrorMessage("")

    try {
      // Vérifier qu'il y a des articles dans le panier
      if (cartItems.length === 0) {
        setErrorMessage(t("checkout.emptyCart") || "Le panier est vide")
        setShowErrorModal(true)
        return
      }

      // Transformer les items du panier en format de commande (produits et packs séparés)
      const orderItems = cartItems.map((item) => {
        if (item.type === "pack") {
          // Créer un OrderPack
          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            discountPrice: item.discountPrice,
            image: item.image,
            type: "pack",
            items: item.packItems || []
          }
        } else {
          // Créer un OrderItem (produit) avec lineTotal et discountLabel pour le détail commande admin
          const lineTotal =
            typeof calculateItemTotal === "function"
              ? calculateItemTotal(item)
              : item.price * item.quantity
          let discountLabel: string | null = null
          if (item.discount?.type === "BUY_X_GET_Y" && item.discount.buyQuantity && item.discount.getQuantity) {
            discountLabel = `Achetez ${item.discount.buyQuantity}, obtenez ${item.discount.getQuantity} gratuit`
          } else if (item.discount?.type === "PERCENTAGE" && item.discount.value != null) {
            discountLabel = `Réduction ${item.discount.value}%`
          }
          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            discount: item.discount?.type || null,
            lineTotal,
            discountLabel,
            buyQuantity: item.discount?.type === "BUY_X_GET_Y" ? item.discount.buyQuantity ?? null : null,
            getQuantity: item.discount?.type === "BUY_X_GET_Y" ? item.discount.getQuantity ?? null : null,
            characteristic: item.characteristic || null,
            type: "product"
          }
        }
      })

      // Préparer les données de la commande avec les informations du coupon
      const orderData = {
        customerName: formData.customerName,
        customerAddress: formData.customerAddress,
        customerPhone: formData.customerPhone,
        items: orderItems,
        subtotal: subtotal, // Sous-total avant réduction
        discount: discountAmount, // Montant de la réduction
        coupon: couponData && couponData.couponCode
          ? {
              code: couponData.couponCode,
              discountType: couponData.type,
              value: couponData.value
            }
          : null,
        shipping: shipping, // Frais de livraison calculés
        total: totalPrice, // Total après réduction + frais de livraison
        hasFreeShipping: hasFreeShipping
      }

      // Envoyer la commande à l'API
      const response = await axios.post("/api/orders", orderData, {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 10000 // Timeout de 10 secondes
      })

      if (response.data.success) {
        // Succès - enregistrer l'ID de la commande
        setOrderId(response.data.orderId)
        setShowSuccessModal(true)

        // Vider le panier après succès
        setTimeout(() => {
          clearCart()
        }, 1000)

        // Redirection après 3 secondes
        setTimeout(() => {
          router.push(`/order-confirmation`)
        }, 1000)
      } else {
        throw new Error(response.data.message || "Erreur inconnue")
      }
    } catch (error: unknown) {
      let message = t("checkout.error") || "Erreur lors de l'enregistrement"

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          message = error.response.data.message
        } else if (error.response?.data?.errors) {
          message = error.response.data.errors.join(", ")
        } else if (error.code === "ECONNABORTED") {
          message = "La requête a expiré. Veuillez réessayer."
        } else if (!error.response) {
          message = "Erreur de connexion. Vérifiez votre connexion internet."
        }
      }

      showToast(message, "error")
      setErrorMessage(message)
      setShowErrorModal(true)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-firstColor/20 p-3 ">
                <ShoppingBag className="text-firstColor" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {t("header.title")}
                </h1>
                <p className="text-gray-600">{t("header.subtitle")}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 md:px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Formulaire de commande */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <CheckoutForm
              onSubmit={handleCheckout}
              isProcessing={isProcessing}
              total={totalPrice}
            />
          </motion.div>

          {/* Résumé du panier */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <CartSummary
              items={cartItems}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              subtotal={subtotal}
              shipping={shipping}
              total={totalPrice}
              coupon={coupon}
              couponData={couponData}
              couponError={couponError}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
            />
          </motion.div>
        </div>
      </main>

      {/* Modal de succès */}
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSuccessModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-firstColor/20 flex items-center justify-center mb-4">
                <CheckCircle className="text-firstColor" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {t("checkout.successTitle") || "Commande confirmée !"}
              </h2>
              <p className="text-gray-600 mb-4">
                {t("checkout.successMessage") ||
                  "Votre commande a été enregistrée avec succès."}
              </p>

              {/* Affichage des détails de la réduction */}
              {couponData && (
                <div className="bg-firstColor/10 p-3 mb-3">
                  <p className="text-sm text-firstColor font-semibold">
                    Coupon appliqué: {couponData.name.fr}
                  </p>
                  <p className="text-xs text-firstColor">
                    Économie réalisée: {discountAmount.toFixed(2)} MAD
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-4 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">N° de commande:</span>
                </p>
                <p className="text-xs text-gray-500 break-all mt-1">
                  {orderId}
                </p>
              </div>
              <p className="text-sm text-gray-500">Redirection en cours...</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal d'erreur */}
      {showErrorModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowErrorModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 flex items-center justify-center mb-4">
                <XCircle className="text-red-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {t("checkout.errorTitle") || "Erreur"}
              </h2>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-600 text-white px-6 py-3 font-semibold hover:bg-red-700 transition-colors w-full"
              >
                {t("checkout.retry") || "Réessayer"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
