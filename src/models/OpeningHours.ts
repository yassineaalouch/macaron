// models/OpeningHours.ts
import mongoose from "mongoose"

const OpeningHourDaySchema = new mongoose.Schema({
  day: {
    fr: {
      type: String,
      required: [true, "Le nom du jour en français est requis"],
      trim: true
    },
    ar: {
      type: String,
      required: [true, "Le nom du jour en arabe est requis"],
      trim: true
    }
  },
  hours: {
    fr: {
      type: String,
      required: false, // Validation faite côté API
      trim: true,
      default: ""
    },
    ar: {
      type: String,
      required: false, // Validation faite côté API
      trim: true,
      default: ""
    }
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  }
})

const OpeningHoursSchema = new mongoose.Schema(
  {
    hours: {
      type: [OpeningHourDaySchema],
      required: true,
      validate: {
        validator: function (v: typeof OpeningHourDaySchema[]) {
          return v.length === 7 // 7 jours de la semaine
        },
        message: "7 jours sont requis"
      }
    },
    note: {
      fr: {
        type: String,
        default: "Nous sommes également disponibles sur rendez-vous en dehors de ces horaires."
      },
      ar: {
        type: String,
        default: "نحن متاحون أيضًا بموعد خارج هذه الساعات."
      }
    },
    // Ce champ garantit qu'il n'y a qu'un seul document
    singleton: {
      type: String,
      default: "opening_hours",
      unique: true,
      immutable: true
    }
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true
  }
)

export default mongoose.models.OpeningHours ||
  mongoose.model("OpeningHours", OpeningHoursSchema)

