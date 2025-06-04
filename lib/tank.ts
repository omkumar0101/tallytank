import type { Vector2D } from "./vector"
import type { DustParticle } from "./game-state"
import type { TankType } from "./game-state"

export type Tank = {
  position: Vector2D
  rotation: number
  color: string
  speed: number
  reloadTime: number
  trackHistory: Vector2D[]
  type: TankType
  bulletSpeed: number
  bulletPower: number
  specialAbility?: string
  specialCooldown?: number
  isInvisible?: boolean
  treadOffset: number
  isMoving: boolean
  muzzleFlash: number
  dustParticles: DustParticle[]
  health: number
  mineCooldown?: number
  missileCooldown?: number
}
