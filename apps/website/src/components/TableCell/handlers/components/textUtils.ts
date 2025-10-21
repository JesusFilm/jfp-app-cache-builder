export function truncateText(value: any, maxLength: number): string {
  if (!value || typeof value !== "string") {
    return String(value || "")
  }

  if (value.length <= maxLength) {
    return value
  }

  return value.substring(0, maxLength) + "..."
}

export function formatArrayLength(
  value: any,
  emptyText: string = "Empty"
): string {
  if (!Array.isArray(value)) {
    return String(value || "")
  }

  return value.length > 0 ? `${value.length} items` : emptyText
}

export function formatBoolean(value: any): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  return String(value || "")
}

export function formatObject(value: any): string {
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value)
  }
  return String(value || "")
}

// Helper function to check if a value is empty/null/undefined
const isEmpty = (val: any) => val === undefined || val === null || val === ""

export function formatReferenceText(value: {
  osisId: string
  chapterStart?: number
  chapterEnd?: number
  verseStart?: number
  verseEnd?: number
}): string {
  // Extract reference properties
  const osisId = value.osisId
  const chapterStart = value.chapterStart
  const chapterEnd = value.chapterEnd
  const verseStart = value.verseStart
  const verseEnd = value.verseEnd

  // Handle missing or invalid data
  if (isEmpty(chapterStart)) {
    return osisId
  }

  // Build the reference part
  let reference = ""

  // Case 1: Only chapterStart (entire chapter)
  if (isEmpty(chapterEnd) && isEmpty(verseStart) && isEmpty(verseEnd)) {
    reference = `${chapterStart}`
  }
  // Case 2: chapterStart and verseStart only (single verse)
  else if (isEmpty(chapterEnd) && !isEmpty(verseStart) && isEmpty(verseEnd)) {
    reference = `${chapterStart}:${verseStart}`
  }
  // Case 3: chapterStart and verse range (verse range in single chapter)
  else if (isEmpty(chapterEnd) && !isEmpty(verseStart) && !isEmpty(verseEnd)) {
    if (verseStart === verseEnd) {
      reference = `${chapterStart}:${verseStart}`
    } else {
      reference = `${chapterStart}:${verseStart}-${verseEnd}`
    }
  }
  // Case 4: Chapter range with verses
  else if (!isEmpty(chapterEnd) && !isEmpty(verseStart) && !isEmpty(verseEnd)) {
    // Same chapter and verse (single verse)
    if (chapterStart === chapterEnd && verseStart === verseEnd) {
      reference = `${chapterStart}:${verseStart}`
    }
    // Same chapter, different verses (verse range)
    else if (chapterStart === chapterEnd && verseStart !== verseEnd) {
      reference = `${chapterStart}:${verseStart}-${verseEnd}`
    }
    // Different chapters (chapter range)
    else {
      reference = `${chapterStart}:${verseStart}-${chapterEnd}:${verseEnd}`
    }
  }
  // Case 5: Chapter range without verses
  else if (!isEmpty(chapterEnd) && isEmpty(verseStart) && isEmpty(verseEnd)) {
    if (chapterStart === chapterEnd) {
      reference = `${chapterStart}`
    } else {
      reference = `${chapterStart}-${chapterEnd}`
    }
  }
  // Fallback - return what we have
  else {
    reference = `${chapterStart}`
    if (!isEmpty(verseStart)) {
      reference += `:${verseStart}`
    }
    if (!isEmpty(chapterEnd) && chapterEnd !== chapterStart) {
      reference += `-${chapterEnd}`
    }
    if (!isEmpty(verseEnd) && verseEnd !== verseStart) {
      reference += `:${verseEnd}`
    }
  }

  // Add osisId prefix if available
  if (!isEmpty(osisId)) {
    return `${osisId} ${reference}`
  }

  return reference
}
