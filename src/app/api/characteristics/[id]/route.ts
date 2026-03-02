import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Characteristic from "@/models/Characteristic"
import Product from "@/models/Product"
import mongoose from "mongoose"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { searchParams } = new URL(req.url)
  const productsCountOnly = searchParams.get("productsCount") === "1"

  await connectToDatabase()
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

  if (productsCountOnly) {
    const count = await Product.countDocuments({
      "Characteristic.name": new mongoose.Types.ObjectId(id)
    })
    return NextResponse.json({ productsCount: count })
  }

  const characteristic = await Characteristic.findById(id)
  if (!characteristic)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(characteristic)
}

export async function PUT(
  req: Request,

  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  await connectToDatabase()
  const body = await req.json()
  const updated = await Characteristic.findByIdAndUpdate(id, body, {
    new: true
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  await connectToDatabase()
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

  const objectId = new mongoose.Types.ObjectId(id)

  // Retirer cette caractéristique de tous les produits qui l'utilisent
  await Product.updateMany(
    { "Characteristic.name": objectId },
    { $pull: { Characteristic: { name: objectId } } }
  )

  await Characteristic.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}
