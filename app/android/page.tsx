"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Layout from "../../components/Layout"
import Sidebar from "../../components/Sidebar"
import TableViewer from "../../components/TableViewer"

interface TableInfo {
  name: string
  columns: Array<{
    name: string
    type: string
    notnull: boolean
    dflt_value: any
    pk: boolean
  }>
  rowCount: number
}

interface AndroidSchema {
  tables: TableInfo[]
}

export default function AndroidBrowser() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [schema, setSchema] = useState<AndroidSchema | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/data/android/schema.json")
      .then((res) => res.json())
      .then((data: AndroidSchema) => {
        setSchema(data)
        setLoading(false)

        // Initialize selected table from URL params
        const tableParam = searchParams.get("t")
        if (
          tableParam &&
          data.tables.some((table) => table.name === tableParam)
        ) {
          setSelectedTable(tableParam)
        }
      })
      .catch((err) => {
        console.error("Failed to load Android schema:", err)
        setError("Failed to load database schema")
        setLoading(false)
      })
  }, [searchParams])

  useEffect(() => {
    if (selectedTable) {
      setLoading(true)
      fetch(`/data/android/${selectedTable}.json`)
        .then((res) => res.json())
        .then((data) => {
          setTableData(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error(`Failed to load table ${selectedTable}:`, err)
          setError(`Failed to load table: ${selectedTable}`)
          setLoading(false)
        })
    }
  }, [selectedTable])

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName)
    const params = new URLSearchParams(searchParams.toString())
    params.set("t", tableName)
    params.delete("q") // Clear search query when changing tables
    router.replace(`/android?${params.toString()}`)
  }

  const sidebarItems =
    schema?.tables.map((table) => ({
      name: table.name,
      count: table.rowCount,
    })) || []

  return (
    <Layout>
      <div className="h-full flex items-center justify-center">
        <div className="w-80 flex-shrink-0 h-full">
          <Sidebar
            items={sidebarItems}
            selectedItem={selectedTable}
            onItemSelect={handleTableSelect}
            title="Android DB"
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
              {selectedTable ? (
                loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading table data...</p>
                  </div>
                ) : (
                  <TableViewer
                    key={selectedTable}
                    data={tableData}
                    title={selectedTable}
                    tableName={selectedTable}
                    platform="android"
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
