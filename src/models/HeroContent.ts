// models/HeroContent.ts
import mongoose from "mongoose"

const SocialLinkSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true
  },
  className: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  }
})

const HeroContentSchema = new mongoose.Schema(
  {
    title: {
      ar: {
        type: String,
        required: [true, "Le titre en arabe est requis"],
        trim: true
      },
      fr: {
        type: String,
        required: [true, "Le titre en français est requis"],
        trim: true
      }
    },
    description: {
      ar: {
        type: String,
        required: [true, "La description en arabe est requise"],
        trim: true
      },
      fr: {
        type: String,
        required: [true, "La description en français est requise"],
        trim: true
      }
    },
    button: {
      ar: {
        type: String,
        required: [true, "Le texte du bouton en arabe est requis"],
        trim: true
      },
      fr: {
        type: String,
        required: [true, "Le texte du bouton en français est requis"],
        trim: true
      }
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length > 0
        },
        message: "Au moins une image est requise"
      }
    },
    socialLinks: {
      type: [SocialLinkSchema],
      default: []
    },
    // Ce champ garantit qu'il n'y a qu'un seul document
    singleton: {
      type: String,
      default: "hero_content",
      unique: true,
      immutable: true
    }
  },
  {
    timestamps: true, // ✅ important pour avoir createdAt et updatedAt
    suppressReservedKeysWarning: true // ✅ pour supprimer ton warning mongoose
  }
)

export default mongoose.models.HeroContent ||
  mongoose.model("HeroContent", HeroContentSchema)
