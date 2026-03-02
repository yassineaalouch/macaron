import { NextRequest, NextResponse } from "next/server"
import { uploadMultipleFilesToS3 } from "@/lib/s3"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 })
    }

    const urls = await uploadMultipleFilesToS3(files)

    return NextResponse.json({ success: true, urls })
  } catch (error) {
    console.error("S3 Upload error:", error)
    return NextResponse.json(
      { error: "Erreur lors du téléversement" },
      { status: 500 }
    )
  }
}
