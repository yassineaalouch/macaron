import React from "react"
import { CategoriesHomPageSection } from "@/types/category"
import HeroSection from "@/components/home/HeroSection"
import ProductCard from "@/components/shop/ProductCard"
import WhyChooseUs from "@/components/WhyCoseUs"
import { getTranslations, getLocale } from "next-intl/server"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { Product } from "@/types/product"

async function getHomePageCategories() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/homepage-categories`)
    if (response.ok) {
      const data = await response.json()
      return data.success ? data.categories : []
    }
  } catch (error) {
    // Erreur silencieuse - retourner un tableau vide
  }
  return []
}

interface HomeVideoConfig {
  sourceType: "upload" | "youtube"
  youtubeUrl: string
  videoUrl: string
  isActive: boolean
}

async function getHomeVideo(): Promise<HomeVideoConfig | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/home-video`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data && data.data.isActive) {
        return {
          sourceType: data.data.sourceType,
          youtubeUrl: data.data.youtubeUrl || "",
          videoUrl: data.data.videoUrl || "",
          isActive: data.data.isActive
        }
      }
    }
  } catch (error) {
    // Erreur silencieuse - retourner null
  }
  return null
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    if (!url) return null
    const trimmed = url.trim()

    // Formats classiques YouTube
    const regExp =
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_\-]+)/i
    const match = trimmed.match(regExp)
    return match && match[1] ? match[1] : null
  } catch {
    return null
  }
}

