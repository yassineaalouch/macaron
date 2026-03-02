import { Award, Headphones, Shield, Truck } from "lucide-react"
import { useTranslations } from "next-intl"

export default function WhyChooseUs() {
  const t = useTranslations("WhyChooseUs")

  return (
    <section className="bg-secondColor/40 rounded-lg shadow-lg p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("title")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-white text-[#a1b16a] rounded-full flex items-center justify-center mx-auto mb-3">
            <Truck size={32} />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">
            {t("features.expressDelivery.title")}
          </h3>
          <p className="text-sm text-gray-600">
            {t("features.expressDelivery.description")}
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-white text-[#a1b16a] rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield size={32} />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">
            {t("features.premiumQuality.title")}
          </h3>
          <p className="text-sm text-gray-600">
            {t("features.premiumQuality.description")}
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-white text-[#a1b16a] rounded-full flex items-center justify-center mx-auto mb-3">
            <Award size={32} />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">
            {t("features.expertise.title")}
          </h3>
          <p className="text-sm text-gray-600">
            {t("features.expertise.description")}
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-white text-[#a1b16a] rounded-full flex items-center justify-center mx-auto mb-3">
            <Headphones size={32} />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">
            {t("features.dedicatedSupport.title")}
          </h3>
          <p className="text-sm text-gray-600">
            {t("features.dedicatedSupport.description")}
          </p>
        </div>
      </div>
    </section>
  )
}
