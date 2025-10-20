import React, { useState, useRef } from "react"

interface AudioPlayerProps {
  src: string
  className?: string
}

export function AudioPlayer({ src, className = "" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlayPause = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Audio playback error:", error)
      setIsPlaying(false)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  const handleError = () => {
    setIsPlaying(false)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        onEnded={handleEnded}
        onError={handleError}
        preload="none"
      />

      <button
        onClick={togglePlayPause}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-sm font-medium transition-colors cursor-pointer ${
          isPlaying
            ? "bg-red-100 text-red-700 hover:bg-red-200"
            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
        }`}
      >
        {isPlaying ? (
          <>
            <span>⏸️</span>
            <span>Pause</span>
          </>
        ) : (
          <>
            <span>🔊</span>
            <span>Play</span>
          </>
        )}
      </button>
    </div>
  )
}
