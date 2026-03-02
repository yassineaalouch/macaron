/**
 * Retourne l'URL de l'image principale d'un produit.
 * Utilise mainImageIndex si défini, sinon images[0].
 */
export function getMainImage(product: {
  images?: string[] | null
  mainImageIndex?: number | null
}): string | undefined {
  const images = product.images
  if (!images || images.length === 0) return undefined
  const index = Math.min(
    Math.max(0, product.mainImageIndex ?? 0),
    images.length - 1
  )
  return images[index]
}
