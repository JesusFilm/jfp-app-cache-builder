"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <Image
                  src="/jfp-app-cache-builder/assets/logo.png"
                  alt="JFP Logo"
                  width={32}
                  height={32}
                  className="rounded"
                />
                <span className="text-xl font-bold text-gray-900">
                  JFP App Cache
                </span>
              </Link>
            </div>

            <nav className="flex space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/" || pathname === ""
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Home
              </Link>
              <Link
                href="/android"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/android" || pathname === "/android/"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Android DB
              </Link>
              <Link
                href="/ios"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/ios" || pathname === "/ios/"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                iOS DB
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="h-[calc(100vh-64px)] overflow-auto w-full">
        {children}
      </main>
    </div>
  )
}
