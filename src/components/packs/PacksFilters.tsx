"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search, SlidersHorizontal, X } from "lucide-react"

export function PacksFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("PacksPage.filters")

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest")
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setSearch(searchParams.get("search") || "")
    setSortBy(searchParams.get("sort") || "newest")
    setMinPrice(searchParams.get("minPrice") || "")
    setMaxPrice(searchParams.get("maxPrice") || "")
  }, [searchParams])

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset to page 1 when filters change
    params.delete("page")

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search })
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    updateFilters({ sort: value })
  }



  const clearFilters = () => {
    setSearch("")
    setSortBy("newest")
    setMinPrice("")
    setMaxPrice("")
    router.push(pathname)
  }

  const hasActiveFilters = search || sortBy !== "newest" || minPrice || maxPrice

  return (
    <>
      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-firstColor/30 bg-white px-4 py-3 font-medium text-firstColor transition-colors hover:bg-firstColor/10 lg:hidden"
      >
        <SlidersHorizontal className="h-5 w-5" />
        {t("title")} {hasActiveFilters && "•"}
      </button>

      {/* Filters Panel - Modern design */}
      <div
        className={`space-y-6 rounded-2xl bg-gradient-to-b from-white to-gray-50 p-6 shadow-xl border-2 border-gray-100 transition-all lg:block ${
          isOpen ? "block" : "hidden"
        }`}
      >
        {/* Header - Modern design */}
        <div className="flex items-center justify-between border-b-2 border-gray-200 pb-4">
          <h2 className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <div className="p-2 bg-gradient-to-br from-firstColor to-secondColor rounded-lg shadow-md">
              <SlidersHorizontal className="h-5 w-5 text-white" />
            </div>
            {t("title")}
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs px-3 py-1.5 bg-firstColor/10 text-firstColor hover:bg-firstColor/20 rounded-lg font-medium transition-all duration-200 border border-firstColor/30"
            >
              {t("reset")}
            </button>
          )}
        </div>

        {/* Search - Modern design */}
        <div className="p-4 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
          <label className="mb-3  text-sm font-bold text-gray-800 flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-firstColor to-secondColor rounded-full"></div>
            {t("search.label")}
          </label>
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full rounded-lg border-2 border-gray-200 py-2.5 pl-10 pr-10 focus:border-firstColor focus:outline-none focus:ring-2 focus:ring-firstColor/20 transition-all"
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  updateFilters({ search: "" })
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>

        {/* Sort By - Modern design */}
        <div className="p-4 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
          <label className="mb-3 text-sm font-bold text-gray-800 flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-firstColor to-secondColor rounded-full"></div>
            {t("sort.label")}
          </label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-200 bg-white py-2.5 px-4 focus:border-firstColor focus:outline-none focus:ring-2 focus:ring-firstColor/20 transition-all font-medium"
          >
            <option value="newest">{t("sort.newest")}</option>
            <option value="price-asc">{t("sort.priceAsc")}</option>
            <option value="price-desc">{t("sort.priceDesc")}</option>
            <option value="discount">{t("sort.discount")}</option>
          </select>
        </div>

        {/* Price Range - Auto-apply - Modern design */}
        <div className="p-4 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
          <label className="mb-3 block text-sm font-bold text-gray-800 flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-firstColor to-secondColor rounded-full"></div>
            {t("priceRange.label")}
          </label>
          <div className="space-y-3">
            <div>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value)
                  // Auto-apply when value changes
                  if (e.target.value || maxPrice) {
                    updateFilters({ minPrice: e.target.value, maxPrice })
                  }
                }}
                placeholder={t("priceRange.min")}
                min="0"
                className="w-full rounded-lg border-2 border-gray-200 py-2.5 px-4 focus:border-firstColor focus:outline-none focus:ring-2 focus:ring-firstColor/20 transition-all"
              />
            </div>
            <div>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value)
                  // Auto-apply when value changes
                  if (minPrice || e.target.value) {
                    updateFilters({ minPrice, maxPrice: e.target.value })
                  }
                }}
                placeholder={t("priceRange.max")}
                min="0"
                className="w-full rounded-lg border-2 border-gray-200 py-2.5 px-4 focus:border-firstColor focus:outline-none focus:ring-2 focus:ring-firstColor/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="rounded-lg bg-firstColor/10 p-4 border border-firstColor/30">
            <p className="mb-2 text-sm font-semibold text-firstColor">
              {t("activeFilters.title")}
            </p>
            <div className="space-y-1 text-sm text-firstColor/80">
              {search && (
                <p>• {t("activeFilters.search", { query: search })}</p>
              )}
              {sortBy !== "newest" && (
                <p>
                  • {t("activeFilters.sort", {
                    sortOption:
                      sortBy === "price-asc"
                        ? t("sort.priceAsc")
                        : sortBy === "price-desc"
                        ? t("sort.priceDesc")
                        : t("sort.discount")
                  })}
                </p>
              )}
              {(minPrice || maxPrice) && (
                <p>
                  • {t("activeFilters.price", {
                    min: minPrice || "0",
                    max: maxPrice || "∞"
                  })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
