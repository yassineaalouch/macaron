// lib/updateHomePageCategoryCount.ts
import { connectToDatabase } from "@/lib/mongodb"
import HomePageCategory from "@/models/HomePageCategory"
import Category from "@/models/Category"
import Product from "@/models/Product"
import mongoose from "mongoose"

/**
 * Met à jour le productCount de toutes les HomePageCategory
 * en comptant le nombre réel de produits dans chaque catégorie correspondante
 */
export async function updateAllHomePageCategoryCounts(): Promise<void> {
  try {
    await connectToDatabase()

    // Récupérer toutes les HomePageCategory actives
    const homePageCategories = await HomePageCategory.find({
      isActive: true
    })

    for (const homePageCat of homePageCategories) {
      try {
        // Trouver la Category correspondante par nom (fr ou ar)
        const category = await Category.findOne({
          $or: [
            { "name.fr": homePageCat.name.fr },
            { "name.ar": homePageCat.name.ar }
          ],
          isActive: true
        })

        if (!category) {
          // Si aucune catégorie correspondante n'est trouvée, mettre le count à 0
          await HomePageCategory.findByIdAndUpdate(homePageCat._id, {
            productCount: 0
          })
          continue
        }

        // Fonction récursive pour obtenir tous les IDs de catégories (parent + enfants)
        const getAllCategoryIds = async (
          categoryId: mongoose.Types.ObjectId
        ): Promise<mongoose.Types.ObjectId[]> => {
          const allIds: mongoose.Types.ObjectId[] = [categoryId]

          // Récupérer tous les descendants
          const children = await Category.find({ parentId: categoryId })
          for (const child of children) {
            const childIds = await getAllCategoryIds(child._id)
            allIds.push(...childIds)
          }

          return allIds
        }

        // Obtenir tous les IDs de catégories (parent + descendants)
        const allCategoryIds = await getAllCategoryIds(category._id)

        // Compter les produits dans toutes ces catégories
        const productCount = await Product.countDocuments({
          category: { $in: allCategoryIds }
        })

        // Mettre à jour le productCount de la HomePageCategory
        await HomePageCategory.findByIdAndUpdate(homePageCat._id, {
          productCount: productCount
        })
      } catch (error) {
        console.error(
          `Erreur lors de la mise à jour du productCount pour la catégorie ${homePageCat._id}:`,
          error
        )
        // Continuer avec les autres catégories même en cas d'erreur
      }
    }
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour des productCount des HomePageCategory:",
      error
    )
    // Ne pas faire échouer l'opération principale si cette mise à jour échoue
  }
}

/**
 * Met à jour le productCount d'une HomePageCategory spécifique
 * en fonction d'une Category donnée
 * Met aussi à jour toutes les catégories parentes si elles correspondent à des HomePageCategory
 */
export async function updateHomePageCategoryCountByCategoryId(
  categoryId: string | mongoose.Types.ObjectId
): Promise<void> {
  try {
    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return
    }

    const categoryObjectId =
      typeof categoryId === "string"
        ? new mongoose.Types.ObjectId(categoryId)
        : categoryId

    // Fonction récursive pour obtenir tous les IDs de catégories parentes
    const getAllParentIds = async (
      catId: mongoose.Types.ObjectId
    ): Promise<mongoose.Types.ObjectId[]> => {
      const parentIds: mongoose.Types.ObjectId[] = [catId]
      const category = await Category.findById(catId)

      if (category && category.parentId) {
        const parentCategoryIds = await getAllParentIds(category.parentId)
        parentIds.push(...parentCategoryIds)
      }

      return parentIds
    }

    // Obtenir toutes les catégories dans la chaîne (sous-catégorie + tous les parents)
    const allCategoryIdsInChain = await getAllParentIds(categoryObjectId)

    // Pour chaque catégorie dans la chaîne, mettre à jour le productCount si elle correspond à une HomePageCategory
    for (const catId of allCategoryIdsInChain) {
      try {
        const category = await Category.findById(catId)

        if (!category) {
          continue
        }

        // Trouver toutes les HomePageCategory qui correspondent à cette catégorie
        const homePageCategories = await HomePageCategory.find({
          $or: [
            { "name.fr": category.name.fr },
            { "name.ar": category.name.ar }
          ],
          isActive: true
        })

        if (homePageCategories.length === 0) {
          continue
        }

        // Fonction récursive pour obtenir tous les IDs de catégories (parent + enfants)
        const getAllCategoryIds = async (
          catId: mongoose.Types.ObjectId
        ): Promise<mongoose.Types.ObjectId[]> => {
          const allIds: mongoose.Types.ObjectId[] = [catId]

          // Récupérer tous les descendants
          const children = await Category.find({ parentId: catId })
          for (const child of children) {
            const childIds = await getAllCategoryIds(child._id)
            allIds.push(...childIds)
          }

          return allIds
        }

        // Obtenir tous les IDs de catégories (cette catégorie + tous ses descendants)
        const allCategoryIds = await getAllCategoryIds(catId)

        // Compter les produits dans toutes ces catégories
        const productCount = await Product.countDocuments({
          category: { $in: allCategoryIds }
        })

        // Mettre à jour toutes les HomePageCategory correspondantes
        for (const homePageCat of homePageCategories) {
          await HomePageCategory.findByIdAndUpdate(homePageCat._id, {
            productCount: productCount
          })
        }
      } catch (error) {
        console.error(
          `Erreur lors de la mise à jour du productCount pour la catégorie ${catId}:`,
          error
        )
        // Continuer avec les autres catégories même en cas d'erreur
      }
    }
  } catch (error) {
    console.error(
      `Erreur lors de la mise à jour du productCount pour la catégorie ${categoryId}:`,
      error
    )
    // Ne pas faire échouer l'opération principale si cette mise à jour échoue
  }
}
