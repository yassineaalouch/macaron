import mongoose, { Document, Schema, Model } from "mongoose"

export type DiscountType = "PERCENTAGE" | "BUY_X_GET_Y" | "COUPON"

export interface LocalizedField {
  fr: string
  ar: string
}

export interface DiscountDocument extends Document {
  name: LocalizedField
  type: DiscountType
  value?: number
  buyQuantity?: number
  getQuantity?: number
  couponCode?: string
  description?: LocalizedField
  startDate?: Date | null
  endDate?: Date | null
  isActive: boolean
  usageLimit?: number | null
  usageCount: number
  minimumPurchase?: number | null
  applicableCategories: mongoose.Types.ObjectId[]
  applicableProducts: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date

  // Méthodes du modèle
  isValid(currentDate?: Date): boolean
  getStatus(currentDate?: Date): string
  incrementUsage(): Promise<number>
  isApplicableTo(productId?: string, categoryId?: string): boolean
}

const DiscountSchema = new Schema<DiscountDocument>(
  {
    name: {
      fr: {
        type: String,
        required: [true, "Le nom en français est requis"],
        trim: true,
        minlength: [3, "Le nom doit contenir au moins 3 caractères"]
      },
      ar: {
        type: String,
        required: [true, "Le nom en arabe est requis"],
        trim: true,
        minlength: [3, "الاسم يجب أن يحتوي على 3 أحرف على الأقل"]
      }
    },
    type: {
      type: String,
      enum: ["PERCENTAGE", "BUY_X_GET_Y", "COUPON"],
      required: [true, "Le type de promotion est requis"]
    },
    value: {
      type: Number,
      min: [0, "La valeur doit être positive"],
      validate: {
        validator: function (this: DiscountDocument, val: number) {
          if ((this.type === "PERCENTAGE" || this.type === "COUPON") && !val)
            return false
          if (this.type === "PERCENTAGE" && (val < 0 || val > 100)) return false
          if (this.type === "COUPON" && val <= 0) return false
          return true
        },
        message: "La valeur est invalide pour ce type de promotion"
      }
    },
    buyQuantity: {
      type: Number,
      min: [1, "La quantité doit être au moins 1"],
      validate: {
        validator: function (this: DiscountDocument, val: number) {
          if (this.type === "BUY_X_GET_Y" && !val) return false
          return true
        },
        message: "La quantité à acheter est requise pour ce type de promotion"
      }
    },
    getQuantity: {
      type: Number,
      min: [1, "La quantité doit être au moins 1"],
      validate: {
        validator: function (this: DiscountDocument, val: number) {
          if (this.type === "BUY_X_GET_Y" && !val) return false
          return true
        },
        message: "La quantité offerte est requise pour ce type de promotion"
      }
    },
    couponCode: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
      unique: true,
      validate: {
        validator: function (this: DiscountDocument, val: string) {
          if (this.type === "COUPON" && !val) return false
          if (val && !/^[A-Z0-9]{4,20}$/.test(val)) return false
          return true
        },
        message:
          "Le code promo doit contenir entre 4 et 20 caractères alphanumériques"
      }
    },
    description: {
      fr: {
        type: String,
        trim: true,
        maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
        default: ""
      },
      ar: {
        type: String,
        trim: true,
        maxlength: [500, "الوصف لا يمكن أن يتجاوز 500 حرف"],
        default: ""
      }
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (this: DiscountDocument, val: Date) {
          if (val && this.startDate && val <= this.startDate) return false
          return true
        },
        message: "La date de fin doit être après la date de début"
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    usageLimit: {
      type: Number,
      min: [1, "La limite d'utilisation doit être au moins 1"],
      validate: {
        validator: function (this: DiscountDocument, val: number) {
          if (this.type === "COUPON" && (!val || val <= 0)) return false
          return true
        },
        message: "La limite d'utilisation est requise pour les codes promo"
      },
      default: null
    },
    usageCount: {
      type: Number,
      min: [0, "Le nombre d'utilisations doit être positif"],
      default: 0
    },
    minimumPurchase: {
      type: Number,
      min: [0, "Le montant minimum doit être positif"],
      validate: {
        validator: function (this: DiscountDocument, val: number) {
          if (this.type === "COUPON" && (!val || val <= 0)) return false
          if (this.type === "COUPON" && this.value && val && this.value >= val) {
            return false
          }
          return true
        },
        message: "Le montant minimum est requis pour les codes promo et doit être supérieur au montant de réduction"
      },
      default: null
    },
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
      }
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ]
  },
  {
    timestamps: true, // ✅ important pour avoir createdAt et updatedAt
    suppressReservedKeysWarning: true // ✅ pour supprimer ton warning mongoose
  }
)

