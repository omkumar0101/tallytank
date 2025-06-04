"use client"

import { useEffect, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { soundManager } from "@/lib/sound-manager"

export default function SoundControl() {
  const [isMuted, setIsMuted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize sound manager
  useEffect(() => {
    soundManager.init()
    setIsInitialized(true)

    // Enable sounds on first user interaction
    const handleUserInteraction = () => {
      soundManager.handleUserInteraction()
      // Remove event listeners after first interaction
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)
      document.removeEventListener("touchstart", handleUserInteraction)
    }

    document.addEventListener("click", handleUserInteraction)
    document.addEventListener("keydown", handleUserInteraction)
    document.addEventListener("touchstart", handleUserInteraction)

    return () => {
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)
      document.removeEventListener("touchstart", handleUserInteraction)
    }
  }, [])

  // Handle mute toggle
  const toggleMute = () => {
    soundManager.handleUserInteraction()
    const newMutedState = soundManager.toggleMute()
    setIsMuted(newMutedState)

    // Play UI sound if unmuting
    if (!newMutedState) {
      soundManager.play("buttonClick")
    }
  }

  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-md p-2 shadow-md">
      <button
        onClick={toggleMute}
        className="p-1 hover:bg-gray-200 rounded-md transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
      <span className="text-xs text-gray-700">Sound: {isMuted ? "Off" : "On"}</span>
    </div>
  )
}
