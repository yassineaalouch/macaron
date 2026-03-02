
import mongoose from "mongoose"

const PackProductSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true
  }
})

const OrderItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  discount: {
    type: String,
    default: null
  },
  lineTotal: {
    type: Number,
    default: null
  },
  discountLabel: {
    type: String,
    default: null
  },
  buyQuantity: { type: Number, default: null },
  getQuantity: { type: Number, default: null },
  characteristic: [
    {
      name: String,
      value: String
    }
  ],
  type: {
    type: String,
    enum: ["product", "pack"]
  },
  // Champs spécifiques aux packs
  discountPrice: {
    type: Number,
    min: 0
  },
  items: [PackProductSchema] // Uniquement pour les packs
})

const OrderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Le nom du client est requis"],
      trim: true,
      minlength: [2, "Le nom doit contenir au moins 2 caractères"]
    },
    customerPhone: {
      type: String,
      required: [true, "Le numéro de téléphone est requis"],
      trim: true,
      match: [
        /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
        "Numéro de téléphone invalide"
      ]
    },
    customerAddress: {
      type: String,
      required: [true, "L'adresse du client est requise"],
      trim: true
    },
    orderNumber: {
      type: String,
      unique: true
    },
    items: [OrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    shipping: {
      type: Number,
      required: true,
      min: 0
    },
    coupon: {
      type: { code: String, discountType: String, value: Number },
      default: null
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "rejected",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ],
      default: "pending"
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: [
        "Carte bancaire",
        "PayPal",
        "Virement bancaire",
        "À la livraison",
        "Chèque"
      ],
      default: "À la livraison"
    },
    shippingMethod: {
      type: String,
      required: true,
      default: "Livraison standard"
    },
    notes: {
      type: String,
      default: ""
    },
    orderDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true
  }
)

// Middleware pour générer automatiquement le numéro de commande
OrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const year = new Date().getFullYear()
    const count = await mongoose.model("Order").countDocuments()
    this.orderNumber = `CMD-${year}-${(count + 1).toString().padStart(4, "0")}`
  }
  next()
})

export default mongoose.models.Order || mongoose.model("Order", OrderSchema)
