import fs from "fs"
import path from "path"

import { notFound } from "next/navigation"

import Layout from "@/components/Layout"
import Sidebar from "@/components/Sidebar"
import TableViewer from "@/components/TableViewer"
import { androidSchemaData } from "@/lib/android/schema"

import type { Metadata } from "next"

interface AndroidTablePageProps {
  params: Promise<{
    table: string
  }>
}

export async function generateStaticParams() {
  return androidSchemaData.tables.map((table) => ({
    table: table.name,
  }))
}

export async function generateMetadata({
  params,
}: AndroidTablePageProps): Promise<Metadata> {
  const { table } = await params
  const tableInfo = androidSchemaData.tables.find((t) => t.name === table)

  if (!tableInfo) {
    return {
      title: "Table Not Found | Android Cache Browser",
      description: "The requested table was not found",
    }
  }

  return {
    title: `${tableInfo.name} | Android Cache Browser | Jesus Film Project`,
    description: `Browse ${tableInfo.name} table with ${tableInfo.rowCount.toLocaleString()} rows from Android SQLite database`,
  }
}

export default async function AndroidTablePage({
  params,
}: AndroidTablePageProps) {
  const { table } = await params

  // Validate table exists in schema
  const tableInfo = androidSchemaData.tables.find((t) => t.name === table)
  if (!tableInfo) {
    notFound()
  }

  // Read table data from JSON file
  const filePath = path.join(
    process.cwd(),
    "src",
    "lib",
    "android",
    "data",
    `${table}.json`
  )
  let tableData: any[] = []

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8")
    tableData = JSON.parse(fileContent)
  } catch (error) {
    console.error(`Failed to read table data for ${table}:`, error)
    notFound()
  }

  const sidebarItems = androidSchemaData.tables.map((table) => ({
    name: table.name,
    count: table.rowCount,
    href: `/android/${table.name}`,
  }))

  return (
    <Layout>
      <div className="h-full flex items-center justify-center">
        <div className="w-80 shrink-0 h-full">
          <Sidebar
            items={sidebarItems}
            selectedItem={table}
            title="Android DB"
          />
        </div>
        <div className="w-[calc(100%-var(--spacing)*80)] h-full flex flex-col items-center justify-center">
          <TableViewer
            data={tableData}
            title={table}
            tableName={table}
            platform="android"
          />
        </div>
      </div>
    </Layout>
  )
}
