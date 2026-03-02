"use client"

import React, { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/Toast"

interface SiteInfo {
  email: string
  phone: string
}

export default function SiteInfoButtons() {
  const t = useTranslations("ContactPage.FAQSection")
  const { showToast } = useToast()
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)

  useEffect(() => {
    fetchSiteInfo()
  }, [])

  const fetchSiteInfo = async () => {
    try {
      const response = await fetch("/api/site-info")
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération")
      }
      const data = await response.json()
      if (data.success) {
        setSiteInfo(data.siteInfo)
      } else {
        showToast(data.message || "Erreur lors du chargement", "error")
      }
    } catch (error) {
      showToast("Erreur lors du chargement des informations", "error")
    }
  }

  const phone = siteInfo?.phone || "+212 670366581"
  const email = siteInfo?.email || "Denon_taha@hotmail.fr"

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <a
        href={`tel:${phone}`}
        className="bg-firstColor text-gray-900 px-6 py-3 rounded-lg hover:bg-firstColor/90 transition-colors duration-300 font-semibold"
      >
        {t("contact.callButton")}
      </a>
      <a
        href={`mailto:${email}`}
        className="bg-white text-firstColor border-2 border-firstColor px-6 py-3 rounded-lg hover:bg-firstColor hover:text-gray-900 transition-colors duration-300 font-semibold"
      >
        {t("contact.emailButton")}
      </a>
    </div>
  )
}

