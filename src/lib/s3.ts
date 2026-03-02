import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"
import sharp from "sharp"

// Cloudflare R2 (S3-compatible) : endpoint personnalisé et path-style requis
const r2Endpoint = process.env.R2_ENDPOINT?.trim()
const s3 = new S3Client({
  region: process.env.MACARONEES_AWS_REGION!.trim(),
  endpoint: r2Endpoint || undefined,
  forcePathStyle: !!r2Endpoint,
  credentials: {
    accessKeyId: process.env.MACARONEES_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.MACARONEES_AWS_SECRET_ACCESS_KEY!
  }
})

/** URL publique d’un fichier (R2 : sous-domaine r2.dev ou domaine perso si R2_PUBLIC_BASE_URL est défini) */
function getPublicFileUrl(bucket: string, encodedFileName: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL?.trim()
  if (base) {
    return `${base.replace(/\/$/, "")}/${encodedFileName}`
  }
  if (r2Endpoint) {
    return `${r2Endpoint}/${bucket}/${encodedFileName}`
  }
  const region = process.env.MACARONEES_AWS_REGION?.trim()
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedFileName}`
}

/**
 * Upload a single file to S3 after resizing and converting to WebP
 */
export async function uploadFileToS3(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 🔹 Resize and convert to WebP (maintaining proportions)
  const resizedBuffer = await sharp(buffer)
    .webp({ quality: 
      100 })
    .toBuffer()

  const fileName = `${randomUUID()}-${file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "_")}.webp`

  const bucket = process.env.MACARONEES_AWS_BUCKET_NAME!

  const uploadParams = {
    Bucket: bucket,
    Key: fileName,
    Body: resizedBuffer,
    ContentType: "image/webp"
  }

  await s3.send(new PutObjectCommand(uploadParams))

  const encodedFileName = encodeURIComponent(fileName)
  return getPublicFileUrl(bucket, encodedFileName)
}

/**
 * Upload multiple files to S3
 */
export async function uploadMultipleFilesToS3(
  files: File[]
): Promise<string[]> {
  const urls: string[] = []

  for (const file of files) {
    const url = await uploadFileToS3(file)
    urls.push(url)
  }

  return urls
}
export async function deleteFileFromS3(fileName: string) {
  const params = {
    Bucket: process.env.MACARONEES_AWS_BUCKET_NAME!,
    Key: fileName
  }

  const command = new DeleteObjectCommand(params)
  await s3.send(command)
}

/**
 * Extract the file name from an S3 URL and decode it
 * @param imageUrl - The full S3 URL (e.g., https://bucket.s3.region.amazonaws.com/encodedFileName)
 * @returns The decoded file name or null if extraction fails
 */
export function extractFileNameFromS3Url(imageUrl: string): string | null {
  try {
    if (!imageUrl || typeof imageUrl !== "string") {
      return null
    }

    // Remove query parameters if any (e.g., ?version=... or ?X-Amz-...)
    const urlWithoutQuery = imageUrl.split("?")[0]
    
    // Extract the file name from the URL (everything after the last /)
    const urlParts = urlWithoutQuery.split("/")
    const encodedFileName = urlParts[urlParts.length - 1]
    
    if (!encodedFileName) {
      return null
    }

    // Decode the URL-encoded file name
    const decodedFileName = decodeURIComponent(encodedFileName)
    
    return decodedFileName
  } catch (error) {
    console.error(`Erreur lors de l'extraction du nom de fichier depuis l'URL: ${imageUrl}`, error)
    return null
  }
}

/**
 * Delete multiple files from S3
 * @param imageUrls - Array of S3 URLs to delete
 */
export async function deleteMultipleFilesFromS3(imageUrls: string[]): Promise<void> {
  const deletePromises = imageUrls.map(async (imageUrl) => {
    try {
      const fileName = extractFileNameFromS3Url(imageUrl)
      if (fileName) {
        await deleteFileFromS3(fileName)
      } else {
        console.warn(`Impossible d'extraire le nom de fichier depuis l'URL: ${imageUrl}`)
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'image ${imageUrl}:`, error)
      // Continue avec les autres images même si une suppression échoue
    }
  })

  await Promise.all(deletePromises)
}

/**
 * Generate a presigned URL for direct client-side upload to S3
 * @param fileName - The name of the file to upload
 * @param contentType - The MIME type of the file (default: image/webp)
 * @param expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
 * @returns Presigned URL and the final file URL
 */
export async function generatePresignedUrl(
  fileName: string,
  contentType: string = "image/webp",
  expiresIn: number = 300
): Promise<{ presignedUrl: string; fileUrl: string }> {
  const bucket = process.env.MACARONEES_AWS_BUCKET_NAME!
  const region = process.env.MACARONEES_AWS_REGION!.trim()

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    ContentType: contentType
  })

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn })

  const encodedFileName = encodeURIComponent(fileName)
  const fileUrl = getPublicFileUrl(bucket, encodedFileName)

  return { presignedUrl, fileUrl }
}

/**
 * Generate presigned URLs for multiple files
 */
export async function generatePresignedUrls(
  fileNames: string[],
  contentType: string = "image/webp",
  expiresIn: number = 300
): Promise<Array<{ presignedUrl: string; fileUrl: string }>> {
  const promises = fileNames.map((fileName) =>
    generatePresignedUrl(fileName, contentType, expiresIn)
  )
  return Promise.all(promises)
}
