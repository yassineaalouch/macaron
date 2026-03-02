"use client"
import {
  Mail,
  Phone,
  ShoppingCart,
  Menu,
  X,
  Home,
  Store,
  Scissors,
  Package,
  MessageCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import SideCart from "./SideCart"
import { FREE_SHIPPING_THRESHOLD } from "@/data/data"
import Image from "next/image"
import LanguageToggle from "./LanguageToggle"
import { useCartContext } from "@/app/context/CartContext"
import { useToast } from "@/components/ui/Toast"
import { motion, AnimatePresence } from "framer-motion"

interface NavCategory {
  id: string
  name: {
    fr: string
    ar: string
  }
  parentId?: string | null
  isActive?: boolean
  order?: number
  children?: NavCategory[]
}

interface SiteInfo {
  email: string
  phone: string
  location: {
    fr: string
    ar: string
  }
}

/** Affiche une catégorie et récursivement toutes ses sous-catégories (tous niveaux). */
function CategoryTreeItem({
  category,
  locale,
  depth
}: {
  category: NavCategory
  locale: "fr" | "ar"
  depth: number
}) {
  const hasChildren = category.children && category.children.length > 0
  const paddingLeft = depth > 0 ? `${depth * 12}px` : undefined

  return (
    <div style={paddingLeft ? { paddingLeft } : undefined} className="space-y-1">
      <Link
        href={`/shop?category=${encodeURIComponent(category.name[locale])}`}
        className="block text-xs text-gray-500 hover:text-firstColor transition-colors leading-relaxed"
      >
        {category.name[locale]}
      </Link>
      {hasChildren && (
        <ul className="space-y-1 mt-1 border-l border-gray-100 pl-3 ml-1">
          {category.children!.map((child) => (
            <li key={child.id}>
              <CategoryTreeItem
                category={child}
                locale={locale}
                depth={depth + 1}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const Header: React.FC = () => {
  const t = useTranslations("Header")
  const locale = useLocale()
  const { cartItems, updateQuantity, removeItem } = useCartContext()
  const { showToast } = useToast()
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)
  const [hasPacks, setHasPacks] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [navCategories, setNavCategories] = useState<NavCategory[]>([])

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    fetchSiteInfo()
    checkPacks()
    fetchNavCategories()
  }, [])

  const fetchSiteInfo = async () => {
    try {
      const response = await fetch("/api/site-info")
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des informations")
      }
      const data = await response.json()
      if (data.success) {
        setSiteInfo(data.siteInfo)
      } else {
        showToast(data.message || "Erreur lors du chargement des informations", "error")
      }
    } catch (error) {
      showToast("Erreur lors du chargement des informations du site", "error")
    }
  }

  const checkPacks = async () => {
    try {
      const response = await fetch("/api/product-packs")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.length > 0) {
          setHasPacks(true)
        } else {
          setHasPacks(false)
        }
      } else {
        setHasPacks(false)
      }
    } catch (error) {
      // Erreur silencieuse - par défaut, on cache les packs
      setHasPacks(false)
    }
  }

  const fetchNavCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (!response.ok) return

      const data = await response.json()

      if (data.success && Array.isArray(data.categories)) {
        const all = data.categories as Array<{
          _id: string
          name: { fr: string; ar: string }
          parentId?: string
          isActive: boolean
          order?: number
          slug?: { fr: string; ar: string }
        }>

        // Construire l'arbre hiérarchique des catégories
        const buildTree = (parentId?: string | null, level: number = 0): NavCategory[] => {
          return all
            .filter((cat) => (parentId ? cat.parentId === parentId : !cat.parentId))
            .filter((cat) => cat.isActive)
            .sort(
              (a, b) => (a.order || 0) - (b.order || 0)
            )
            .map((cat) => ({
              id: cat._id,
              name: cat.name,
              parentId: cat.parentId,
              isActive: cat.isActive,
              order: cat.order,
              children: buildTree(cat._id, level + 1)
            }))
        }

        const roots = buildTree(null)
        setNavCategories(roots)
      }
    } catch {
      // Erreur silencieuse - on ne bloque pas le header
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen)
  }

  // Calcul du nombre total d'articles
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const menuItems = [
    { href: "/", label: t("navigation.home"), icon: Home },
    {
      href: "/shop",
      label: t("navigation.shop"),
      icon: Store
    },
    ...(hasPacks
      ? [
          {
            href: "/packs",
            label: t("navigation.packages"),
            icon: Package
          }
        ]
      : []),
    {
      href: "/contact",
      label: t("navigation.contact"),
      icon: MessageCircle
    }
  ]
  return (
    <>
      {/* Header fixe compact */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50">
        {/* Top Bar - Plus compact */}
        <div className="bg-firstColor text-[#413e3b] py-1 hidden sm:block">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Phone size={12} className="mr-1" />
                  <span>{siteInfo?.phone || t("contact.phone")}</span>
                </div>
                <div className="flex items-center">
                  <Mail size={12} className="mr-1" />
                  <span>{siteInfo?.email || t("contact.email")}</span>
                </div>
              </div>
              <div>
                <span>
                  {t("freeShipping", { threshold: FREE_SHIPPING_THRESHOLD })}
                </span>
              </div>{" "}
            </div>
          </div>
        </div>

        {/* Main Header - Plus compact */}
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo compact */}
            <div className="flex items-center">
              <div className="text-white rounded-lg mr-2 p-1">
                <Image
                  src="/logo.png"
                  alt="logo"
                  height={60}
                  width={60}
                  className="object-cover rounded-lg animate-bounce"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold font-lux text-gray-800">
                    <span className="text-secondColor">SWEET</span> MACARONS
                </h1>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              {/* Language Selector */}
              <div className="relative hidden sm:block">
                <LanguageToggle />
              </div>

              {/* Shopping Cart */}
              <button
                onClick={toggleCart}
                className="flex items-center text-[#413e3b] hover:text-black relative transition-colors duration-200"
                aria-label={t("cart")}
              >
                <ShoppingCart size={20} />
                <span className="hidden sm:inline ml-1">{t("cart")}</span>
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#a1b16a] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMenu}
                className="lg:hidden p-2 text-[#413e3b] hover:text-black relative z-60 transition-all duration-300"
                aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                <div
                  className={`transform transition-all duration-300 ${
                    isMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Desktop - Plus compact */}
        <div className="bg-firstColor text-[#413e3b] py-2 hidden lg:block">
          <div className="container mx-auto px-4">
            <ul className="flex justify-center items-center space-x-8">
              <li>
                <Link
                  href="/"
                  className="hover:text-black transition-colors duration-200 font-medium text-base"
                >
                  {t("navigation.home")}
                </Link>
              </li>
              {/* Shop avec mega-menu catégories au survol */}
              <li className="relative group">
                <Link
                  href="/shop"
                  className="hover:text-black transition-colors duration-200 font-medium text-base"
                >
                  {t("navigation.shop")}
                </Link>

                {navCategories.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-white/95 backdrop-blur-xl text-gray-900 rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.45)] border border-gray-100 px-8 py-6 min-w-[640px]">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-[11px] tracking-[0.35em] uppercase text-gray-400">
                            {t("navigation.shop")}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {navCategories.length}{" "}
                          {locale === "fr" ? "catégories" : "أصناف"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
                        {navCategories.map((category) => {
                          const isExpanded = expandedCategoryId === category.id
                          const hasChildren = category.children && category.children.length > 0
                          return (
                            <div key={category.id} className="space-y-2">
                              {/* Catégorie principale : clic pour afficher les sous-catégories */}
                              <div className="flex items-center gap-1 pb-1 border-b border-gray-100/80">
                                {hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedCategoryId((id) =>
                                        id === category.id ? null : category.id
                                      )
                                    }
                                    className="flex items-center gap-1 w-full text-left text-sm font-semibold tracking-wide text-gray-900 hover:text-firstColor transition-colors"
                                  >
                                    <span>{category.name[locale as "fr" | "ar"]}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 shrink-0" />
                                    )}
                                  </button>
                                ) : (
                                  <Link
                                    href={`/shop?category=${encodeURIComponent(
                                      category.name[locale as "fr" | "ar"]
                                    )}`}
                                    className="text-sm font-semibold tracking-wide text-gray-900 hover:text-firstColor transition-colors"
                                  >
                                    {category.name[locale as "fr" | "ar"]}
                                  </Link>
                                )}
                              </div>

                              {/* Sous-catégories (tous niveaux) : affichées au clic sur le parent */}
                              {hasChildren && isExpanded && (
                                <ul className="space-y-1.5 pt-1">
                                  <li>
                                    <Link
                                      href={`/shop?category=${encodeURIComponent(
                                        category.name[locale as "fr" | "ar"]
                                      )}`}
                                      className="block text-xs text-firstColor hover:underline font-medium"
                                    >
                                      {locale === "fr" ? "Voir tout" : "عرض الكل"}
                                    </Link>
                                  </li>
                                  {category.children!.map((child) => (
                                    <li key={child.id} className="pl-0">
                                      <CategoryTreeItem
                                        category={child}
                                        locale={locale as "fr" | "ar"}
                                        depth={0}
                                      />
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </li>
              {hasPacks && (
                <li>
                  <Link
                    href="/packs"
className="hover:text-black transition-colors duration-200 font-medium text-base"
                    >
                      {t("navigation.packages")}
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/contact"
                  className="hover:text-black transition-colors duration-200 font-medium text-base"
                >
                  {t("navigation.contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sidebar Mobile - Design moderne et compact */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay avec animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
              onClick={toggleMenu}
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 h-full w-[90%] sm:w-[85%] max-w-sm bg-gradient-to-b from-white via-gray-50 to-white shadow-2xl z-[50] overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header du Sidebar */}
                <div className="relative text-[#413e3b] p-4 shadow-lg">
                  <div className="absolute inset-0 "></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Image
                          src="/logo.png"
                          alt="logo"
                          height={28}
                          width={28}
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold"><span className="text-secondColor">SWEET</span> MACARON</h2>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                  <ul className="space-y-2">
                    {menuItems.map((item, index) => (
                      <motion.li
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-firstColor hover:text-black transition-all duration-200 group"
                        >
                          <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                            <item.icon size={20} className="text-[#bbc49c] group-hover:text-[#a1b16a] transition-colors" />
                          </div>
                          <span className="font-medium text-base">{item.label}</span>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </nav>

                {/* Section Contact & Info */}
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
                  {/* Informations de contact */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-[#413e3b] uppercase tracking-wider px-2">
                      {t("sidebar.contact")}
                    </h3>
                    <motion.a
                      href={`tel:${siteInfo?.phone || ""}`}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 px-3 py-2 bg-white rounded-lg hover:bg-firstColor hover:text-white transition-all duration-200 group"
                    >
                      <div className="p-1.5 bg-gray-100 group-hover:bg-white rounded-lg">
                        <Phone size={16} className="text-[#bbc49c] group-hover:text-[#a1b16a] transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-[#413e3b] group-hover:text-black transition-colors">
                        {siteInfo?.phone || t("contact.phone")}
                      </span>
                    </motion.a>
                    <motion.a
                      href={`mailto:${siteInfo?.email || ""}`}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 px-3 py-2 bg-white rounded-lg hover:bg-firstColor hover:text-white transition-all duration-200 group"
                    >
                      <div className="p-1.5 bg-gray-100 group-hover:bg-white rounded-lg">
                        <Mail size={16} className="text-[#bbc49c] group-hover:text-[#a1b16a] transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-[#413e3b] group-hover:text-black transition-colors truncate">
                        {siteInfo?.email || t("contact.email")}
                      </span>
                    </motion.a>
                  </div>

                  {/* Language Toggle */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="px-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t("sidebar.language")}
                      </span>
                    </div>
                    <div className="px-1">
                      <LanguageToggle />
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer plus petit pour compenser le header fixe */}
      <div className="h-20 sm:h-24"></div>

      {/* Side Cart */}
      <SideCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
      />
    </>
  )
}

export default Header
