"use client"

import { useLocale } from "next-intl"
import { usePathname } from "@/i18n/navigation"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function LanguageToggle() {
  const locale = useLocale() // "fr" ou "ar"
  const pathname = usePathname() || "/" // pathname sans locale: "/" ou "/packs"
  const router = useRouter() // Router de Next.js standard
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)

  const otherLocale = locale === "fr" ? "ar" : "fr"

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLocaleChange = () => {
    if (!mounted) return

    // Obtient le pathname complet avec le locale depuis window.location
    const fullPathname = window.location.pathname
    
    // Remplace le locale dans le pathname
    // Ex: "/ar" -> "/fr", "/ar/packs" -> "/fr/packs"
    const newPathname = fullPathname.replace(/^\/(fr|ar)/, `/${otherLocale}`)
    
    // Ajoute les query params s'ils existent
    const queryString = searchParams.toString()
    const fullPath = queryString ? `${newPathname}?${queryString}` : newPathname
    
    // Navigue vers le nouveau chemin sans refresh complet
    router.push(fullPath)
  }

  return (
    <button
      onClick={handleLocaleChange}
      className="px-2 py-1 text-sm rounded border text-[#413e3b] border-[#413e3b] hover:border-black hover:text-black transition-colors"
    >
      {otherLocale.toUpperCase()}
    </button>
  )
}
