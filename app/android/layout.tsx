import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Android Cache Browser | Jesus Film Project",
  description: "Browse Android SQLite database contents",
}

export default function AndroidLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
