import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "@/app/globals.css"
import { NextIntlClientProvider } from "next-intl"
import { routing } from "@/i18n/routing"
import { getMessages } from "next-intl/server"
import { ReactNode, ReactElement } from "react"
import { ToastProvider } from "@/components/ui/Toast"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: "Dashboard"
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}): Promise<ReactElement> {
  const { locale } = await params
  const messages = await getMessages({ locale })
  const direction = locale === "ar" ? "rtl" : "ltr"

  return (
    <html lang={locale} dir={direction}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>
            <div className="min-h-screen">{children}</div>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
