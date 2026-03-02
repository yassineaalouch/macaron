
import mongoose, { Document, Model } from "mongoose"

// Interface pour les items du pack
interface IPackItem {
  productId: string
  quantity: number
}

// Interface pour le document ProductPack
interface IProductPack extends Document {
  name: {
    fr: string
    ar: string
  }
  description: {
    fr: string
    ar: string
  }
  items: IPackItem[]
  totalPrice: number
  discountPrice?: number
  images: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PackItemSchema = new mongoose.Schema<IPackItem>({
  productId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
})

const ProductPackSchema = new mongoose.Schema<IProductPack>(
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
    description: {
      fr: {
        type: String,
        trim: true,
        default: ""
      },
      ar: {
        type: String,
        trim: true,
        default: ""
      }
    },
    items: {
      type: [PackItemSchema],
      required: true,
      validate: {
        validator: function (v: IPackItem[]): boolean {
          return v.length > 0
        },
        message: "Au moins un produit est requis dans le pack"
      }
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discountPrice: {
      type: Number,
      required: false,
      min: 0
    },
    images: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true // ✅ important pour avoir createdAt et updatedAt
  }
)

// Export du modèle avec typage
const ProductPack: Model<IProductPack> =
  mongoose.models.ProductPack ||
  mongoose.model<IProductPack>("ProductPack", ProductPackSchema)

export default ProductPack
export type { IProductPack, IPackItem }
