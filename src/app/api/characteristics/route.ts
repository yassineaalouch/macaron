import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Characteristic from "@/models/Characteristic"
import mongoose from "mongoose"

export async function GET() {
  await connectToDatabase()
  const data = await Characteristic.find()
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  await connectToDatabase()
  const body = await req.json()
  body._id = new mongoose.Types.ObjectId()

  const characteristic = await Characteristic.create(body)
  return NextResponse.json(characteristic)
}
