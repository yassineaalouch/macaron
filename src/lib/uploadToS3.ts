import axios from "axios"

/**
 * Generate a unique filename for S3 upload
 */
function generateFileName(originalFileName: string): string {
  const baseName = originalFileName
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "_")
  // Generate UUID v4 compatible string
  const uuid = crypto.randomUUID ? crypto.randomUUID() : generateUUID()
  return `${uuid}-${baseName}.webp`
}

/**
 * Generate a raw filename (keeps original extension) for non-image uploads (e.g. video)
 */
function generateRawFileName(originalFileName: string): string {
  const parts = originalFileName.split(".")
  const extension = parts.length > 1 ? `.${parts.pop()}` : ""
  const baseName = parts.join(".").replace(/\s+/g, "_")
  const uuid = crypto.randomUUID ? crypto.randomUUID() : generateUUID()
  return `${uuid}-${baseName}${extension}`
}

/**
 * Fallback UUID generator for browsers that don't support crypto.randomUUID
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Compress and convert image to WebP format on client side
 * This reduces file size before upload
 */
async function compressImage(file: File, maxWidth: number = 1920, quality: number = 85): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Resize if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"))
              return
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          "image/webp",
          quality / 100
        )
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

/**
 * Upload a single file directly to S3 using presigned URL
 */
async function uploadFileToS3(
  file: File,
  presignedUrl: string
): Promise<void> {
  try {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type
      }
    })

    if (!response.ok) {
      // Vérifier si c'est une erreur CORS
      if (response.status === 0 || response.statusText === "") {
        throw new Error(
          "Erreur CORS: Le bucket S3 n'est pas configuré pour autoriser les uploads depuis cette origine. " +
          "Veuillez configurer CORS sur le bucket S3. Consultez le fichier S3-CORS-SETUP.md pour plus d'informations."
        )
      }
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    // Si c'est une erreur de réseau/CORS
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error(
        "Erreur CORS: Impossible de se connecter à S3. " +
        "Le bucket S3 doit être configuré avec CORS pour autoriser les uploads depuis le navigateur. " +
        "Consultez le fichier S3-CORS-SETUP.md pour plus d'informations."
      )
    }
    throw error
  }
}

/**
 * Upload multiple files directly to S3
 * This function handles the entire flow:
 * 1. Compress images (optional)
 * 2. Generate file names
 * 3. Get presigned URLs from server
 * 4. Upload directly to S3
 * 5. Return final URLs
 */
export async function uploadFilesDirectlyToS3(
  files: File[],
  options: {
    compress?: boolean
    maxWidth?: number
    quality?: number
  } = {}
): Promise<string[]> {
  const { compress = true, maxWidth = 1920, quality = 85 } = options

  if (files.length === 0) {
    return []
  }

  try {
    // Step 1: Compress images if needed
    let processedFiles = files
    if (compress) {
      processedFiles = await Promise.all(
        files.map((file) => compressImage(file, maxWidth, quality))
      )
    }

    // Step 2: Generate file names
    const fileNames = processedFiles.map((file) => generateFileName(file.name))

    // Step 3: Get presigned URLs from server
    const response = await axios.post("/api/upload/presigned", {
      fileNames,
      contentType: "image/webp"
    })

    if (!response.data.success || !response.data.data) {
      throw new Error("Failed to get presigned URLs")
    }

    const presignedData = response.data.data as Array<{
      presignedUrl: string
      fileUrl: string
    }>

    // Step 4: Upload files directly to S3 in parallel
    await Promise.all(
      processedFiles.map((file, index) =>
        uploadFileToS3(file, presignedData[index].presignedUrl)
      )
    )

    // Step 5: Return final URLs
    return presignedData.map((item) => item.fileUrl)
  } catch (error) {
    console.error("Direct S3 upload error:", error)
    throw error
  }
}

/**
 * Upload a single video file directly to S3 without compression.
 * The file goes from the navigateur -> S3 via URL présignée, sans passer par Next.js.
 */
export async function uploadVideoFileDirectlyToS3(file: File): Promise<string> {
  if (!file) {
    throw new Error("Aucun fichier vidéo fourni")
  }

  try {
    const fileName = generateRawFileName(file.name)

    const response = await axios.post("/api/upload/presigned", {
      fileNames: [fileName],
      contentType: file.type || "video/mp4"
    })

    if (!response.data.success || !response.data.data || !response.data.data[0]) {
      throw new Error("Échec de la génération de l'URL présignée pour la vidéo")
    }

    const presignedData = response.data.data[0] as {
      presignedUrl: string
      fileUrl: string
    }

    // Upload direct au bucket S3
    await uploadFileToS3(file, presignedData.presignedUrl)

    // Retourner l'URL finale S3
    return presignedData.fileUrl
  } catch (error) {
    console.error("Direct S3 video upload error:", error)
    throw error
  }
}
