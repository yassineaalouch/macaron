import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import HomeVideo from "@/models/HomeVideo"
import { deleteMultipleFilesFromS3 } from "@/lib/s3"

interface HomeVideoRequestBody {
  sourceType: "upload" | "youtube"
  youtubeUrl?: string
  videoUrl?: string
  isActive?: boolean
}

// GET - Récupérer la configuration de la vidéo d'accueil
export async function GET() {
  try {
    await connectToDatabase()

    let homeVideo = await HomeVideo.findOne({ singleton: "home_video" }).lean()

    // Créer une configuration par défaut si rien n'existe encore
    if (!homeVideo) {
      homeVideo = (
        await HomeVideo.create({
          sourceType: "youtube",
          youtubeUrl: "",
          videoUrl: "",
          isActive: false,
          singleton: "home_video"
        })
      ).toObject()
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          sourceType: homeVideo.sourceType,
          youtubeUrl: homeVideo.youtubeUrl || "",
          videoUrl: homeVideo.videoUrl || "",
          isActive: homeVideo.isActive
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération de la vidéo d'accueil:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour la configuration de la vidéo d'accueil
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = (await request.json()) as HomeVideoRequestBody
    const { sourceType, youtubeUrl, videoUrl, isActive = true } = body

    if (!sourceType || !["upload", "youtube"].includes(sourceType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Le type de source de la vidéo est invalide"
        },
        { status: 400 }
      )
    }

    // Validation spécifique selon le type de source
    if (sourceType === "youtube") {
      if (!youtubeUrl || !youtubeUrl.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "L'URL YouTube est requise pour ce type de source"
          },
          { status: 400 }
        )
      }
    } else if (sourceType === "upload") {
      if (!videoUrl || !videoUrl.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "L'URL de la vidéo uploadée est requise"
          },
          { status: 400 }
        )
      }
    }

    // Récupérer l'ancienne configuration pour éventuellement supprimer l'ancienne vidéo S3
    const existing = await HomeVideo.findOne({ singleton: "home_video" })

    let oldUploadedVideoUrl: string | null = null
    if (existing && existing.sourceType === "upload" && existing.videoUrl) {
      oldUploadedVideoUrl = existing.videoUrl
    }

    // Préparer les nouvelles données
    const updateData: any = {
      sourceType,
      youtubeUrl: sourceType === "youtube" ? youtubeUrl?.trim() || "" : "",
      videoUrl: sourceType === "upload" ? videoUrl?.trim() || "" : "",
      isActive: !!isActive
    }

    // Mettre à jour ou créer le document
    const updated = await HomeVideo.findOneAndUpdate(
      { singleton: "home_video" },
      updateData,
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    )

    // Si une ancienne vidéo uploadée existe et qu'on la remplace
    // - par une nouvelle vidéo uploadée (URL différente)
    // - ou par une URL YouTube
    // alors on supprime l'ancien fichier S3.
    if (oldUploadedVideoUrl) {
      const newUrl =
        updated.sourceType === "upload" ? updated.videoUrl : updated.youtubeUrl

      // On ne supprime QUE si on a bien basculé sur une autre source / une autre URL.
      if (newUrl && newUrl !== oldUploadedVideoUrl) {
        try {
          await deleteMultipleFilesFromS3([oldUploadedVideoUrl])
        } catch (deleteError) {
          console.error(
            "Erreur lors de la suppression de l'ancienne vidéo S3:",
            deleteError
          )
          // On ne renvoie pas d'erreur au client pour ne pas bloquer la mise à jour
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Vidéo d'accueil mise à jour avec succès",
        data: {
          sourceType: updated.sourceType,
          youtubeUrl: updated.youtubeUrl || "",
          videoUrl: updated.videoUrl || "",
          isActive: updated.isActive
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour de la vidéo d'accueil:", error)

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur de validation",
          error: error.message
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

