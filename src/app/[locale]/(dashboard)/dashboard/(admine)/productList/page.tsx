"use client"

import React, { useState, useEffect } from "react"
import {
  Package,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Tag,
  Trash2,
  Loader2,
  RotateCcw,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Product, ProductFilterState, ProductSortState } from "@/types/product"
import { getMainImage } from "@/lib/getMainImage"
import { Category } from "@/types/category"
import { Discount } from "@/types/discount"
import { ManagementCard } from "@/components/dashboard/ManagementCard"
import { useToast } from "@/components/ui/Toast"

const AdminProductsTable: React.FC = () => {
  const { showToast } = useToast()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentLanguage, setCurrentLanguage] = useState<"fr" | "ar">("fr")
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])

  // Temporary filter state (for form inputs)
  const [tempFilters, setTempFilters] = useState<ProductFilterState>({
    search: "",
    category: "",
    discount: "",
    status: "all",
    minQuantity: "",
    maxQuantity: ""
  })

  // Applied filter state (used in API calls)
  const [appliedFilters, setAppliedFilters] = useState<ProductFilterState>({
    search: "",
    category: "",
    discount: "",
    status: "all",
    minQuantity: "",
    maxQuantity: ""
  })

  const [sort, setSort] = useState<ProductSortState>({
    field: "name",
    direction: "asc"
  })

  // Charger les produits avec filtres et pagination
  useEffect(() => {
    fetchProducts()
  }, [appliedFilters, sort, currentPage, currentLanguage])

  // Charger les catégories et discounts au montage
  useEffect(() => {
    fetchCategories()
    fetchDiscounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Add filters
      if (appliedFilters.search) params.append("search", appliedFilters.search)
      if (appliedFilters.category) params.append("categoryName", appliedFilters.category)
      if (appliedFilters.discount) params.append("discountName", appliedFilters.discount)
      if (appliedFilters.status && appliedFilters.status !== "all") params.append("status", appliedFilters.status)
      if (appliedFilters.minQuantity) params.append("minQuantity", appliedFilters.minQuantity)
      if (appliedFilters.maxQuantity) params.append("maxQuantity", appliedFilters.maxQuantity)
      
      // Add sort
      params.append("sortField", sort.field)
      params.append("sortDirection", sort.direction)
      params.append("language", currentLanguage)
      
      // Add pagination
      params.append("page", currentPage.toString())
      params.append("limit", "12")
      
      const response = await axios.get(`/api/products?${params.toString()}`)
      if (response.data.success) {
        setProducts(response.data.products)
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages)
          setTotalProducts(response.data.pagination.totalProducts)
        }
      } else {
        showToast(response.data.message || "Erreur lors du chargement des produits", "error")
      }
    } catch (error) {
      showToast("Erreur lors du chargement des produits", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories")
      if (response.data.success) {
        const allCategories = response.data.categories || []
        // Filter categories that have names (required for display)
        const validCategories = allCategories.filter(
          (cat: Category) => cat && cat.name && (cat.name.fr || cat.name.ar)
        )
        setCategories(validCategories)
      } else {
        showToast(response.data.message || "Erreur lors du chargement des catégories", "error")
        setCategories([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error)
      if (axios.isAxiosError(error)) {
        console.error("Error details:", error.response?.data)
        showToast(error.response?.data?.message || "Erreur lors du chargement des catégories", "error")
      } else {
        showToast("Erreur lors du chargement des catégories", "error")
      }
      setCategories([])
    }
  }

  const fetchDiscounts = async () => {
    try {
      const response = await axios.get("/api/discounts")
      if (response.data.success) {
        const allDiscounts = response.data.discounts || []
        // Filter discounts that have names (required for display)
        const validDiscounts = allDiscounts.filter(
          (discount: Discount) => discount && discount.name && (discount.name.fr || discount.name.ar)
        )
        setDiscounts(validDiscounts)
      } else {
        showToast(response.data.message || "Erreur lors du chargement des promotions", "error")
        setDiscounts([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des promotions:", error)
      if (axios.isAxiosError(error)) {
        console.error("Error details:", error.response?.data)
        showToast(error.response?.data?.message || "Erreur lors du chargement des promotions", "error")
      } else {
        showToast("Erreur lors du chargement des promotions", "error")
      }
      setDiscounts([])
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      return
    }

    try {
      const response = await axios.delete(`/api/products/${productId}`)

      if (response.data.success) {
        showToast("Produit supprimé avec succès", "success")
        await fetchProducts()
      } else {
        showToast(response.data.message || "Erreur lors de la suppression", "error")
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        showToast(error.response.data.message, "error")
      } else {
        showToast("Erreur lors de la suppression du produit", "error")
      }
    }
  }

  // Remove client-side filtering - now handled server-side

  const handleSort = (field: ProductSortState["field"]) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }))
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handleFilterInputChange = (newFilters: Partial<ProductFilterState>) => {
    setTempFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters)
    setCurrentPage(1) // Reset to first page when filters are applied
  }

  const handleResetFilters = () => {
    const emptyFilters = {
      search: "",
      category: "",
      discount: "",
      status: "all" as const,
      minQuantity: "",
      maxQuantity: ""
    }
    setTempFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleProductClick = (productId: string) => {
    router.push(`/dashboard/productList/${productId}`)
  }

  const getStatusBadge = (product: Product) => {
    if (!product.inStock || product.quantity === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="mr-1" size={12} />
          Rupture
        </span>
      )
    }

    if (product.quantity <= 10) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="mr-1" size={12} />
          Stock faible
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="mr-1" size={12} />
        En stock
      </span>
    )
  }

  const getSortIcon = (field: ProductSortState["field"]) => {
    if (sort.field !== field) return <ArrowUpDown className="ml-1" size={14} />
    return sort.direction === "asc" ? (
      <ArrowUp className="ml-1" size={14} />
    ) : (
      <ArrowDown className="ml-1" size={14} />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="animate-spin mx-auto mb-4 text-blue-500"
            size={48}
          />
          <p className="text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* En-tête */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Package className="mr-3" size={28} />
                  Gestion des Produits
                </h1>
                <div className="text-sm text-gray-600 mt-1">
                  {totalProducts} produit{totalProducts > 1 ? "s" : ""} au total
                  {totalProducts > 0 && (
                    <>
                      {" "}• Page {currentPage} sur {totalPages}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-white rounded-lg border">
                  <button
                    onClick={() => setCurrentLanguage("fr")}
                    className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                      currentLanguage === "fr"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    FR
                  </button>
                  <button
                    onClick={() => setCurrentLanguage("ar")}
                    className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                      currentLanguage === "ar"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    AR
                  </button>
                </div>

                <div className="flex items-center bg-white rounded-lg border">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                      viewMode === "table"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    title="Vue tableau"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                      viewMode === "grid"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    title="Vue grille"
                  >
                    <Grid3x3 size={16} />
                  </button>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <Filter className="mr-2" size={16} />
                  Filtres
                </button>

                <button
                  onClick={() => router.push("/dashboard/productList/add")}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Package className="mr-2" size={16} />
                  Ajouter un produit
                </button>
              </div>
            </div>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="bg-gray-50 border-b p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recherche
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Nom"
                      value={tempFilters.search}
                      onChange={(e) =>
                        handleFilterInputChange({ search: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={tempFilters.category}
                    onChange={(e) =>
                      handleFilterInputChange({ category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.length === 0 ? (
                      <option value="" disabled>Aucune catégorie disponible</option>
                    ) : (
                      categories.map((category) => {
                        const categoryName = category?.name?.[currentLanguage] || category?.name?.fr || category?.name?.ar || "Sans nom"
                        return (
                          <option
                            key={category?._id}
                            value={categoryName}
                          >
                            {categoryName}
                          </option>
                        )
                      })
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solde
                  </label>
                  <select
                    value={tempFilters.discount}
                    onChange={(e) =>
                      handleFilterInputChange({ discount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Toutes les promotions</option>
                    {discounts.length === 0 ? (
                      <option value="" disabled>Aucune promotion disponible</option>
                    ) : (
                      discounts.map((discount) => {
                        const discountName = discount?.name?.[currentLanguage] || discount?.name?.fr || discount?.name?.ar || "Sans nom"
                        return (
                          <option
                            key={discount?._id}
                            value={discountName}
                          >
                            {discountName}
                          </option>
                        )
                      })
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={tempFilters.status}
                    onChange={(e) =>
                      handleFilterInputChange({ status: e.target.value as ProductFilterState["status"] })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="inStock">En stock</option>
                    <option value="outOfStock">En rupture</option>
                    <option value="lowStock">Stock faible (≤10)</option>
                    <option value="new">Nouveaux produits</option>
                    <option value="onSale">En promotion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité min
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={tempFilters.minQuantity}
                    onChange={(e) =>
                      handleFilterInputChange({ minQuantity: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité max
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    value={tempFilters.maxQuantity}
                    onChange={(e) =>
                      handleFilterInputChange({ maxQuantity: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={handleResetFilters}
                  className="
                            flex items-center gap-1.5 
                            px-4 py-2 cursor-pointer
                            text-sm font-semibold text-gray-500 
                            border bg-gray-100 border-transparent rounded-lg 
                            hover:bg-gray-200 hover:text-gray-700 
                            focus:outline-none focus:ring-2 focus:ring-gray-100 transition-colors duration-200"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réinitialiser
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="
                            flex items-center gap-1.5 
                            px-4 py-2 cursor-pointer
                            text-sm font-semibold text-white 
                            border bg-blue-500 border-transparent rounded-lg 
                            hover:bg-blue-600 
                            focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors duration-200"
                >
                  <Filter className="h-4 w-4" />
                  Appliquer les filtres
                </button>
              </div>
            </div>
          )}

          {/* Tableau ou Grille */}
          {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center hover:text-gray-700"
                    >
                      Produit
                      {getSortIcon("name")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("category")}
                      className="flex items-center hover:text-gray-700"
                    >
                      Catégorie
                      {getSortIcon("category")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("discount")}
                      className="flex items-center hover:text-gray-700"
                    >
                      Solde
                      {getSortIcon("discount")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("price")}
                      className="flex items-center hover:text-gray-700"
                    >
                      Prix
                      {getSortIcon("price")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("quantity")}
                      className="flex items-center hover:text-gray-700"
                    >
                      Stock
                      {getSortIcon("quantity")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr
                    key={product._id}
                    onClick={() => handleProductClick(product._id)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {product.images && (getMainImage(product) ?? product.images[0]) ? (
                          <Image
                            src={getMainImage(product) ?? product.images[0]}
                            alt={product.name[currentLanguage]}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="text-gray-400" size={20} />
                          </div>
                        )}
                        {product.isNewProduct && (
                          <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">
                            NEW
                          </div>
                        )}
                        {product.isOnSale && (
                          <div className="absolute bottom-0 left-0 bg-red-500 text-white text-xs px-1 rounded-tr">
                            SALE
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name[currentLanguage]}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {product?.category?.name ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Tag className="mr-1" size={12} />
                          {product.category.name?.[currentLanguage] ?? "---"}
                        </span>
                      ) : (
                        "---"
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {product?.discount?.name ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Tag className="mr-1" size={12} />
                          {product.discount.name?.[currentLanguage] ?? "---"}
                        </span>
                      ) : (
                        "---"
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {product.originalPrice ? (
                          <div>
                            <span className="text-sm font-bold text-green-600">
                              {product.price.toFixed(2)} MAD
                            </span>
                            <div className="text-xs text-gray-500 line-through">
                              {product.originalPrice.toFixed(2)} MAD
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {product.price.toFixed(2)} MAD
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {product.quantity}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProductClick(product._id)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/productList/${product._id}`)
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProduct(product._id)
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Message si aucun produit - Table */}
            {products.length === 0 && (
              <div className="p-8 text-center">
                <Package className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-500">
                  Essayez de modifier vos filtres de recherche ou ajoutez votre
                  premier produit.
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage de {((currentPage - 1) * 12) + 1} à{" "}
                  {Math.min(currentPage * 12, totalProducts)} sur {totalProducts} produits
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Précédent
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            currentPage === pageNum
                              ? "bg-blue-500 text-white"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    Suivant
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
          ) : (
            /* Vue Grille */
            <div className="p-6">
              {products.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun produit trouvé
                  </h3>
                  <p className="text-gray-500">
                    Essayez de modifier vos filtres de recherche ou ajoutez votre
                    premier produit.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ManagementCard
                        key={`product-${product._id}`}
                        type="product"
                        item={product}
                        currentLanguage={currentLanguage}
                        onView={(id) => handleProductClick(id)}
                        editPath={`/dashboard/productList/${product._id}`}
                        onDelete={handleDeleteProduct}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination Controls for Grid View */}
                  {totalPages > 1 && (
                    <div className="mt-6 bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Affichage de {((currentPage - 1) * 12) + 1} à{" "}
                        {Math.min(currentPage * 12, totalProducts)} sur {totalProducts} produits
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          <ChevronLeft size={16} className="mr-1" />
                          Précédent
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                  currentPage === pageNum
                                    ? "bg-blue-500 text-white"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            )
                          })}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          Suivant
                          <ChevronRight size={16} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminProductsTable
