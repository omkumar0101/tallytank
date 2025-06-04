import type { Vector2D } from "./vector"
import type { SmokeParticle } from "./game-state"

export type Missile = {
  position: Vector2D
  velocity: Vector2D
  rotation: number
  target?: Vector2D
  isPlayerMissile: boolean
  lifetime: number
  trail: Vector2D[]
  smokeParticles: SmokeParticle[]
}
