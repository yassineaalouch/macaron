import { Product } from "./product"

// Interface locale pour gérer les produits sélectionnés avec leur objet complet
export interface SelectedPackItem {
  productId: string
  product: Product
  quantity: number
}
export interface PackProduct {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

export type ProductPack = {
  _id: string
  name: {
    fr: string
    ar: string
  }
  description?: {
    fr: string
    ar: string
  }
  items: PackItem[]
  totalPrice: number
  discountPrice?: number
  images?: string[]
}

export type PackItem = {
  productId: string
  quantity: number
}

export interface PackFormData {
  name: {
    fr: string
    ar: string
  }
  description: {
    fr: string
    ar: string
  }
  discountPrice: string
  images: string[]
}
