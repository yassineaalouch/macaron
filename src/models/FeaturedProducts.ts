// models/FeaturedProducts.ts
import mongoose, { Document, Schema } from "mongoose"

export interface FeaturedProductsDocument extends Document {
  productIds: mongoose.Types.ObjectId[]
  order: number[] // Ordre des produits (index correspondant à productIds)
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const FeaturedProductsSchema = new Schema<FeaturedProductsDocument>(
  {
    productIds: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      required: true,
      validate: {
        validator: function (v: mongoose.Types.ObjectId[]) {
          return v.length > 0 && v.length <= 10 // Maximum 10 produits
        },
        message: "Entre 1 et 10 produits sont requis"
      }
    },
    order: {
      type: [Number],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Champ singleton pour garantir un seul document
    singleton: {
      type: String,
      default: "featured_products",
      unique: true,
      immutable: true
    }
  },
  {
    timestamps: true
  }
)

// Index
FeaturedProductsSchema.index({ isActive: 1 })

const FeaturedProducts =
  mongoose.models.FeaturedProducts ||
  mongoose.model<FeaturedProductsDocument>(
    "FeaturedProducts",
    FeaturedProductsSchema
  )

export default FeaturedProducts

