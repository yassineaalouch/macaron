import { ReactNode } from "react"
import { Product } from "./product"
import { Discount } from "./discount"
import { ShopFilters } from "./shopFilter"

export type ProductForm = Omit<Product, "id" | "rating" | "reviews">

export interface FormData {
  name: string
  price: string
  originalPrice: string
  image: string
  rating: string
  reviews: string
  isNewProduct: boolean
  isOnSale: boolean
  category: string
  material: string
  height: string
  color: string
  inStock: boolean
  description: string
}

export interface FormErrors {
  name?: string
  price?: string
  originalPrice?: string
  image?: string
  rating?: string
  reviews?: string
  category?: string
  material?: string
  height?: string
  color?: string
  description?: string
}

export interface SortOption {
  value: string
  label: string
}

export interface ShopContentProps {
  products: Product[]
  pagination: {
    page: number
    limit: number
    totalProducts: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  initialFilters: ShopFilters
  initialSortBy: string
}

export interface ProductCardProps {
  product: Product
  viewMode: "grid" | "list"
}

export interface FilterState {
  category: string[]
  priceRange: [number, number]
  inStock: boolean
  onSale: boolean
  rating: number
}

export interface ProductFilterProps {
  products: Product[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
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

export interface Service {
  icon: React.ReactNode
  title: string
  description: string
}

export interface FAQ {
  id: string
  question: {
    fr: string
    ar: string
  }
  answer: {
    fr: string
    ar: string
  }
}
export interface ContactInfo {
  icon: React.ReactNode
  title: string
  content: string[]
  color: string
}

export interface ContactInfoCardProps {
  contactInfo: ContactInfo
}

export interface OpeningHour {
  day: string
  hours: string
  isToday?: boolean
}

export interface CartContextType {
  cartItems: CartItem[]
  isCartOpen: boolean
  FREE_SHIPPING_THRESHOLD: number
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  updateQuantity: (item: CartItem, quantity: number) => void
  removeItem: (item: CartItem) => void
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>
  removeCoupon: () => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  totalItems: number
  totalPrice: number
  remainingForFreeShipping: number
  discount?: {
    type: "PERCENTAGE" | "BUY_X_GET_Y"
    value?: number // pourcentage (ex: 10 pour 10%)
    buyQuantity?: number // ex: 2
    getQuantity?: number // ex: 1
  } | null
  progressPercentage: number
  hasFreeShipping: boolean

  coupon: string | null
  couponData: Discount | null
  couponError: string | null

  subtotal: number
  discountAmount: number
  shipping: number
  calculateItemTotal: (item: CartItem) => number
}

export interface CartProviderProps {
  children: ReactNode
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  category?: string | null
  image: string
  discount?: {
    type: "PERCENTAGE" | "BUY_X_GET_Y"
    value?: number // pourcentage (ex: 10 pour 10%)
    buyQuantity?: number // ex: 2
    getQuantity?: number // ex: 1
  } | null
  characteristic?: { name: string; value: string }[] | null
  type?: "product" | "pack" // Type d'item: produit ou pack
  packItems?: Array<{
    id: string
    name: string
    quantity: number
    price: number
    image: string
  }> // Produits inclus dans le pack (seulement pour type="pack")
  discountPrice?: number // Prix avec réduction pour les packs
  maxQuantity?: number // Quantité maximale disponible (seulement pour les produits)
}

export interface SideCartProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (item: CartItem, quantity: number) => void
  onRemoveItem: (item: CartItem) => void
  coupon?: string | null
  couponData?: Discount | null
  couponError?: string | null
  subtotal?: number
  discountAmount?: number
  totalPrice?: number
  applyCoupon?: (code: string) => Promise<{ success: boolean; message: string }>
  removeCoupon?: () => void
}

export interface CheckoutFormData {
  customerName: string
  customerAddress: string
  customerPhone: string
}

export interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => void
  isProcessing: boolean
  total: number
}

export interface CartSummaryProps {
  items: CartItem[]
  updateQuantity: (item: CartItem, quantity: number) => void
  removeItem: (item: CartItem) => void
  subtotal: number
  shipping: number
  total: number
  coupon?: string | null
  couponData?: Discount | null
  couponError?: string | null
  applyCoupon?: (code: string) => Promise<{ success: boolean; message: string }>
  removeCoupon?: () => void
}
export interface FormErrors {
  customerName?: string
  customerAddress?: string
  customerPhone?: string
}

export interface BaseEntity {
  id: string
  name: string
}

export interface EntityTableAction {
  type: "view" | "edit" | "delete"
  label: string
  icon: React.ReactNode
  className?: string
  onClick: (item: BaseEntity) => void
}

export interface EntityTableProps {
  data: BaseEntity[]
  title: string
  actions?: EntityTableAction[]
  onSearch?: (query: string) => void
  loading?: boolean
  emptyMessage?: string
}

export interface NavigationItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
  isActive?: boolean
  submenu?: NavigationSubItem[]
}

export interface NavigationSubItem {
  id: string
  label: string
  href: string
  isActive?: boolean
}

export interface UserProfile {
  name: string
  email: string
  avatar?: string
  role: string
}

export interface DashboardLayoutProps {
  children: React.ReactNode
  currentPath?: string
}
