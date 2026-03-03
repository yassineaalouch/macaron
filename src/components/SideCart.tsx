// export default SideCart

"use client"

import React from "react"
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Truck,
  Sparkles,
  Package
} from "lucide-react"
import { useTranslations } from "next-intl"
import { CartItem, SideCartProps } from "@/types/type"
import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { FREE_SHIPPING_THRESHOLD } from "@/data/data"
import { motion, AnimatePresence } from "framer-motion"
import { isColorCharacteristic, isValidHexColor, normalizeHexColor } from "@/utils/colorCharacteristic"

const SideCart: React.FC<SideCartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem
}) => {
  const t = useTranslations("SideCart")

  // 💰 Calcul du prix d'un item en tenant compte des réductions
  const calculateItemTotal = (item: CartItem): number => {
    // Pour les packs, utiliser discountPrice si disponible
    if (item.type === "pack" && item.discountPrice) {
      return item.discountPrice * item.quantity
    }

    let total = item.price * item.quantity

    if (item.discount) {
      // 🟡 Cas 1 : réduction en pourcentage
      if (item.discount.type === "PERCENTAGE") {
        const percent = item.discount.value ?? 0
        total -= (total * percent) / 100
      }

      // 🟢 Cas 2 : "Buy X get Y free" — la réduction s'applique dès que la quantité atteint X (pas seulement à X+Y)
      else if (item.discount.type === "BUY_X_GET_Y") {
        const X = item.discount.buyQuantity ?? 0
        const Y = item.discount.getQuantity ?? 0
        if (Y && X && item.quantity >= X) {
          const groupSize = X + Y
          const fullGroups = Math.floor(item.quantity / groupSize)
          const remainder = item.quantity % groupSize
          const paidInRemainder =
            remainder === 0 ? 0 : remainder <= X ? remainder : X
          const paidCount = fullGroups * X + paidInRemainder
          total = paidCount * item.price
        }
      }
    }

    return total
  }

  // Calcul du sous-total avec réductions
  const subtotal = items.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  )

  // Calcul des frais de livraison
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const shippingCost = hasFreeShipping ? 0 : 30

  // Calcul du total final (sous-total + frais de livraison)
  const totalPrice = subtotal + shippingCost

  // Calcul du montant restant pour la livraison gratuite
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal
  )

  // Pourcentage de progression vers la livraison gratuite
  const progressPercentage = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100
  )

  // Fonction pour gérer le pluriel
  const getItemCountText = (count: number) => {
    return count > 1
      ? t("header.itemCountPlural", { count })
      : t("header.itemCount", { count })
  }

  const handleQuantityChange = (item: CartItem, change: number) => {
    // Pour les produits, vérifier la limite de quantité maximale
    if (change > 0 && item.type !== "pack" && item.maxQuantity !== undefined) {
      if (item.quantity >= item.maxQuantity) {
        return // Ne pas augmenter si on a atteint le maximum
      }
    }
    
    const newQuantity = Math.max(0, item.quantity + change)
    if (newQuantity === 0) {
      onRemoveItem(item)
    } else {
      onUpdateQuantity(item, newQuantity)
    }
  }

  return (
    <>
      {/* Overlay avec animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Side Cart avec animation */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-paletteCream shadow-2xl z-[110] overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header compact */}
          <div className="relative bg-secondColor text-gray-900 p-4 shadow-lg">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative flex items-center justify-between">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center"
              >
                <div className="p-2 bg-white/30 backdrop-blur-sm mr-3">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-wide">
                    {t("header.title")}
                  </h2>
                  <p className="text-gray-700 text-xs mt-0.5">
                    {getItemCountText(items.length)}
                  </p>
                </div>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          {/* Progress Bar compact pour livraison gratuite */}
          <AnimatePresence mode="wait">
            {subtotal < FREE_SHIPPING_THRESHOLD ? (
              <motion.div
                key="progress"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className=" p-3 border-b border-firstColor shadow-sm"
              >
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs">
                    <motion.span
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="text-gray-700 flex items-center font-medium"
                    >
                      <Truck size={14} className="text-black mr-1" />
                      {t("freeShipping.label")}
                    </motion.span>
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-black font-bold text-sm"
                    >
                      {remainingForFreeShipping.toFixed(2)} MAD
                    </motion.span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="bg-secondColor h-2"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="achieved"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-firstColor p-3 border-b border-green-200 shadow-sm"
              >
                <div className="flex items-center">
                  <Sparkles size={16} className="text-green-700 mr-2" />
                  <div className="flex-1">
                    <p className="font-bold text-green-800 text-sm">
                      {t("freeShipping.achieved")}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cart Items - Compact avec séparation produits/packs */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-firstColor scrollbar-track-gray-100">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center h-full text-gray-500 p-6"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-4 bg-gray-100 mb-4"
                >
                  <Package size={48} className="text-gray-300" />
                </motion.div>
                <h3 className="text-lg font-bold mb-2 text-gray-700">
                  {t("emptyCart.title")}
                </h3>
                <p className="text-xs text-center px-4 text-gray-500">
                  {t("emptyCart.subtitle")}
                </p>
              </motion.div>
            ) : (
              <div className="p-3 space-y-3">
                {/* Section Produits */}
                {items.filter((item) => item.type !== "pack").length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <Package size={14} className="text-blue-600" />
                      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Produits ({items.filter((item) => item.type !== "pack").length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {items
                          .filter((item) => item.type !== "pack")
                          .map((item, index) => (
                            <motion.div
                              key={index}
                              layout
                              initial={{ opacity: 0, x: 50 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -50 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              whileHover={{ scale: 1.01 }}
                              className="group bg-white border border-gray-200 p-2.5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-center gap-2">
                                {/* Product Image compact */}
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className="relative w-16 h-16 bg-gray-100 overflow-hidden flex-shrink-0"
                                >
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={64}
                                    height={64}
                                    className="object-cover w-full h-full"
                                  />
                                </motion.div>

                                {/* Product Details compact */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-800 text-xs mb-1 line-clamp-1 group-hover:text-[#a1b16a] transition-colors">
                                    {item.name}
                                  </h4>

                                  {item.characteristic && item.characteristic.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-1">
                                      {item.characteristic.slice(0, 2).map((char) => {
                                        const isColor = isColorCharacteristic(char.name)
                                        const isHexColor = isValidHexColor(char.value)
                                        
                                        return (
                                          <span
                                            key={char.name}
                                            className="bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 flex items-center gap-1"
                                          >
                                            <span>{char.name}:</span>
                                            {isColor && isHexColor ? (
                                              <span className="flex items-center gap-1">
                                                <span
                                                  className="w-3 h-3  border border-gray-300"
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

                                  <div className="flex items-center justify-between">
                                    {/* Quantity Controls compact */}
                                    <div className="flex items-center bg-gray-50 border border-gray-200">
                                      <button
                                        onClick={() => handleQuantityChange(item, -1)}
                                        className="p-1 hover:bg-firstColor/20  transition-colors"
                                      >
                                        <Minus size={12} className="text-gray-600" />
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
                                          
                                          onUpdateQuantity(item, finalQuantity)
                                        }}
                                        onBlur={(e) => {
                                          // Si le champ est vide ou invalide, remettre la quantité actuelle
                                          const value = parseInt(e.target.value)
                                          if (isNaN(value) || value < 1) {
                                            onUpdateQuantity(item, 1)
                                          }
                                        }}
                                        className="w-10 px-1 py-0.5 text-xs font-bold text-gray-800 text-center border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-firstColor rounded [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                      />
                                      <button
                                        onClick={() => handleQuantityChange(item, 1)}
                                        disabled={
                                          item.type !== "pack" &&
                                          item.maxQuantity !== undefined &&
                                          item.quantity >= item.maxQuantity
                                        }
                                        className="p-1 hover:bg-firstColor/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Plus size={12} className="text-gray-600" />
                                      </button>
                                    </div>

                                    {/* Price and Remove compact */}
                                    <div className="flex items-center gap-1.5">
                                      <div className="flex flex-col items-end">
                                        {(() => {
                                          const itemTotal = calculateItemTotal(item)
                                          const originalTotal = item.price * item.quantity
                                          const hasDiscount = itemTotal < originalTotal
                                          
                                          return hasDiscount ? (
                                            <>
                                              <span className="font-bold text-xs text-[#413e3b]">
                                                {itemTotal.toFixed(2)} MAD
                                              </span>
                                              <span className="text-[10px] text-gray-400 line-through">
                                                {originalTotal.toFixed(2)} MAD
                                              </span>
                                            </>
                                          ) : (
                                            <span className="font-bold text-sm text-[#413e3b]">
                                              {itemTotal.toFixed(2)} MAD
                                            </span>
                                          )
                                        })()}
                                      </div>
                                      <button
                                        onClick={() => onRemoveItem(item)}
                                        className="p-1 text-red-500 hover:bg-red-50  transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Section Packs */}
                {items.filter((item) => item.type === "pack").length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <Sparkles size={14} className="text-purple-600" />
                      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Packs ({items.filter((item) => item.type === "pack").length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {items
                          .filter((item) => item.type === "pack")
                          .map((item, index) => (
                            <motion.div
                              key={item.id}
                              layout
                              initial={{ opacity: 0, x: 50 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -50 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              whileHover={{ scale: 1.01 }}
                              className="group bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 p-2.5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-center gap-2">
                                {/* Pack Image compact avec badge */}
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className="relative w-16 h-16 bg-gray-100 overflow-hidden flex-shrink-0"
                                >
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={64}
                                    height={64}
                                    className="object-cover w-full h-full"
                                  />
                                  <div className="absolute top-0 right-0 bg-purple-500 text-white text-[8px] px-1 font-bold">
                                    PACK
                                  </div>
                                </motion.div>

                                {/* Pack Details compact */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-800 text-xs mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors">
                                    {item.name}
                                  </h4>

                                  {item.packItems && (
                                    <p className="text-[10px] text-purple-600 mb-1 font-medium">
                                      {item.packItems.length} produit{item.packItems.length > 1 ? "s" : ""} inclus
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between">
                                    {/* Quantity Controls compact */}
                                    <div className="flex items-center bg-white border border-purple-200 ">
                                      <button
                                        onClick={() => handleQuantityChange(item, -1)}
                                        className="p-1 hover:bg-purple-100  transition-colors"
                                      >
                                        <Minus size={12} className="text-gray-600" />
                                      </button>
                                      <span className="px-2 py-0.5 text-xs font-bold text-gray-800 min-w-[28px] text-center">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() => handleQuantityChange(item, 1)}
                                        className="p-1 hover:bg-purple-100  transition-colors"
                                      >
                                        <Plus size={12} className="text-gray-600" />
                                      </button>
                                    </div>

                                    {/* Price and Remove compact */}
                                    <div className="flex items-center gap-1.5">
                                      <div className="flex flex-col items-end">
                                        {item.discountPrice ? (
                                          <>
                                            <span className="font-bold text-xs text-black">
                                              {(item.discountPrice * item.quantity).toFixed(2)} MAD
                                            </span>
                                            <span className="text-[10px] text-gray-400 line-through">
                                              {(item.price * item.quantity).toFixed(2)} MAD
                                            </span>
                                          </>
                                        ) : (
                                          <span className="font-bold text-sm text-purple-600">
                                            {(item.price * item.quantity).toFixed(2)} MAD
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => onRemoveItem(item)}
                                        className="p-1 text-red-500 hover:bg-red-50  transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer compact */}
          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="border-t-2 border-gray-100 bg-white p-4 shadow-2xl"
              >
                {/* Total compact */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-base font-semibold text-gray-700">
                    {t("total")}
                  </span>
                  <motion.div
                    key={totalPrice}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="flex items-baseline"
                  >
                    <span className="text-2xl font-bold bg-black bg-clip-text text-transparent">
                      {totalPrice.toFixed(2)}
                    </span>
                    <span className="ml-1 text-sm font-semibold text-gray-600">
                      MAD
                    </span>
                  </motion.div>
                </div>

                {/* Shipping Info compact */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center text-xs mb-3 p-2 bg-gray-50 "
                >
                  <Truck size={12} className="mr-1 text-gray-500" />
                  {hasFreeShipping ? (
                    <span className="text-green-600 font-semibold text-xs">
                      ✨ {t("freeShipping.included")}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">
                      {t("freeShipping.cost")} (+{shippingCost.toFixed(2)} MAD)
                    </span>
                  )}
                </motion.div>

                {/* Action Buttons compact */}
                <div className="space-y-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      className="block w-full bg-secondColor text-gray-900 py-3 font-bold text-sm text-center shadow-lg hover:shadow-xl transform transition-all duration-300"
                      href="/checkout"
                      onClick={onClose}
                    >
                      <span className="flex items-center justify-center">
                        <ShoppingBag size={16} className="mr-2" />
                        {t("buttons.validateOrder")}
                      </span>
                    </Link>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      className="block w-full bg-white text-[#a1b16a] border-2 border-firstColor py-3  font-bold text-sm text-center hover:bg-firstColor transform transition-all duration-300"
                      href="/shop"
                      onClick={onClose}
                    >
                      {t("buttons.continueShopping")}
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}

export default SideCart
