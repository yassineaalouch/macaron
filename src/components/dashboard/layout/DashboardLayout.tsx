"use client"

import React, { useState } from "react"
import { signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  User,
  ChevronLeft,
  Home,
  Package,
  ShoppingCart,
  Settings,
  Percent,
  Boxes,
  Layers,
  LayoutDashboard,
  Palette,
  MessageCircleQuestion
} from "lucide-react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"

// Types
interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  isActive: boolean
  badge?: string
  submenu?: NavigationItem[]
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const currentPath = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Navigation items (exemple)
  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <Home className="w-5 h-5" />,
      href: "/dashboard",
      isActive:
        currentPath.toLowerCase() === "/fr/dashboard" ||
        currentPath.toLowerCase() === "/ar/dashboard"
    },
    {
      id: "orders",
      label: "Commandes",
      icon: <ShoppingCart className="w-5 h-5" />,
      href: "/dashboard/ordersListe",
      isActive: currentPath.includes("/dashboard/orders")
    },
    {
      id: "products",
      label: "Produits",
      icon: <Package className="w-5 h-5" />,
      href: "/dashboard/productList",
      isActive: currentPath.includes("/dashboard/productList")
    },
    {
      id: "packs",
      label: "Packs",
      icon: <Boxes className="w-5 h-5" />,
      href: "/dashboard/packsListe",
      isActive: currentPath.includes("/dashboard/packsListe")
    },
    {
      id: "categories",
      label: "Catégories",
      icon: <Layers className="w-5 h-5" />,
      href: "/dashboard/categoriesListe",
      isActive: currentPath.includes("/dashboard/categoriesListe")
    },
    {
      id: "properties",
      label: "characteristiques",
      icon: <Palette className="w-5 h-5" />,
      href: "/dashboard/characteristics",
      isActive: currentPath.includes("/dashboard/characteristics")
    },
    {
      id: "homepage-content",
      label: "Home Page Content",
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: "/dashboard/homepage-content",
      isActive: currentPath.includes("/dashboard/homepage-content")
    },
    {
      id: "qa",
      label: "Contact Page Content",
      icon: <MessageCircleQuestion className="w-5 h-5" />,
      href: "/dashboard/qa",
      isActive: currentPath.includes("/dashboard/qa")
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: <Percent className="w-5 h-5" />,
      href: "/dashboard/soldesListe",
      isActive: currentPath.includes("/dashboard/soldesListe")
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: <Settings className="w-5 h-5" />,
      href: "/dashboard/settings",
      isActive: currentPath.includes("/dashboard/settings")
    }
  ]

  // Gestion du menu déroulant
  const toggleSubmenu = (menuId: string) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId)
    } else {
      newExpanded.add(menuId)
    }
    setExpandedMenus(newExpanded)
  }

  // Search functionality
  const filteredNavigationItems = navigationItems.filter((item) => {
    if (!searchQuery.trim()) return false
    const query = searchQuery.toLowerCase()
    return (
      item.label.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.href.toLowerCase().includes(query) ||
      (item.submenu &&
        item.submenu.some(
          (subItem) =>
            subItem.label.toLowerCase().includes(query) ||
            subItem.href.toLowerCase().includes(query)
        ))
    )
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowSearchResults(e.target.value.trim().length > 0)
  }

  const handleSearchItemClick = (href: string) => {
    setSearchQuery("")
    setShowSearchResults(false)
    router.push(href)
  }

  // Largeur de la sidebar selon l'état
  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-72"

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${sidebarWidth}
        bg-white shadow-2xl lg:shadow-xl flex flex-col
      `}
      >
        {/* Logo et contrôles - Section fixe */}
        <div
          className={`
          flex items-center h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-firstColor to-firstColor/80 shrink-0
          ${sidebarCollapsed ? "justify-center" : "justify-between"}
        `}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="logo"
                  height={32}
                  width={32}
                  className="object-cover rounded-lg animate-bounce"
                />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Sweet Macaron</h1>
                <p className="text-white/80 text-xs">Admin Panel</p>
              </div>
            </div>
          )}

          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="logo"
                height={32}
                width={32}
                className="w-full h-full object-cover rounded-lg animate-bounce"
              />
            </div>
          )}

          {/* Bouton collapse/expand pour desktop */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Bouton fermeture pour mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>


        {/* Navigation - Section scrollable */}
        <div className="flex-1 overflow-y-auto">
          <nav className={sidebarCollapsed ? "px-2 py-4" : "px-4 py-4"}>
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <div key={item.id}>
                  {/* Item principal */}
                  <div className="group relative">
                    {item.submenu && !sidebarCollapsed ? (
                      <button
                        onClick={() => toggleSubmenu(item.id)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                          ${
                            item.isActive
                              ? "bg-firstColor text-white shadow-lg"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }
                          group-hover:scale-[1.02] group-hover:shadow-md
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className={
                              item.isActive
                                ? "text-white"
                                : "text-gray-400 group-hover:text-firstColor"
                            }
                          >
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                          {item.badge && (
                            <span
                              className={`
                              ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full
                              ${
                                item.isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-firstColor text-white"
                              }
                            `}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {expandedMenus.has(item.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={`
                          flex items-center ${
                            sidebarCollapsed
                              ? "justify-center px-3 py-3"
                              : "px-3 py-2.5"
                          } text-sm font-medium rounded-lg transition-all duration-200 relative
                          ${
                            item.isActive
                              ? "bg-firstColor text-white shadow-lg"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }
                          group-hover:scale-[1.02] group-hover:shadow-md
                        `}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <span
                          className={
                            item.isActive
                              ? "text-white"
                              : "text-gray-400 group-hover:text-firstColor"
                          }
                        >
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <>
                            <span className="ml-3">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`
                                ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full
                                ${
                                  item.isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-firstColor text-white"
                                }
                              `}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Badge pour mode collapsed */}
                        {sidebarCollapsed && item.badge && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-firstColor rounded-full">
                            {item.badge}
                          </span>
                        )}

                        {/* Tooltip pour mode collapsed */}
                        {sidebarCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                            {item.label}
                          </div>
                        )}
                      </Link>
                    )}
                  </div>

                  {/* Sous-menu */}
                  {item.submenu &&
                    expandedMenus.has(item.id) &&
                    !sidebarCollapsed && (
                      <div className="mt-1 ml-6 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.id}
                            href={subItem.href}
                            className={`
                            block px-3 py-2 text-sm rounded-lg transition-colors
                            ${
                              subItem.isActive || currentPath === subItem.href
                                ? "bg-firstColor/10 text-firstColor font-medium"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }
                          `}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* Actions du bas - Section fixe */}
        <div
          className={`p-4 border-t border-gray-200 bg-gray-50 shrink-0 ${
            sidebarCollapsed ? "px-2" : "px-4"
          }`}
        >
          <div className="space-y-2">
            <button
              className={`
                w-full flex items-center text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group relative
                ${sidebarCollapsed ? "justify-center px-3 py-3" : "px-3 py-2"}
              `}
              title={sidebarCollapsed ? "Mon profil" : undefined}
            >
              <User className="w-4 h-4 text-gray-400" />
              {!sidebarCollapsed && <span className="ml-3">Mon profil</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  Mon profil
                </div>
              )}
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={`
                w-full flex items-center text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group relative
                ${sidebarCollapsed ? "justify-center px-3 py-3" : "px-3 py-2"}
              `}
              title={sidebarCollapsed ? "Déconnexion" : undefined}
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span className="ml-3">Déconnexion</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  Déconnexion
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 z-30">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Menu burger et titre */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Dashboard
                </h2>
                <p className="text-sm text-gray-500">
                  Gérez votre boutique Sweet Macaron
                </p>
              </div>
            </div>

            {/* Actions header */}
            <div className="flex items-center space-x-4">
              {/* Recherche */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher dans le menu..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-firstColor focus:border-firstColor transition-colors w-64"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && filteredNavigationItems.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                    {filteredNavigationItems.map((item) => (
                      <div key={item.id}>
                        <button
                          onClick={() => handleSearchItemClick(item.href)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-gray-400">{item.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-500 truncate">{item.href}</p>
                          </div>
                        </button>
                        {/* Submenu items */}
                        {item.submenu &&
                          item.submenu
                            .filter((subItem) =>
                              searchQuery.toLowerCase().includes(subItem.label.toLowerCase()) ||
                              subItem.label.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((subItem) => (
                              <button
                                key={subItem.id}
                                onClick={() => handleSearchItemClick(subItem.href)}
                                className="w-full text-left px-4 py-2 pl-12 hover:bg-gray-50 transition-colors flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex-1">
                                  <p className="text-sm text-gray-700">{subItem.label}</p>
                                  <p className="text-xs text-gray-500 truncate">{subItem.href}</p>
                                </div>
                              </button>
                            ))}
                      </div>
                    ))}
                  </div>
                )}
                
                {showSearchResults && filteredNavigationItems.length === 0 && searchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                    <p className="text-sm text-gray-500 text-center">Aucun résultat trouvé</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
