import React from "react"

interface ImageThumbnailProps {
  src: any
  alt?: string
}

export function ImageThumbnail({ src, alt = "Image" }: ImageThumbnailProps) {
  if (!src || typeof src !== "string" || src.trim() === "") {
    return String(src || "")
  }

  return (
    <img
      src={src}
      alt={alt ?? src}
      className="w-[50px] object-cover rounded border"
    />
  )
}
