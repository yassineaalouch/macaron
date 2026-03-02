"use client"
import "@/app/globals.css"
import DashboardLayout from "@/components/dashboard/layout/DashboardLayout"
import { SessionProvider } from "next-auth/react"

export default function DashboardGlobalLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SessionProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </SessionProvider>
  )
}
