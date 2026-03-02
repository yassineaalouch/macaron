"use client"

import { CartItem } from "@/types/type"
import { Discount } from "@/types/discount"
import { useState, useEffect, useRef } from "react"

// Fonction helper pour charger le panier depuis localStorage
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === "undefined") return []
  try {
    const savedCart = localStorage.getItem("couture-cart")
    return savedCart ? JSON.parse(savedCart) : []
  } catch (error) {
    console.error("Erreur lors du chargement du panier:", error)
    return []
  }
}

// Fonction helper pour charger le coupon depuis localStorage
const loadCouponFromStorage = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("couture-coupon")
}

// Fonction helper pour charger les données du coupon depuis localStorage
const loadCouponDataFromStorage = (): Discount | null => {
  if (typeof window === "undefined") return null
  try {
    const savedCouponData = localStorage.getItem("couture-coupon-data")
    return savedCouponData ? JSON.parse(savedCouponData) : null
  } catch (error) {
    console.error("Erreur lors du chargement des données du coupon:", error)
    return null
  }
}

export const useCart = () => {
  const FREE_SHIPPING_THRESHOLD = 1000

  // 🧠 Initialiser avec des valeurs par défaut pour éviter les problèmes d'hydratation
  // Le serveur et le client doivent avoir le même rendu initial
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [coupon, setCoupon] = useState<string | null>(null)
  const [couponData, setCouponData] = useState<Discount | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  
  // 🔒 Flag pour éviter d'écraser le localStorage avant le chargement initial
  const isInitialized = useRef(false)

  // 🧠 Charger le panier depuis localStorage après le montage (côté client uniquement)
  useEffect(() => {
    // Charger depuis localStorage de manière synchrone
    const savedCart = loadCartFromStorage()
    const savedCoupon = loadCouponFromStorage()
    const savedCouponData = loadCouponDataFromStorage()

    if (savedCart.length > 0) {
      setCartItems(savedCart)
    }
    if (savedCoupon) {
      setCoupon(savedCoupon)
    }
    if (savedCouponData) {
      setCouponData(savedCouponData)
    }
    
    // Marquer comme initialisé après le chargement
    isInitialized.current = true
  }, [])

  // 💾 Sauvegarder à chaque modification (seulement après l'initialisation)
  useEffect(() => {
    // Ne pas sauvegarder avant que le chargement initial soit terminé
    if (!isInitialized.current) return
    
    localStorage.setItem("couture-cart", JSON.stringify(cartItems))
    if (coupon) {
      localStorage.setItem("couture-coupon", coupon)
    } else {
      localStorage.removeItem("couture-coupon")
    }
    if (couponData) {
      localStorage.setItem("couture-coupon-data", JSON.stringify(couponData))
    } else {
      localStorage.removeItem("couture-coupon-data")
    }
  }, [cartItems, coupon, couponData])

  const areCharacteristicsEqual = (
    a: { name: string; value: string }[],
    b: { name: string; value: string }[]
  ): boolean => {
    if (a.length !== b.length) return false
    const sortFn = (x: { name: string; value: string }) =>
      `${x.name}:${x.value}`.toLowerCase()
    const sortedA = [...a].sort((x, y) => sortFn(x).localeCompare(sortFn(y)))
    const sortedB = [...b].sort((x, y) => sortFn(x).localeCompare(sortFn(y)))
    return JSON.stringify(sortedA) === JSON.stringify(sortedB)
  }

  // ➕ Ajouter un article (en prenant en compte les caractéristiques)
  const addItem = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setCartItems((currentItems) => {
      // Si c'est un pack, on ajoute seulement le pack (pas les produits individuels)
      if (item.type === "pack") {
        // Vérifier si le pack existe déjà
        const existingPack = currentItems.find(
          (cartItem) => cartItem.id === item.id && cartItem.type === "pack"
        )

        if (existingPack) {
          // Mettre à jour la quantité du pack existant
          return currentItems.map((cartItem) =>
            cartItem.id === item.id && cartItem.type === "pack"
              ? { ...cartItem, quantity: cartItem.quantity + quantity }
              : cartItem
          )
        } else {
          // Ajouter le nouveau pack
          return [...currentItems, { ...item, quantity }]
        }
      }

      // Pour les produits normaux
      const existingItem = currentItems.find(
        (cartItem) =>
          cartItem.id === item.id &&
          cartItem.type !== "pack" &&
          areCharacteristicsEqual(
            cartItem.characteristic || [],
            item.characteristic || []
          )
      )

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.id === existingItem.id &&
          cartItem.type !== "pack" &&
          areCharacteristicsEqual(
            cartItem.characteristic || [],
            item.characteristic || []
          )
            ? {
                ...cartItem,
                quantity: Math.min(
                  cartItem.quantity + quantity,
                  item.maxQuantity ?? Infinity
                )
              }
            : cartItem
        )
      }

      return [
        ...currentItems,
        {
          ...item,
          quantity: Math.min(quantity, item.maxQuantity ?? Infinity),
          type: item.type || "product"
        }
      ]
    })
  }

  // 🔄 Mettre à jour la quantité d'un article
  const updateQuantity = (item: CartItem, quantity: number) => {
    if (quantity <= 0) {
      removeItem(item)
      return
    }

    // Pour les produits, vérifier la limite de quantité maximale
    if (item.type !== "pack" && item.maxQuantity !== undefined) {
      quantity = Math.min(quantity, item.maxQuantity)
    }

    setCartItems((currentItems) =>
      currentItems.map((cartItem) =>
        cartItem.id === item.id &&
        areCharacteristicsEqual(
          cartItem.characteristic || [],
          item.characteristic || []
        )
          ? { ...cartItem, quantity }
          : cartItem
      )
    )
  }

  // ❌ Supprimer un article spécifique (avec caractéristiques)
  const removeItem = (item: CartItem) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (cartItem) =>
          !(
            cartItem.id === item.id &&
            areCharacteristicsEqual(
              cartItem.characteristic || [],
              item.characteristic || []
            )
          )
      )
    )
  }

  // 🧹 Vider le panier
  const clearCart = () => {
    setCartItems([])
    setCoupon(null)
    setCouponData(null)
    setCouponError(null)
  }

  // 🎟️ Appliquer un coupon avec vérification
  const applyCoupon = async (
    code: string
  ): Promise<{ success: boolean; message: string; discount?: Discount }> => {
    try {
      setCouponError(null)

      const response = await fetch(
        `/api/discounts/coupon/${encodeURIComponent(code)}`
      )
      const result = await response.json()

      if (!result.success) {
        setCouponError(result.message)
        return { success: false, message: result.message }
      }

      const discount = result.discount
      // Vérifier le montant minimum d'achat
      const currentSubtotal = cartItems.reduce(
        (sum, item) => sum + calculateItemTotal(item),
        0
      )

      if (
        discount.minimumPurchase &&
        discount.minimumPurchase > 0 &&
        currentSubtotal < discount.minimumPurchase
      ) {
        const message = `Montant minimum requis: ${discount.minimumPurchase} MAD`
        setCouponError(message)
        return { success: false, message }
      }

      // Vérifier la limite d'utilisation
      if (
        discount.usageLimit &&
        discount.usageLimit > 0 &&
        discount.usageCount &&
        discount.usageCount >= discount.usageLimit
      ) {
        const message = "Ce coupon a atteint sa limite d'utilisation"
        setCouponError(message)
        return { success: false, message }
      }

      // Tout est valide, appliquer le coupon
      setCoupon(code)
      setCouponData(discount)
      setCouponError(null)

      return { success: true, message: "Coupon appliqué avec succès", discount }
    } catch (error) {
      console.error("Erreur lors de l'application du coupon:", error)
      const message = "Erreur lors de la vérification du coupon"
      setCouponError(message)
      return { success: false, message }
    }
  }

  const removeCoupon = () => {
    setCoupon(null)
    setCouponData(null)
    setCouponError(null)
  }

  // 💰 Calcul du prix en tenant compte des réductions
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
          // Groupes complets : on paie X par groupe. Reste : si reste <= X on paie le reste, sinon on paie X (groupe partiel)
          const paidInRemainder =
            remainder === 0 ? 0 : remainder <= X ? remainder : X
          const paidCount = fullGroups * X + paidInRemainder
          total = paidCount * item.price
        }
      }
    }

    return total
  }

  // 🧮 Calcul du total avant coupon
  const subtotal = cartItems.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  )

  // 🎟️ Appliquer le coupon global avec les nouvelles règles
  const calculateCouponDiscount = (): {
    discountAmount: number
    totalAfterDiscount: number
  } => {
    if (!couponData || !coupon) {
      return { discountAmount: 0, totalAfterDiscount: subtotal }
    }

    let discountAmount = 0

    if (couponData.type === "COUPON") {
      if (couponData.value) {
        // Pourcentage
        if (coupon.toLowerCase().includes("%")) {
          discountAmount = (subtotal * couponData.value) / 100
        }
        // Montant fixe
        else {
          discountAmount = Math.min(subtotal, couponData.value)
        }
      }
    }

    const totalAfterDiscount = Math.max(0, subtotal - discountAmount)

    return { discountAmount, totalAfterDiscount }
  }

  const { discountAmount, totalAfterDiscount } = calculateCouponDiscount()

  // 🚚 Livraison gratuite (basée sur le total après réduction)
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - totalAfterDiscount
  )

  const progressPercentage = Math.min(
    100,
    (totalAfterDiscount / FREE_SHIPPING_THRESHOLD) * 100
  )

  const hasFreeShipping = totalAfterDiscount >= FREE_SHIPPING_THRESHOLD

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Calcul des frais de livraison (exemple: 30 MAD si pas de livraison gratuite)
  const shippingCost = hasFreeShipping ? 0 : 30

  // Calcul du total final (sous-total après réduction + frais de livraison)
  const total = totalAfterDiscount + shippingCost

  // 🚪 Gestion ouverture/fermeture du panier
  const toggleCart = () => setIsCartOpen(!isCartOpen)
  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)
  return {
    // State
    cartItems,
    isCartOpen,
    FREE_SHIPPING_THRESHOLD,
    coupon,
    couponData,
    couponError,

    // Actions
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    applyCoupon,
    removeCoupon,

    // Computed values
    totalItems,
    totalPrice: total, // Total incluant les frais de livraison
    subtotal,
    discountAmount,
    shipping: shippingCost,
    remainingForFreeShipping,
    progressPercentage,
    hasFreeShipping,
    calculateItemTotal
  }
}
