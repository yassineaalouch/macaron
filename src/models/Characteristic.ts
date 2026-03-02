import {
  ICharacteristic,
  ICharacteristicValue,
  LocalizedName
} from "@/types/characteristic"
import mongoose, { Schema, Model } from "mongoose"

export const LocalizedNameSchema = new Schema<LocalizedName>(
  {
    ar: { type: String, required: true, trim: true },
    fr: { type: String, required: true, trim: true }
  },
  { _id: false } // évite un sous-ID inutile
)

export const CharacteristicValueSchema = new Schema<ICharacteristicValue>(
  {
    name: { type: LocalizedNameSchema, required: true }
  },
  { _id: true }
)

// ----------------------
// 🔹 Schéma principal
// ----------------------

export const CharacteristicSchema = new Schema<ICharacteristic>(
  {
    name: { type: LocalizedNameSchema, required: true },
    values: { type: [CharacteristicValueSchema], default: [] }
  },
  { timestamps: true }
)

// ----------------------
// 🔹 Modèle Mongoose
// ----------------------

export const Characteristic: Model<ICharacteristic> =
  mongoose.models.Characteristic ||
  mongoose.model<ICharacteristic>("Characteristic", CharacteristicSchema)

export default Characteristic
