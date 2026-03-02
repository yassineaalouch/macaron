// models/HomePageCategory.ts
import mongoose, { Document, Schema } from "mongoose"

export interface HomePageCategoryDocument extends Document {
  name: {
    fr: string
    ar: string
  }
  image: string
  productCount: number
  url: string
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const HomePageCategorySchema = new Schema<HomePageCategoryDocument>(
  {
    name: {
      fr: {
        type: String,
        required: [true, "Le nom en français est requis"],
        trim: true
      },
      ar: {
        type: String,
        required: [true, "Le nom en arabe est requis"],
        trim: true
      }
    },
    image: {
      type: String,
      required: [true, "L'image est requise"],
      trim: true
    },
    productCount: {
      type: Number,
      required: [true, "Le nombre de produits est requis"],
      min: [0, "Le nombre de produits ne peut pas être négatif"]
    },
    url: {
      type: String,
      required: [true, "L'URL est requise"],
      trim: true,
      validate: {
        validator: function (v: string) {
          // Valider que l'URL commence par / ou http
          return v.startsWith("/") || v.startsWith("http")
        },
        message: "L'URL doit commencer par / ou http"
      }
    },
    order: {
      type: Number,
      required: [true, "L'ordre est requis"],
      default: 0,
      min: [0, "L'ordre ne peut pas être négatif"]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

// Index pour améliorer les performances
HomePageCategorySchema.index({ order: 1 })
HomePageCategorySchema.index({ isActive: 1 })

const HomePageCategory =
  mongoose.models.HomePageCategory ||
  mongoose.model<HomePageCategoryDocument>(
    "HomePageCategory",
    HomePageCategorySchema
  )

export default HomePageCategory

