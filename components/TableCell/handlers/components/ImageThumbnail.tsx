import React from "react"

interface ImageThumbnailProps {
  src: any
  alt?: string
  className?: string
  width?: number
  height?: number
}

export function ImageThumbnail({
  src,
  alt = "Image",
  className = "",
  width = 8,
  height = 6,
}: ImageThumbnailProps) {
  if (!src || typeof src !== "string" || src.trim() === "") {
    return String(src || "")
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`w-${width} h-${height} object-cover rounded border ${className}`}
    />
  )
}