const CategoriesSection = async () => {
  const t = await getTranslations("HomePage")
  const locale = (await getLocale()) as "fr" | "ar"

  // Récupérer les catégories depuis la base de données
  const dbCategories = await getHomePageCategories()
  // Fallback si aucune catégorie en DB
  const fallbackCategories: CategoriesHomPageSection[] = [
    {
      id: "1",
      name: {
        fr: "Coffrets de macarons",
        ar: "علب الماكرون"
      },
      image:
        "https://www.tissus-price.com/img/cms/IMG%20BLOG/tissu-burlington-pas-cher.jpg",
      productCount: 120,
      url: "/shop"
    },
    {
      id: "2",
      name: {
        fr: "Macarons individuels",
        ar: "ماكرون فردي"
      },
      image:
        "https://www.lerobert.com/sites/default/files/scald_image/dico-en-ligne-le-robert-de-fil-en-aiguille-marcelle-ratafia.jpg",
      productCount: 75,
      url: "/shop"
    },
    {
      id: "3",
      name: {
        fr: "Macarons personnalisés",
        ar: "ماكرون حسب الطلب"
      },
      image:
        "https://img.leboncoin.fr/api/v1/lbcpb1/images/1b/9a/d2/1b9ad2c9d7b8c8841a1f0e84104f648308aa6d60.jpg?rule=ad-large",
      productCount: 50,
      url: "/shop"
    },
    {
      id: "4",
      name: {
        fr: "Éditions spéciales & saisons",
        ar: "إصدارات موسمية خاصة"
      },
      image:
        "https://www.coutureenfant.fr/wp-content/uploads/2017/05/materiel-de-couture.jpg",
      productCount: 90,
      url: "/shop"
    }
  ]
 
  // Convertir les catégories DB en format attendu ou utiliser fallback
  const categories: CategoriesHomPageSection[] =
    dbCategories.length > 0
      ? dbCategories
          .filter((cat: { isActive?: boolean }) => cat.isActive)
          .sort((a: { order?: number }, b: { order?: number }) => (a.order || 0) - (b.order || 0))
          .map((cat: {
            _id: string
            name: { fr: string; ar: string }
            image: string
            productCount: number
            url?: string
            order?: number
            isActive?: boolean
          }) => ({
            id: cat._id,
            name: cat.name,
            image: cat.image,
            productCount: cat.productCount,
            url: cat.url || "/shop",
            order: cat.order,
            isActive: cat.isActive
          }))
      : fallbackCategories

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {t("CategoriesSection.title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("CategoriesSection.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.url || "/shop"}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden  shadow-md h-64">
                <Image
                  src={category.image}
                  alt={category.name[locale]}
                  fill // Utilisation de `fill`
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-opacity duration-300 flex items-end">
                  <div className="p-6 text-white">
                    <h3 className="text-xl font-semibold mb-1">
                      {category.name[locale]}
                    </h3>
                    <p className="text-sm">
                      {t("CategoriesSection.productCount", {
                        count: category.productCount
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

async function getPromoBanner() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/promo-banner`)
    if (response.ok) {
      const data = await response.json()
      return data.success && data.banner && data.banner.isActive ? data.banner : null
    }
  } catch (error) {
    // Erreur silencieuse - retourner null
  }
  return null
}

async function getFeaturedProducts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/featured-products`)
    if (response.ok) {
      const data = await response.json()
      return data.success && data.products ? data.products : []
    }
  } catch (error) {
    // Erreur silencieuse - retourner un tableau vide
  }
  return []
}

// Composant Produits Populaires
const FeaturedProducts: React.FC = async () => {
  const t = await getTranslations("HomePage")
  
  // Récupérer les produits en vedette depuis la base de données
  const dbProducts = await getFeaturedProducts()

  // Fallback si aucun produit en DB
  const fallbackProducts: Product[] = [
    {
      _id: "1",
      name: {
        ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
        fr: "Bobines de fil multicolores"
      },
      description: {
        ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
        fr: "Un assortiment de belles bobines de fil multicolores, parfaites pour tous vos projets de couture."
      },
      price: 25,
      originalPrice: 30,
      images: [
        "https://static.mapetitemercerie.com/98636-large_default/poincon-pour-pose-rivets-oeillets-boutons-couture-loisirs.jpg"
      ],
      category: {
        _id: "cat1",
        name: { fr: "Accessoires de Couture", ar: "إكسسوارات الخياطة" },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      discount: {
        _id: "disc1",
        name: { fr: "Promotion 10%", ar: "تخفيض 10%" },
        type: "PERCENTAGE",
        value: 10,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      Characteristic: [
        {
          _id: "c1",
          name: {
            _id: "68fcc6f03124d8faea297cb3",
            name: { fr: "color", ar: "أبيض" },
            values: [
              { name: { fr: "Polyester", ar: "بوليستر" } },
              { name: { fr: "Coton", ar: "قطن" } }
            ]
          },
          values: [
            { fr: "Multicolore", ar: "متعدد الألوان" },
            { fr: "Blanc", ar: "أبيض" }
          ]
        },
        {
          _id: "c2",
          name: {
            _id: "68fcc6f03124d8faea297cb3",
            name: { fr: "color", ar: "أبيض" },
            values: [
              { name: { fr: "Polyester", ar: "بوليستر" } },
              { name: { fr: "Coton", ar: "قطن" } }
            ]
          },
          values: [
            { fr: "Polyester", ar: "بوليستر" },
            { fr: "Coton", ar: "قطن" }
          ]
        }
      ],
      inStock: true,
      quantity: 20,
      isNewProduct: false,
      isOnSale: true,
      slug: "bobines-de-fil-multicolores",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: "2",
      name: {
        ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
        fr: "Fournitures de couture"
      },
      description: {
        ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
        fr: "Collection d’outils de couture (fils, boutons, etc.) idéale pour atelier et DIY."
      },
      price: 40,
      images: [
        "https://static.mapetitemercerie.com/241747-large_default/ciseaux-classic-cranteurs-23-cm-droitier-fiskars.jpg"
      ],
      category: {
        _id: "cat1",
        name: { fr: "Accessoires de Couture", ar: "إكسسوارات الخياطة" },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      Characteristic: [
        {
          _id: "c3",
          name: {
            _id: "68fcc6f03124d8faea297cb3",
            name: { fr: "color", ar: "أبيض" },
            values: [
              { name: { fr: "Polyester", ar: "بوليستر" } },
              { name: { fr: "Coton", ar: "قطن" } }
            ]
          },
          values: [{ fr: "Multicolore", ar: "متعدد الألوان" }]
        },
        {
          _id: "c4",
          name: {
            _id: "68fcc6f03124d8faea297cb3",
            name: { fr: "color", ar: "أبيض" },
            values: [
              { name: { fr: "Polyester", ar: "بوليستر" } },
              { name: { fr: "Coton", ar: "قطن" } }
            ]
          },
          values: [{ fr: "Mix", ar: "خليط" }]
        }
      ],
      inStock: true,
      quantity: 50,
      isNewProduct: false,
      isOnSale: false,
      slug: "fournitures-de-couture",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: "3",
      name: {
        ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
        fr: "Fils colorés dans un tiroir"
      },
      description: {
        ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
        fr: "Vue rapprochée de fils à coudre colorés bien rangés dans un tiroir."
      },
      price: 30,
      images: [
        "https://static.mapetitemercerie.com/99298-large_default/kit-de-11-fils-a-coudre-guetermann-accessoires.jpg"
      ],
      category: {
        _id: "cat1",
        name: { fr: "Accessoires de Couture", ar: "إكسسوارات الخياطة" },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      Characteristic: [
        {
          _id: "c5",
          name: {
            _id: "68fcc6f03124d8faea297cb3",
            name: { fr: "color", ar: "أبيض" },
            values: [
              { name: { fr: "Polyester", ar: "بوليستر" } },
              { name: { fr: "Coton", ar: "قطن" } }
            ]
          },
          values: [{ fr: "Multicolore", ar: "متعدد الألوان" }]
        },
        {
          _id: "c6",
          name: {
            _id: "68fcc6f03124d8faea297cb3",
            name: { fr: "color", ar: "أبيض" },
            values: [
              { name: { fr: "Polyester", ar: "بوليستر" } },
              { name: { fr: "Coton", ar: "قطن" } }
            ]
          },
          values: [{ fr: "Coton", ar: "قطن" }]
        }
      ],
      inStock: true,
      quantity: 70,
      isNewProduct: true,
      isOnSale: false,
      slug: "fils-colores-dans-un-tiroir",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: "4",
      name: {
        ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
        fr: "Tissus assortis colorés"
      },
      description: {
        ar: "ؤاعبا نتيبا بنابش نبتلابلاب نمبابب",
        fr: "Collection de tissus 100% coton, idéals pour patchwork, quilting et projets créatifs."
      },
      price: 35,
      images: [
        "https://static.mapetitemercerie.com/48913-large_default/machine-a-coudre-smarter-260c-pfaff.jpg"
      ],
      category: {
        _id: "cat2",
        name: { fr: "Tissus", ar: "أقمشة" },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      Characteristic: [
        {
          _id: "c7",
          name: {
            _id: "68fcc6f03124d8faea297cb3",
            name: { fr: "color", ar: "أبيض" },
            values: [
              { name: { fr: "Polyester", ar: "بوليستر" } },
              { name: { fr: "Coton", ar: "قطن" } }
            ]
          },
          values: [{ fr: "Multicolore", ar: "متعدد الألوان" }]
        },
        {
          _id: "c8",
          name: {
            _id: "68fcc6f03124d8faea297cb3",
            name: { fr: "color", ar: "أبيض" },
            values: [
              { name: { fr: "Polyester", ar: "بوليستر" } },
              { name: { fr: "Coton", ar: "قطن" } }
            ]
          },
          values: [{ fr: "Coton", ar: "قطن" }]
        }
      ],
      inStock: true,
      quantity: 80,
      isNewProduct: false,
      isOnSale: false,
      slug: "tissus-assortis-colores",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  // Utiliser les produits de la DB ou le fallback
  const products: Product[] = dbProducts.length > 0 ? dbProducts : fallbackProducts

  return (
    <section className="py-16 ">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {t("FeaturedProductsSection.title")}
          </h2>
          <p className="text-gray-600">
            {t("FeaturedProductsSection.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard key={index} product={product} viewMode={"grid"} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Composant Bannière Publicitaire
const PromoBannerSection = async () => {
  const banner = await getPromoBanner()

  if (!banner) {
    return null
  }

  // Déterminer quelle image utiliser (fallback si une seule image est disponible)
  const desktopImage = banner.imageDesktop || banner.imageMobile
  const mobileImage = banner.imageMobile || banner.imageDesktop

  // Si aucune image n'est disponible, ne pas afficher la bannière
  if (!desktopImage && !mobileImage) {
    return null
  }

  return (
    <section className="py-8 ">
      <div className="container mx-auto px-4">
        <Link href={banner.link} className="block group">
          <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
            {/* Image Desktop - visible sur md et plus (>= 768px) */}
            {desktopImage && (
              <Image
                src={desktopImage}
                alt="Promotion"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 hidden md:block"
                sizes="(max-width: 768px) 0px, (max-width: 1200px) 90vw, 1200px"
                priority
              />
            )}
            {/* Image Mobile - visible uniquement sur mobile (< 768px) */}
            {mobileImage && (
              <Image
                src={mobileImage}
                alt="Promotion"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 md:hidden"
                sizes="100vw"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>
        </Link>
      </div>
    </section>
  )
}

// Composant Vidéo d'accueil
const HomeVideoSection = async () => {
  const config = await getHomeVideo()

  if (!config || !config.isActive) {
    return null
  }

  // YouTube
  if (config.sourceType === "youtube" && config.youtubeUrl) {
    const videoId = extractYouTubeVideoId(config.youtubeUrl)
    if (!videoId) {
      return null
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`

    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="relative w-full max-w-5xl mx-auto overflow-hidden shadow-2xl aspect-video bg-black">
            <iframe
              src={embedUrl}
              title="Vidéo de présentation"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>
    )
  }

  // Vidéo uploadée sur S3
  if (config.sourceType === "upload" && config.videoUrl) {
    return (
      <section className="py-12 bg-paletteCream">
        <div className="container mx-auto px-4">
          <div className="relative w-full max-w-5xl mx-auto overflow-hidden shadow-2xl aspect-video bg-black">
            <video
              src={config.videoUrl}
              className="w-full h-full"
              controls
              autoPlay
              muted
              playsInline
            />
          </div>
        </div>
      </section>
    )
  }

  return null
}

// Composant Principal
const HomePage: React.FC = async () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <HomeVideoSection />
      <CategoriesSection />
      <PromoBannerSection />
      <FeaturedProducts />
      <WhyChooseUs />
    </div>
  )
}

export default HomePage
