import { NextRequest, NextResponse } from "next/server"
import { QA, IQA } from "@/models/QA"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    await connectToDatabase()
    const body: IQA = await req.json()

    const updated = await QA.findByIdAndUpdate(id, body, {
      new: true
    })

    return NextResponse.json({ success: true, data: updated })
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

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  await connectToDatabase()

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    )
  }

  await QA.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}
