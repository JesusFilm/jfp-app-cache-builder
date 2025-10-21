import { Inter } from "next/font/google"
import { ReactNode } from "react"

import type { Metadata } from "next"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "App Cache | Jesus Film Project",
  description: "Browse and download Jesus Film Project app cache databases",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  )
}
