"use client"

import React, { useEffect, useState } from "react"
import { Link } from "@/i18n/navigation"
import { Home, ArrowLeft, Scissors, Package } from "lucide-react"
import type { SiteInfo } from "@/types/site-info"
import { useTranslations } from "next-intl"

const NotFoundPage: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const t = useTranslations("NotFound")
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)

  useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        const response = await fetch("/api/site-info")
        const data = await response.json()
        if (data.success && data.siteInfo) {
          setSiteInfo(data.siteInfo)
        }
      } catch {
        // silent error, fallback values will be used
      }
    }

    fetchSiteInfo()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-firstColor/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-secondColor/10 rounded-full blur-3xl animate-bounce"></div>
        <div
          className="absolute top-3/4 left-1/3 w-24 h-24 bg-yellow-300/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        <Scissors
          className="absolute top-20 right-20 text-firstColor/20 w-8 h-8 animate-spin"
          style={{ animationDuration: "8s" }}
        />
        <Package className="absolute bottom-20 left-20 text-secondColor/20 w-6 h-6 animate-bounce" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <div className="relative mb-8">
          <h1 className="text-8xl sm:text-9xl md:text-[12rem] font-bold bg-[#a1b16a] bg-clip-text text-transparent leading-none">
            404
          </h1>
          <div className="absolute inset-0 text-8xl sm:text-9xl md:text-[12rem] font-bold text-firstColor/10 blur-sm leading-none">
            404
          </div>
        </div>

        <div className="mb-8 space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {t("title")}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
            {t("description")}
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => window.history.back()}
            className="group flex items-center px-6 py-3 bg-white text-[#a1b16a] border-2 border-[#a1b16a] rounded-xl font-semibold hover:bg-firstColor hover:text-white transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <ArrowLeft
              size={20}
              className="mr-2 group-hover:-translate-x-1 transition-transform duration-300"
            />
            {t("buttons.back")}
          </button>

          <Link
            href="/"
            className="group flex items-center px-6 py-3 bg-[#a1b16a] text-white rounded-xl font-semibold hover:from-firstColor/90 hover:to-secondColor/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Home
              size={20}
              className="mr-2 group-hover:scale-110 transition-transform duration-300"
            />
            {t("buttons.home")}
          </Link>

          <Link
            href="/shop"
            className="group flex items-center px-6 py-3 bg-white text-[#a1b16a] border-2 border-[#a1b16a] rounded-xl font-semibold hover:bg-secondColor hover:text-white transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Package
              size={20}
              className="mr-2 group-hover:rotate-12 transition-transform duration-300"
            />
            {t("buttons.shop")}
          </Link>
        </div>

        {/* Message encourageant */}
        <div className="mt-8 p-4 bg-gradient-to-r from-firstColor/10 to-secondColor/10 rounded-2xl border border-firstColor/20">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-[#a1b16a]">
              {t("help.title")}
            </span>{" "}
            {t("help.phoneLabel")}{" "}
            <a
              href={`tel:${siteInfo?.phone || "+212670366581"}`}
              className="font-semibold text-[#a1b16a] hover:underline"
            >
              {siteInfo?.phone || "+212 621526099"}
            </a>{" "}
            {t("help.emailLabel")}{" "}
            <a
              href={`mailto:${siteInfo?.email || "Denon_taha@hotmail.fr"}`}
              className="font-semibold text-[#a1b16a] hover:underline"
            >
              {siteInfo?.email || "contact@macaroness.ma"}
            </a>
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © {currentYear} SWEET MACARONS - Tout pour vos macarons
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
