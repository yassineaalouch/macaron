// components/packs/PacksGrid.tsx

import { EmptyState } from "./EmptyState"
import { PackCard } from "./PackCard"
import { Pagination } from "./Pagination"
import { ResultsInfo } from "./ResultsInfo"

const ITEMS_PER_PAGE = 12

interface Pack {
  _id: string
  name: {
    fr: string
    ar: string
  }
  description?: {
    fr: string
    ar: string
  }
  items: Array<{
    productId: string
    quantity: number
  }>
  totalPrice: number
  discountPrice?: number
  images?: string[]
}

interface PacksGridProps {
  page: number
  sortBy: string
  minPrice?: number
  maxPrice?: number
  searchQuery: string
}

async function fetchPacks() {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/product-packs`
    )

    if (!response.ok) {
      throw new Error("Failed to fetch packs")
    }

    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    // Erreur silencieuse - retourner un tableau vide
    return []
  }
}

function filterAndSortPacks(
  packs: Pack[],
  sortBy: string,
  minPrice?: number,
  maxPrice?: number,
  searchQuery?: string
) {
  let filtered = [...packs]

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (pack) =>
        pack.name.fr.toLowerCase().includes(query) ||
        pack.name.ar.includes(query)
    )
  }

  // Filter by price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    filtered = filtered.filter((pack) => {
      const price = pack.discountPrice || pack.totalPrice
      if (minPrice !== undefined && price < minPrice) return false
      if (maxPrice !== undefined && price > maxPrice) return false
      return true
    })
  }

  // Sort packs
  switch (sortBy) {
    case "price-asc":
      filtered.sort((a, b) => {
        const priceA = a.discountPrice || a.totalPrice
        const priceB = b.discountPrice || b.totalPrice
        return priceA - priceB
      })
      break
    case "price-desc":
      filtered.sort((a, b) => {
        const priceA = a.discountPrice || a.totalPrice
        const priceB = b.discountPrice || b.totalPrice
        return priceB - priceA
      })
      break
    case "discount":
      filtered.sort((a, b) => {
        const discountA = a.discountPrice
          ? ((a.totalPrice - a.discountPrice) / a.totalPrice) * 100
          : 0
        const discountB = b.discountPrice
          ? ((b.totalPrice - b.discountPrice) / b.totalPrice) * 100
          : 0
        return discountB - discountA
      })
      break
    case "newest":
    default:
      // Already sorted by createdAt from API
      break
  }

  return filtered
}

export async function PacksGrid({
  page,
  sortBy,
  minPrice,
  maxPrice,
  searchQuery
}: PacksGridProps) {
  const allPacks = await fetchPacks()
  const filteredPacks = filterAndSortPacks(
    allPacks,
    sortBy,
    minPrice,
    maxPrice,
    searchQuery
  )

  const totalPacks = filteredPacks.length
  const totalPages = Math.ceil(totalPacks / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedPacks = filteredPacks.slice(startIndex, endIndex)

  if (paginatedPacks.length === 0) {
    return <EmptyState searchQuery={searchQuery} />
  }

  return (
    <div className="space-y-8">
      {/* Results Info */}
      <ResultsInfo totalPacks={totalPacks} />

      {/* Packs Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedPacks.map((pack) => (
          <PackCard key={pack._id} pack={pack} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  )
}
