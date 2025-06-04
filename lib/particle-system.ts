import { type Vector2D, add, scale } from "./vector"
import type { DustParticle, ExplosionParticle, SmokeParticle } from "./game-state"

// Create dust particles when tanks move
export const createDustParticle = (position: Vector2D): DustParticle => {
  return {
    position: { ...position },
    size: 1 + Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.3,
    lifetime: 0,
    maxLifetime: 0.5 + Math.random() * 1.0, // Random lifetime between 0.5 and 1.5 seconds
  }
}

// Update dust particles
export const updateDustParticles = (particles: DustParticle[], deltaTime: number): DustParticle[] => {
  return particles
    .map((particle) => {
      const updatedParticle = { ...particle }
      updatedParticle.lifetime += deltaTime

      // Gradually reduce opacity as particle ages
      updatedParticle.opacity = Math.max(0, particle.opacity * (1 - particle.lifetime / particle.maxLifetime))

      // Slightly increase size as particle ages
      updatedParticle.size += deltaTime * 2

      return updatedParticle
    })
    .filter((particle) => particle.lifetime < particle.maxLifetime)
}

// Create smoke particles for missile trails
export const createSmokeParticle = (position: Vector2D): SmokeParticle => {
  return {
    position: { ...position },
    size: 2 + Math.random() * 4,
    opacity: 0.4 + Math.random() * 0.3,
    lifetime: 0,
    maxLifetime: 0.8 + Math.random() * 0.7, // Random lifetime between 0.8 and 1.5 seconds
  }
}

// Update smoke particles
export const updateSmokeParticles = (particles: SmokeParticle[], deltaTime: number): SmokeParticle[] => {
  return particles
    .map((particle) => {
      const updatedParticle = { ...particle }
      updatedParticle.lifetime += deltaTime

      // Gradually reduce opacity as particle ages
      updatedParticle.opacity = Math.max(0, particle.opacity * (1 - particle.lifetime / particle.maxLifetime))

      // Increase size as smoke disperses
      updatedParticle.size += deltaTime * 5

      return updatedParticle
    })
    .filter((particle) => particle.lifetime < particle.maxLifetime)
}

// Create explosion particles
export const createExplosionParticles = (position: Vector2D, count: number): ExplosionParticle[] => {
  const particles: ExplosionParticle[] = []

  // Colors for explosion particles
  const colors = ["#ff8c00", "#ff4500", "#ff0000", "#ffff00", "#ffffff"]

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 50 + Math.random() * 150
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    }

    particles.push({
      position: { ...position },
      velocity,
      size: 2 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.7 + Math.random() * 0.3,
    })
  }

  return particles
}

// Update explosion particles
export const updateExplosionParticles = (particles: ExplosionParticle[], deltaTime: number): ExplosionParticle[] => {
  return particles.map((particle) => {
    const updatedParticle = { ...particle }

    // Update position based on velocity
    updatedParticle.position = add(particle.position, scale(particle.velocity, deltaTime))

    // Slow down particles over time
    updatedParticle.velocity = scale(particle.velocity, 0.95)

    // Reduce opacity over time
    updatedParticle.opacity = Math.max(0, particle.opacity - deltaTime * 1.5)

    // Reduce size slightly
    updatedParticle.size = Math.max(0.5, particle.size - deltaTime * 2)

    return updatedParticle
  })
}
