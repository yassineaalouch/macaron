"use client"

import { PackageX } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

interface EmptyStateProps {
  searchQuery?: string
}

export function EmptyState({ searchQuery }: EmptyStateProps) {
  const t = useTranslations("PacksPage.emptyState")
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-lg">
      <div className="mb-6 rounded-full bg-firstColor/10 p-6">
        <PackageX className="h-16 w-16 text-firstColor" />
      </div>
      <h3 className="mb-2 text-2xl font-bold text-gray-900">
        {t("title")}
      </h3>
      <p className="mb-6 max-w-md text-gray-600">
        {searchQuery ? (
          <>{t("withSearch", { query: searchQuery })}</>
        ) : (
          <>{t("withoutSearch")}</>
        )}
      </p>
      <Link
        href="/packs"
        className="rounded-lg bg-firstColor px-6 py-3 font-medium text-white transition-colors hover:bg-secondColor"
      >
        {t("resetFilters")}
      </Link>
    </div>
  )
}
