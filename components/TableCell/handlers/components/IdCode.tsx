import React from "react"
import Link from "next/link"

interface IdCodeProps {
  value: any
  t: string
  q: string
  platform?: "ios" | "android"
}

export function IdCode({
  value,
  t,
  q = "mediaComponentId",
  platform = "ios",
}: IdCodeProps) {
  if (!value || (typeof value !== "string" && typeof value !== "number")) {
    return String(value || "")
  }

  const href = `/${platform}?t=${t}&q=${q}`
  return (
    <div className="flex items-center space-x-2">
      <Link
        href={href}
        className="flex items-center space-x-1 px-2 py-1 rounded text-sm font-medium transition-colors cursor-pointer bg-blue-100 hover:bg-blue-200"
      >
        <span>🔗</span>
        <span>{value}</span>
      </Link>
    </div>
  )
}
