// Generate simple sound effects using Web Audio API
export class SoundGenerator {
  private audioContext: AudioContext | null = null

  constructor() {
    // Create audio context on first user interaction
    this.initAudioContext()
  }

  private initAudioContext() {
    try {
      // AudioContext must be created on user interaction in many browsers
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      console.log("Audio context initialized successfully")
    } catch (error) {
      console.error("Failed to create audio context:", error)
    }
  }

  // Make sure audio context is running (must be called after user interaction)
  public resume() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext
        .resume()
        .then(() => {
          console.log("AudioContext resumed successfully")
        })
        .catch((error) => {
          console.error("Failed to resume AudioContext:", error)
        })
    }
  }

  // Generate a shooting sound
  public shoot() {
    if (!this.audioContext) {
      this.initAudioContext()
      if (!this.audioContext) return
    }

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = "square"
      oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + 0.2)

      console.log("Shoot sound played")
    } catch (error) {
      console.error("Error playing shoot sound:", error)
    }
  }

  // Generate a missile launch sound
  public missile() {
    if (!this.audioContext) {
      this.initAudioContext()
      if (!this.audioContext) return
    }

    try {
      // Create a more complex sound for missiles
      const oscillator1 = this.audioContext.createOscillator()
      const oscillator2 = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()

      oscillator1.type = "sawtooth"
      oscillator1.frequency.setValueAtTime(100, this.audioContext.currentTime)
      oscillator1.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3)

      oscillator2.type = "square"
      oscillator2.frequency.setValueAtTime(120, this.audioContext.currentTime)
      oscillator2.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.3)

      filter.type = "lowpass"
      filter.frequency.value = 1000

      gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

      oscillator1.connect(filter)
      oscillator2.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator1.start()
      oscillator2.start()
      oscillator1.stop(this.audioContext.currentTime + 0.3)
      oscillator2.stop(this.audioContext.currentTime + 0.3)

      console.log("Missile sound played")
    } catch (error) {
      console.error("Error playing missile sound:", error)
    }
  }

  // Generate a mine placement sound
  public minePlace() {
    if (!this.audioContext) {
      this.initAudioContext()
      if (!this.audioContext) return
    }

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.15)

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + 0.15)

      console.log("Mine place sound played")
    } catch (error) {
      console.error("Error playing mine place sound:", error)
    }
  }

  // Generate a mine activation sound
  public mineActivate() {
    if (!this.audioContext) {
      this.initAudioContext()
      if (!this.audioContext) return
    }

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime)
      oscillator.frequency.setValueAtTime(900, this.audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + 0.3)

      console.log("Mine activate sound played")
    } catch (error) {
      console.error("Error playing mine activate sound:", error)
    }
  }

  // Generate a big explosion sound for missiles
  public bigExplosion() {
    if (!this.audioContext) {
      this.initAudioContext()
      if (!this.audioContext) return
    }

    try {
      const noise = this.audioContext.createBufferSource()
      const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 1.0, this.audioContext.sampleRate)
      const data = buffer.getChannelData(0)

      // Fill the buffer with noise
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1
      }

      noise.buffer = buffer

      const gainNode = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()

      filter.type = "lowpass"
      filter.frequency.setValueAtTime(800, this.audioContext.currentTime)
      filter.frequency.exponentialRampToValueAtTime(10, this.audioContext.currentTime + 1.0)

      gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0)

      noise.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      noise.start()
      noise.stop(this.audioContext.currentTime + 1.0)

      console.log("Big explosion sound played")
    } catch (error) {
      console.error("Error playing big explosion sound:", error)
    }
  }

  // Generate an explosion sound
  public explosion() {
    if (!this.audioContext) {
      this.initAudioContext()
      if (!this.audioContext) return
    }

    try {
      const noise = this.audioContext.createBufferSource()
      const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate)
      const data = buffer.getChannelData(0)

      // Fill the buffer with noise
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1
      }

      noise.buffer = buffer

      const gainNode = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()

      filter.type = "lowpass"
      filter.frequency.setValueAtTime(1000, this.audioContext.currentTime)
      filter.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.5)

      gainNode.gain.setValueAtTime(0.8, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)

      noise.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      noise.start()
      noise.stop(this.audioContext.currentTime + 0.5)

      console.log("Explosion sound played")
    } catch (error) {
      console.error("Error playing explosion sound:", error)
    }
  }

  // Generate a button click sound
  public buttonClick() {
    if (!this.audioContext) {
      this.initAudioContext()
      if (!this.audioContext) return
    }

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + 0.1)

      console.log("Button click sound played")
    } catch (error) {
      console.error("Error playing button click sound:", error)
    }
  }

  // Generate a tank movement sound
  public tankMove() {
    if (!this.audioContext) {
      this.initAudioContext()
      if (!this.audioContext) return
    }

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = "sawtooth"
      oscillator.frequency.setValueAtTime(50, this.audioContext.currentTime)

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.start()

      // Return the nodes so we can stop them later
      return { oscillator, gainNode }
    } catch (error) {
      console.error("Error playing tank move sound:", error)
      return null
    }
  }

  // Generate a level complete sound
  public levelComplete() {
    if (!this.audioContext) {
      this.initAudioContext()
      if (!this.audioContext) return
    }

    try {
      // Play a sequence of notes
      const notes = [261.63, 329.63, 392.0, 523.25] // C4, E4, G4, C5

      notes.forEach((freq, i) => {
        const oscillator = this.audioContext!.createOscillator()
        const gainNode = this.audioContext!.createGain()

        oscillator.type = "sine"
        oscillator.frequency.value = freq

        gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime + i * 0.2)
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext!.currentTime + i * 0.2 + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + i * 0.2 + 0.2)

        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext!.destination)

        oscillator.start(this.audioContext!.currentTime + i * 0.2)
        oscillator.stop(this.audioContext!.currentTime + i * 0.2 + 0.2)
      })

      console.log("Level complete sound played")
    } catch (error) {
      console.error("Error playing level complete sound:", error)
    }
  }

  // Generate a game over sound
  public gameOver() {
    if (!this.audioContext) {
      this.initAudioContext()
      if (!this.audioContext) return
    }

    try {
      // Play a descending sequence of notes
      const notes = [392.0, 349.23, 329.63, 261.63] // G4, F4, E4, C4

      notes.forEach((freq, i) => {
        const oscillator = this.audioContext!.createOscillator()
        const gainNode = this.audioContext!.createGain()

        oscillator.type = "triangle"
        oscillator.frequency.value = freq

        gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime + i * 0.3)
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext!.currentTime + i * 0.3 + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + i * 0.3 + 0.3)

        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext!.destination)

        oscillator.start(this.audioContext!.currentTime + i * 0.3)
        oscillator.stop(this.audioContext!.currentTime + i * 0.3 + 0.3)
      })

      console.log("Game over sound played")
    } catch (error) {
      console.error("Error playing game over sound:", error)
    }
  }
}

// Create a singleton instance
export const soundGenerator = new SoundGenerator()
