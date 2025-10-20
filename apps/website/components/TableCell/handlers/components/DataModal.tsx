import React, { useState } from "react"

interface DataModalProps {
  value: any
  title?: string
}

export function DataModal({ value, title = "Data" }: DataModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Decode base64 data if it's a string
  const decodeData = (data: any): any => {
    if (typeof data === "string") {
      if (data === "") return null

      try {
        // Try to decode as base64
        const decoded = Buffer.from(data, "base64").toString("utf-8")
        // Try to parse as JSON
        return JSON.parse(decoded)
      } catch {
        // If decoding/parsing fails, return original data
        return data
      }
    }
    return data
  }

  const decodedValue = decodeData(value)

  if (decodedValue == null) {
    return ""
  }

  // Handle different data types
  const getRecordCount = (data: any): number => {
    if (Array.isArray(data)) {
      return data.length
    }
    if (typeof data === "object" && data !== null) {
      return Object.keys(data).length
    }
    return 1
  }

  const getTableData = (data: any): any[] => {
    if (Array.isArray(data)) {
      return data
    }
    if (typeof data === "object" && data !== null) {
      return [data]
    }
    return [{ value: data }]
  }

  const getColumns = (data: any[]): string[] => {
    if (data.length === 0) return []

    // Get all unique keys from all objects
    const allKeys = new Set<string>()
    data.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        Object.keys(item).forEach((key) => allKeys.add(key))
      }
    })

    return Array.from(allKeys)
  }

  const recordCount = getRecordCount(decodedValue)
  const tableData = getTableData(decodedValue)
  const columns = getColumns(tableData)

  const formatCellValue = (val: any): string => {
    if (val === null || val === undefined) return ""
    if (typeof val === "object") {
      return JSON.stringify(val)
    }
    return String(val)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer"
      >
        {recordCount} record{recordCount !== 1 ? "s" : ""}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] w-full mx-4 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer py-1 px-2"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {tableData.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No data available
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column}
                          className="px-6 py-3 text-left font-bold text-gray-500"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {columns.map((column) => (
                          <td
                            key={column}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            <div
                              className="max-w-xs truncate"
                              title={formatCellValue(row[column])}
                            >
                              {formatCellValue(row[column])}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500">
                Showing {tableData.length} record
                {tableData.length !== 1 ? "s" : ""}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
