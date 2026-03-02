// types/shop.ts

export interface ShopPageProps {
  searchParams: Promise<{
    category?: string | string[]
    characteristics?: string | string[]
    minPrice?: string
    maxPrice?: string
    inStock?: string
    onSale?: string
    isNew?: string
    sortBy?: string
    page?: string
    limit?: string
  }>
}

