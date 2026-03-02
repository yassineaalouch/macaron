"use client"

import React, { useState } from "react"
import {
  Share2,
  Facebook,
  MessageCircle,
  Instagram,
  Link as LinkIcon,
  Copy,
  Check,
  X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/Toast"
import { useLocale } from "next-intl"

interface ShareMenuProps {
  url: string
  title: string
  description?: string
  image?: string
}

export const ShareMenu: React.FC<ShareMenuProps> = ({
  url,
  title,
  description,
  image
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()
  const locale = useLocale()

  const shareText = description || title

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(facebookUrl, "_blank", "width=600,height=400")
    setIsOpen(false)
  }

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
    window.open(whatsappUrl, "_blank")
    setIsOpen(false)
  }

  const shareOnInstagram = () => {
    // Instagram ne permet pas le partage direct via URL, on copie le lien
    copyToClipboard()
    showToast(
      locale === "fr"
        ? "Copiez le lien et partagez-le sur Instagram"
        : "انسخ الرابط وشاركه على إنستغرام",
      "info"
    )
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      showToast(
        locale === "fr" ? "Lien copié !" : "تم نسخ الرابط!",
        "success"
      )
      setTimeout(() => setCopied(false), 2000)
      setIsOpen(false)
    } catch (err) {
      showToast(
        locale === "fr"
          ? "Erreur lors de la copie"
          : "خطأ أثناء النسخ",
        "error"
      )
    }
  }

  const shareOptions = [
    {
      name: locale === "fr" ? "Facebook" : "فيسبوك",
      icon: Facebook,
      color: "bg-blue-500 hover:bg-blue-600",
      action: shareOnFacebook
    },
    {
      name: locale === "fr" ? "WhatsApp" : "واتساب",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
      action: shareOnWhatsApp
    },
    {
      name: locale === "fr" ? "Instagram" : "إنستغرام",
      icon: Instagram,
      color: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600",
      action: shareOnInstagram
    },
    {
      name: locale === "fr" ? "Copier le lien" : "نسخ الرابط",
      icon: copied ? Check : LinkIcon,
      color: copied
        ? "bg-green-500 hover:bg-green-600"
        : "bg-gray-500 hover:bg-gray-600",
      action: copyToClipboard
    }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
        aria-label={locale === "fr" ? "Partager" : "مشاركة"}
      >
        <Share2 size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 min-w-[200px]"
            >
              <div className="flex items-center justify-between mb-2 px-3 py-2 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">
                  {locale === "fr" ? "Partager sur" : "مشاركة على"}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-1">
                {shareOptions.map((option, index) => (
                  <motion.button
                    key={option.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={option.action}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 ${option.color}`}
                  >
                    <option.icon size={20} />
                    <span>{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

