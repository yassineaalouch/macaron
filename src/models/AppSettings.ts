import mongoose from "mongoose"

const AppSettingsSchema = new mongoose.Schema(
  {
    lowStockThreshold: {
      type: Number,
      required: true,
      default: 15,
      min: [1, "Le seuil doit être au moins 1"],
      max: [1000, "Le seuil ne peut pas dépasser 1000"]
    }
  },
  { timestamps: true }
)

// Un seul document de paramètres (singleton)
AppSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({ lowStockThreshold: 15 })
  }
  return settings
}

export type AppSettingsDocument = mongoose.InferSchemaType<
  typeof AppSettingsSchema
> & { _id: mongoose.Types.ObjectId }

export default mongoose.models.AppSettings ||
  mongoose.model("AppSettings", AppSettingsSchema)
