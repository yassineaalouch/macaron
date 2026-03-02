import mongoose from "mongoose"

const SiteInfoSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'email est requis"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Format d'email invalide"]
    },
    phone: {
      type: String,
      required: [true, "Le numéro de téléphone est requis"],
      trim: true
    },
    location: {
      fr: {
        type: String,
        required: [true, "L'adresse en français est requise"],
        trim: true
      },
      ar: {
        type: String,
        required: [true, "L'adresse en arabe est requise"],
        trim: true
      }
    }
  },
  {
    timestamps: true
  }
)

// Ensure only one document exists
SiteInfoSchema.statics.getSiteInfo = async function () {
  let siteInfo = await this.findOne()
  if (!siteInfo) {
    siteInfo = await this.create({
      email: "contact@macarons.com",
      phone: "+212 6XX XXX XXX",
      location: {
        fr: "Adresse à configurer",
        ar: "العنوان للتكوين"
      }
    })
  }
  return siteInfo
}

export default mongoose.models.SiteInfo || mongoose.model("SiteInfo", SiteInfoSchema)

