import type { Vector2D } from "./vector"
import type { ExplosionParticle } from "./game-state"

export type Explosion = {
  position: Vector2D
  time: number
  maxTime: number
  particles: ExplosionParticle[]
  radius: number
} | null
