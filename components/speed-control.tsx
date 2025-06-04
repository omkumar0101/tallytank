"use client"

import { useState, useEffect } from "react"
import { Clock, FastForward, Rewind } from "lucide-react"
import type { GameSpeed } from "@/lib/game-state"
import { soundManager } from "@/lib/sound-manager"

interface SpeedControlProps {
  gameSpeed: GameSpeed
  onSpeedChange: (speed: GameSpeed) => void
}

export default function SpeedControl({ gameSpeed, onSpeedChange }: SpeedControlProps) {
  const [currentSpeed, setCurrentSpeed] = useState<GameSpeed>(gameSpeed)

  // Update local state when prop changes
  useEffect(() => {
    setCurrentSpeed(gameSpeed)
  }, [gameSpeed])

  // Handle speed change
  const handleSpeedChange = (speed: GameSpeed) => {
    setCurrentSpeed(speed)
    onSpeedChange(speed)
    soundManager.play("buttonClick")
  }

  return (
    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-md p-1 shadow-md">
      <button
        onClick={() => handleSpeedChange("slow")}
        className={`p-1 rounded-md transition-colors ${
          currentSpeed === "slow" ? "bg-blue-500 text-white" : "hover:bg-gray-200 text-gray-700"
        }`}
        aria-label="Slow speed"
        title="Slow speed"
      >
        <Rewind className="w-5 h-5" />
      </button>

      <button
        onClick={() => handleSpeedChange("normal")}
        className={`p-1 rounded-md transition-colors ${
          currentSpeed === "normal" ? "bg-blue-500 text-white" : "hover:bg-gray-200 text-gray-700"
        }`}
        aria-label="Normal speed"
        title="Normal speed"
      >
        <Clock className="w-5 h-5" />
      </button>

      <button
        onClick={() => handleSpeedChange("fast")}
        className={`p-1 rounded-md transition-colors ${
          currentSpeed === "fast" ? "bg-blue-500 text-white" : "hover:bg-gray-200 text-gray-700"
        }`}
        aria-label="Fast speed"
        title="Fast speed"
      >
        <FastForward className="w-5 h-5" />
      </button>
    </div>
  )
}
