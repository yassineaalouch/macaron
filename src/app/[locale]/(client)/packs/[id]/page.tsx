import { notFound } from "next/navigation"
import { Metadata } from "next"
import { PackDetails } from "@/components/packs/PackDetails"
import { RelatedPacks } from "@/components/packs/RelatedPacks"
import { enrichPackWithProducts } from "@/lib/packUtils"

interface PackDetailsPageProps {
  params: Promise<{ id: string }>
}

async function fetchPack(id: string) {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/product-packs/${id}`,
      {
        cache: "no-store"
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data.success || !data.data) {
      return null
    }

    // Enrichir le pack avec les détails des produits
    const enrichedPack = await enrichPackWithProducts(data.data)
    return enrichedPack
  } catch (error) {
    // Erreur silencieuse - retourner null
    return null
  }
}

export async function generateMetadata({
  params
}: PackDetailsPageProps): Promise<Metadata> {
  const { id } = await params
  const pack = await fetchPack(id)

  if (!pack) {
    return {
      title: "Pack non trouvé"
    }
  }

  return {
    title: `${pack.name.fr} | Pack Promotionnel`,
    description:
      pack.description?.fr ||
      `Découvrez notre pack ${pack.name.fr} à prix réduit`,
    openGraph: {
      title: pack.name.fr,
      description: pack.description?.fr,
      images: pack.images || []
    }
  }
}

export default async function PackDetailsPage({
  params
}: PackDetailsPageProps) {
  const { id } = await params
  const pack = await fetchPack(id)

  if (!pack) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-firstColor/10 via-white to-secondColor/10">
      {/* Pack Details */}
      <section className="container mx-auto px-4 py-12">
        <PackDetails pack={pack} />
      </section>

      {/* Related Packs */}
      <section className="container mx-auto px-4 py-12">
        <RelatedPacks currentPackId={id} />
      </section>
    </div>
  )
}
