"use client"

import React from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { Edit, Trash2, Eye, Package, Percent, ShoppingBag, Tag } from "lucide-react"
import { ProductPack } from "@/types/pack"
import { Product } from "@/types/product"

interface ManagementCardProps {
  type: "pack" | "product"
  item: ProductPack | Product
  currentLanguage: "fr" | "ar"
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  viewPath?: string
  editPath?: string
}

export function ManagementCard({
  type,
  item,
  currentLanguage,
  onEdit,
  onDelete,
  onView,
  viewPath,
  editPath
}: ManagementCardProps) {
  const isPack = type === "pack"
  const pack = isPack ? (item as ProductPack) : null
  const product = !isPack ? (item as Product) : null

  const id = item._id
  const name = isPack
    ? pack!.name[currentLanguage]
    : product!.name[currentLanguage]
  const description = isPack
    ? pack!.description?.[currentLanguage]
    : product!.description[currentLanguage]
  const image = isPack
    ? pack!.images?.[0]
    : product!.images?.[0]
  // Price calculation
  const price = isPack ? pack!.totalPrice : product!.price
  const discountPrice = isPack ? pack!.discountPrice : undefined
  const originalPrice = isPack ? undefined : product!.originalPrice

  // For products: if originalPrice exists, current price is the sale price, originalPrice is the full price
  // For packs: discountPrice is the sale price, totalPrice is the full price
  const finalPrice = isPack
    ? (discountPrice || price)
    : (originalPrice ? product!.price : price)
  const displayOriginalPrice = isPack
    ? (discountPrice ? price : undefined)
    : originalPrice

  const hasDiscount = Boolean(displayOriginalPrice && finalPrice && displayOriginalPrice > finalPrice)
  const discountPercentage = hasDiscount && displayOriginalPrice && finalPrice
    ? Math.round(((displayOriginalPrice - finalPrice) / displayOriginalPrice) * 100)
    : 0

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(id)
    } else if (editPath) {
      window.location.href = editPath
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(id)
    }
  }

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onView) {
      onView(id)
    } else if (viewPath) {
      window.location.href = viewPath
    }
  }

  return (
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="text-gray-400" size={48} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {isPack && pack!.discountPrice && (
            <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
              <Percent className="h-3.5 w-3.5" />
              -{discountPercentage}%
            </div>
          )}
          {!isPack && product!.isNewProduct && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white shadow-lg">
              NEW
            </span>
          )}
          {!isPack && product!.isOnSale && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white shadow-lg">
              SALE
            </span>
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {onView || viewPath ? (
            <button
              onClick={handleView}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-blue-50 transition-colors"
              title="Voir les détails"
            >
              <Eye size={16} className="text-blue-600" />
            </button>
          ) : null}
          {onEdit || editPath ? (
            <button
              onClick={handleEdit}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              title="Modifier"
            >
              <Edit size={16} className="text-gray-600" />
            </button>
          ) : null}
          {onDelete ? (
            <button
              onClick={handleDelete}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 size={16} className="text-red-600" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2 mb-3">
          {isPack && pack!.items && (
            <div className="flex items-center gap-1 text-xs text-gray-600 bg-orange-50 px-2 py-1 rounded-full">
              <ShoppingBag size={12} />
              <span>
                {pack!.items.reduce((sum, item) => sum + item.quantity, 0)} produit
                {pack!.items.reduce((sum, item) => sum + item.quantity, 0) > 1 ? "s" : ""}
              </span>
            </div>
          )}
          {!isPack && product!.category && (
            <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              <Tag size={12} />
              <span>{product!.category.name[currentLanguage]}</span>
            </div>
          )}
          {!isPack && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              product!.inStock && product!.quantity > 0
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}>
              <Package size={12} />
              <span>
                {product!.inStock && product!.quantity > 0
                  ? `${product!.quantity} en stock`
                  : "Rupture de stock"}
              </span>
            </div>
          )}
        </div>

        {/* Price Section */}
        <div className="flex items-end justify-between pt-3 border-t border-gray-100">
          <div className="flex items-baseline gap-2">
            {hasDiscount && displayOriginalPrice ? (
              <>
                <span className="text-lg font-bold text-green-600">
                  {finalPrice.toFixed(2)} MAD
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {displayOriginalPrice.toFixed(2)} MAD
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-800">
                {finalPrice.toFixed(2)} MAD
              </span>
            )}
          </div>

          {hasDiscount && (
            <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
              -{discountPercentage}%
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

