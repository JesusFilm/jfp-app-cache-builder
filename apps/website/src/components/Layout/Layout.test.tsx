import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, it, expect, vi } from "vitest"

import Layout from "."

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))

describe("Layout website", () => {
  it("renders website homepage successfully", () => {
    render(<Layout>Test content</Layout>)
    expect(screen.getByText("JFP App Cache")).toBeInTheDocument()
  })
})
