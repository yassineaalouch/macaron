// app/packs/page.tsx
import { Suspense } from "react"
import { Metadata } from "next"
import { PacksHero } from "@/components/packs/PacksHero"
import { PacksFilters } from "@/components/packs/PacksFilters"
import { PacksSkeleton } from "@/components/packs/PacksSkeleton"
import { PacksGrid } from "@/components/packs/PacksGrid"

export const metadata: Metadata = {
  title: "Nos Packs Promotionnels | Économisez sur vos produits préférés",
  description:
    "Découvrez nos packs de produits à prix réduits. Profitez d'offres exceptionnelles sur une sélection de produits groupés.",
  openGraph: {
    title: "Packs Promotionnels",
    description: "Économisez avec nos packs de produits sélectionnés",
    type: "website"
  }
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    search?: string
  }>
}

export default async function PacksPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const sortBy = params.sort || "newest"
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined
  const searchQuery = params.search || ""

  return (
    <div className="min-h-screen ">
      {/* Hero Section */}
      <PacksHero />

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Filters - Client Component */}
          <aside className="lg:sticky lg:top-4 lg:h-fit">
            <PacksFilters />
          </aside>

          {/* Packs Grid - Server Component with Suspense */}
          <main>
            <Suspense
              key={`${currentPage}-${sortBy}-${minPrice}-${maxPrice}-${searchQuery}`}
              fallback={<PacksSkeleton />}
            >
              <PacksGrid
                page={currentPage}
                sortBy={sortBy}
                minPrice={minPrice}
                maxPrice={maxPrice}
                searchQuery={searchQuery}
              />
            </Suspense>
          </main>
        </div>
      </section>
    </div>
  )
}
