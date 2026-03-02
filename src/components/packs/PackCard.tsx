"use client"

import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { getMainImage } from "@/lib/getMainImage"
import { ShoppingCart, Package, Percent, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useCartContext } from "@/app/context/CartContext"
import { useToast } from "@/components/ui/Toast"

interface Product {
  _id: string
  name: {
    fr: string
    ar: string
  }
  description: {
    fr: string
    ar: string
  }
  price: number
  images: string[]
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
  items: Array<{
    productId: string
    quantity: number
    product?: Product
  }>
  totalPrice: number
  discountPrice?: number
  images?: string[]
}

interface PackCardProps {
  pack: Pack
}

export function PackCard({ pack }: PackCardProps) {
  const [imageError, setImageError] = useState(false)
  const { addItem } = useCartContext()
  const locale = useLocale() as "fr" | "ar"
  const { showToast } = useToast()
  const t = useTranslations("PacksPage.card")
  const finalPrice = pack.discountPrice || pack.totalPrice
  const hasDiscount = pack.discountPrice && pack.discountPrice < pack.totalPrice
  const discountPercentage = hasDiscount
    ? Math.round(
        ((pack.totalPrice - pack.discountPrice!) / pack.totalPrice) * 100
      )
    : 0

  const itemsCount = pack.items.reduce((sum, item) => sum + item.quantity, 0)
  const handleAddToCart = async () => {
    try {
      // Fetch product details for each productId in the pack
      const packItemsPromises = pack.items.map(async (item) => {
        try {
          const response = await fetch(`/api/products/${item.productId}`)
          if (!response.ok) return null
          const data = await response.json()
          if (!data.success || !data.product) return null

          return {
            id: data.product._id,
            name: data.product.name[locale],
            quantity: item.quantity,
            price: data.product.price,
            image: getMainImage(data.product) ?? "/No_Image_Available.jpg"
          }
        } catch (error) {
          // Erreur silencieuse pour éviter de spammer les toasts
          return null
        }
      })

      const packItems = (await Promise.all(packItemsPromises)).filter(
        Boolean
      ) as Array<{
        id: string
        name: string
        quantity: number
        price: number
        image: string
      }>

      if (packItems.length === 0) {
        showToast(t("errorLoadingProducts"), "error")
        return
      }

      addItem({
        id: pack._id,
        name: pack.name[locale],
        price: pack.totalPrice,
        image: pack.images?.[0] ?? "/No_Image_Available.jpg",
        type: "pack",
        packItems: packItems,
        discountPrice: pack.discountPrice
      })
    } catch (error) {
      showToast(t("errorAddingToCart"), "error")
    }
  }

  return (
    <article className="group relative overflow-hidden bg-white shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col">
      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
          -{discountPercentage}<Percent className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Image Container */}
      <Link href={`/packs/${pack._id}`} className="block">
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-firstColor/20 to-secondColor/20">
          {pack.images && pack.images.length > 0 && !imageError ? (
            <Image
              src={pack.images[0]}
              alt={pack.name[locale]}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-20 w-20 text-firstColor/50" />
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <Link href={`/packs/${pack._id}`}>
          <h3 className="mb-2 line-clamp-2 font-lux text-xl sm:text-2xl text-gray-900">
            {pack.name[locale]}
          </h3>
        </Link>

        {/* Description */}
        {pack.description && pack.description[locale] && (
          <p className="mb-4 line-clamp-1 text-sm text-gray-600">
            {pack.description[locale]}
          </p>
        )}

        {/* Items Count */}
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-firstColor/10 px-3 py-2 text-sm text-[#a1b16a]">
          <Package className="h-4 w-4" />
          <span className="font-medium">
             {itemsCount > 1 ? t("productsIncludedPlural", { count: itemsCount }) : t("productsIncluded", { count: itemsCount })}
          </span>
        </div>

        {/* Price Section - align old/new price comme ProductCard */}
        <div className="mb-4 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through font-medium">
                    {pack.totalPrice.toFixed(2)} MAD
                  </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-lux text-3xl text-gray-900">
                {finalPrice.toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-gray-600">MAD</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-3">
          <div className="flex gap-2">
            <Link
              href={`/packs/${pack._id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#a1b16a] bg-white px-4 py-2.5 font-medium text-[#a1b16a] transition-all hover:bg-firstColor/50"
            >
              {t("viewDetails")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              className="flex items-center justify-center gap-2 rounded-lg bg-[#a1b16a] px-4 py-2.5 font-medium text-white transition-all hover:bg-[#95a65c]"
              aria-label={t("addToCart")}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Corner */}
      <div className="absolute -right-12 -top-12 h-24 w-24 rotate-45 bg-gradient-to-br from-firstColor/20 to-secondColor/20 transition-transform duration-300 group-hover:scale-150" />
    </article>
  )
}
