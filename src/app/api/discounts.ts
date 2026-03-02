import { Discount, DiscountFormData, DiscountRequestBody } from "@/types/discount"
import axios from "axios"

const API_BASE = "/api/discounts"

export const getDiscounts = async (): Promise<Discount[]> => {
  const res = await axios.get(API_BASE)
  return res.data.discounts || []
}

export const createDiscount = async (
  data: DiscountFormData
): Promise<Discount> => {
  const res = await axios.post(API_BASE, data)
  return res.data
}

export const updateDiscount = async (
  id: string,
  data: DiscountFormData
): Promise<Discount> => {
  // Convert DiscountFormData to DiscountRequestBody format
  const requestBody: DiscountRequestBody = {
    name: data.name,
    type: data.type,
    value: data.value ?? undefined,
    buyQuantity: data.buyQuantity ?? undefined,
    getQuantity: data.getQuantity ?? undefined,
    couponCode: data.couponCode || undefined,
    description: data.description,
    startDate: data.startDate || undefined,
    endDate: data.endDate || undefined,
    isActive: data.isActive,
    usageLimit: data.usageLimit ?? undefined,
    minimumPurchase: data.minimumPurchase ?? undefined
  }
  const res = await axios.put(`${API_BASE}/${id}`, requestBody)
  return res.data.discount || res.data
}

export const deleteDiscount = async (
  id: string
): Promise<{ success: boolean }> => {
  const res = await axios.delete(`${API_BASE}/${id}`)
  return res.data
}

export const toggleDiscount = async (
  id: string,
  isActive: boolean
): Promise<Discount> => {
  const res = await axios.patch(`${API_BASE}/${id}`, {
    isActive: Boolean(isActive)
  })
  return res.data
}
