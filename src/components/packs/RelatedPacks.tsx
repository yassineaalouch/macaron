import { PackCard } from "./PackCard"

interface RelatedPacksProps {
  currentPackId: string
}
interface Product {
  _id: string
  name: {
    fr: string
    ar: string
  }
  description: {
    fr: string
    ar: string
  }
  price: number
  originalPrice?: number
  images: string[]
  category?: string
  inStock: boolean
  quantity: number
}

interface PackItem {
  productId: string
  quantity: number
  product?: Product
}

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
  items: PackItem[]
  totalPrice: number
  discountPrice?: number
  images?: string[]
}

async function fetchRelatedPacks(currentPackId: string) {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/product-packs`,
      {
        cache: "no-store"
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const allPacks = data.success ? data.data : []

    // Filter out current pack and get up to 3 related packs
    return allPacks
      .filter((pack: Pack) => pack._id !== currentPackId)
      .slice(0, 3)
  } catch (error) {
    // Erreur silencieuse - retourner un tableau vide
    return []
  }
}

export async function RelatedPacks({ currentPackId }: RelatedPacksProps) {
  const relatedPacks = await fetchRelatedPacks(currentPackId)

  if (relatedPacks.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="mb-8 text-3xl font-bold text-gray-900">
        Découvrez aussi nos autres packs
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {relatedPacks.map((pack: Pack) => (
          <PackCard key={pack._id} pack={pack} />
        ))}
      </div>
    </div>
  )
}
