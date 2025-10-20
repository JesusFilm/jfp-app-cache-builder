"use client"

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react"

interface SearchBarProps {
  onSearch: (query: string) => void
  initialValue?: string
  availableColumns?: string[]
}

export default function SearchBar({
  onSearch,
  initialValue = "",
  availableColumns = [],
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  // Detect if user is typing a column name (before a colon)
  const getColumnSuggestions = () => {
    if (!query.includes(":")) {
      const lastSpaceIndex = query.lastIndexOf(" ")
      const potentialColumn = query.substring(lastSpaceIndex + 1)

      if (potentialColumn.length > 0) {
        return availableColumns
          .filter((col) =>
            col.toLowerCase().includes(potentialColumn.toLowerCase())
          )
          .slice(0, 5) // Limit to 5 suggestions
      }
    }
    return []
  }

  const suggestions = getColumnSuggestions()

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value)
    setShowSuggestions(value.length > 0 && suggestions.length > 0)
    setSelectedSuggestionIndex(-1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  const selectSuggestion = (columnName: string) => {
    const lastSpaceIndex = query.lastIndexOf(" ")
    const newQuery = query.substring(0, lastSpaceIndex + 1) + columnName + ':""'
    setQuery(newQuery)
    onSearch(newQuery)
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)

    // Focus back to input and position cursor between the quotes
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.setSelectionRange(
          newQuery.length - 1,
          newQuery.length - 1
        )
      }
    }, 0)
  }

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }, 150)
  }

  return (
    <div className="relative m-4">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() =>
          setShowSuggestions(query.length > 0 && suggestions.length > 0)
        }
        placeholder="Search..."
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Column Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((column, index) => (
            <div
              key={column}
              className={`px-4 py-2 cursor-pointer text-sm ${
                index === selectedSuggestionIndex
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-gray-50 text-gray-900"
              }`}
              onClick={() => selectSuggestion(column)}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
            >
              <div className="flex items-center">
                <span className="font-medium">{column}</span>
                <span className="ml-2 text-xs text-gray-500">column</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
