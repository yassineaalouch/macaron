"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { ChevronLeft, ChevronRight, ShoppingCart, Heart } from "lucide-react"
import { useLocale } from "next-intl"
import ProductCard from "./ProductCard"
import { Product } from "@/types/product"
import { useToast } from "@/components/ui/Toast"

interface RelatedProductsProps {
  categoryId: string
  currentProductId: string
}

export function RelatedProducts({
  categoryId,
  currentProductId
}: RelatedProductsProps) {
  const locale = useLocale() as "fr" | "ar"
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/products?categoryId=${encodeURIComponent(categoryId)}&limit=12`
        )
        const data = await response.json()

        if (data.success) {
          // Filtrer pour exclure le produit actuel (même catégorie exacte ou sous-catégorie)
          const filtered = data.products.filter(
            (p: Product) => p._id !== currentProductId
          )
          setProducts(filtered.slice(0, 8)) // Limiter à 8 produits
        } else {
          showToast(data.message || "Erreur lors du chargement des produits similaires", "error")
        }
      } catch (error) {
        showToast("Erreur lors du chargement des produits similaires", "error")
      } finally {
        setLoading(false)
      }
    }

    if (categoryId) {
      fetchRelatedProducts()
    }
  }, [categoryId, currentProductId])

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("related-products-container")
    if (!container) return

    const scrollAmount = 300
    const newPosition =
      direction === "left"
        ? scrollPosition - scrollAmount
        : scrollPosition + scrollAmount

    container.scrollTo({
      left: newPosition,
      behavior: "smooth"
    })

    setScrollPosition(newPosition)
  }

  if (loading) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {locale === "fr" ? "Produits similaires" : "منتجات مماثلة"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {locale === "fr" ? "Produits similaires" : "منتجات مماثلة"}
          </h2>

          {/* Navigation buttons */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Précédent"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Products carousel */}
        <div
          id="related-products-container"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <ProductCard
              key={product._id}
              viewMode={"grid"}
              product={product}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// function ProductCard({
//   product,
//   locale
// }: {
//   product: Product
//   locale: "fr" | "ar"
// }) {
//   const [imageError, setImageError] = useState(false)
//   const [isFavorite, setIsFavorite] = useState(false)

//   const discountPercentage =
//     product.originalPrice && product.originalPrice > product.price
//       ? Math.round(
//           ((product.originalPrice - product.price) / product.originalPrice) *
//             100
//         )
//       : 0

//   return (
//     <div className="group relative flex-shrink-0 w-64 snap-start">
//       <Link
//         href={`/shop/${product._id}`}
//         className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
//       >
//         {/* Image */}
//         <div className="relative aspect-square bg-gray-100 overflow-hidden">
//           {product.images && product.images.length > 0 && !imageError ? (
//             <Image
//               src={product.images[0]}
//               alt={product.name[locale]}
//               fill
//               className="object-cover transition-transform duration-300 group-hover:scale-110"
//               onError={() => setImageError(true)}
//             />
//           ) : (
//             <div className="w-full h-full flex items-center justify-center bg-gray-200">
//               <ShoppingCart className="h-12 w-12 text-gray-400" />
//             </div>
//           )}

//           {/* Badges */}
//           <div className="absolute top-2 left-2 flex flex-col gap-1">
//             {product.isNewProduct && (
//               <span className="bg-blue-500 text-white px-2 py-1 text-xs rounded-full font-medium">
//                 {locale === "fr" ? "Nouveau" : "جديد"}
//               </span>
//             )}
//             {product.isOnSale && discountPercentage > 0 && (
//               <span className="bg-red-500 text-white px-2 py-1 text-xs rounded-full font-medium">
//                 -{discountPercentage}%
//               </span>
//             )}
//           </div>

//           {/* Quick actions */}
//           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
//             <button
//               onClick={(e) => {
//                 e.preventDefault()
//                 setIsFavorite(!isFavorite)
//               }}
//               className={`p-2 rounded-full bg-white shadow-md transition-colors ${
//                 isFavorite ? "text-red-500" : "text-gray-600 hover:text-red-500"
//               }`}
//             >
//               <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
//             </button>
//           </div>

//           {/* Stock status */}
//           {!product.inStock && (
//             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//               <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
//                 {locale === "fr" ? "Rupture de stock" : "نفذت الكمية"}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Content */}
//         <div className="p-4">
//           <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[48px]">
//             {product.name[locale]}
//           </h3>

//           {/* Price */}
//           <div className="flex items-center gap-2 mb-3">
//             <span className="text-lg font-bold text-orange-600">
//               {product.price} MAD
//             </span>
//             {product.originalPrice && product.originalPrice > product.price && (
//               <span className="text-sm text-gray-500 line-through">
//                 {product.originalPrice} MAD
//               </span>
//             )}
//           </div>

//           {/* Add to cart button */}
//           <button
//             onClick={(e) => {
//               e.preventDefault()
//               // Logique d'ajout au panier
//               alert(
//                 `${product.name[locale]} ${
//                   locale === "fr" ? "ajouté au panier" : "أضيف إلى السلة"
//                 }`
//               )
//             }}
//             disabled={!product.inStock}
//             className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
//               product.inStock
//                 ? "bg-orange-500 text-white hover:bg-orange-600"
//                 : "bg-gray-200 text-gray-500 cursor-not-allowed"
//             }`}
//           >
//             <ShoppingCart size={18} />
//             {locale === "fr" ? "Ajouter" : "أضف"}
//           </button>
//         </div>
//       </Link>
//     </div>
//   )
// }

// // Style pour cacher la scrollbar
// const style = `
//   .scrollbar-hide::-webkit-scrollbar {
//     display: none;
//   }
// `

// if (typeof document !== "undefined") {
//   const styleSheet = document.createElement("style")
//   styleSheet.textContent = style
//   document.head.appendChild(styleSheet)
// }