// Index
DiscountSchema.index({ isActive: 1 })
DiscountSchema.index({ type: 1 })
DiscountSchema.index({ startDate: 1, endDate: 1 })
DiscountSchema.index({ "name.fr": "text", "name.ar": "text" })

// --- Méthodes ---
DiscountSchema.methods.isValid = function (currentDate: Date = new Date()) {
  if (!this.isActive) return false
  if (this.startDate && currentDate < this.startDate) return false
  if (this.endDate && currentDate > this.endDate) return false
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false
  return true
}

DiscountSchema.methods.getStatus = function (currentDate: Date = new Date()) {
  if (!this.isActive) return "inactive"
  if (this.endDate && currentDate > this.endDate) return "expired"
  if (this.startDate && currentDate < this.startDate) return "upcoming"
  if (this.usageLimit && this.usageCount >= this.usageLimit)
    return "limit_reached"
  return "active"
}

DiscountSchema.methods.incrementUsage = async function (): Promise<number> {
  this.usageCount += 1
  await this.save()
  return this.usageCount
}

DiscountSchema.methods.isApplicableTo = function (
  productId?: string,
  categoryId?: string
): boolean {
  if (
    (!this.applicableProducts || this.applicableProducts.length === 0) &&
    (!this.applicableCategories || this.applicableCategories.length === 0)
  ) {
    return true
  }

  if (productId && this.applicableProducts.length > 0) {
    return this.applicableProducts.some(
      (p: mongoose.Types.ObjectId) => p.toString() === productId.toString()
    )
  }

  if (categoryId && this.applicableCategories.length > 0) {
    return this.applicableCategories.some(
      (c: mongoose.Types.ObjectId) => c.toString() === categoryId.toString()
    )
  }

  return false
}

// Middleware pre-save
DiscountSchema.pre<DiscountDocument>("save", function (next) {
  if (this.type === "PERCENTAGE") {
    if (!this.value || this.value <= 0 || this.value > 100) {
      return next(new Error("Le pourcentage doit être entre 1 et 100"))
    }
  } else if (this.type === "BUY_X_GET_Y") {
    if (!this.buyQuantity || !this.getQuantity) {
      return next(
        new Error("Les quantités sont requises pour ce type de promotion")
      )
    }
  } else if (this.type === "COUPON") {
    if (!this.couponCode) {
      return next(
        new Error("Le code promo est requis pour ce type de promotion")
      )
    }
    if (!this.value || this.value <= 0) {
      return next(new Error("La valeur du coupon doit être positive"))
    }
    if (!this.usageLimit || this.usageLimit <= 0) {
      return next(new Error("La limite d'utilisation est requise pour les codes promo"))
    }
    if (!this.minimumPurchase || this.minimumPurchase <= 0) {
      return next(new Error("Le montant minimum du panier est requis pour les codes promo"))
    }
    if (this.value >= this.minimumPurchase) {
      return next(new Error("Le montant de réduction doit être inférieur au montant minimum du panier"))
    }
  }

  next()
})

const Discount: Model<DiscountDocument> =
  mongoose.models.Discount ||
  mongoose.model<DiscountDocument>("Discount", DiscountSchema)

export default Discount
