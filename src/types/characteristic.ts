import mongoose from "mongoose"

export interface ICharacteristic {
  _id: string
  name: LocalizedName
  values: ICharacteristicValue[]
  createdAt?: string
}

export interface ProductCharacteristic {
  _id?: string
  name: ICharacteristic | mongoose.Types.ObjectId
  values: Array<{
    fr: string
    ar: string
    _id?: string
    imageUrl?: string
  }>
}

export interface SelectedCharacteristic {
  characteristicId: string | mongoose.Types.ObjectId
  characteristicName: LocalizedName
  selectedValues: ICharacteristicValue[]
}
export interface LocalizedName {
  ar: string
  fr: string
}

export interface ICharacteristicValue {
  _id?: string
  name: LocalizedName
}
