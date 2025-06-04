import type { Vector2D } from "./vector"

export type Bullet = {
  position: Vector2D
  velocity: Vector2D
  bounces: number
  isPlayerBullet: boolean
  power: number
  trail: Vector2D[]
  hasRicocheted: boolean
  originalShooter: "player" | "enemy"
  canRicochet?: boolean
}
