export interface FilterState {
  category: string[]
  priceRange: [number, number]
  characteristics: string[]
  inStock: boolean
  onSale: boolean
  isNewCategory: boolean
}

export interface ProductFilterProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  isOpen: boolean
  onClose: () => void
}
////
// types/shopFilter.ts
export interface ShopFilters {
  category: string[]
  priceRange: [number, number]
  characteristics: string[]
  inStock: boolean
  onSale: boolean
  isNewCategory: boolean
}

export interface ProductFilterProps {
  filters: ShopFilters
  onFiltersChange: (filters: ShopFilters) => void
  isOpen: boolean
  onClose: () => void
}

export interface ProductSorterProps {
  totalProducts: number
  sortBy: string
  onSortChange: (sortBy: string) => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  onOpenFilters: () => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export interface SortOption {
  value: string
  label: string
}
