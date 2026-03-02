"use client"

import React, { useEffect, useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Loader2,
  AlertCircle,
  Calendar,
  Filter,
  X,
  Search,
  Check
} from "lucide-react"
import { useToast } from "@/components/ui/Toast"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Statistics, SelectableItem } from "@/types/dashboard"

// Dynamically import charts to avoid SSR issues
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
)
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), {
  ssr: false
})
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), {
  ssr: false
})
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), {
  ssr: false
})
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
)
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false
})
const Legend = dynamic(
  () => import("recharts").then((mod) => mod.Legend as React.ComponentType<Record<string, unknown>>),
  { ssr: false }
)
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
)

const DashboardPage: React.FC = () => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<Statistics | null>(null)

  // First Graph - Overall Sales Filters (completely independent)
  const [salesDateFrom, setSalesDateFrom] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [salesDateTo, setSalesDateTo] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [salesTimeUnit, setSalesTimeUnit] = useState<"hour" | "day" | "month" | "year">("day")

  // Second Graph - Product Comparison Filters (completely independent)
  const [compareDateFrom, setCompareDateFrom] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [compareDateTo, setCompareDateTo] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [itemSearchQuery, setItemSearchQuery] = useState("")

  useEffect(() => {
    fetchStatistics()
  }, [salesDateFrom, salesDateTo, salesTimeUnit, compareDateFrom, compareDateTo, selectedItems])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // First graph parameters
      if (salesDateFrom) params.set("salesDateFrom", salesDateFrom)
      if (salesDateTo) params.set("salesDateTo", salesDateTo)
      params.set("salesTimeUnit", salesTimeUnit)
      
      // Second graph parameters
      if (compareDateFrom) params.set("compareDateFrom", compareDateFrom)
      if (compareDateTo) params.set("compareDateTo", compareDateTo)
      if (selectedItems.length > 0) {
        params.set("productIds", selectedItems.join(","))
      }

      const response = await fetch(`/api/statistics?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setStatistics(data.statistics)
      } else {
        showToast(
          data.message || "Erreur lors du chargement des statistiques",
          "error"
        )
      }
    } catch (error) {
      showToast("Erreur lors du chargement des statistiques", "error")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-FR").format(num)
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : ""
    return `${sign}${change.toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      rejected: "bg-red-100 text-red-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  // Get all selectable items (products + packs)
  const getAllSelectableItems = (): SelectableItem[] => {
    if (!statistics) return []
    const products = (statistics.products.list || []).map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      type: "product" as const
    }))
    const packs = (statistics.packs.list || []).map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      type: "pack" as const
    }))
    return [...products, ...packs]
  }

  const filteredItems = getAllSelectableItems().filter((item) =>
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  )

  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId))
    } else {
      if (selectedItems.length >= 5) {
        showToast("Vous ne pouvez sélectionner que 5 éléments maximum", "warning")
        return
      }
      setSelectedItems((prev) => [...prev, itemId])
    }
  }

  const getSelectedItemsNames = () => {
    const allItems = getAllSelectableItems()
    return selectedItems
      .map((id) => allItems.find((item) => item.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  const formatDateLabel = (date: string, unit: string) => {
    const d = new Date(date)
    if (unit === "hour") {
      return d.toLocaleString("fr-FR", { month: "short", day: "numeric", hour: "2-digit" })
    } else if (unit === "day") {
      return d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
    } else if (unit === "month") {
      return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
    } else {
      return d.getFullYear().toString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-firstColor" />
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600">Impossible de charger les statistiques</p>
      </div>
    )
  }

  const stats = [
    {
      title: "Revenus Total",
      value: formatCurrency(statistics.revenue.total),
      change: formatChange(statistics.revenue.change),
      trend: statistics.revenue.trend,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      subtitle: `Ce mois: ${formatCurrency(statistics.revenue.thisMonth)}`
    },
    {
      title: "Commandes",
      value: formatNumber(statistics.orders.total),
      change: formatChange(statistics.orders.change),
      trend: statistics.orders.trend,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      subtitle: `${statistics.orders.pending} en attente`
    },
    {
      title: "Clients",
      value: formatNumber(statistics.customers.total),
      change: "",
      trend: "up" as const,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      subtitle: `${statistics.orders.today} commandes aujourd'hui`
    },
    {
      title: "Produits",
      value: formatNumber(statistics.products.total),
      change: "",
      trend: "up" as const,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      subtitle: `${statistics.products.inStock} en stock`
    }
  ]

  // Prepare product comparison chart data
  const productComparisonChartData = statistics.productComparison || []
  const selectedItemNames: { [key: string]: string } = {}
  selectedItems.forEach((id) => {
    const item = getAllSelectableItems().find((i) => i.id === id)
    if (item) {
      selectedItemNames[id] = item.name
    }
  })

  const colors = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"]

  return (
    <div className="space-y-8">
      {/* Titre de la page */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue sur Sweet Macarons
        </h1>
        <p className="text-gray-600">
          Voici un aperçu de votre boutique aujourd&apos;hui
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
                {stat.change && (
                <div className="flex items-center mt-2">
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                    )}
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                )}
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GRAPH 1: Overall Sales - Completely Independent */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Graphique des Ventes Globales
          </h2>
          
          {/* Filters for Graph 1 */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Période:</span>
            </div>
            <input
              type="date"
              value={salesDateFrom}
              onChange={(e) => setSalesDateFrom(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <span className="text-gray-500 font-medium">à</span>
            <input
              type="date"
              value={salesDateTo}
              onChange={(e) => setSalesDateTo(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-gray-700">Unité X:</span>
              <select
                value={salesTimeUnit}
                onChange={(e) => setSalesTimeUnit(e.target.value as "hour" | "day" | "month" | "year")}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-white font-medium"
              >
                <option value="hour">Heure</option>
                <option value="day">Jour</option>
                <option value="month">Mois</option>
                <option value="year">Année</option>
              </select>
            </div>
          </div>
        </div>

        {statistics.salesOverTime && statistics.salesOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={statistics.salesOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => formatDateLabel(value, salesTimeUnit)}
                angle={salesTimeUnit === "hour" ? -45 : 0}
                textAnchor={salesTimeUnit === "hour" ? "end" : "middle"}
                height={salesTimeUnit === "hour" ? 80 : 60}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value: unknown, name: unknown) => [
                  String(name) === "revenue"
                    ? formatCurrency(Number(value))
                    : formatNumber(Number(value)),
                  String(name) === "revenue" ? "Revenus" : "Commandes"
                ]}
                labelFormatter={(label) => formatDateLabel(label, salesTimeUnit)}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px"
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={3}
                name="Revenus (MAD)"
                dot={{ r: 5, fill: "#f97316" }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Commandes"
                dot={{ r: 5, fill: "#3b82f6" }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-gray-500 bg-gray-50 rounded-xl">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Aucune donnée pour cette période</p>
              <p className="text-sm mt-2">Veuillez sélectionner une autre période</p>
            </div>
          </div>
        )}
      </div>

      {/* GRAPH 2: Product Comparison - Completely Independent */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Comparaison des Produits et Packs
          </h2>
          
          {/* Filters for Graph 2 */}
          <div className="space-y-4">
            {/* Time Filter */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Période:</span>
              </div>
              <input
                type="date"
                value={compareDateFrom}
                onChange={(e) => setCompareDateFrom(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <span className="text-gray-500 font-medium">à</span>
              <input
                type="date"
                value={compareDateTo}
                onChange={(e) => setCompareDateTo(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Product/Pack Selection */}
            <div className="relative">
              <button
                onClick={() => setShowItemDropdown(!showItemDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-left hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedItems.length > 0
                      ? `${selectedItems.length} élément(s) sélectionné(s)`
                      : "Sélectionner des produits/packs (max 5)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedItems.length > 0 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedItems([])
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedItems([])
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-gray-400">
                    {showItemDropdown ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Dropdown with Search */}
              {showItemDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-96 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un produit ou pack..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="max-h-80 overflow-y-auto">
                    {filteredItems.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Aucun résultat trouvé
                      </div>
                    ) : (
                      filteredItems.map((item) => {
                        const isSelected = selectedItems.includes(item.id)
                        const isDisabled = !isSelected && selectedItems.length >= 5
                        return (
                          <button
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!isDisabled) {
                                toggleItem(item.id)
                              }
                            }}
                            disabled={isDisabled}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-purple-50 transition-colors ${
                              isSelected ? "bg-purple-100" : ""
                            } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                              <Image
                                src={item.image || "/No_Image_Available.jpg"}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] px-1 rounded-bl">
                                {item.type === "pack" ? "PACK" : "PROD"}
                              </div>
                            </div>
                            <span className="flex-1 text-left text-sm font-medium text-gray-700 truncate">
                              {item.name}
                            </span>
                            {isSelected && (
                              <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                            )}
                            {isDisabled && !isSelected && (
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                (max 5)
                              </span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Selected Items Preview */}
              {selectedItems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedItems.map((id) => {
                    const item = getAllSelectableItems().find((i) => i.id === id)
                    if (!item) return null
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium"
                      >
                        <span className="truncate max-w-[150px]">{item.name}</span>
                        <button
                          onClick={() => toggleItem(id)}
                          className="hover:bg-purple-200 rounded p-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {productComparisonChartData.length > 0 && selectedItems.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={productComparisonChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("fr-FR", {
                    month: "short",
                    day: "numeric"
                  })
                }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => formatNumber(Number(value))}
                label={{ value: "Unités vendues", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#6b7280" } }}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  `${formatNumber(Number(value))} unités`,
                  selectedItemNames[String(name)] || String(name)
                ]}
                labelFormatter={(label) => {
                  const date = new Date(label)
                  return date.toLocaleDateString("fr-FR")
                }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px"
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
                formatter={(value: unknown) => selectedItemNames[String(value)] || String(value)}
              />
              {selectedItems.map((itemId, index) => (
                <Line
                  key={itemId}
                  type="monotone"
                  dataKey={itemId}
                  stroke={colors[index % colors.length]}
                  strokeWidth={3}
                  name={itemId}
                  dot={{ r: 5 }}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-gray-500 bg-gray-50 rounded-xl">
            <div className="text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">
                {selectedItems.length === 0
                  ? "Sélectionnez des produits ou packs pour comparer"
                  : "Aucune donnée pour les éléments sélectionnés dans cette période"}
              </p>
              <p className="text-sm mt-2">
                {selectedItems.length === 0
                  ? "Utilisez le filtre ci-dessus pour choisir jusqu'à 5 éléments"
                  : "Essayez une autre période ou sélectionnez d'autres éléments"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Commandes Récentes
            </h3>
            <div className="space-y-4">
              {statistics.recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucune commande récente
                </p>
              ) : (
                statistics.recentOrders.map((order) => (
                <div
                    key={order._id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-firstColor/10 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-firstColor" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                          {order.orderNumber || `CMD-${order._id.slice(-6)}`}
                      </p>
                        <p className="text-sm text-gray-500">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                    </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status === "pending"
                          ? "En attente"
                          : order.status === "confirmed"
                            ? "Confirmée"
                            : order.status === "processing"
                              ? "En traitement"
                              : order.status === "shipped"
                                ? "Expédiée"
                                : order.status === "delivered"
                                  ? "Livrée"
                                  : order.status === "rejected"
                                    ? "Rejetée"
                                    : order.status === "cancelled"
                                      ? "Annulée"
                                      : order.status}
                    </span>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Produits Populaires
            </h3>
            <div className="space-y-4">
              {statistics.topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucun produit vendu
                </p>
              ) : (
                statistics.topProducts.map((product, index) => (
                  <div key={product._id} className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute -top-1 -left-1 bg-firstColor text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                        {product.name}
                    </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {formatNumber(product.totalQuantity)} vendus
                        </span>
                        <span className="text-sm font-semibold text-firstColor">
                          {formatCurrency(product.totalRevenue)}
                      </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
