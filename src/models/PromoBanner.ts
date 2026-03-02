// models/PromoBanner.ts
import mongoose, { Document, Schema } from "mongoose"

export interface PromoBannerDocument extends Document {
  // Images responsive (au moins une doit être fournie)
  imageDesktop?: string // Image pour PC et tablettes (écrans >= 768px)
  imageMobile?: string // Image pour téléphones (écrans < 768px)
  
  // Contenu multilingue (optionnel)
  title?: {
    fr: string
    ar: string
  }
  description?: {
    fr: string
    ar: string
  }
  
  // Lien de destination
  link: string // URL vers un produit, pack, catégorie ou page personnalisée
  linkType: "product" | "pack" | "custom" | "category" // Type de lien
  linkId?: string // ID du produit, pack ou catégorie (si applicable)
  
  // Statut et dates
  isActive: boolean
  startDate?: Date // Date de début d'affichage (optionnelle)
  endDate?: Date // Date de fin d'affichage (optionnelle)
  priority: number // Ordre d'affichage (si plusieurs bannières)
  
  // Statistiques
  clickCount: number // Nombre de clics sur la bannière
  
  // Champ singleton pour garantir un seul document
  singleton: string
  
  createdAt: Date
  updatedAt: Date
}

const PromoBannerSchema = new Schema<PromoBannerDocument>(
  {
    // Images responsive
    imageDesktop: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          // Au moins une image (desktop ou mobile) doit être fournie
          return v || (this as any).imageMobile
        },
        message: "Au moins une image (desktop ou mobile) est requise"
      }
    },
    imageMobile: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          // Au moins une image (desktop ou mobile) doit être fournie
          return v || (this as any).imageDesktop
        },
        message: "Au moins une image (desktop ou mobile) est requise"
      }
    },
    
    // Contenu multilingue
    title: {
      fr: { type: String, trim: true },
      ar: { type: String, trim: true }
    },
    description: {
      fr: { type: String, trim: true },
      ar: { type: String, trim: true }
    },
    
    // Lien de destination
    link: {
      type: String,
      required: [true, "Le lien est requis"],
      trim: true,
      validate: {
        validator: function (v: string) {
          // Valider que l'URL commence par / ou http
          return v.startsWith("/") || v.startsWith("http")
        },
        message: "Le lien doit commencer par / ou http"
      }
    },
    linkType: {
      type: String,
      enum: ["product", "pack", "custom", "category"],
      default: "custom"
    },
    linkId: {
      type: String,
      trim: true
    },
    
    // Statut et dates
    isActive: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (v: Date) {
          // Si endDate est défini et startDate aussi, endDate doit être après startDate
          if (v && (this as any).startDate) {
            return v > (this as any).startDate
          }
          return true
        },
        message: "La date de fin doit être après la date de début"
      }
    },
    priority: {
      type: Number,
      default: 0,
      min: [0, "La priorité doit être positive ou nulle"]
    },
    
    // Statistiques
    clickCount: {
      type: Number,
      default: 0,
      min: [0, "Le nombre de clics ne peut pas être négatif"]
    },
    
    // Champ singleton
    singleton: {
      type: String,
      default: "promo_banner",
      unique: true,
      immutable: true
    }
  },
  {
    timestamps: true
  }
)

// Index pour optimiser les requêtes
PromoBannerSchema.index({ isActive: 1 })
PromoBannerSchema.index({ startDate: 1, endDate: 1 })
PromoBannerSchema.index({ priority: -1 })

// Validation personnalisée : au moins une image doit être fournie (seulement lors de la création)
PromoBannerSchema.pre("validate", function (next) {
  // Ne valider que si c'est un nouveau document ou si les deux images sont explicitement null/undefined
  const isNew = this.isNew
  const hasNoImages = (!this.imageDesktop || this.imageDesktop.trim() === "") && 
                      (!this.imageMobile || this.imageMobile.trim() === "")
  
  // Si c'est un nouveau document et qu'il n'y a pas d'images, invalider
  if (isNew && hasNoImages) {
    this.invalidate("imageDesktop", "Au moins une image (desktop ou mobile) est requise")
    this.invalidate("imageMobile", "Au moins une image (desktop ou mobile) est requise")
  }
  next()
})

const PromoBanner =
  mongoose.models.PromoBanner ||
  mongoose.model<PromoBannerDocument>("PromoBanner", PromoBannerSchema)

export default PromoBanner

