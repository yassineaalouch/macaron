import mongoose, { Document, Schema, Model, Types } from "mongoose"

// --- Interface pour champs localisés ---
export interface LocalizedField {
  fr: string
  ar: string
}

// --- Interface pour le document Category ---
export interface CategoryDocument extends Document {
  _id: Types.ObjectId
  name: LocalizedField
  description: LocalizedField
  parentId?: Types.ObjectId | null
  isActive: boolean
  slug: LocalizedField
  order: number
  createdAt: Date
  updatedAt: Date

  hasChildren(): Promise<boolean>
  getAllDescendants(): Promise<CategoryDocument[]>
}

// --- Schéma ---
const CategorySchema = new Schema<CategoryDocument>(
  {
    name: {
      fr: {
        type: String,
        required: [true, "Le nom en français est requis"],
        trim: true,
        minlength: [2, "Le nom doit contenir au moins 2 caractères"]
      },
      ar: {
        type: String,
        required: [true, "Le nom en arabe est requis"],
        trim: true,
        minlength: [2, "الاسم يجب أن يحتوي على حرفين على الأقل"]
      }
    },
    description: {
      fr: { type: String, trim: true, default: "" },
      ar: { type: String, trim: true, default: "" }
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    isActive: { type: Boolean, default: true },
    slug: {
      fr: { type: String, unique: true, sparse: true },
      ar: { type: String, unique: true, sparse: true }
    },
    order: { type: Number, default: 0 }
  },
  {
    timestamps: true, // ✅ important pour avoir createdAt et updatedAt
    suppressReservedKeysWarning: true // ✅ pour supprimer ton warning mongoose
  }
)

// --- Indexes ---
CategorySchema.index({ parentId: 1 })
CategorySchema.index({ isActive: 1 })
CategorySchema.index({ "name.fr": 1 })
CategorySchema.index({ "name.ar": 1 })

// --- Méthode: vérifier si la catégorie a des enfants ---
CategorySchema.methods.hasChildren = async function (this: CategoryDocument) {
  const count = await mongoose.models.Category.countDocuments({
    parentId: this._id
  })
  return count > 0
}

// --- Méthode: obtenir tous les descendants ---
CategorySchema.methods.getAllDescendants = async function (
  this: CategoryDocument
): Promise<CategoryDocument[]> {
  const descendants: CategoryDocument[] = []
  const queue: Types.ObjectId[] = [this._id]

  while (queue.length > 0) {
    const currentId = queue.shift()
    if (!currentId) continue

    const children = (await mongoose.models.Category.find({
      parentId: currentId
    })) as CategoryDocument[]

    for (const child of children) {
      descendants.push(child)
      queue.push(child._id as Types.ObjectId)
    }
  }

  return descendants
}

// --- Middleware: empêcher suppression si des enfants existent ---
CategorySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (this: CategoryDocument, next) {
    const hasChildren = await this.hasChildren()
    if (hasChildren) {
      return next(
        new Error(
          "Impossible de supprimer cette catégorie car elle contient des sous-catégories"
        )
      )
    }
    next()
  }
)

// --- Fonction helper pour générer un slug valide ---
function generateSlug(text: string, fallback: string): string {
  if (!text || typeof text !== "string") return fallback
  
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ء-ي]+/g, "-")
    .replace(/(^-|-$)/g, "")
  
  // Si le slug est vide après traitement, utiliser le fallback
  if (!slug || slug.trim() === "") {
    slug = fallback
  }
  
  return slug
}

// --- Middleware: générer un slug avant sauvegarde ---
// Note: Le slug est maintenant généré dans l'API pour garantir l'unicité
// Ce middleware ne s'exécute QUE si le slug n'est pas déjà défini par l'API
CategorySchema.pre("save", function (this: CategoryDocument, next) {
  // Si le slug est déjà défini et non vide (fourni par l'API), ne PAS le régénérer
  if (this.slug && 
      this.slug.fr && 
      this.slug.ar && 
      this.slug.fr.trim() !== "" && 
      this.slug.ar.trim() !== "" &&
      this.slug.fr !== "undefined" &&
      this.slug.ar !== "undefined") {
    return next()
  }
  
  // Sinon, générer un slug basique (pour compatibilité avec les anciennes catégories ou mises à jour directes)
  if (this.isModified("name") || !this.slug || !this.slug.fr || !this.slug.ar) {
    // Générer un identifiant unique pour le fallback
    const fallbackId = this._id 
      ? this._id.toString().slice(-8) 
      : `t${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6)}`
    
    // Générer le slug français
    let slugFr = this.name.fr
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    
    // Si le slug français est vide, utiliser un fallback unique
    if (!slugFr || slugFr.trim() === "") {
      slugFr = `cat-fr-${fallbackId}`
    }
    
    // Générer le slug arabe - améliorer la regex pour mieux gérer l'arabe
    let slugAr = this.name.ar
      .toLowerCase()
      .trim()
      // Garder les caractères arabes, latins et numériques
      .replace(/[^\u0600-\u06FFa-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    
    // Si le slug arabe est vide, utiliser un fallback unique
    if (!slugAr || slugAr.trim() === "") {
      slugAr = `cat-ar-${fallbackId}`
    }
    
    this.slug = {
      fr: slugFr,
      ar: slugAr
    }
  }
  next()
})

// --- Export du modèle ---
const Category: Model<CategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<CategoryDocument>("Category", CategorySchema)

export default Category
