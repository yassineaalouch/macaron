
// app/[locale]/(client)/shop/page.tsx
import ShopContent from "@/components/shop/ShopContent"
import { Product } from "@/types/product"
import { ShopPageProps } from "@/types/shop"

const ShopPage = async ({ searchParams }: ShopPageProps) => {
  // ✅ Await the searchParams before using them
  const resolvedSearchParams = await searchParams

  const params = new URLSearchParams()

  if (resolvedSearchParams.category) {
    const categories = Array.isArray(resolvedSearchParams.category)
      ? resolvedSearchParams.category
      : [resolvedSearchParams.category]
    categories.forEach((cat) => params.append("category", cat))
  }

  if (resolvedSearchParams.characteristics) {
    const chars = Array.isArray(resolvedSearchParams.characteristics)
      ? resolvedSearchParams.characteristics
      : [resolvedSearchParams.characteristics]
    chars.forEach((char) => params.append("characteristics", char))
  }

  if (resolvedSearchParams.minPrice)
    params.append("minPrice", resolvedSearchParams.minPrice)
  if (resolvedSearchParams.maxPrice)
    params.append("maxPrice", resolvedSearchParams.maxPrice)
  if (resolvedSearchParams.inStock)
    params.append("inStock", resolvedSearchParams.inStock)
  if (resolvedSearchParams.onSale)
    params.append("onSale", resolvedSearchParams.onSale)
  if (resolvedSearchParams.isNew)
    params.append("isNew", resolvedSearchParams.isNew)
  if (resolvedSearchParams.sortBy)
    params.append("sortBy", resolvedSearchParams.sortBy)

  params.append("page", resolvedSearchParams.page || "1")
  params.append("limit", resolvedSearchParams.limit || "8")
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL||"http://localhost:3000"
  const res = await fetch(
    `${baseUrl}/api/products?${params.toString()}`,
    { cache: "no-store" }
  )

  const data = await res.json()
  const products: Product[] = data?.products || []
  const pagination = data?.pagination || {
    page: 1,
    limit: 12,
    totalProducts: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ShopContent
          products={products}
          pagination={pagination}
          initialFilters={{
            category: Array.isArray(resolvedSearchParams.category)
              ? resolvedSearchParams.category
              : resolvedSearchParams.category
              ? [resolvedSearchParams.category]
              : [],
            characteristics: Array.isArray(resolvedSearchParams.characteristics)
              ? resolvedSearchParams.characteristics
              : resolvedSearchParams.characteristics
              ? [resolvedSearchParams.characteristics]
              : [],
            priceRange: [
              resolvedSearchParams.minPrice
                ? parseInt(resolvedSearchParams.minPrice)
                : 0,
              resolvedSearchParams.maxPrice
                ? parseInt(resolvedSearchParams.maxPrice)
                : 5000
            ],
            inStock: resolvedSearchParams.inStock === "true",
            onSale: resolvedSearchParams.onSale === "true",
            isNewCategory: resolvedSearchParams.isNew === "true"
          }}
          initialSortBy={resolvedSearchParams.sortBy || "newest"}
        />
      </div>
    </div>
  )
}

export default ShopPage
