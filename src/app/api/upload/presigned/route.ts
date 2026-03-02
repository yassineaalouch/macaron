import { NextRequest, NextResponse } from "next/server"
import { generatePresignedUrls } from "@/lib/s3"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fileNames, contentType = "image/webp" } = body

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json(
        { error: "Les noms de fichiers sont requis" },
        { status: 400 }
      )
    }

    // Generate presigned URLs for all files
    const presignedData = await generatePresignedUrls(
      fileNames,
      contentType,
      300 // 5 minutes expiration
    )

    return NextResponse.json({ success: true, data: presignedData })
  } catch (error) {
    console.error("Presigned URL generation error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la génération des URLs" },
      { status: 500 }
    )
  }
}
