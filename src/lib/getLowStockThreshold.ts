import { connectToDatabase } from "@/lib/mongodb"
import AppSettings from "@/models/AppSettings"

const DEFAULT_THRESHOLD = 15

/**
 * Retourne le seuil de stock bas configuré par l'admin (paramètres dashboard).
 * Utilisé pour déclencher l'email d'alerte quand quantité < seuil.
 */
export async function getLowStockThreshold(): Promise<number> {
  try {
    await connectToDatabase()
    const settings = await AppSettings.findOne()
    if (settings?.lowStockThreshold != null) {
      return settings.lowStockThreshold
    }
    const created = await AppSettings.create({ lowStockThreshold: DEFAULT_THRESHOLD })
    return created.lowStockThreshold ?? DEFAULT_THRESHOLD
  } catch {
    return DEFAULT_THRESHOLD
  }
}
