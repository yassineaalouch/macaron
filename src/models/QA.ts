import mongoose, { Schema, Document, Model } from "mongoose"

export interface ILocalizedText {
  ar: string
  fr: string
}

export interface IQA extends Document {
  question: ILocalizedText
  answer: ILocalizedText
}

const LocalizedTextSchema = new Schema<ILocalizedText>(
  {
    ar: { type: String, required: true },
    fr: { type: String, required: true }
  },
  { _id: false }
)

const QASchema = new Schema<IQA>(
  {
    question: { type: LocalizedTextSchema, required: true },
    answer: { type: LocalizedTextSchema, required: true }
  },
  { timestamps: true }
)

export const QA: Model<IQA> =
  mongoose.models.QA || mongoose.model<IQA>("QA", QASchema)
