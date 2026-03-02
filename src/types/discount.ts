// types/discount.ts

export type DiscountType = "PERCENTAGE" | "BUY_X_GET_Y" | "COUPON"

export interface BilingualText {
  fr: string
  ar: string
}

export interface Discount {
  _id: string
  name: BilingualText
  type: DiscountType
  value?: number
  buyQuantity?: number
  getQuantity?: number
  couponCode?: string
  description?: BilingualText
  startDate?: string
  endDate?: string
  isActive: boolean
  usageLimit?: number
  usageCount?: number
  minimumPurchase?: number
  createdAt: string
  updatedAt: string
}

export interface DiscountFormData {
  name: BilingualText
  type: DiscountType
  value: number | undefined
  buyQuantity: number | undefined
  getQuantity: number | undefined
  couponCode: string
  description: BilingualText
  startDate: string
  endDate: string
  isActive: boolean
  usageLimit: number | undefined
  minimumPurchase: number | undefined
}

export interface DiscountRequestBody {
  name: BilingualText
  type: DiscountType
  value?: number
  buyQuantity?: number
  getQuantity?: number
  couponCode?: string
  description?: BilingualText
  startDate?: Date | string
  endDate?: Date | string
  isActive?: boolean
  usageLimit?: number
  minimumPurchase?: number
}

export interface DiscountResponse {
  success: boolean
  message?: string
  discount?: Discount
  discounts?: Discount[]
  errors?: string[]
}

export interface FilterState {
  search: string
  type: DiscountType | "all"
  status: "all" | "active" | "inactive" | "expired" | "upcoming"
}

export interface SortState {
  field: "name" | "type" | "startDate" | "endDate"
  direction: "asc" | "desc"
}
