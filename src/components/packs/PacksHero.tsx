 "use client"

import { useTranslations } from "next-intl"
import Image from "next/image"

export function PacksHero() {
  const t = useTranslations("PacksPage.hero")

  const backgroundImage =
    "/puck.jpg"

  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-paletteCream">
      {/* Background image comme le hero home */}
      <div className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt="Packs hero background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center text-white">
          <h1 className="mb-4 text-4xl md:text-5xl lg:text-6xl font-lux text-white">
            {t("title")}
          </h1>
          <p className="text-lg md:text-xl text-white opacity-90">
            {t("subtitle")}
          </p>
        </div>
      </div>
    </section>
  )
}

// "use client"

// import { useTranslations } from "next-intl"

// export function PacksHero() {
//   const t = useTranslations("PacksPage.hero")
  
//   return (
//     <section className="relative overflow-hidden bg-paletteCream py-16 md:py-24">
//       <div className="absolute inset-0 opacity-10" />
//       <div className="container relative mx-auto px-4">
//         <div className="mx-auto max-w-3xl text-center text-[#413e3b">
//           <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">
//             {t("title")}
//           </h1>
//           <p className="text-lg md:text-xl opacity-90">
//             {t("subtitle")}
//           </p>
//         </div>
//       </div>
//       {/* Decorative waves */}
//     </section>
//   )
// }

