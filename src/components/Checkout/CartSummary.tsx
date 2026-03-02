
"use client"
import { motion } from "framer-motion"
import { Minus, Plus, Trash2, ShoppingCart, Gift, Phone } from "lucide-react"
import { useTranslations } from "next-intl"
import { CartSummaryProps } from "@/types/type"
import { Link } from "@/i18n/navigation"
import { FREE_SHIPPING_THRESHOLD } from "@/data/data"
import Image from "next/image"
import { useState } from "react"
import { isColorCharacteristic, isValidHexColor, normalizeHexColor } from "@/utils/colorCharacteristic"

export default function CartSummary({
  items,
  updateQuantity,
  removeItem,
  subtotal,
  shipping,
  total,
  coupon,
  couponData,
  couponError,
  applyCoupon,
  removeCoupon
}: CartSummaryProps) {
  const t = useTranslations("CartSummary")
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [couponCode, setCouponCode] = useState("")
  const [isApplying, setIsApplying] = useState(false)
  const [localCouponError, setLocalCouponError] = useState<string | null>(null)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setLocalCouponError("Veuillez entrer un code promo")
      return
    }

    if (!applyCoupon) {
      setLocalCouponError("Fonction d'application de coupon non disponible")
      return
    }

    setIsApplying(true)
    setLocalCouponError(null)

    const result = await applyCoupon(couponCode.trim())

    if (result.success) {
      setCouponCode("")
    } else {
      setLocalCouponError(result.message)
    }
    setIsApplying(false)
  }

  const handleRemoveCoupon = () => {
    if (removeCoupon) {
      removeCoupon()
      setLocalCouponError(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApplyCoupon()
    }
  }

  // Fonction pour gérer le pluriel
  const getItemCountText = (count: number) => {
    return count > 1
      ? t("header.itemCountPlural", { count })
      : t("header.itemCount", { count })
  }

  const displayError = couponError || localCouponError
  const discountAmount = subtotal - total

  return (
    <div className="bg-white shadow-sm p-4 sm:p-6 md:p-8 sticky top-8 w-full max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center min-w-0 flex-1">
          <div className="bg-firstColor/20 p-2 mr-2 sm:mr-3 flex-shrink-0">
            <ShoppingCart className="text-secondColor" size={18} />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
            {t("header.title")}
          </h2>
        </div>
        <div className="bg-[#a1b16a] text-white px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold flex-shrink-0 ml-2">
          <span className="hidden xs:inline">
            {getItemCountText(itemCount)}
          </span>
          <span className="xs:hidden">{itemCount}</span>
        </div>
      </div>

      {/* Articles du panier - Séparer produits et packs */}
      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-5 max-h-64 sm:max-h-96 overflow-y-auto">
        {/* Section Produits */}
        {items.filter((item) => item.type !== "pack").length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <ShoppingCart size={16} />
              Produits ({items.filter((item) => item.type !== "pack").length})
            </h3>
            <div className="space-y-2">
              {items
                .filter((item) => item.type !== "pack")
                .map((item,index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    {/* Image du produit */}
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-100 mr-2 sm:mr-4 flex items-center justify-center overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* Informations produit */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-[11px] sm:text-sm leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                        {item.category}
                      </p>
                      {/* Affichage des caractéristiques */}
                      {item.characteristic && item.characteristic.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 mb-0.5">
                          {item.characteristic.slice(0, 2).map((char, idx) => {
                            const isColor = isColorCharacteristic(char.name)
                            const isHexColor = isValidHexColor(char.value)
                            
                            return (
                              <span
                                key={idx}
                                className="bg-gray-100 rounded px-1.5 py-0.5 text-[10px] text-gray-600 flex items-center gap-1"
                              >
                                <span>{char.name}:</span>
                                {isColor && isHexColor ? (
                                  <span className="flex items-center gap-1">
                                    <span
                                      className="w-3 h-3 rounded-full border border-gray-300"
                                      style={{ backgroundColor: normalizeHexColor(char.value) }}
                                      title={char.value}
                                    />
                                  </span>
                                ) : (
                                  <span>{char.value}</span>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      <p className="font-bold text-secondColor text-xs sm:text-base mt-0.5">
                        {item.price.toFixed(2)} MAD
                      </p>
                    </div>

                    {/* Contrôles quantité */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <div className="flex items-center bg-gray-100 rounded-md">
                        <button
                          onClick={() => updateQuantity(item, item.quantity - 1)}
                          className="p-1 sm:p-2 hover:bg-gray-200 rounded-l-md transition-colors"
                          type="button"
                        >
                          <Minus size={10} className="text-gray-600" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.type !== "pack" && item.maxQuantity ? item.maxQuantity : undefined}
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1
                            let finalQuantity = newQuantity
                            
                            // Vérifier la limite pour les produits
                            if (item.type !== "pack" && item.maxQuantity !== undefined) {
                              finalQuantity = Math.min(newQuantity, item.maxQuantity)
                            }
                            
                            // S'assurer que la quantité est au moins 1
                            finalQuantity = Math.max(1, finalQuantity)
                            
                            updateQuantity(item, finalQuantity)
                          }}
                          onBlur={(e) => {
                            // Si le champ est vide ou invalide, remettre la quantité actuelle
                            const value = parseInt(e.target.value)
                            if (isNaN(value) || value < 1) {
                              updateQuantity(item, 1)
                            }
                          }}
                          className="w-12 sm:w-16 px-1 sm:px-2 py-1 sm:py-1.5 font-semibold text-gray-800 text-xs sm:text-sm text-center border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-firstColor rounded [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                        <button
                          onClick={() => {
                            // Vérifier la limite de quantité pour les produits (pas les packs)
                            if (item.type !== "pack" && item.maxQuantity) {
                              if (item.quantity < item.maxQuantity) {
                                updateQuantity(item, item.quantity + 1)
                              }
                            } else {
                              updateQuantity(item, item.quantity + 1)
                            }
                          }}
                          disabled={
                            item.type !== "pack" &&
                            item.maxQuantity !== undefined &&
                            item.quantity >= item.maxQuantity
                          }
                          className="p-1 sm:p-2 hover:bg-gray-200 rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                        >
                          <Plus size={10} className="text-gray-600" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item)}
                        className="text-red-500 hover:text-red-700 transition-colors p-0.5 sm:p-1"
                        title={t("actions.removeItem")}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Section Packs */}
        {items.filter((item) => item.type === "pack").length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Gift size={16} />
              Packs ({items.filter((item) => item.type === "pack").length})
            </h3>
            <div className="space-y-2">
              {items
                .filter((item) => item.type === "pack")
                .map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-4 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-md transition-shadow"
                  >
                    {/* Image du pack */}
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-100 mr-2 sm:mr-4 flex items-center justify-center overflow-hidden relative">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-0 right-0 bg-purple-500 text-white text-[8px] sm:text-xs px-1 rounded-bl">
                        PACK
                      </div>
                    </div>

                    {/* Informations pack */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-[11px] sm:text-sm leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                      {item.packItems && (
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                          {item.packItems.length} produit{item.packItems.length > 1 ? "s" : ""} inclus
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.discountPrice ? (
                          <>
                            <p className="font-bold text-firstColor text-xs sm:text-base">
                              {item.discountPrice.toFixed(2)} MAD
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                              {item.price.toFixed(2)} MAD
                            </p>
                          </>
                        ) : (
                          <p className="font-bold text-secondColor text-xs sm:text-base">
                            {item.price.toFixed(2)} MAD
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contrôles quantité */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <div className="flex items-center bg-gray-100 rounded-md">
                        <button
                          onClick={() => updateQuantity(item, item.quantity - 1)}
                          className="p-1 sm:p-2 hover:bg-gray-200 rounded-l-md transition-colors"
                          type="button"
                        >
                          <Minus size={10} className="text-gray-600" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.type !== "pack" && item.maxQuantity ? item.maxQuantity : undefined}
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1
                            let finalQuantity = newQuantity
                            
                            // Vérifier la limite pour les produits
                            if (item.type !== "pack" && item.maxQuantity !== undefined) {
                              finalQuantity = Math.min(newQuantity, item.maxQuantity)
                            }
                            
                            // S'assurer que la quantité est au moins 1
                            finalQuantity = Math.max(1, finalQuantity)
                            
                            updateQuantity(item, finalQuantity)
                          }}
                          onBlur={(e) => {
                            // Si le champ est vide ou invalide, remettre la quantité actuelle
                            const value = parseInt(e.target.value)
                            if (isNaN(value) || value < 1) {
                              updateQuantity(item, 1)
                            }
                          }}
                          className="w-12 sm:w-16 px-1 sm:px-2 py-1 sm:py-1.5 font-semibold text-gray-800 text-xs sm:text-sm text-center border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-firstColor rounded [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                        <button
                          onClick={() => {
                            // Vérifier la limite de quantité pour les produits (pas les packs)
                            if (item.type !== "pack" && item.maxQuantity) {
                              if (item.quantity < item.maxQuantity) {
                                updateQuantity(item, item.quantity + 1)
                              }
                            } else {
                              updateQuantity(item, item.quantity + 1)
                            }
                          }}
                          disabled={
                            item.type !== "pack" &&
                            item.maxQuantity !== undefined &&
                            item.quantity >= item.maxQuantity
                          }
                          className="p-1 sm:p-2 hover:bg-gray-200 rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                        >
                          <Plus size={10} className="text-gray-600" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item)}
                        className="text-red-500 hover:text-red-700 transition-colors p-0.5 sm:p-1"
                        title={t("actions.removeItem")}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Code promo */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-paletteCream to-secondColor/40 border border-firstColor/30">
        <div className="flex items-center mb-2">
          <Gift className="text-secondColor mr-2 flex-shrink-0" size={14} />
          <h3 className="font-semibold text-gray-800 text-sm">
            {t("promoCode.title")}
          </h3>
        </div>

        {/* Affichage du coupon appliqué */}
        {couponData && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="text-firstColor font-semibold text-sm">
                    ✓ {couponData.name.fr}
                  </span>
                  <span className="ml-2 bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    {coupon}
                  </span>
                </div>
                {couponData.description?.fr && (
                  <p className="text-firstColor text-xs mt-1">
                    {couponData.description.fr}
                  </p>
                )}
                {discountAmount > 0 && (
                  <p className="text-firstColor font-bold text-sm mt-1">
                    Économie: -{discountAmount.toFixed(2)} MAD
                  </p>
                )}
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-red-500 hover:text-red-700 text-sm font-semibold ml-2 flex-shrink-0"
                type="button"
                title="Retirer le coupon"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Message d'erreur */}
        {displayError && !couponData && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200">
            <p className="text-red-700 text-sm flex items-center">
              <span className="mr-2">⚠</span>
              {displayError}
            </p>
          </div>
        )}

        {/* Champ de saisie */}
        {!couponData && (
          <div className="flex space-x-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value)
                setLocalCouponError(null)
              }}
              onKeyPress={handleKeyPress}
              placeholder={t("promoCode.placeholder")}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-firstColor focus:border-transparent"
              disabled={isApplying}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isApplying || !couponCode.trim()}
              className="px-4 sm:px-6 py-2 text-sm font-semibold transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] text-[#413e3b] hover:bg-[#a1b16a] hover:text-black"
              type="button"
            >
              {isApplying ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                  <span className="hidden sm:inline">Application...</span>
                </div>
              ) : (
                <>
                  <span className="hidden sm:inline">{t("actions.apply")}</span>
                  <span className="sm:hidden">OK</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Récapitulatif des prix */}
      <div className="space-y-2 sm:space-y-3 py-3 sm:py-4 border-t border-gray-200">
        <div className="flex justify-between text-gray-700 text-sm sm:text-base">
          <span>{t("pricing.subtotal", { count: itemCount })}</span>
          <span className="font-semibold">{subtotal.toFixed(2)} MAD</span>
        </div>

        {/* Affichage de la réduction du coupon */}
        {couponData && discountAmount > 0 && (
          <div className="flex justify-between text-firstColor text-sm sm:text-base">
            <span>Réduction {couponData.name.fr}</span>
            <span className="font-semibold">
              -{discountAmount.toFixed(2)} MAD
            </span>
          </div>
        )}

        <div className="flex justify-between text-gray-700 text-sm sm:text-base">
          <span>{t("pricing.shipping")}</span>
          <span className="font-semibold">
            {shipping === 0 ? (
              <span className="text-[#a1b16a]">{t("pricing.free")}</span>
            ) : (
              `${shipping.toFixed(2)} MAD`
            )}
          </span>
        </div>

        {subtotal >= FREE_SHIPPING_THRESHOLD && (
          <div className="flex items-center justify-center p-2 sm:p-3 bg-green-50 border border-green-200">
            <span className="text-[#a1b16a] text-xs sm:text-sm font-semibold text-center">
              {t("shipping.freeShippingAchieved")}
            </span>
          </div>
        )}

        {subtotal < FREE_SHIPPING_THRESHOLD && (
          <div className="flex items-center justify-center p-2 sm:p-3 bg-blue-50 border border-blue-200">
            <span className="text-blue-700 text-xs sm:text-sm text-center leading-relaxed">
              {t("shipping.freeShippingRemaining", {
                amount: (FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)
              })}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center py-4 sm:py-6 border-t-2 border-firstColor/30">
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-bold text-gray-800">
            {t("pricing.total")}
          </span>
          {couponData && subtotal !== total && (
            <span className="text-xs text-gray-500 line-through mt-1">
              {subtotal.toFixed(2)} MAD
            </span>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xl sm:text-2xl font-bold text-black">
            {total.toFixed(2)} MAD
          </span>
          {couponData && discountAmount > 0 && (
            <span className="text-xs text-firstColor font-medium mt-1">
              Vous économisez {discountAmount.toFixed(2)} MAD
            </span>
          )}
        </div>
      </div>

      {/* Aide */}
      <div className="mt-4 sm:mt-6 text-center">
        <p className="text-xs sm:text-sm text-gray-600 mb-2">
          {t("help.question")}
        </p>
        <div className="flex justify-center">
          <Link
            href={`tel:${t("help.phone")}`}
            className="text-secondColor hover:text-firstColor text-xs sm:text-sm font-semibold flex items-center"
          >
            <Phone size={12} className="mr-1 flex-shrink-0" />
            <span>{t("help.phone")}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
