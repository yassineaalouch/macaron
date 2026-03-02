// types/product.ts

import { Types } from "mongoose"
import { Category } from "./category"
import { Discount } from "./discount"
import { ProductCharacteristic } from "./characteristic"

export interface ProductName {
  fr: string
  ar: string
}

export interface ProductDescription {
  fr: string
  ar: string
}
export interface Product {
  _id: string
  name: ProductName
  description: ProductDescription
  price: number
  originalPrice?: number
  images: string[]
  /** Index de l'image principale (affichée en premier). Défaut 0. */
  mainImageIndex?: number
  category?: Category
  discount?: Discount
  Characteristic?: ProductCharacteristic[]
  inStock: boolean
  quantity: number
  isNewProduct: boolean
  isOnSale: boolean
  slug?: string
  createdAt: string
  updatedAt: string
}

export interface ProductFormData {
  name: ProductName
  description: ProductDescription
  price: number
  originalPrice?: number
  images: string[]
  mainImageIndex?: number
  category: string
  discount: string
  Characteristic?: ProductCharacteristic[]
  inStock: boolean
  quantity: number
  isNewProduct: boolean
  isOnSale: boolean
}

export interface ProductRequestBody {
  name: ProductName
  description: ProductDescription
  price: number
  originalPrice?: number
  images: string[]
  mainImageIndex?: number
  category: Types.ObjectId | string
  discount: Types.ObjectId | string
  Characteristic?: ProductCharacteristic[]
  inStock: boolean
  quantity: number
  isNewProduct: boolean
  isOnSale: boolean
}

export interface ProductResponse {
  success: boolean
  message?: string
  product?: Product
  products?: Product[]
  errors?: string[]
}

export interface ProductFilterState {
  search: string
  category: string
  discount: string
  status: "all" | "inStock" | "outOfStock" | "lowStock" | "new" | "onSale"
  minQuantity: string
  maxQuantity: string
}

export interface ProductSortState {
  field:
    | "name"
    | "price"
    | "quantity"
    | "rating"
    | "category"
    | "createdAt"
    | "discount"
  direction: "asc" | "desc"
}
