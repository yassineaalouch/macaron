// types/qa.ts

export interface ILocalizedText {
  ar: string
  fr: string
}

export interface IQA {
  _id?: string
  question: ILocalizedText
  answer: ILocalizedText
  createdAt?: string
}

