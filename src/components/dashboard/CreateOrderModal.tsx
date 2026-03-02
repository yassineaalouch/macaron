"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  Loader2,
  User,
  Phone,
  MapPin,
  Trash2
} from "lucide-react"
import { useToast } from "@/components/ui/Toast"
import Image from "next/image"
import { Product } from "@/types/product"
import { getMainImage } from "@/lib/getMainImage"
import { ProductPack } from "@/types/pack"
import {
  CreateOrderModalProps,
  SelectedItem
} from "@/types/order"

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated
}) => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [packs, setPacks] = useState<ProductPack[]>([])
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [showProducts, setShowProducts] = useState(true)

  // Customer form data
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    paymentMethod: "À la livraison",
    shippingMethod: "Livraison standard",
    notes: ""
  })

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchPacks()
    }
  }, [isOpen])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      const data = await response.json()
      if (data.success) {
        setProducts(data.products || [])
      }
    } catch (error) {
      showToast("Erreur lors du chargement des produits", "error")
    }
  }

  const fetchPacks = async () => {
    try {
      const response = await fetch("/api/product-packs")
      const data = await response.json()
      if (data.success) {
        setPacks(data.data || [])
      } else {
        showToast("Erreur lors du chargement des packs", "error")
      }
    } catch (error) {
      showToast("Erreur lors du chargement des packs", "error")
    }
  }

  const addItem = (item: Product | ProductPack, type: "product" | "pack") => {
    const existingItem = selectedItems.find((i) => i.id === item._id)
    
    if (existingItem) {
      setSelectedItems((prev) =>
        prev.map((i) =>
          i.id === item._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      )
    } else {
      // Type-safe item creation
      if (type === "product") {
        const product = item as Product
        const newItem: SelectedItem = {
          id: product._id,
          name: product.name.fr,
          type: "product",
          price: product.price,
          image: getMainImage(product) ?? "/No_Image_Available.jpg",
          quantity: 1
        }
        setSelectedItems((prev) => [...prev, newItem])
      } else {
        const pack = item as ProductPack
        const newItem: SelectedItem = {
          id: pack._id,
          name: pack.name.fr,
          type: "pack",
          price: pack.totalPrice,
          discountPrice: pack.discountPrice,
          image: pack.images?.[0] ?? "/No_Image_Available.jpg",
          quantity: 1,
          packItems: pack.items?.map((packItem: {
            productId: string
            product?: {
              name?: { fr?: string }
              price?: number
              images?: string[]
            }
            quantity: number
            name?: string
            price?: number
            image?: string
          }) => ({
            id: packItem.productId,
            name: packItem.product?.name?.fr || "Produit",
            quantity: packItem.quantity,
            price: packItem.product?.price || 0,
            image:
              packItem.product?.images?.[0] ?? "/No_Image_Available.jpg"
          }))
        }
        setSelectedItems((prev) => [...prev, newItem])
      }
    }
    showToast(`${type === "product" ? "Produit" : "Pack"} ajouté`, "success")
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((sum, item) => {
      const itemPrice = item.discountPrice || item.price
      return sum + itemPrice * item.quantity
    }, 0)
    
    const shipping = subtotal >= 1000 ? 0 : 50 // FREE_SHIPPING_THRESHOLD logic
    const total = subtotal + shipping

    return { subtotal, shipping, total }
  }

  const filteredProducts = products.filter((product) =>
    product.name.fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.name.ar.includes(searchQuery)
  )

  const filteredPacks = packs.filter(
    (pack) =>
      pack.name.fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.name.ar.includes(searchQuery)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedItems.length === 0) {
      showToast("Veuillez sélectionner au moins un produit ou pack", "warning")
      return
    }

    if (!formData.customerName || !formData.customerPhone || !formData.customerAddress) {
      showToast("Veuillez remplir tous les champs obligatoires", "warning")
      return
    }

    setLoading(true)

    try {
      const { subtotal, shipping, total } = calculateTotals()

      // Prepare items according to OrderItemSchema
      const items = await Promise.all(
        selectedItems.map(async (item) => {
          // For packs, fetch full details if packItems are missing
          if (item.type === "pack" && !item.packItems) {
            try {
              const packResponse = await fetch(`/api/product-packs/${item.id}`)
              const packData = await packResponse.json()
              if (packData.success && packData.data) {
                const pack = packData.data
                item.packItems = pack.items?.map((packItem: {
                  product?: {
                    _id?: string
                    name?: { fr?: string }
                    price?: number
                    images?: string[]
                  }
                  productId?: string | {
                    _id?: string
                    name?: { fr?: string }
                    price?: number
                    images?: string[]
                  }
                  name?: string
                  quantity: number
                  price?: number
                  image?: string
                }) => {
                  // Handle both populated and non-populated pack items
                  const product = packItem.product || packItem.productId
                  return {
                    id: product?._id || product || packItem.productId,
                    name: product?.name?.fr || packItem.name || "Produit",
                    quantity: packItem.quantity,
                    price: product?.price || packItem.price || 0,
                    image: product?.images?.[0] || packItem.image || "/No_Image_Available.jpg"
                  }
                }) || []
              }
            } catch (error) {
              // Erreur silencieuse - le pack sera ajouté sans détails complets
            }
          }

          // Build order item according to OrderItemSchema
          const orderItem: {
            id: string
            name: string
            type: string
            price: number
            quantity: number
            image: string
            discountPrice?: number
            items?: Array<{
              id: string
              name: string
              quantity: number
              price: number
              image: string
            }>
            discount?: string
            characteristic?: Array<{
              name: string
              value: string
            }>
          } = {
            id: item.id,
            name: item.name,
            type: item.type,
            price: item.price,
            quantity: item.quantity,
            image: item.image || "/No_Image_Available.jpg"
          }

          // Add discountPrice for packs
          if (item.type === "pack" && item.discountPrice) {
            orderItem.discountPrice = item.discountPrice
          }

          // Add pack items if it's a pack
          if (item.type === "pack" && item.packItems && item.packItems.length > 0) {
            orderItem.items = item.packItems.map((packItem) => ({
              id: packItem.id,
              name: packItem.name,
              quantity: packItem.quantity,
              price: packItem.price,
              image: packItem.image
            }))
          }

          // For products, add discount and characteristic if available
          if (item.type === "product") {
            // Try to get product details to get discount/characteristics
            try {
              const productResponse = await fetch(`/api/products/${item.id}`)
              const productData = await productResponse.json()
              if (productData.success && productData.product) {
                const product = productData.product
                if (product.discount) {
                  orderItem.discount = product.discount._id || product.discount
                }
                if (product.Characteristic && product.Characteristic.length > 0) {
                  orderItem.characteristic = product.Characteristic.map((char: {
                    name?: { fr?: string } | string
                    values?: Array<{ fr?: string; ar?: string }>
                  }) => ({
                    name: char.name?.fr || char.name || "",
                    value: char.values?.[0]?.fr || char.values?.[0]?.ar || ""
                  }))
                }
              }
            } catch (error) {
              // Erreur silencieuse - le produit sera ajouté sans détails complets
            }
          }

          return orderItem
        })
      )

      // Build order data according to OrderRequestBody interface
      const orderData = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerAddress: formData.customerAddress.trim(),
        items,
        subtotal,
        shipping,
        total,
        coupon: null, // No coupon for admin-created orders for now
        paymentMethod: formData.paymentMethod,
        shippingMethod: formData.shippingMethod,
        notes: formData.notes,
        status: "pending"
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()

      if (data.success) {
        showToast("Commande créée avec succès", "success")
        // Reset form
        setFormData({
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          paymentMethod: "À la livraison",
          shippingMethod: "Livraison standard",
          notes: ""
        })
        setSelectedItems([])
        onOrderCreated()
        onClose()
      } else {
        showToast(
          data.message || "Erreur lors de la création de la commande",
          "error"
        )
      }
    } catch (error) {
      showToast("Erreur lors de la création de la commande", "error")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const { subtotal, shipping, total } = calculateTotals()

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600">
          <h2 className="text-2xl font-bold text-white">Créer une commande</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                Informations client
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, customerPhone: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <textarea
                    required
                    value={formData.customerAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, customerAddress: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méthode de paiement
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethod: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    <option value="À la livraison">À la livraison</option>
                    <option value="Carte bancaire">Carte bancaire</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Virement bancaire">Virement bancaire</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méthode de livraison
                  </label>
                  <select
                    value={formData.shippingMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, shippingMethod: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Livraison standard">Livraison standard</option>
                    <option value="Livraison express">Livraison express</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    placeholder="Notes internes sur cette commande..."
                  />
                </div>
              </div>
            </div>

            {/* Product/Pack Selection */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                  Produits et Packs
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProducts(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showProducts
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Produits
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProducts(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !showProducts
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Packs
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto space-y-2 border-2 border-gray-100 rounded-lg p-2">
                {showProducts
                  ? filteredProducts.length === 0
                    ? (
                        <p className="text-center text-gray-500 py-4">
                          Aucun produit trouvé
                        </p>
                      )
                    : (
                        filteredProducts.map((product) => (
                          <div
                            key={product._id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="relative w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                                <Image
                                  src={getMainImage(product) ?? "/No_Image_Available.jpg"}
                                  alt={product.name.fr}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {product.name.fr}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {product.price} MAD
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => addItem(product, "product")}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )
                  : filteredPacks.length === 0
                    ? (
                        <p className="text-center text-gray-500 py-4">
                          Aucun pack trouvé
                        </p>
                      )
                    : (
                        filteredPacks.map((pack) => (
                          <div
                            key={pack._id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="relative w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                                <Image
                                  src={pack.images?.[0] ?? "/No_Image_Available.jpg"}
                                  alt={pack.name.fr}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {pack.name.fr}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {pack.discountPrice || pack.totalPrice} MAD
                                  {pack.discountPrice && (
                                    <span className="text-gray-400 line-through ml-2">
                                      {pack.totalPrice} MAD
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => addItem(pack, "pack")}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
              </div>
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  Articles sélectionnés ({selectedItems.length})
                </h3>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                          {item.type === "pack" && (
                            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] px-1 rounded-bl">
                              PACK
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {(item.discountPrice || item.price).toFixed(2)} MAD
                            {item.discountPrice && (
                              <span className="text-gray-400 line-through ml-2">
                                {item.price.toFixed(2)} MAD
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border-2 border-gray-300 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-2 hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-2 hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-semibold text-gray-900 min-w-[80px] text-right">
                          {(
                            (item.discountPrice || item.price) * item.quantity
                          ).toFixed(2)}{" "}
                          MAD
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Sous-total:</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Livraison:</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-green-600">Gratuite</span>
                      ) : (
                        `${shipping.toFixed(2)} MAD`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="text-orange-600">{total.toFixed(2)} MAD</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || selectedItems.length === 0}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Créer la commande
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
