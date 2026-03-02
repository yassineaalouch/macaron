import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Order from "@/models/Order"
import Product from "@/models/Product"
import ProductPack from "@/models/ProductPack"
import Discount from "@/models/Discount"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams

    // Parameters for first graph (overall sales)
    const salesDateFrom = searchParams.get("salesDateFrom")
    const salesDateTo = searchParams.get("salesDateTo")
    const salesTimeUnit = searchParams.get("salesTimeUnit") || "day" // hour, day, month, year

    // Parameters for second graph (product comparison)
    const compareDateFrom = searchParams.get("compareDateFrom")
    const compareDateTo = searchParams.get("compareDateTo")
    const productIds =
      searchParams.get("productIds")?.split(",").filter(Boolean) || []

    // Get date ranges for overall sales graph
    let salesDateFromFilter: Date | null = null
    let salesDateToFilter: Date | null = null

    if (salesDateFrom) {
      salesDateFromFilter = new Date(salesDateFrom)
      salesDateFromFilter.setHours(0, 0, 0, 0)
    }
    if (salesDateTo) {
      salesDateToFilter = new Date(salesDateTo)
      salesDateToFilter.setHours(23, 59, 59, 999)
    }

    // Get date ranges for product comparison graph
    let compareDateFromFilter: Date | null = null
    let compareDateToFilter: Date | null = null

    if (compareDateFrom) {
      compareDateFromFilter = new Date(compareDateFrom)
      compareDateFromFilter.setHours(0, 0, 0, 0)
    }
    if (compareDateTo) {
      compareDateToFilter = new Date(compareDateTo)
      compareDateToFilter.setHours(23, 59, 59, 999)
    }

    const nowForToday = new Date()
    const todayStart = new Date(nowForToday)
    todayStart.setHours(0, 0, 0, 0)

    const thisMonthStart = new Date(
      nowForToday.getFullYear(),
      nowForToday.getMonth(),
      1
    )
    const lastMonthStart = new Date(
      nowForToday.getFullYear(),
      nowForToday.getMonth() - 1,
      1
    )
    const lastMonthEnd = new Date(
      nowForToday.getFullYear(),
      nowForToday.getMonth(),
      0
    )

    // Total Revenue (all time)
    const totalRevenueResult = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ])
    const totalRevenue = totalRevenueResult[0]?.total || 0

    // This Month Revenue
    const thisMonthRevenueResult = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: { $gte: thisMonthStart }
        }
      },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ])
    const thisMonthRevenue = thisMonthRevenueResult[0]?.total || 0

    // Last Month Revenue (for comparison)
    const lastMonthRevenueResult = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
        }
      },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ])
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0

    // Calculate revenue change percentage
    const revenueChange =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : thisMonthRevenue > 0
        ? 100
        : 0

    // Total Orders
    const totalOrders = await Order.countDocuments({
      status: { $ne: "cancelled" }
    })

    // This Month Orders
    const thisMonthOrders = await Order.countDocuments({
      status: { $ne: "cancelled" },
      createdAt: { $gte: thisMonthStart }
    })

    // Last Month Orders
    const lastMonthOrders = await Order.countDocuments({
      status: { $ne: "cancelled" },
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    })

    // Calculate orders change percentage
    const ordersChange =
      lastMonthOrders > 0
        ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
        : thisMonthOrders > 0
        ? 100
        : 0

    // Unique Customers (distinct customer names)
    const uniqueCustomers = await Order.distinct("customerName")
    const totalCustomers = uniqueCustomers.length

    // Today's Orders
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: todayStart }
    })

    // Pending Orders
    const pendingOrders = await Order.countDocuments({ status: "pending" })

    // Total Products
    const totalProducts = await Product.countDocuments()

    // Total Packs
    const totalPacks = await ProductPack.countDocuments()

    // Products in Stock
    const productsInStock = await Product.countDocuments({
      inStock: true,
      quantity: { $gt: 0 }
    })

    // Out of Stock Products
    const outOfStockProducts = await Product.countDocuments({
      $or: [{ inStock: false }, { quantity: 0 }]
    })

    // Active Discounts
    const activeDiscounts = await Discount.countDocuments({
      isActive: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: new Date() } }
      ]
    })

    // Recent Orders (last 10)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("orderNumber customerName total status createdAt paymentMethod")
      .lean()

    // Build match filter for overall sales graph
    const salesOrdersMatchFilter: {
      status: { $ne: string }
      createdAt?: { $gte?: Date; $lte?: Date }
    } = {
      status: { $ne: "cancelled" }
    }
    if (salesDateFromFilter || salesDateToFilter) {
      salesOrdersMatchFilter.createdAt = {}
      if (salesDateFromFilter) {
        salesOrdersMatchFilter.createdAt.$gte = salesDateFromFilter
      }
      if (salesDateToFilter) {
        salesOrdersMatchFilter.createdAt.$lte = salesDateToFilter
      }
    }

    // Sales over time (grouped by time unit)
    let salesOverTime: Array<{
      date: string
      revenue: number
      orders: number
    }> = []

    // Use date filters if provided, otherwise use defaults
    const effectiveSalesFrom =
      salesDateFromFilter || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const effectiveSalesTo = salesDateToFilter || new Date()

    if (effectiveSalesFrom && effectiveSalesTo) {
      // Determine date format based on time unit
      let dateFormat = "%Y-%m-%d" // default: day
      if (salesTimeUnit === "hour") {
        dateFormat = "%Y-%m-%d %H:00"
      } else if (salesTimeUnit === "month") {
        dateFormat = "%Y-%m"
      } else if (salesTimeUnit === "year") {
        dateFormat = "%Y"
      }

      // Build proper filter with effective dates
      const effectiveSalesFilter: {
        status: { $ne: string }
        createdAt: { $gte: Date; $lte: Date }
      } = {
        status: { $ne: "cancelled" },
        createdAt: {
          $gte: effectiveSalesFrom,
          $lte: effectiveSalesTo
        }
      }

      const salesByUnit = await Order.aggregate([
        { $match: effectiveSalesFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormat, date: "$createdAt" }
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
      salesOverTime = salesByUnit.map((item) => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders
      }))
    }

    // Product sales comparison (with time series data over selected period)
    let productComparison: Array<{
      date: string
      [key: string]: string | number // Dynamic product keys
    }> = []

    // Build match filter for product comparison
    const compareOrdersMatchFilter: {
      status: { $ne: string }
      createdAt?: { $gte?: Date; $lte?: Date }
    } = {
      status: { $ne: "cancelled" }
    }
    if (compareDateFromFilter || compareDateToFilter) {
      compareOrdersMatchFilter.createdAt = {}
      if (compareDateFromFilter) {
        compareOrdersMatchFilter.createdAt.$gte = compareDateFromFilter
      }
      if (compareDateToFilter) {
        compareOrdersMatchFilter.createdAt.$lte = compareDateToFilter
      }
    }

    // Use date filters if provided, otherwise use defaults
    const effectiveCompareFrom =
      compareDateFromFilter || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const effectiveCompareTo = compareDateToFilter || new Date()

    if (productIds.length > 0) {
      // Build proper filter with effective dates
      const effectiveCompareFilter: {
        status: { $ne: string }
        createdAt: { $gte: Date; $lte: Date }
      } = {
        status: { $ne: "cancelled" },
        createdAt: {
          $gte: effectiveCompareFrom,
          $lte: effectiveCompareTo
        }
      }

      // Get all orders in the date range with selected products/packs
      const orders = await Order.find(effectiveCompareFilter)
        .select("items createdAt")
        .lean()

      // Group by date and calculate QUANTITY (units) per product (not revenue)
      const quantitiesByDate: {
        [key: string]: { [productId: string]: number }
      } = {}

        orders.forEach((order:any) => {
        const dateKey = new Date(order.createdAt).toISOString().split("T")[0]
        if (!quantitiesByDate[dateKey]) {
          quantitiesByDate[dateKey] = {}
        }

        order.items.forEach((item:any) => {
          if (productIds.includes(item.id)) {
            if (!quantitiesByDate[dateKey][item.id]) {
              quantitiesByDate[dateKey][item.id] = 0
            }
            // Count quantity (units sold) instead of revenue
            quantitiesByDate[dateKey][item.id] += item.quantity || 0
          }
        })
      })

      // Convert to array format
      const dates = Object.keys(quantitiesByDate).sort()
      productComparison = dates.map((date) => {
        const result: { date: string; [key: string]: string | number } = { date }
        productIds.forEach((productId) => {
          result[productId] = quantitiesByDate[date][productId] || 0
        })
        return result
      })
    }

    // Top Products by sales (from order items) - for display cards
    const topProductsResult = await Order.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.type": "product",
          status: { $ne: "cancelled" }
        }
      },
      {
        $group: {
          _id: "$items.id",
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] }
          }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ])

    // Get all products and packs for filter selection
    const allProducts = await Product.find()
      .select("_id name images")
      .limit(200)
      .lean()

    const allPacks = await ProductPack.find()
      .select("_id name images")
      .limit(200)
      .lean()

    return NextResponse.json(
      {
        success: true,
        statistics: {
          revenue: {
            total: totalRevenue,
            thisMonth: thisMonthRevenue,
            change: revenueChange,
            trend: revenueChange >= 0 ? "up" : "down"
          },
          orders: {
            total: totalOrders,
            thisMonth: thisMonthOrders,
            today: todayOrders,
            pending: pendingOrders,
            change: ordersChange,
            trend: ordersChange >= 0 ? "up" : "down"
          },
          customers: {
            total: totalCustomers
          },
          products: {
            total: totalProducts,
            inStock: productsInStock,
            outOfStock: outOfStockProducts,
            list: allProducts.map((p:any) => ({
              id: p._id.toString(),
              name: p.name?.fr || p.name?.ar || "Produit",
              image: p.images?.[0] || "/No_Image_Available.jpg",
              type: "product"
            }))
          },
          packs: {
            total: totalPacks,
            list: allPacks.map((p: {
              _id: { toString(): string }
              name?: { fr?: string; ar?: string }
              images?: string[]
            }) => ({
              id: p._id.toString(),
              name: p.name?.fr || p.name?.ar || "Pack",
              image: p.images?.[0] || "/No_Image_Available.jpg",
              type: "pack"
            }))
          },
          discounts: {
            active: activeDiscounts
          },
          recentOrders,
          topProducts: topProductsResult,
          salesOverTime,
          productComparison
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des statistiques:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la récupération des statistiques",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}
