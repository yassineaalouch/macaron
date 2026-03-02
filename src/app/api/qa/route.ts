import { NextRequest, NextResponse } from "next/server"
import { QA, IQA } from "@/models/QA"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  await connectToDatabase()
  const data: IQA[] = await QA.find().sort({ createdAt: -1 })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const body: IQA = await req.json()
    const created = await QA.create(body)
    return NextResponse.json({ success: true, data: created })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500 }
    )
  }
}
