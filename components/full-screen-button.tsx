"use client"

import { useState, useEffect } from "react"
import { Maximize2, Minimize2 } from "lucide-react"

export default function FullScreenButton() {
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Update state when fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullScreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange)
    }
  }, [])

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter full screen
        await document.documentElement.requestFullscreen()
      } else {
        // Exit full screen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error)
    }
  }

  return (
    <button
      onClick={toggleFullScreen}
      className="flex items-center justify-center p-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-md hover:bg-white/90 shadow-md transition-all active:scale-95"
      aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
    >
      {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
    </button>
  )
}
