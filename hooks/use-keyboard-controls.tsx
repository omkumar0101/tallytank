"use client"

import { useEffect, useState } from "react"

export type Controls = {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  fire: boolean
}

export function useKeyboardControls() {
  const [controls, setControls] = useState<Controls>({
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return

      switch (e.key) {
        case "ArrowUp":
          setControls((prev) => ({ ...prev, up: true }))
          break
        case "ArrowDown":
          setControls((prev) => ({ ...prev, down: true }))
          break
        case "ArrowLeft":
          setControls((prev) => ({ ...prev, left: true }))
          break
        case "ArrowRight":
          setControls((prev) => ({ ...prev, right: true }))
          break
        case " ": // Space
          setControls((prev) => ({ ...prev, fire: true }))
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          setControls((prev) => ({ ...prev, up: false }))
          break
        case "ArrowDown":
          setControls((prev) => ({ ...prev, down: false }))
          break
        case "ArrowLeft":
          setControls((prev) => ({ ...prev, left: false }))
          break
        case "ArrowRight":
          setControls((prev) => ({ ...prev, right: false }))
          break
        case " ": // Space
          setControls((prev) => ({ ...prev, fire: false }))
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  return controls
}
