// Helper functions for color characteristics

/**
 * Vérifie si un nom de caractéristique correspond à "couleur" (en français, anglais ou arabe)
 */
export function isColorCharacteristic(name: string): boolean {
  const normalizedName = name.toLowerCase().trim()
  
  // Français
  if (normalizedName === "couleur" || normalizedName === "couleurs") {
    return true
  }
  
  // Anglais
  if (normalizedName === "color" || normalizedName === "colors" || normalizedName === "colour" || normalizedName === "colours") {
    return true
  }
  
  // Arabe (لون = couleur)
  if (normalizedName === "لون" || normalizedName === "ألوان") {
    return true
  }
  
  return false
}

/**
 * Vérifie si une valeur est un code hexadécimal valide
 */
export function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)
}

/**
 * Normalise un code hexadécimal (ajoute # si manquant, convertit en majuscules)
 */
export function normalizeHexColor(hex: string): string {
  if (!hex) return "#000000"
  const cleaned = hex.trim().replace(/^#/, "")
  if (cleaned.length === 3) {
    // Convertir #RGB en #RRGGBB
    return `#${cleaned.split("").map(c => c + c).join("")}`.toUpperCase()
  }
  return `#${cleaned}`.toUpperCase()
}

