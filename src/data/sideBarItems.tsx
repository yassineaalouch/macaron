import { NavigationItem } from "@/types/type"
import {
  Home,
  Package,
  Percent,
  ShoppingCart,
  BarChart3,
  Settings
} from "lucide-react"

export const getNavigationItems = (currentPath: string): NavigationItem[] => [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <Home className="w-5 h-5" />,
    href: "/dashboard",
    isActive: currentPath.toLowerCase() === "/dashboard"
  },
  {
    id: "products",
    label: "Produits",
    icon: <Package className="w-5 h-5" />,
    href: "/dashboard/productList",
    isActive: currentPath.startsWith("/dashboard/products")
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: <Percent className="w-5 h-5" />,
    href: "/dashboard/marketing",
    isActive: currentPath.startsWith("/dashboard/marketing")
  },
  {
    id: "orders",
    label: "Commandes",
    icon: <ShoppingCart className="w-5 h-5" />,
    href: "/dashboard/orders",
    isActive: currentPath.startsWith("/dashboard/orders")
  },
  {
    id: "analytics",
    label: "Statistiques",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/dashboard/analytics",
    isActive: currentPath.startsWith("/dashboard/analytics")
  },
  {
    id: "settings",
    label: "Paramètres",
    icon: <Settings className="w-5 h-5" />,
    href: "/dashboard/settings",
    isActive: currentPath.startsWith("/settings")
  }
]
