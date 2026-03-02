
// export default ProductSorter
"use client"

import React from "react"
import { Grid, List, SlidersHorizontal } from "lucide-react"
import { useTranslations } from "next-intl"
import { ProductSorterProps, SortOption } from "@/types/shopFilter"

const ProductSorter: React.FC<ProductSorterProps> = ({
  totalProducts,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenFilters,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const t = useTranslations("ShopPage.ProductSorter")

  const sortOptions: SortOption[] = [
    { value: "name-asc", label: t("sortOptions.nameAsc") },
    { value: "name-desc", label: t("sortOptions.nameDesc") },
    { value: "price-asc", label: t("sortOptions.priceAsc") },
    { value: "price-desc", label: t("sortOptions.priceDesc") },
    { value: "newest", label: t("sortOptions.newest") }
  ]

  const getProductsFoundText = (count: number) => {
    return count > 1
      ? t("productsFound.plural", { count })
      : t("productsFound.single", { count })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
      <div className="flex flex-col space-y-4">
        {/* Header avec titre */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {t("title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {getProductsFoundText(totalProducts)}
            </p>
          </div>

          {/* Bouton filtres mobile uniquement */}
          <button
            onClick={onOpenFilters}
            className="lg:hidden self-start flex items-center px-4 py-2 bg-firstColor text-white rounded-lg hover:bg-secondColor transition-colors duration-200"
          >
            <SlidersHorizontal size={18} className="mr-2" />
            {t("filters")}
          </button>
        </div>

        {/* Contrôles de tri et vue - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 pt-2 border-t border-gray-100">
          {/* Sélecteur de tri */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">
              {t("sortBy")}
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-firstColor focus:border-firstColor bg-white min-w-0 transition-all duration-200"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sélecteur de vue */}
          <div className="hidden md:flex items-center justify-between sm:justify-end">
            <span className="text-sm text-gray-600 sm:hidden">
              {t("viewMode.label")}
            </span>
            {/* <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => onViewModeChange("grid")}
                className={`p-2 transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-firstColor text-white"
                    : "text-gray-600 hover:text-firstColor hover:bg-gray-50"
                }`}
                title={t("viewMode.grid")}
                aria-label={t("viewMode.grid")}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => onViewModeChange("list")}
                className={`p-2 transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-firstColor text-white"
                    : "text-gray-600 hover:text-firstColor hover:bg-gray-50"
                }`}
                title={t("viewMode.list")}
                aria-label={t("viewMode.list")}
              >
                <List size={18} />
              </button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-center">
            <nav
              aria-label="Pagination"
              className="flex items-center space-x-1 sm:space-x-2"
            >
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  currentPage === 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-firstColor hover:text-firstColor"
                }`}
                aria-label={t("pagination.previous")}
              >
                <span className="hidden sm:inline">
                  {t("pagination.previous")}
                </span>
                <span className="sm:hidden">
                  {t("pagination.previousShort")}
                </span>
              </button>

              {/* Pages - Responsive display */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                  if (pageNum > totalPages) return null

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                        currentPage === pageNum
                          ? "bg-firstColor text-white shadow-md"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-firstColor hover:text-firstColor"
                      }`}
                      aria-label={`Page ${pageNum}`}
                      aria-current={
                        currentPage === pageNum ? "page" : undefined
                      }
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  currentPage === totalPages
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-firstColor hover:text-firstColor"
                }`}
                aria-label={t("pagination.next")}
              >
                <span className="hidden sm:inline">{t("pagination.next")}</span>
                <span className="sm:hidden">{t("pagination.nextShort")}</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductSorter
