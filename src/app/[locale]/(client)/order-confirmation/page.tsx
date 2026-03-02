"use client"

import { CheckCircle, Phone, Package, Clock } from "lucide-react"
import { useTranslations } from "next-intl"

export default function ThankYouPage() {
  const t = useTranslations("thankYou")

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Icon de succès */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        </div>

        {/* Titre principal */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4">
          {t("title")}
        </h1>

        {/* Message de confirmation */}
        <p className="text-center text-gray-600 text-lg mb-8">
          {t("subtitle")}
        </p>

        {/* Carte d'information principale */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <Package className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-semibold text-gray-800 mb-2">
                {t("orderConfirmed")}
              </h2>
              <p className="text-gray-700">{t("orderMessage")}</p>
            </div>
          </div>
        </div>

        {/* Carte d'appel téléphonique */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <Phone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-semibold text-gray-800 mb-2">
                {t("phoneCallTitle")}
              </h2>
              <p className="text-gray-700 mb-3">{t("phoneCallMessage")}</p>
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">{t("timeframe")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            {t("nextStepsTitle")}
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">1.</span>
              <span>{t("step2")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">2.</span>
              <span>{t("step3")}</span>
            </li>
          </ul>
        </div>

        {/* Bouton retour */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
          >
            {t("backButton")}
          </button>
        </div>
      </div>
    </div>
  )
}
