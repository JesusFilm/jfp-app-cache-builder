import fs from "fs"
import path from "path"

import { notFound } from "next/navigation"

import Layout from "@/components/Layout"
import Sidebar from "@/components/Sidebar"
import TableViewer from "@/components/TableViewer"
import { iosSchemaData } from "@/data/ios-schema"

import type { Metadata } from "next"

interface IOSTablePageProps {
  params: Promise<{
    table: string
  }>
}

export async function generateStaticParams() {
  return iosSchemaData.schemas.map((schema) => ({
    table: schema.name,
  }))
}

export async function generateMetadata({
  params,
}: IOSTablePageProps): Promise<Metadata> {
  const { table } = await params
  const schemaInfo = iosSchemaData.schemas.find((s) => s.name === table)

  if (!schemaInfo) {
    return {
      title: "Schema Not Found | iOS Cache Browser",
      description: "The requested schema was not found",
    }
  }

  return {
    title: `${schemaInfo.name} | iOS Cache Browser | Jesus Film Project`,
    description: `Browse ${schemaInfo.name} schema with ${schemaInfo.objectCount.toLocaleString()} objects from iOS Realm database`,
  }
}

export default async function IOSTablePage({ params }: IOSTablePageProps) {
  const { table } = await params

  // Validate schema exists in schema
  const schemaInfo = iosSchemaData.schemas.find((s) => s.name === table)
  if (!schemaInfo) {
    notFound()
  }

  // Read schema data from JSON file
  const filePath = path.join(process.cwd(), "public/data/ios", `${table}.json`)
  let schemaData: any[] = []

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8")
    schemaData = JSON.parse(fileContent)
  } catch (error) {
    console.error(`Failed to read schema data for ${table}:`, error)
    notFound()
  }

  const sidebarItems = iosSchemaData.schemas.map((schema) => ({
    name: schema.name,
    count: schema.objectCount,
    href: `/ios/${schema.name}`,
  }))

  return (
    <Layout>
      <div className="h-full flex items-center justify-center">
        <div className="w-80 shrink-0 h-full">
          <Sidebar items={sidebarItems} selectedItem={table} title="iOS DB" />
        </div>
        <div className="w-[calc(100%-var(--spacing)*80)] h-full flex flex-col items-center justify-center">
          <TableViewer
            data={schemaData}
            title={table}
            tableName={table}
            platform="ios"
          />
        </div>
      </div>
    </Layout>
  )
}
