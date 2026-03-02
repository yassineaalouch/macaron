"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { User, MapPin, Phone, ShoppingCart, Truck } from "lucide-react"
import { CheckoutFormProps, CheckoutFormData, FormErrors } from "@/types/type"

// Clé pour le localStorage
const CHECKOUT_FORM_STORAGE_KEY = "couture-checkout-form"

// Fonction pour charger les données depuis localStorage
const loadCheckoutFormFromStorage = (): CheckoutFormData => {
  if (typeof window === "undefined") {
    return {
      customerName: "",
      customerAddress: "",
      customerPhone: ""
    }
  }
  try {
    const savedData = localStorage.getItem(CHECKOUT_FORM_STORAGE_KEY)
    if (savedData) {
      return JSON.parse(savedData)
    }
  } catch (error) {
    console.error("Erreur lors du chargement des données du formulaire:", error)
  }
  return {
    customerName: "",
    customerAddress: "",
    customerPhone: ""
  }
}

// Fonction pour sauvegarder les données dans localStorage
const saveCheckoutFormToStorage = (data: CheckoutFormData): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CHECKOUT_FORM_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données du formulaire:", error)
  }
}

export default function CheckoutForm({
  onSubmit,
  isProcessing,
  total
}: CheckoutFormProps) {
  const t = useTranslations("CheckoutForm")

  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: "",
    customerAddress: "",
    customerPhone: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Charger les données depuis localStorage au montage
  useEffect(() => {
    const savedData = loadCheckoutFormFromStorage()
    setFormData(savedData)
    setIsInitialized(true)
  }, [])

  // Sauvegarder les données dans localStorage à chaque changement (après l'initialisation)
  useEffect(() => {
    if (isInitialized) {
      saveCheckoutFormToStorage(formData)
    }
  }, [formData, isInitialized])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validation nom du client
    if (!formData.customerName.trim()) {
      newErrors.customerName = t("validation.customerName.required")
    } else if (formData.customerName.trim().length < 2) {
      newErrors.customerName = t("validation.customerName.minLength")
    }

    // Validation Adresse
    if (!formData.customerAddress.trim()) {
      newErrors.customerAddress = t("validation.customerAddress.required")
    } else if (formData.customerAddress.trim().length < 2) {
      newErrors.customerAddress = t("validation.customerAddress.minLength")
    }

    // Validation numéro de téléphone
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = t("validation.customerPhone.required")
    } else if (
      !/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(
        formData.customerPhone.trim()
      )
    ) {
      newErrors.customerPhone = t("validation.customerPhone.invalid")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    if (validateForm()) {
      // Sauvegarder les données avant de soumettre
      saveCheckoutFormToStorage(formData)
      onSubmit(formData)
    }
  }

  const handleChange = (field: keyof CheckoutFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="bg-white shadow-lg p-4 sm:p-6 md:p-8 w-full max-w-full">
      {/* Header */}
      <div className="flex items-start sm:items-center mb-6">
        <div className="bg-firstColor/20 p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
          <User className="text-secondColor" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {t("header.title")}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {t("header.subtitle")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Nom du client */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-2" />
            {t("fields.customerName.label")}
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => handleChange("customerName", e.target.value)}
            className={`w-full px-3 sm:px-4 py-3 border-2  focus:ring-2 focus:ring-firstColor focus:border-transparent transition-all text-base ${
              errors.customerName
                ? "border-red-500"
                : "border-gray-300 hover:border-firstColor"
            }`}
            placeholder={t("fields.customerName.placeholder")}
            disabled={isProcessing}
          />
          {errors.customerName && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mt-2 flex items-start"
            >
              <span className="mr-1 flex-shrink-0">⚠️</span>
              <span className="break-words">{errors.customerName}</span>
            </motion.p>
          )}
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-2" />
            {t("fields.customerAddress.label")}
          </label>
          <input
            type="text"
            value={formData.customerAddress}
            onChange={(e) => handleChange("customerAddress", e.target.value)}
            className={`w-full px-3 sm:px-4 py-3 border-2 focus:ring-2 focus:ring-firstColor focus:border-transparent transition-all text-base ${
              errors.customerAddress
                ? "border-red-500"
                : "border-gray-300 hover:border-firstColor"
            }`}
            placeholder={t("fields.customerAddress.placeholder")}
            disabled={isProcessing}
          />
          {errors.customerAddress && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mt-2 flex items-start"
            >
              <span className="mr-1 flex-shrink-0">⚠️</span>
              <span className="break-words">{errors.customerAddress}</span>
            </motion.p>
          )}
        </div>

        {/* Numéro de téléphone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Phone className="inline w-4 h-4 mr-2" />
            {t("fields.customerPhone.label")}
          </label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => handleChange("customerPhone", e.target.value)}
            className={`w-full px-3 sm:px-4 py-3 border-2 focus:ring-2 focus:ring-firstColor focus:border-transparent transition-all text-base ${
              errors.customerPhone
                ? "border-red-500"
                : "border-gray-300 hover:border-firstColor"
            }`}
            placeholder={t("fields.customerPhone.placeholder")}
            disabled={isProcessing}
          />
          {errors.customerPhone && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mt-2 flex items-start"
            >
              <span className="mr-1 flex-shrink-0">⚠️</span>
              <span className="break-words">{errors.customerPhone}</span>
            </motion.p>
          )}
        </div>

        {/* Informations de livraison */}
        <div className="bg-paletteCream p-3 sm:p-4 border border-firstColor/30">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
            <Truck className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-secondColor flex-shrink-0" />
            <span className="text-sm sm:text-base">{t("delivery.title")}</span>
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {t("delivery.description", {
              customerAddress:
                formData.customerAddress || t("delivery.placeholderCity"),
              customerPhone:
                formData.customerPhone || t("delivery.placeholderPhone")
            })}
          </p>
        </div>

        {/* Résumé de commande mobile */}
        <div className="lg:hidden bg-gray-50 p-3 sm:p-4 ">
          <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
            {t("summary.title")}
          </h3>
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base">{t("summary.total")}</span>
            <span className="text-lg sm:text-xl font-bold text-secondColor">
              {total.toFixed(2)}MAD
            </span>
          </div>
        </div>

        {/* Bouton de validation */}
        <motion.button
          type="submit"
          disabled={isProcessing}
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          className="w-full py-3 sm:py-4 font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-secondColor text-[#413e3b] hover:bg-[#a1b16a] hover:text-black"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              <div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-white border-t-transparent animate-spin"></div>
              <span>{t("button.processing")}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
              <span className="truncate">
                {t("button.confirm", { total: total.toFixed(2) })}
              </span>
            </div>
          )}
        </motion.button>

        {/* Note de sécurité */}
        <div className="text-center text-xs sm:text-sm text-gray-500">
          <p className="flex items-center justify-center">
            <span className="mr-1">🔒</span>
            <span>{t("security.message")}</span>
          </p>
        </div>
      </form>
    </div>
  )
}
