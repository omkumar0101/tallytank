import { soundGenerator } from "./sound-generator"

// Sound effect types
export type SoundEffect =
  | "shoot"
  | "explosion"
  | "tankMove"
  | "bulletBounce"
  | "bulletImpact"
  | "buttonClick"
  | "levelComplete"
  | "gameOver"
  | "tankStart"
  | "uiSelect"
  | "metalHit"
  | "woodHit"
  | "brickHit"
  | "missile" // New sound for missile launch
  | "minePlace" // New sound for placing a mine
  | "mineActivate" // New sound for mine activation
  | "bigExplosion" // New sound for missile explosion

// Sound manager class
class SoundManager {
  private muted = false
  private initialized = false
  private tankMoveSound: { oscillator: OscillatorNode; gainNode: GainNode } | null = null

  // Initialize sound manager
  init(): void {
    try {
      console.log("Initializing sound manager...")
      this.initialized = true
      console.log("Sound manager initialized successfully")
    } catch (error) {
      console.error("Failed to initialize sound manager:", error)
    }
  }

  // Handle user interaction
  handleUserInteraction(): void {
    console.log("User interaction detected, resuming audio context")
    soundGenerator.resume()
  }

  // Play a sound effect
  play(name: SoundEffect): void {
    if (this.muted || !this.initialized) return

    console.log(`Playing sound: ${name}`)

    try {
      switch (name) {
        case "shoot":
          soundGenerator.shoot()
          break
        case "explosion":
          soundGenerator.explosion()
          break
        case "buttonClick":
        case "uiSelect":
          soundGenerator.buttonClick()
          break
        case "levelComplete":
          soundGenerator.levelComplete()
          break
        case "gameOver":
          soundGenerator.gameOver()
          break
        case "tankStart":
          // Use button click for tank start
          soundGenerator.buttonClick()
          break
        case "missile":
          // Use a modified shoot sound for missiles
          soundGenerator.missile()
          break
        case "minePlace":
          // Use a simple click for mine placement
          soundGenerator.minePlace()
          break
        case "mineActivate":
          // Use a beep sound for mine activation
          soundGenerator.mineActivate()
          break
        case "bigExplosion":
          // Use a bigger explosion sound for missiles
          soundGenerator.bigExplosion()
          break
        case "bulletBounce":
        case "bulletImpact":
        case "metalHit":
        case "woodHit":
        case "brickHit":
          // Use a simple click for these sounds
          soundGenerator.buttonClick()
          break
      }
    } catch (error) {
      console.error(`Error playing sound: ${name}`, error)
    }
  }

  // Start engine sound loop
  startEngineSound(): void {
    if (this.muted || !this.initialized || this.tankMoveSound) return

    try {
      this.tankMoveSound = soundGenerator.tankMove()
    } catch (error) {
      console.error("Error starting engine sound", error)
    }
  }

  // Stop engine sound loop
  stopEngineSound(): void {
    if (!this.tankMoveSound) return

    try {
      this.tankMoveSound.oscillator.stop()
      this.tankMoveSound = null
    } catch (error) {
      console.error("Error stopping engine sound", error)
    }
  }

  // Toggle mute/unmute all sounds
  toggleMute(): boolean {
    this.muted = !this.muted

    if (this.muted) {
      this.stopEngineSound()
    }

    return this.muted
  }

  // Check if sounds are muted
  isMuted(): boolean {
    return this.muted
  }
}

// Create singleton instance
export const soundManager = new SoundManager()
