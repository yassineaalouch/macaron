import { PackProduct } from "./pack"

// Type pour les données envoyées lors de la création d'une commande
// export interface OrderRequestBody {
//   customerName: string
//   customerAddress: string
//   customerPhone: string
//   items: OrderItem[]
//   subtotal: number
//   shipping: number
//   total: number
// }

export interface OrderRequestBody {
  customerName: string
  customerAddress: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  coupon?: { code: string; discountType: string; value: number } | null
  paymentMethod?: string
  shippingMethod?: string
  notes?: string
  status?: string
}
// Type pour la réponse de l'API (utilisé dans les routes API)
export interface OrderResponse {
  success: boolean
  message?: string
  orderId?: string
  order?: OrderDocument
  orders?: OrderDocument[]
  errors?: string[]
}

// Type pour un document de commande dans MongoDB
export interface OrderDocument {
  _id: string
  customerName: string
  customerAddress: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  orderDate: Date
  createdAt: Date
  updatedAt: Date
  coupon: { code: string; discountType: string; value: number } | null
}

// Type pour les erreurs de validation
export interface ValidationError extends Error {
  name: "ValidationError"
  errors: {
    [key: string]: {
      message: string
    }
  }
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image: string
  discount?: string | null
  lineTotal?: number | null
  discountLabel?: string | null
  buyQuantity?: number | null
  getQuantity?: number | null
  characteristic?: { name: string; value: string }[] | null
  type: "product"
}

// Types pour les packs

export interface OrderPack {
  id: string
  name: string
  quantity: number
  price: number
  discountPrice?: number
  image: string
  type: "pack"
  items: PackProduct[]
}
export interface UpdateOrderData {
  status?: string
  paymentMethod?: string
}

export type OrderLineItem = OrderItem | OrderPack

export interface Order {
  _id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerAddress: string
  orderDate: Date
  status:
    | "pending"
    | "confirmed"
    | "rejected"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
  total: number
  paymentMethod: string
  shippingMethod: string
  items: OrderLineItem[]
  notes?: string
  coupon: { code: string; discountType: string; value: number } | null
}

export interface OrderFilterState {
  search: string
  status: string
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
  itemType: string
}

export interface SortState {
  field: "date" | "total" | "customerName" | "orderNumber"
  direction: "asc" | "desc"
}

export interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderCreated: () => void
}

export interface SelectedItem {
  id: string
  name: string
  type: "product" | "pack"
  price: number
  discountPrice?: number
  image: string
  quantity: number
  packItems?: Array<{
    id: string
    name: string
    quantity: number
    price: number
    image: string
  }>
}
