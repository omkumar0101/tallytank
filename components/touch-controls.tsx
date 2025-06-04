"use client"

import { useEffect, useRef, useState } from "react"
import type { Controls } from "@/hooks/use-keyboard-controls"

interface TouchControlsProps {
  onControlsChange: (controls: Controls) => void
}

export default function TouchControls({ onControlsChange }: TouchControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const joystickKnobRef = useRef<HTMLDivElement>(null)
  const [isFiring, setIsFiring] = useState(false)
  const [isAccelerating, setIsAccelerating] = useState(false)
  const [joystickActive, setJoystickActive] = useState(false)
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 })
  const [joystickAngle, setJoystickAngle] = useState(0)
  const [joystickDistance, setJoystickDistance] = useState(0)
  const maxJoystickDistance = 40

  // Handle joystick movement
  const handleJoystickMove = (clientX: number, clientY: number) => {
    if (!joystickRef.current || !joystickActive) return

    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Calculate distance from center
    const deltaX = clientX - centerX
    const deltaY = clientY - centerY
    const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxJoystickDistance)
    const angle = Math.atan2(deltaY, deltaX)

    // Calculate normalized position
    const normalizedX = Math.cos(angle) * distance
    const normalizedY = Math.sin(angle) * distance

    setJoystickPosition({ x: normalizedX, y: normalizedY })
    setJoystickAngle(angle)
    setJoystickDistance(distance)

    // Update controls based on joystick position - now only for rotation
    const controls: Controls = {
      up: isAccelerating, // Now controlled by the gas pedal
      down: false,
      left: false,
      right: false,
      fire: isFiring,
    }

    // Determine direction based on angle - now only for left/right rotation
    if (distance > 10) {
      if (angle > -Math.PI * 0.25 && angle < Math.PI * 0.25) {
        controls.right = true
      } else if (angle > Math.PI * 0.75 || angle < -Math.PI * 0.75) {
        controls.left = true
      }
    }

    onControlsChange(controls)
  }

  // Handle joystick touch start
  const handleJoystickStart = (clientX: number, clientY: number) => {
    setJoystickActive(true)
    handleJoystickMove(clientX, clientY)
  }

  // Handle joystick touch end
  const handleJoystickEnd = () => {
    setJoystickActive(false)
    setJoystickPosition({ x: 0, y: 0 })
    setJoystickDistance(0)
    onControlsChange({
      up: isAccelerating, // Keep the acceleration state
      down: false,
      left: false,
      right: false,
      fire: isFiring,
    })
  }

  // Handle fire button
  const handleFireStart = () => {
    setIsFiring(true)
    onControlsChange({
      up: isAccelerating,
      down: false,
      left: false,
      right: false,
      fire: true,
    })
  }

  const handleFireEnd = () => {
    setIsFiring(false)
    onControlsChange({
      up: isAccelerating,
      down: false,
      left: false,
      right: false,
      fire: false,
    })
  }

  // Handle gas pedal button
  const handleGasStart = () => {
    setIsAccelerating(true)
    onControlsChange({
      up: true,
      down: false,
      left: joystickActive && (joystickAngle > Math.PI * 0.75 || joystickAngle < -Math.PI * 0.75),
      right: joystickActive && joystickAngle > -Math.PI * 0.25 && joystickAngle < Math.PI * 0.25,
      fire: isFiring,
    })
  }

  const handleGasEnd = () => {
    setIsAccelerating(false)
    onControlsChange({
      up: false,
      down: false,
      left: joystickActive && (joystickAngle > Math.PI * 0.75 || joystickAngle < -Math.PI * 0.75),
      right: joystickActive && joystickAngle > -Math.PI * 0.25 && joystickAngle < Math.PI * 0.25,
      fire: isFiring,
    })
  }

  // Set up touch event listeners
  useEffect(() => {
    const joystickElement = joystickRef.current
    if (!joystickElement) return

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!joystickActive) return
      const touch = Array.from(e.touches).find(
        (t) => t.target === joystickElement || t.target === joystickKnobRef.current,
      )
      if (touch) {
        handleJoystickMove(touch.clientX, touch.clientY)
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = Array.from(e.touches).find(
        (t) => t.target === joystickElement || t.target === joystickKnobRef.current,
      )
      if (touch) {
        handleJoystickStart(touch.clientX, touch.clientY)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (
        e.touches.length === 0 ||
        !Array.from(e.touches).some((t) => t.target === joystickElement || t.target === joystickKnobRef.current)
      ) {
        handleJoystickEnd()
      }
    }

    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    joystickElement.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchend", handleTouchEnd)
    document.addEventListener("touchcancel", handleTouchEnd)

    return () => {
      document.removeEventListener("touchmove", handleTouchMove)
      joystickElement.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
      document.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [joystickActive, onControlsChange])

  // Calculate direction indicators
  const showLeftIndicator = joystickActive && (joystickAngle > Math.PI * 0.75 || joystickAngle < -Math.PI * 0.75)
  const showRightIndicator = joystickActive && joystickAngle > -Math.PI * 0.25 && joystickAngle < Math.PI * 0.25

  return (
    <div className="fixed bottom-4 left-0 right-0 z-10 flex items-center justify-between px-6 pointer-events-none">
      {/* Joystick - now only for steering */}
      <div className="relative">
        <div
          ref={joystickRef}
          className="relative w-28 h-28 bg-black/10 backdrop-blur-sm border-2 border-white/30 rounded-full pointer-events-auto touch-none shadow-lg"
        >
          {/* Direction indicators - now only left/right */}
          <div
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-opacity ${showLeftIndicator ? "opacity-100 bg-blue-500" : "opacity-30 bg-gray-400"}`}
          ></div>
          <div
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-opacity ${showRightIndicator ? "opacity-100 bg-blue-500" : "opacity-30 bg-gray-400"}`}
          ></div>

          {/* Joystick knob */}
          <div
            ref={joystickKnobRef}
            className={`absolute w-14 h-14 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg transition-all ${joystickActive ? "bg-blue-500 scale-110" : "bg-white/80"}`}
            style={{
              left: `calc(50% + ${joystickPosition.x}px)`,
              top: `calc(50% + ${joystickPosition.y}px)`,
            }}
          />
        </div>
        <div className="mt-1 text-center text-xs text-white bg-black/40 rounded-md px-2 py-1">STEER</div>
      </div>

      {/* Right side controls */}
      <div className="flex flex-col gap-4 items-center">
        {/* Fire button */}
        <button
          className={`w-20 h-20 rounded-full pointer-events-auto touch-none flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all ${
            isFiring ? "bg-red-600 scale-95" : "bg-red-500"
          }`}
          onTouchStart={handleFireStart}
          onTouchEnd={handleFireEnd}
        >
          FIRE
        </button>

        {/* Gas pedal button */}
        <button
          className={`w-24 h-16 rounded-lg pointer-events-auto touch-none flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all ${
            isAccelerating ? "bg-green-600 scale-95" : "bg-green-500"
          }`}
          onTouchStart={handleGasStart}
          onTouchEnd={handleGasEnd}
        >
          GO
        </button>
      </div>
    </div>
  )
}
