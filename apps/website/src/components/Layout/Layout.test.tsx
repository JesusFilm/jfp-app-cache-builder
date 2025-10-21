import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import Layout from "."

describe("Layout Component", () => {
  it("renders without crashing", () => {
    render(<Layout>Test content</Layout>)
    expect(screen.getByText("Test content")).toBeInTheDocument()
  })
})
