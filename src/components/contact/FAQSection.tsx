"use client"

import React, { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import axios from "axios"
import SiteInfoButtons from "./SiteInfoButtons"
import { useToast } from "@/components/ui/Toast"

export interface FAQ {
  _id: string
  question: { ar: string; fr: string }
  answer: { ar: string; fr: string }
}

const FAQSection: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
  const locale = useLocale()
  const t = useTranslations("ContactPage.FAQSection")
  const { showToast } = useToast()

  useEffect(() => {
    fetchFAQs()
  }, [])

  async function fetchFAQs() {
    try {
      const res = await axios.get("/api/qa")
      if (res.data.success) {
        setFaqs(res.data.data)
      } else {
        showToast(res.data.message || "Erreur lors du chargement des FAQ", "error")
      }
    } catch (error) {
      showToast("Erreur lors du chargement des questions fréquentes", "error")
    }
  }

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id)
  }

  return (
    <section className="bg-secondColor/30 shadow-lg p-8 border border-firstColor/20">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <HelpCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {t("header.title")}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {t("header.subtitle")}
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {faqs.length === 0 && (
          <p className="text-center text-gray-500 py-6">{t("loading")}</p>
        )}

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq._id}
              className="border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <button
                className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center"
                onClick={() => toggleFAQ(faq._id)}
              >
                <h3 className="text-lg font-semibold text-gray-800 pr-4">
                  {faq.question[locale as "fr" | "ar"]}
                </h3>
                <div className="flex-shrink-0">
                  {openFAQ === faq._id ? (
                    <ChevronUp className="text-green-600" size={24} />
                  ) : (
                    <ChevronDown className="text-gray-400" size={24} />
                  )}
                </div>
              </button>

              {openFAQ === faq._id && (
                <div className="px-6 py-4 bg-paletteCream/80 border-t border-firstColor/20">
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer[locale as "fr" | "ar"]}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-green-50 text-center">
          <h3 className="text-xl font-semibold text-green-800 mb-3">
            {t("contact.title")}
          </h3>
          <p className="text-green-700 mb-4">{t("contact.subtitle")}</p>
          <SiteInfoButtons />
        </div>
      </div>
    </section>
  )
}

export default FAQSection
