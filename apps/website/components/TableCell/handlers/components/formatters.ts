export function formatNumber(value: number): string {
  if (typeof value !== "number") {
    return String(value || "0")
  }

  // Use consistent formatting to avoid hydration mismatches
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function formatDecimal(value: number, decimals: number = 4): string {
  if (typeof value !== "number") {
    return String(value || "")
  }

  return value.toFixed(decimals)
}

export function formatDurationSeconds(seconds: number): string {
  if (typeof seconds !== "number") {
    return String(seconds || "")
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function formatDurationMilliseconds(milliseconds: number): string {
  if (typeof milliseconds !== "number") {
    return String(milliseconds || "")
  }

  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function formatFileSize(bytes: number): string {
  if (typeof bytes !== "number") {
    return String(bytes || "")
  }

  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}
