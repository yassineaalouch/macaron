"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Filter, X, ChevronRight } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import axios from "axios"
import { Category, CategoryTreeNode } from "@/types/category"
import { ProductFilterProps } from "@/types/shopFilter"
// import { ICharacteristic } from "@/types/characteristic"
// import { ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/components/ui/Toast"
// import { isColorCharacteristic, normalizeHexColor, isValidHexColor } from "@/utils/colorCharacteristic"

const ProductFilter: React.FC<ProductFilterProps> = ({
  filters,
  onFiltersChange,
  isOpen,
  onClose
}) => {
  const t = useTranslations("ShopPage.ProductFilter")
  const locale = useLocale() as "fr" | "ar"
  const { showToast } = useToast()
  const [categories, setCategories] = useState<string[]>([])
  const [categoriesData, setCategoriesData] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  // const [characteristics, setCharacteristics] = useState<ICharacteristic[]>([])
  // const [openChar, setOpenChar] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // const toggleChar = (id: string) => {
  //   setOpenChar((prev) => (prev === id ? null : id))
  // }

  // async function fetchCharacteristics() {
  //   const res = await axios.get("/api/characteristics")
  //   setCharacteristics(res.data)
  // }

  useEffect(() => {
    fetchCategories()
    // fetchCharacteristics()
  }, [])
  //categorie
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await axios.get("/api/categories")
      if (response.data.success) {
        const allCategories: Category[] = response.data.categories
        setCategoriesData(allCategories)
        // Garder aussi l'ancienne structure pour compatibilité
        setCategories(
          allCategories.map((category: Category) => category?.name?.[locale])
        )
      } else {
        showToast(response.data.message || "Erreur lors du chargement des catégories", "error")
      }
    } catch (error) {
      showToast("Erreur lors du chargement des catégories", "error")
    } finally {
      setLoadingCategories(false)
    }
  }

  // Construire l'arbre de catégories
  const categoryTree = useMemo(() => {
    const buildTree = (parentId?: string, level: number = 0): CategoryTreeNode[] => {
      return categoriesData
        .filter((cat) => (parentId ? cat.parentId === parentId : !cat.parentId))
        .filter((cat) => cat.isActive) // Seulement les catégories actives
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((category) => ({
          category,
          children: buildTree(category._id, level + 1),
          level
        }))
    }
    return buildTree()
  }, [categoriesData])

  // Fonction pour obtenir tous les IDs de catégories (parent + enfants)
  const getAllCategoryIds = (categoryId: string): string[] => {
    const category = categoriesData.find((c) => c._id === categoryId)
    if (!category) return [categoryId]

    const ids = [categoryId]
    // Récupérer tous les enfants récursivement
    const getChildrenIds = (parentId: string) => {
      const children = categoriesData.filter((c) => c.parentId === parentId)
      children.forEach((child) => {
        ids.push(child._id)
        getChildrenIds(child._id)
      })
    }
    getChildrenIds(categoryId)
    return ids
  }

  // 🕹 Handlers
  const handleCategoryChange = (categoryName: string, categoryId?: string) => {
    if (!categoryId) {
      // Fallback si pas d'ID (ne devrait pas arriver)
      const newCategories = filters.category.includes(categoryName)
        ? filters.category.filter((c) => c !== categoryName)
        : [...filters.category, categoryName]
      onFiltersChange({ ...filters, category: newCategories })
      return
    }

    const category = categoriesData.find((c) => c._id === categoryId)
    if (!category) return

    // Vérifier si c'est une catégorie parente (a des enfants)
    const hasChildren = categoriesData.some((c) => c.parentId === categoryId)
    const isCurrentlySelected = filters.category.includes(categoryName)

    if (isCurrentlySelected) {
      // Désélectionner
      if (hasChildren) {
        // Si c'est un parent : retirer la catégorie et toutes ses sous-catégories
        const allIds = getAllCategoryIds(categoryId)
        const allNames = allIds
          .map((id) => {
            const cat = categoriesData.find((c) => c._id === id)
            return cat ? cat.name[locale] : null
          })
          .filter((name): name is string => name !== null)
        const newCategories = filters.category.filter((c) => !allNames.includes(c))
        onFiltersChange({ ...filters, category: newCategories })
      } else {
        // Si c'est une sous-catégorie : retirer seulement cette catégorie (pas le parent)
        const newCategories = filters.category.filter((c) => c !== categoryName)
        onFiltersChange({ ...filters, category: newCategories })
      }
    } else {
      // Sélectionner
      if (hasChildren) {
        // Si c'est un parent : ajouter la catégorie et toutes ses sous-catégories
        const allIds = getAllCategoryIds(categoryId)
        const allNames = allIds
          .map((id) => {
            const cat = categoriesData.find((c) => c._id === id)
            return cat ? cat.name[locale] : null
          })
          .filter((name): name is string => name !== null)
        const newCategories = [...new Set([...filters.category, ...allNames])]
        onFiltersChange({ ...filters, category: newCategories })
      } else {
        // Si c'est une sous-catégorie : ajouter seulement cette catégorie (pas le parent)
        const newCategories = [...new Set([...filters.category, categoryName])]
        onFiltersChange({ ...filters, category: newCategories })
      }
    }
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Vérifier si une catégorie ou une de ses sous-catégories est sélectionnée
  const isCategoryOrChildSelected = (categoryId: string): boolean => {
    const category = categoriesData.find((c) => c._id === categoryId)
    if (!category) return false
    
    const categoryName = category.name[locale]
    // Vérifier si cette catégorie spécifique est sélectionnée
    if (filters.category.includes(categoryName)) return true
    
    // Vérifier si une de ses sous-catégories est sélectionnée
    const allIds = getAllCategoryIds(categoryId)
    // Exclure la catégorie elle-même pour ne vérifier que les enfants
    const childIds = allIds.filter((id) => id !== categoryId)
    const childNames = childIds
      .map((id) => {
        const cat = categoriesData.find((c) => c._id === id)
        return cat ? cat.name[locale] : null
      })
      .filter((name): name is string => name !== null)
    return childNames.some((name) => filters.category.includes(name))
  }

  // const handleCharacteristicChange = (value: string) => {
  //   const newValues = filters.characteristics.includes(value)
  //     ? filters.characteristics.filter((v) => v !== value)
  //     : [...filters.characteristics, value]
  //   onFiltersChange({ ...filters, characteristics: newValues })
  // }

  const clearAllFilters = () => {
    onFiltersChange({
      category: [],
      priceRange: [0, 5000],
      characteristics: [],
      inStock: false,
      onSale: false,
      isNewCategory: false
    })
  }

  // 💻 Classes pour sidebar
  const sidebarClasses = `fixed lg:relative inset-y-0 z-50 lg:z-40 left-0 w-80 bg-white shadow-lg lg:shadow-none transform ${
    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
  } transition-transform duration-300 ease-in-out lg:block`

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
      )}

      <div className={sidebarClasses}>
        <div className="p-4 sm:p-6 h-full overflow-y-auto">
          {/* Header - Modern design */}
          <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 border-b-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-firstColor to-secondColor rounded-lg shadow-md">
                <Filter className="text-white" size={20} />
              </div>
              {t("title")}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearAllFilters}
                className="text-xs px-3 py-1.5 bg-orange-50 text-secondaryColor hover:bg-orange-100 rounded-lg font-medium transition-all duration-200 border border-orange-200"
              >
                {t("reset")}
              </button>
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Prix - Modern design */}
          <div className="mb-6 p-4 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-sm sm:text-base flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-firstColor to-secondColor rounded-full"></div>
              {t("sections.price.title")}
            </h3>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder={t("sections.price.min")}
                value={filters.priceRange[0]}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    priceRange: [
                      parseInt(e.target.value) || 0,
                      filters.priceRange[1]
                    ]
                  })
                }
                className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-firstColor focus:outline-none focus:ring-2 focus:ring-firstColor/20 transition-all"
              />
              <span className="text-gray-400 font-medium">-</span>
              <input
                type="number"
                placeholder={t("sections.price.max")}
                value={filters.priceRange[1]}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    priceRange: [
                      filters.priceRange[0],
                      parseInt(e.target.value) || 5000
                    ]
                  })
                }
                className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-firstColor focus:outline-none focus:ring-2 focus:ring-firstColor/20 transition-all"
              />
            </div>
          </div>

          {/* Catégories - Tree structure */}
          {categoryTree.length > 0 && (
            <div className="mb-6 p-4 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 text-sm sm:text-base flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-firstColor to-secondColor rounded-full"></div>
                {t("sections.categories.title")}
              </h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {!loadingCategories ? (
                  categoryTree.map((node) => (
                    <CategoryTreeNodeComponent
                      key={node.category._id}
                      node={node}
                      locale={locale}
                      filters={filters}
                      onCategoryChange={handleCategoryChange}
                      expandedCategories={expandedCategories}
                      onToggleExpansion={toggleCategoryExpansion}
                      isCategoryOrChildSelected={isCategoryOrChildSelected}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">Chargement...</div>
                )}
              </div>
            </div>
          )}

          {/* Filtrage par caractéristiques désactivé */}

          {/* Options */}
          <div className="mb-5">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">
              {t("sections.options.title")}
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, inStock: e.target.checked })
                  }
                  className="mr-3 text-yellow-500 focus:ring-yellow-500 rounded"
                />
                <span className="text-sm text-gray-700 flex-1">
                  {t("sections.options.inStock")}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={filters.onSale}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, onSale: e.target.checked })
                  }
                  className="mr-3 text-yellow-500 focus:ring-yellow-500 rounded"
                />
                <span className="text-sm text-gray-700 flex-1">
                  {t("sections.options.onSale")}
                </span>
              </label>

              <label className="flex items-baseline gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={filters.isNewCategory}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      isNewCategory: e.target.checked
                    })
                  }
                  className="mr-3 text-yellow-500 focus:ring-yellow-500 rounded"
                />
                <span className="text-sm text-gray-700 flex-1">
                  {t("sections.options.isNew")}
                </span>
              </label>
            </div>
          </div>

          {/* Filtres actifs */}
          {/* {hasActiveFilters && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                {t("activeFilters")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {filters.category.map((category) => (
                  <span
                    key={category}
                    className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-xs flex items-center border border-yellow-200"
                  >
                    {category}
                    <button
                      onClick={() => handleCategoryChange(category)}
                      className="ml-2 hover:text-yellow-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {filters.characteristics.map((char, index) => (
                  <span
                    key={index}
                    className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs flex items-center border border-green-200"
                  >
                    {char}
                    <button
                      onClick={() => handleCharacteristicChange(char)}
                      className="ml-2 hover:text-green-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </div>
    </>
  )
}

// Composant pour afficher un nœud de catégorie dans l'arbre
interface CategoryTreeNodeComponentProps {
  node: CategoryTreeNode
  locale: "fr" | "ar"
  filters: ProductFilterProps["filters"]
  onCategoryChange: (categoryName: string, categoryId?: string) => void
  expandedCategories: Set<string>
  onToggleExpansion: (categoryId: string) => void
  isCategoryOrChildSelected: (categoryId: string) => boolean
}

const CategoryTreeNodeComponent: React.FC<CategoryTreeNodeComponentProps> = ({
  node,
  locale,
  filters,
  onCategoryChange,
  expandedCategories,
  onToggleExpansion,
  isCategoryOrChildSelected
}) => {
  const categoryName = node.category.name[locale]
  const hasChildren = node.children.length > 0
  const isExpanded = expandedCategories.has(node.category._id)
  const isSelected = filters.category.includes(categoryName)
  // Vérifier si une sous-catégorie est sélectionnée (mais pas le parent lui-même)
  const isAnyChildSelected = hasChildren && !isSelected && isCategoryOrChildSelected(node.category._id)

  return (
    <div>
      <div className="flex items-center gap-2">
        {/* Bouton d'expansion pour les catégories avec enfants */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpansion(node.category._id)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight
              size={16}
              className={`text-gray-500 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        ) : (
          <div className="w-6" /> // Espace pour l'alignement
        )}

        {/* Checkbox et label */}
        <label
          className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-all duration-200 border border-transparent hover:border-orange-200 flex-1"
          style={{ paddingLeft: `${node.level * 20 + 8}px` }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onCategoryChange(categoryName, node.category._id)}
            className="w-4 h-4 text-firstColor focus:ring-firstColor rounded border-gray-300"
          />
          <span className="text-sm text-gray-700 flex-1 font-medium">
            {categoryName}
          </span>
        </label>
      </div>

      {/* Sous-catégories */}
      {hasChildren && isExpanded && (
        <div className="ml-6">
          {node.children.map((childNode) => (
            <CategoryTreeNodeComponent
              key={childNode.category._id}
              node={childNode}
              locale={locale}
              filters={filters}
              onCategoryChange={onCategoryChange}
              expandedCategories={expandedCategories}
              onToggleExpansion={onToggleExpansion}
              isCategoryOrChildSelected={isCategoryOrChildSelected}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductFilter
