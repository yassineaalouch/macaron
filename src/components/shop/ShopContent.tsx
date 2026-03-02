// export default ShopContent

"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import ProductCard from "./ProductCard"
import ProductFilter from "./ProductFilter"
import ProductSorter from "./ProductSorter"
import { ShopFilters } from "@/types/shopFilter"
import { ShopContentProps } from "@/types/type"

const ShopContent: React.FC<ShopContentProps> = ({
  products,
  pagination,
  initialFilters,
  initialSortBy
}) => {
  const router = useRouter()
  const pathname = usePathname()

  const [filters, setFilters] = useState<ShopFilters>(initialFilters)
  const [sortBy, setSortBy] = useState(initialSortBy)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Fonction pour construire l'URL avec les paramètres
  const buildUrl = (
    newFilters?: ShopFilters,
    newSortBy?: string,
    newPage?: number
  ) => {
    const params = new URLSearchParams()

    const currentFilters = newFilters || filters
    const currentSort = newSortBy || sortBy
    const currentPage = newPage || pagination.page

    // Ajouter les filtres
    currentFilters.category.forEach((cat) => params.append("category", cat))
    currentFilters.characteristics.forEach((char) =>
      params.append("characteristics", char)
    )

    if (currentFilters.priceRange[0] > 0) {
      params.append("minPrice", currentFilters.priceRange[0].toString())
    }
    if (currentFilters.priceRange[1] < 5000) {
      params.append("maxPrice", currentFilters.priceRange[1].toString())
    }

    if (currentFilters.inStock) params.append("inStock", "true")
    if (currentFilters.onSale) params.append("onSale", "true")
    if (currentFilters.isNewCategory) params.append("isNew", "true")

    // Ajouter le tri
    if (currentSort !== "newest") {
      params.append("sortBy", currentSort)
    }

    // Ajouter la pagination
    if (currentPage !== 1) {
      params.append("page", currentPage.toString())
    }

    return params.toString()
  }

  // Gérer les changements de filtres
  const handleFiltersChange = (newFilters: ShopFilters) => {
    setFilters(newFilters)
    const url = buildUrl(newFilters, sortBy, 1) // Reset to page 1 on filter change
    window.scrollTo({ top: 0, behavior: "smooth" }) // scroll smooth
    router.push(`${pathname}${url ? `?${url}` : ""}`)
  }

  // Gérer le changement de tri
  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    const url = buildUrl(filters, newSortBy, 1) // Reset to page 1 on sort change
    router.push(`${pathname}${url ? `?${url}` : ""}`)
  }

  // Gérer le changement de page
  const handlePageChange = (newPage: number) => {
    const url = buildUrl(filters, sortBy, newPage)
    router.push(`${pathname}${url ? `?${url}` : ""}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 relative">
      {/* Filtres - Sidebar */}
      <aside className="lg:w-80 flex-shrink-0">
        <ProductFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />
      </aside>

      {/* Contenu principal */}
      <main className="flex-1">
        {/* Barre de tri et contrôles */}
        <ProductSorter
          totalProducts={pagination.totalProducts}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenFilters={() => setIsFilterOpen(true)}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />

        {/* Grille de produits ou message vide */}
        {products.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4"
                : "flex flex-col space-y-4"
            }
          >
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-white rounded-lg shadow-sm">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 sm:w-24 sm:h-24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-sm sm:text-base text-gray-500 text-center max-w-md px-4">
              Essayez de modifier vos filtres ou de rechercher autre chose
            </p>
            <button
              onClick={() =>
                handleFiltersChange({
                  category: [],
                  priceRange: [0, 5000],
                  characteristics: [],
                  inStock: false,
                  onSale: false,
                  isNewCategory: false
                })
              }
              className="mt-6 px-4 sm:px-6 py-2 sm:py-3 bg-firstColor text-white rounded-lg hover:bg-secondColor transition-colors duration-200"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Pagination en bas si plusieurs pages */}
        {products.length > 0 && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.page - 1))
                }
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  !pagination.hasPrevPage
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Précédent
              </button>

              <div className="flex items-center space-x-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const pageNum =
                      pagination.page <= 3 ? i + 1 : pagination.page - 2 + i
                    if (pageNum > pagination.totalPages) return null

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                          pagination.page === pageNum
                            ? "bg-firstColor text-white shadow-md"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  }
                )}
              </div>

              <button
                onClick={() =>
                  handlePageChange(
                    Math.min(pagination.totalPages, pagination.page + 1)
                  )
                }
                disabled={!pagination.hasNextPage}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  !pagination.hasNextPage
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Suivant
              </button>
            </nav>
          </div>
        )}
      </main>
    </div>
  )
}

export default ShopContent
