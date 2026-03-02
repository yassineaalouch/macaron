// types/dashboard.ts

export interface Statistics {
  revenue: {
    total: number
    thisMonth: number
    change: number
    trend: "up" | "down"
  }
  orders: {
    total: number
    thisMonth: number
    today: number
    pending: number
    change: number
    trend: "up" | "down"
  }
  customers: {
    total: number
  }
  products: {
    total: number
    inStock: number
    outOfStock: number
    list: Array<{
      id: string
      name: string
      image: string
      type: string
    }>
  }
  packs: {
    total: number
    list: Array<{
      id: string
      name: string
      image: string
      type: string
    }>
  }
  discounts: {
    active: number
  }
  recentOrders: Array<{
    _id: string
    orderNumber: string
    customerName: string
    total: number
    status: string
    createdAt: string
    paymentMethod: string
  }>
  topProducts: Array<{
    _id: string
    name: string
    image: string
    totalQuantity: number
    totalRevenue: number
  }>
  salesOverTime: Array<{
    date: string
    revenue: number
    orders: number
  }>
  productComparison: Array<{
    date: string
    [key: string]: string | number
  }>
}

export interface SelectableItem {
  id: string
  name: string
  image: string
  type: "product" | "pack"
}

