import { ReactNode } from "react"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "iOS Cache Browser | Jesus Film Project",
  description: "Browse iOS Realm database contents",
}

export default function IOSLayout({ children }: { children: ReactNode }) {
  return children
}
