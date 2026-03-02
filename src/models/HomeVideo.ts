import mongoose, { Document, Schema } from "mongoose"

export interface HomeVideoDocument extends Document {
  // Type de source de la vidéo
  sourceType: "upload" | "youtube"

  // URL de la vidéo YouTube (si sourceType === "youtube")
  youtubeUrl?: string

  // URL de la vidéo hébergée sur S3 (si sourceType === "upload")
  videoUrl?: string

  // Activer / désactiver la section sur la page d'accueil
  isActive: boolean

  // Champ singleton pour garantir un seul document
  singleton: string

  createdAt: Date
  updatedAt: Date
}

const HomeVideoSchema = new Schema<HomeVideoDocument>(
  {
    sourceType: {
      type: String,
      enum: ["upload", "youtube"],
      required: [true, "Le type de source de la vidéo est requis"],
      default: "upload"
    },
    youtubeUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true
          // Autoriser les URLs YouTube/Youtu.be classiques
          return (
            v.startsWith("https://www.youtube.com/") ||
            v.startsWith("https://youtube.com/") ||
            v.startsWith("https://youtu.be/")
          )
        },
        message: "L'URL YouTube n'est pas valide"
      }
    },
    videoUrl: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    singleton: {
      type: String,
      default: "home_video",
      unique: true,
      immutable: true
    }
  },
  {
    timestamps: true
  }
)

const HomeVideo =
  mongoose.models.HomeVideo ||
  mongoose.model<HomeVideoDocument>("HomeVideo", HomeVideoSchema)

export default HomeVideo

