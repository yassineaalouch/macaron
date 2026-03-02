"use client"
import React, { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import axios from "axios"

interface OpeningHourDay {
  day: {
    fr: string
    ar: string
  }
  hours: {
    fr: string
    ar: string
  }
  isClosed: boolean
  order: number
}

interface OpeningHoursData {
  hours: OpeningHourDay[]
  note: {
    fr: string
    ar: string
  }
}

const OpeningHours = () => {
  const t = useTranslations("ContactPage.OpeningHours")
  const locale = useLocale()
  const [openingHoursData, setOpeningHoursData] = useState<OpeningHoursData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOpeningHours()
  }, [])

  const fetchOpeningHours = async () => {
    try {
      const { data } = await axios.get("/api/opening-hours")
      if (data.success) {
        setOpeningHoursData(data.data)
      } else {
        console.error("Erreur lors du chargement des horaires:", data.message)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des horaires:", error)
      if (axios.isAxiosError(error)) {
        console.error("Détails de l'erreur:", error.response?.data || error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-secondColor/30 shadow-lg p-8 border border-firstColor/20">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent  animate-spin" />
        </div>
      </div>
    )
  }

  if (!openingHoursData) {
    return (
      <div className="bg-secondColor/30 shadow-lg p-8 border border-firstColor/20">
        <p className="text-center text-gray-500">Aucun horaire disponible</p>
      </div>
    )
  }

  const sortedHours = [...openingHoursData.hours].sort((a, b) => a.order - b.order)

  return (
    <div className="bg-secondColor/30 shadow-lg p-8 border border-firstColor/20">
      <div className="flex items-center justify-center mb-6">
        <div className="w-20 h-20 bg-blue-500 text-white  flex items-center justify-center">
          <Clock size={40} />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
        {t("title")}
      </h3>

      <div className="space-y-3">
        {sortedHours.map((schedule, index) => {
          const hoursText = schedule.hours[locale as "fr" | "ar"]
          const isClosed = schedule.isClosed || !hoursText || hoursText.trim() === ""
          // Si fermé, afficher "Fermé" en rouge
          const displayText = isClosed
            ? locale === "fr"
              ? "Fermé"
              : "مغلق"
            : hoursText || ""
          
          return (
            <div
              key={index}
              className="flex justify-between items-center py-2 px-3 "
            >
              <span className="font-medium text-gray-700">
                {schedule.day[locale as "fr" | "ar"]}
              </span>
              <span
                className={`${
                  isClosed
                    ? "text-red-500 font-medium"
                    : "text-gray-600"
                }`}
              >
                {displayText}
              </span>
            </div>
          )
        })}
      </div>

      {openingHoursData.note && (
        <div className="mt-6 p-4 bg-green-50">
          <p className="text-sm text-green-700 text-center">
            <strong>{t("note.label")}</strong> {openingHoursData.note[locale as "fr" | "ar"]}
          </p>
        </div>
      )}
    </div>
  )
}

export default OpeningHours
