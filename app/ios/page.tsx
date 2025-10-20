"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Layout from "../../components/Layout"
import Sidebar from "../../components/Sidebar"
import TableViewer from "../../components/TableViewer"

interface SchemaProperty {
  name: string
  type: string
  optional: boolean
  primaryKey?: boolean
}

interface SchemaInfo {
  name: string
  properties: SchemaProperty[]
  objectCount: number
}

interface IOSSchema {
  schemas: SchemaInfo[]
}

export default function IOSBrowser() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [schema, setSchema] = useState<IOSSchema | null>(null)
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)
  const [schemaData, setSchemaData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load schema
    fetch("/data/ios/schema.json")
      .then((res) => res.json())
      .then((data: IOSSchema) => {
        setSchema(data)
        setLoading(false)

        // Initialize selected schema from URL params
        const schemaParam = searchParams.get("t")
        if (
          schemaParam &&
          data.schemas.some((schemaInfo) => schemaInfo.name === schemaParam)
        ) {
          setSelectedSchema(schemaParam)
        }
      })
      .catch((err) => {
        console.error("Failed to load iOS schema:", err)
        setError("Failed to load database schema")
        setLoading(false)
      })
  }, [searchParams])

  useEffect(() => {
    if (selectedSchema) {
      setLoading(true)
      fetch(`/data/ios/${selectedSchema}.json`)
        .then((res) => res.json())
        .then((data) => {
          setSchemaData(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error(`Failed to load schema ${selectedSchema}:`, err)
          setError(`Failed to load schema: ${selectedSchema}`)
          setLoading(false)
        })
    }
  }, [selectedSchema])

  const handleSchemaSelect = (schemaName: string) => {
    setSelectedSchema(schemaName)
    const params = new URLSearchParams(searchParams.toString())
    params.set("t", schemaName)
    params.delete("q") // Clear search query when changing tables
    router.replace(`/ios?${params.toString()}`)
  }

  const sidebarItems =
    schema?.schemas.map((schemaInfo) => ({
      name: schemaInfo.name,
      count: schemaInfo.objectCount,
    })) || []

  return (
    <Layout>
      <div className="h-full flex items-center justify-center">
        <div className="w-80 flex-shrink-0 h-full">
          <Sidebar
            items={sidebarItems}
            selectedItem={selectedSchema}
            onItemSelect={handleSchemaSelect}
            title="iOS DB"
          />
        </div>
        <div className="w-[calc(100%_-_var(--spacing)*80)] h-full flex flex-col items-center justify-center">
          {loading && !schema && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading database schema...</p>
            </>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!error && schema && (
            <>
              {selectedSchema ? (
                loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading schema data...</p>
                  </div>
                ) : (
                  <TableViewer
                    key={selectedSchema}
                    data={schemaData}
                    title={selectedSchema}
                    tableName={selectedSchema}
                    platform="ios"
                  />
                )
              ) : (
                <>
                  <div className="text-gray-400 text-6xl mb-4">🗄️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select Table
                  </h3>
                  <p className="text-gray-500">
                    Choose a table from the sidebar to view its contents
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
