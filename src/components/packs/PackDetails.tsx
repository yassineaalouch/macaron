"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import {
  Package,
  ShoppingCart,
  Percent,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { PackAvailabilityAlert } from "./PackAvailabilityAlert"
import { useLocale, useTranslations } from "next-intl"
import { useCartContext } from "@/app/context/CartContext"
import { useToast } from "@/components/ui/Toast"
import { Product } from "@/types/product"
import { getMainImage } from "@/lib/getMainImage"
import { ShareMenu } from "@/components/ShareMenu"

// Type flexible pour les produits retournés par l'API
type ProductApiResponse = Omit<Product, "category" | "discount"> & {
  category?: Product["category"] | null
  discount?: Product["discount"] | null
}

interface PackItem {
  productId: string
  quantity: number
  product?: ProductApiResponse
}

interface Pack {
  _id: string
  name: {
    fr: string
    ar: string
  }
  description?: {
    fr: string
    ar: string
  }
  items: PackItem[]
  totalPrice: number
  discountPrice?: number
  images?: string[]
}

interface PackDetailsProps {
  pack: Pack
}

export function PackDetails({ pack }: PackDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [imageError, setImageError] = useState(false)
  const [currentUrl, setCurrentUrl] = useState("")
  const locale = useLocale() as "fr" | "ar"
  const { addItem, cartItems, updateQuantity, removeItem } = useCartContext()
  const { showToast } = useToast()
  const t = useTranslations("PacksPage.details")
  const tCard = useTranslations("PacksPage.card")
  const finalPrice = pack.discountPrice || pack.totalPrice
  const hasDiscount = pack.discountPrice && pack.discountPrice < pack.totalPrice
  const discountPercentage = hasDiscount
    ? Math.round(
        ((pack.totalPrice - pack.discountPrice!) / pack.totalPrice) * 100
      )
    : 0

  const itemsCount = pack.items.reduce((sum, item) => sum + item.quantity, 0)
  const savings = hasDiscount
    ? (pack.totalPrice - pack.discountPrice!) * quantity
    : 0

  const images = pack.images && pack.images.length > 0 ? pack.images : []

  // Check if pack is in cart
  const cartItem = cartItems.find(
    (item) => item.id === pack._id && item.type === "pack"
  )
  const cartQuantity = cartItem?.quantity || 0
  const isInCart = cartQuantity > 0

  // Get current URL for sharing
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href)
    }
  }, [])

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="space-y-12">
      {/* Main Product Info */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-firstColor/20 to-secondColor/20 shadow-xl">
            {images.length > 0 && !imageError ? (
              <>
                <Image
                  src={images[selectedImage]}
                  alt={pack.name[locale]}
                  fill
                  className="object-cover"
                  priority
                  onError={() => setImageError(true)}
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2  bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white"
                      aria-label="Image précédente"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2  bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white"
                      aria-label="Image suivante"
                    >
                      <ChevronRight className="h-6 w-6 text-gray-800" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-32 w-32 text-firstColor/50" />
              </div>
            )}

            {hasDiscount && (
              <div className="absolute right-4 top-4 bg-red-500  px-4 py-2 text-sm font-bold text-white shadow-lg">
                <Percent className="inline h-4 w-4 mr-1" />-{discountPercentage}
                %
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden transition-all ${
                    selectedImage === index
                      ? "ring-4 ring-firstColor"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${pack.name[locale]} - ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title */}
          <div className="flex justify-between items-start">
            <h1 className="mb-2 text-3xl font-bold text-[#413e3b] lg:text-4xl">
              {pack.name[locale]}
            </h1>
            {/* Share Button */}
            <div className="flex space-x-2">
              {currentUrl && (
                <ShareMenu
                  url={currentUrl}
                  title={pack.name[locale]}
                  description={pack.description?.[locale]}
                  image={pack.images?.[0]}
                />
              )}
            </div>
          </div>

          {/* Items Count Badge */}
          <div className="inline-flex items-center gap-2 bg-firstColor/10 px-4 py-2 text-[#a1b16a]">
            <Package className="h-5 w-5" />
            <span className="font-semibold">
               {itemsCount > 1 ? t("productsIncludedPlural", { count: itemsCount }) : t("productsIncluded", { count: itemsCount })}
            </span>
          </div>

          {/* Description */}
          {pack.description && pack.description[locale] && (
            <div className=" bg-gray-50 p-6">
              <p className="text-gray-700 leading-relaxed">
                {pack.description[locale]}
              </p>
            </div>
          )}

          {/* Price Section with enhanced discount visibility */}
          <div className=" p-6 shadow-md border-2 border-firstColor/30">
            {hasDiscount && (
              <div className="mb-4 flex items-center gap-3">
                <span className="bg-red-500 text-white px-4 py-2  text-lg font-bold shadow-lg">
                  -{discountPercentage}%
                </span>
                <div className="text-gray-500">
                  <p className="text-sm font-medium">{t("normalPrice")}</p>
                  <p className="text-xl line-through font-semibold">
                    {pack.totalPrice.toFixed(2)} MAD
                  </p>
                </div>
              </div>
            )}
            <div className="mb-4 flex items-end gap-4">
              <div>
                <p className="text-sm text-[#a1b16a] font-medium">
                  {t("packPrice")}
                </p>
                <p className="text-4xl font-black text-[#a1b16a]">
                  {finalPrice.toFixed(2)} MAD
                </p>
              </div>
            </div>

            {hasDiscount && (
              <div className="flex items-center gap-2 bg-green-100 px-4 py-2 text-green-800 border border-green-300">
                <Check className="h-5 w-5" />
                <span className="font-semibold">
                  {t("youSave", { amount: savings.toFixed(2) })}
                </span>
              </div>
            )}
          </div>

          {/* Quantity Selector */}

          {/* Availability Alert */}
          <PackAvailabilityAlert pack={pack} />

          {/* Total Price */}

          {/* Action Buttons */}
          <div className="space-y-3">
            {isInCart ? (
              /* Quantity Controller when pack is in cart */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">
                    {t("quantityInCart")}
                  </span>
                  <span className="text-sm text-green-600 font-medium">
                    {t("inCart")}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-firstColor bg-firstColor/10">
                    <button
                      onClick={() => {
                        if (cartQuantity > 1) {
                          updateQuantity(cartItem!, cartQuantity - 1)
                        } else {
                          removeItem(cartItem!)
                        }
                      }}
                      className="px-4 py-3 hover:bg-firstColor/20 font-bold text-[#a1b16a] transition-colors"
                    >
                      -
                    </button>
                    <span className="px-6 py-3 min-w-16 text-center font-bold text-lg text-[#a1b16a]">
                      {cartQuantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(cartItem!, cartQuantity + 1)
                      }
                      className="px-4 py-3 hover:bg-firstColor/20 font-bold text-[#a1b16a] transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(cartItem!)}
                    className="px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors border border-red-200"
                  >
                    {t("remove")}
                  </button>
                </div>
              </div>
            ) : (
              /* Add to Cart when pack not in cart */
              <button
                onClick={async () => {
                  try {
                    // Fetch product details for each productId in the pack
                    const packItemsPromises = pack.items.map(async (item) => {
                      try {
                        const response = await fetch(
                          `/api/products/${item.productId}`
                        )
                        if (!response.ok) return null
                        const data = await response.json()
                        if (!data.success || !data.product) return null

                        return {
                          id: data.product._id,
                          name: data.product.name[locale],
                          quantity: item.quantity,
                          price: data.product.price,
                          image:
                            getMainImage(data.product) ??
                            "/No_Image_Available.jpg"
                        }
                      } catch (error) {
                        // Erreur silencieuse pour éviter de spammer les toasts
                        return null
                      }
                    })

                    const packItems = (
                      await Promise.all(packItemsPromises)
                    ).filter(Boolean) as Array<{
                      id: string
                      name: string
                      quantity: number
                      price: number
                      image: string
                    }>

                    if (packItems.length === 0) {
                      showToast(tCard("errorLoadingProducts"), "error")
                      return
                    }

                    addItem(
                      {
                        id: pack._id,
                        name: pack.name[locale],
                        price: pack.totalPrice,
                        image: pack.images?.[0] ?? "/No_Image_Available.jpg",
                        type: "pack",
                        packItems: packItems,
                        discountPrice: pack.discountPrice
                      },
                      quantity
                    )
                  } catch (error) {
                    showToast(tCard("errorAddingToCart"), "error")
                  }
                }}
                className="flex w-full items-center justify-center gap-3 bg-secondColor text-[#413e3b] px-8 py-4 text-lg font-bold shadow-lg transition-all hover:bg-[#a1b16a] hover:text-black hover:shadow-xl"
              >
                <ShoppingCart className="h-6 w-6" />
                {t("addToCart")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Included Section */}
      {pack.items && pack.items.length > 0 && (
        <div className=" bg-white p-8 shadow-lg">
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-gray-900">
            <Package className="h-7 w-7 text-[#a1b16a]" />
            {t("productsIncludedTitle")}
          </h2>

          <div className="space-y-6">
            {pack.items.map((item, index) => (
              <PackProductCard key={item.productId} item={item} index={index} />
            ))}
          </div>

          {/* Pack Summary */}
          <div className="mt-8 bg-gradient-to-r from-firstColor/10 to-secondColor/10 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">{t("totalItems")}</p>
                <p className="text-2xl font-bold text-[#a1b16a]">
                  {itemsCount}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">{t("totalNormalPrice")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pack.totalPrice.toFixed(2)} MAD
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">{t("yourPrice")}</p>
                <p className="text-2xl font-bold text-green-600">
                  {finalPrice.toFixed(2)} MAD
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Fonction utilitaire pour valider une description
function isValidDescription(desc: string | undefined | null): boolean {
  if (!desc || typeof desc !== "string") return false
  // Vérifier que ce n'est pas du texte corrompu ou du placeholder
  const trimmed = desc.trim()
  if (trimmed.length < 3) return false
  // Vérifier qu'il n'y a pas trop de caractères répétitifs (signe de corruption)
  const uniqueChars = new Set(trimmed.split("")).size
  if (uniqueChars < 5 && trimmed.length > 50) return false
  return true
}

// Composant pour afficher chaque produit du pack
function PackProductCard({ item, index }: { item: PackItem; index: number }) {
  const [imageError, setImageError] = useState(false)
  const locale = useLocale() as "fr" | "ar"
  const t = useTranslations("PacksPage.details")
  const product = item.product

  if (!product) {
    return (
      <div className="flex items-center gap-4 border-2 border-dashed border-gray-300 bg-gray-50 p-4">
        <div className="flex h-24 w-24 items-center justify-center  bg-gray-200">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">{t("productId")} {item.productId}</p>
          <p className="text-xs text-gray-400">{t("quantity")} {item.quantity}</p>
        </div>
      </div>
    )
  }

  // Valider la description
  const description = product.description?.[locale]
  const hasValidDescription = isValidDescription(description)

  return (
    <div className="group relative overflow-hidden  border-2 border-gray-200 bg-white p-4 transition-all hover:border-firstColor/50 hover:shadow-lg">
      {/* Product Number Badge */}
      <div className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center  bg-[#a1b16a] text-sm font-bold text-white shadow-md">
        {index + 1}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Image */}
        <Link
          href={`/shop/${product._id}`}
          className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-firstColor/20 to-secondColor/20 sm:h-32 sm:w-32 flex-shrink-0"
        >
          {product.images && product.images.length > 0 && !imageError ? (
            <Image
              src={getMainImage(product) ?? product.images[0]}
              alt={product.name[locale]}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-[#a1b16a]" />
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Product Name */}
          <div>
            <Link
              href={`/shop/${product._id}`}
              className="font-bold text-gray-900 hover:text-[#a1b16a] transition-colors"
            >
              <h3 className="text-lg line-clamp-1">{product.name[locale]}</h3>
            </Link>
          </div>

          {/* Description */}
          {hasValidDescription && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          )}

          {/* Price & Quantity */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{t("unitPrice")}</span>
              <span className="text-lg font-bold text-[#a1b16a]">
                {product.price.toFixed(2)} MAD
              </span>
            </div>

            <div className="flex items-center gap-2 bg-firstColor/10 px-3 py-1">
              <Package className="h-4 w-4 text-[#a1b16a]" />
              <span className="text-sm font-semibold text-[#a1b16a]">
                x{item.quantity}
              </span>
            </div>

            {!product.inStock && (
              <span className=" bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {t("outOfStock")}
              </span>
            )}
          </div>

          {/* Total for this item */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-gray-500">{t("subtotal")}</span>
            <span className="text-xl font-bold text-gray-900">
              {(product.price * item.quantity).toFixed(2)} MAD
            </span>
          </div>
        </div>

        {/* View Product Button */}
        <div className="flex items-center sm:flex-col sm:justify-center">
          <Link
            href={`/shop/${product._id}`}
            className="flex items-center gap-2 border-2 border-firstColor bg-white px-4 py-2 text-sm font-medium text-[#a1b16a] transition-all hover:bg-firstColor/10"
          >
            {t("viewDetails")}
          </Link>
        </div>
      </div>
    </div>
  )
}
