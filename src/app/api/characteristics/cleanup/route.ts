import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Characteristic from "@/models/Characteristic"
import Product from "@/models/Product"
import mongoose from "mongoose"

/**
 * POST - Nettoie les références orphelines : retire du tableau Characteristic
 * de chaque produit les entrées qui pointent vers une caractéristique supprimée
 * (ou name null).
 */
export async function POST() {
  await connectToDatabase()

  const existingIds = new Set<string>(
    (await Characteristic.find({}).select("_id").lean()).map((c) =>
      (c._id as mongoose.Types.ObjectId).toString()
    )
  )

  const products = await Product.find({
    Characteristic: { $exists: true, $ne: [] }
  }).lean()

  let updated = 0
  for (const product of products) {
    const arr = (product.Characteristic as { name: mongoose.Types.ObjectId | null; values: unknown[] }[]) || []
    const kept = arr.filter((item) => {
      if (!item?.name) return false
      const id = (item.name as mongoose.Types.ObjectId).toString()
      return existingIds.has(id)
    })
    if (kept.length !== arr.length) {
      await Product.updateOne(
        { _id: product._id },
        { $set: { Characteristic: kept } }
      )
      updated++
    }
  }

  return NextResponse.json({
    success: true,
    updated,
    totalProcessed: products.length
  })
}
