"use client"

import { useTranslations } from "next-intl"

interface ResultsInfoProps {
  totalPacks: number
}

export function ResultsInfo({ totalPacks }: ResultsInfoProps) {
  const t = useTranslations("PacksPage.grid")
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">
        {totalPacks > 1
          ? t("resultsPlural", { count: totalPacks })
          : t("results", { count: totalPacks })}
      </p>
    </div>
  )
}

