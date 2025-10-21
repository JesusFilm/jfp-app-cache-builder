"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useMemo, useEffect } from "react"

import SearchBar from "../SearchBar"
import TableCell from "../TableCell"

interface TableViewerProps {
  data: Record<string, unknown>[]
  tableName: string
  platform: "ios" | "android"
}

export default function TableViewer({
  data,
  tableName,
  platform,
}: TableViewerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)

  // Initialize search query from URL params
  useEffect(() => {
    const queryParam = searchParams.get("q")
    if (queryParam) {
      setSearchQuery(queryParam)
    }
  }, [searchParams])

  const detectedColumns = useMemo(() => {
    const firstRow = data[0]
    if (!firstRow) return []
    return Object.keys(firstRow)
  }, [data])

  const filteredData = useMemo(() => {
    if (!searchQuery) return data

    // Check if search query uses columnname:"value" syntax
    const columnSearchMatch = searchQuery.match(/^(\w+):"([^"]*)"$/)

    if (columnSearchMatch) {
      const [, columnName, searchValue] = columnSearchMatch
      const lowerSearchValue = searchValue?.toLowerCase() || ""

      return data.filter((row) => {
        if (!columnName) return false
        const columnValue = row[columnName]
        if (columnValue === null || columnValue === undefined) return false
        return String(columnValue).toLowerCase() === lowerSearchValue
      })
    }

    // Default search across all columns
    return data.filter((row) =>
      Object.values(row).some((value) => {
        return String(value).toLowerCase().includes(searchQuery.toLowerCase())
      })
    )
  }, [data, searchQuery])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set("q", query)
    } else {
      params.delete("q")
    }
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  const showPagination = totalPages > 1

  return (
    <div className="bg-white h-full w-full">
      <div className="border-b border-gray-200 flex justify-between items-center">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900">{tableName}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredData.length !== data.length ? (
              <>
                {filteredData.length.toLocaleString()} of{" "}
                {data.length.toLocaleString()} rows
              </>
            ) : (
              <>{data.length.toLocaleString()} rows</>
            )}
          </p>
        </div>
        <SearchBar
          onSearch={handleSearch}
          initialValue={searchQuery}
          availableColumns={detectedColumns}
        />
      </div>
      {/* 65px for header, 85px for search bar, 55px for pagination */}
      <div
        className={`overflow-auto bg-gray-200 ${showPagination ? "max-h-[calc(100vh-65px-85px-55px)]" : "max-h-[calc(100vh-65px-85px)]"}`}
      >
        <table
          className="divide-y divide-gray-200"
          style={{ minWidth: "max-content" }}
        >
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {detectedColumns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-gray-500 font-bold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {detectedColumns.map((column) => {
                  const value = row[column]

                  return (
                    <TableCell
                      key={`${tableName}-${column}-${currentPage}-${index}`}
                      value={value}
                      tableName={tableName}
                      columnName={column}
                      platform={platform}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} rows
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
