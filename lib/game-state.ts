import type { Vector2D } from "./vector"
import { separateOverlappingTanks } from "./game-engine"

// Game constants - increased speeds for better gameplay
export const TANK_SIZE = 40
export const BULLET_SIZE = 8
export const MISSILE_SIZE = 12
export const MINE_SIZE = 15
export const BULLET_SPEED = 400 // Increased from 300
export const MISSILE_SPEED = 300 // Slower but more powerful
export const TANK_SPEED = 180 // Increased from 120
export const TANK_ROTATION_SPEED = 4 // Increased from 3
export const BLOCK_SIZE = 40
export const RELOAD_TIME = 0.4 // Decreased from 0.5
export const MINE_ACTIVATION_TIME = 1.0 // Time before mine activates
export const MISSILE_EXPLOSION_RADIUS = TANK_SIZE * 1.5 // Explosion radius for missiles

// Define tank types and their properties
export type TankType = "standard" | "heavy" | "light" | "stealth" | "artillery" | "demolition" | "rocket"

export interface TankTypeProperties {
  name: string
  color: string
  speed: number
  reloadTime: number
  bulletSpeed: number
  bulletPower: number // 1 = normal, 2 = can destroy metal
  specialAbility?: string
  description: string
}

export const TANK_TYPES: Record<TankType, TankTypeProperties> = {
  standard: {
    name: "Standard Tank",
    color: "#FFD700", // Gold
    speed: TANK_SPEED,
    reloadTime: RELOAD_TIME,
    bulletSpeed: BULLET_SPEED,
    bulletPower: 1,
    description: "Balanced tank with good speed and firepower.",
  },
  heavy: {
    name: "Heavy Tank",
    color: "#2E8B57", // Sea green
    speed: TANK_SPEED * 0.7, // Slower
    reloadTime: RELOAD_TIME * 1.5, // Slower reload
    bulletSpeed: BULLET_SPEED * 0.8, // Slower bullets
    bulletPower: 2, // Can destroy metal blocks
    description: "Slow but powerful tank that can destroy metal blocks.",
  },
  light: {
    name: "Light Tank",
    color: "#FF6347", // Tomato
    speed: TANK_SPEED * 1.4, // Faster
    reloadTime: RELOAD_TIME * 0.6, // Faster reload
    bulletSpeed: BULLET_SPEED * 1.2, // Faster bullets
    bulletPower: 1,
    description: "Fast and agile tank with rapid fire ability.",
  },
  stealth: {
    name: "Stealth Tank",
    color: "#9370DB", // Medium purple
    speed: TANK_SPEED * 0.9,
    reloadTime: RELOAD_TIME * 1.1,
    bulletSpeed: BULLET_SPEED,
    bulletPower: 1,
    specialAbility: "cloaking", // Can become invisible temporarily
    description: "Tactical tank that can temporarily cloak from enemies.",
  },
  artillery: {
    name: "Artillery Tank",
    color: "#B22222", // Firebrick red
    speed: TANK_SPEED * 0.6, // Very slow
    reloadTime: RELOAD_TIME * 1.8, // Very slow reload
    bulletSpeed: BULLET_SPEED * 1.5, // Very fast bullets
    bulletPower: 1,
    specialAbility: "longRange", // Bullets travel further
    description: "Long-range specialist with powerful artillery shots.",
  },
  demolition: {
    name: "Demolition Tank",
    color: "#8B4513", // Saddle brown
    speed: TANK_SPEED * 0.65, // Slow
    reloadTime: RELOAD_TIME * 1.2,
    bulletSpeed: BULLET_SPEED * 0.9,
    bulletPower: 1,
    specialAbility: "mines", // Can lay mines
    description: "Tactical tank that can deploy land mines.",
  },
  rocket: {
    name: "Rocket Tank",
    color: "#DC143C", // Crimson
    speed: TANK_SPEED * 0.75,
    reloadTime: RELOAD_TIME * 2.0, // Very slow reload
    bulletSpeed: BULLET_SPEED,
    bulletPower: 1,
    specialAbility: "missiles", // Can fire missiles
    description: "Heavy tank that fires guided missiles with area damage.",
  },
}

// Entity types
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
  lastPosition?: Vector2D // Track last position to detect if stuck
  stuckTimer?: number // Track how long the tank has been stuck
  // Animation properties
  treadOffset: number // For animating treads
  isMoving: boolean // Track if tank is currently moving
  muzzleFlash: number // Timer for muzzle flash effect
  dustParticles: DustParticle[] // Dust particles
  health: number // Health for damage states
  // Special ability cooldowns
  mineCooldown?: number // Cooldown for laying mines
  missileCooldown?: number // Cooldown for firing missiles
}

// Add this to the existing types
export type GameSpeed = "slow" | "normal" | "fast"

// Add dust particle type
export type DustParticle = {
  position: Vector2D
  size: number
  opacity: number
  lifetime: number
  maxLifetime: number
}

export type Bullet = {
  position: Vector2D
  velocity: Vector2D
  bounces: number
  isPlayerBullet: boolean
  power: number // Added to track bullet power
  // Animation properties
  trail: Vector2D[] // Trail positions
  hasRicocheted: boolean // Track if the bullet has already ricocheted
  originalShooter: "player" | "enemy" // Track who originally fired the bullet
  canRicochet?: boolean // Whether this bullet can use the ricochet system
}

// New missile type
export type Missile = {
  position: Vector2D
  velocity: Vector2D
  rotation: number
  target?: Vector2D // Optional target for guided missiles
  isPlayerMissile: boolean
  lifetime: number
  trail: Vector2D[]
  smokeParticles: SmokeParticle[]
}

// New mine type
export type Mine = {
  position: Vector2D
  placedBy: "player" | "enemy"
  activationTimer: number
  isActive: boolean
  pulseTimer: number // For visual pulsing effect
}

// Smoke particle for missile trails
export type SmokeParticle = {
  position: Vector2D
  size: number
  opacity: number
  lifetime: number
  maxLifetime: number
}

// Update the Block type to include "barrier" type
export type Block = {
  position: Vector2D
  size: Vector2D
  type: "wood" | "brick" | "metal" | "barrier"
}

// Enhanced explosion type with more properties
export type Explosion = {
  position: Vector2D
  time: number
  maxTime: number
  particles: ExplosionParticle[]
  radius: number // For different sized explosions
} | null

// Add explosion particle type
export type ExplosionParticle = {
  position: Vector2D
  velocity: Vector2D
  size: number
  color: string
  opacity: number
}

// Game state
export type GameState = {
  player: Tank
  enemies: Tank[]
  playerBullets: Bullet[]
  enemyBullets: Bullet[]
  missiles: Missile[] // New array for missiles
  mines: Mine[] // New array for mines
  blocks: Block[]
  level: number
  score: number
  playerLives: number
  width: number
  height: number
  explosion: Explosion
  gameSpeed: GameSpeed
  continuesRemaining: number // Add this line to track continues
  levelStartCountdown: number // Add this line for level start countdown
  isLevelStarting: boolean // Add this line to track if level is starting
}

// Create a player tank (always standard)
export const createPlayerTank = (position: Vector2D): Tank => {
  return {
    position,
    rotation: 0,
    color: "#4169E1", // Royal blue - player is always blue
    speed: TANK_SPEED,
    reloadTime: 0,
    trackHistory: [],
    type: "standard", // Player is always standard type
    bulletSpeed: BULLET_SPEED,
    bulletPower: 1,
    specialAbility: undefined,
    specialCooldown: 0,
    isInvisible: false,
    // Animation properties
    treadOffset: 0,
    isMoving: false,
    muzzleFlash: 0,
    dustParticles: [],
    health: 100,
  }
}

// Create an enemy tank based on tank type
export const createEnemyTank = (tankType: TankType, position: Vector2D, level: number): Tank => {
  const tankProps = TANK_TYPES[tankType]
  return {
    position,
    rotation: Math.random() * Math.PI * 2,
    color: tankProps.color,
    speed: tankProps.speed * (0.5 + level * 0.1), // Enemies get faster with level
    reloadTime: 0,
    trackHistory: [],
    type: tankType,
    bulletSpeed: tankProps.bulletSpeed,
    bulletPower: tankProps.bulletPower,
    specialAbility: tankProps.specialAbility,
    specialCooldown: 0,
    isInvisible: false,
    // Animation properties
    treadOffset: 0,
    isMoving: false,
    muzzleFlash: 0,
    dustParticles: [],
    health: tankType === "heavy" ? 150 : 100, // Heavy tanks have more health
    // Special ability cooldowns
    mineCooldown: tankType === "demolition" ? 5 : undefined,
    missileCooldown: tankType === "rocket" ? 8 : undefined,
  }
}

// Helper function to calculate distance between two points
function distance(p1: Vector2D, p2: Vector2D): number {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Replace the createLevelWithRightWall function with this enhanced version that creates distinct levels

export function createLevelWithRightWall(level: number, width: number, height: number): GameState {
  // Create blocks based on level
  const blocks: Block[] = []

  // Border blocks - always present in all levels
  const borderThickness = BLOCK_SIZE

  // Create all four perimeter walls as single continuous blocks
  // Top wall
  blocks.push({
    position: { x: 0, y: 0 },
    size: { x: width, y: borderThickness },
    type: "wood",
  })

  // Bottom wall
  blocks.push({
    position: { x: 0, y: height - borderThickness },
    size: { x: width, y: borderThickness },
    type: "wood",
  })

  // Left wall
  blocks.push({
    position: { x: 0, y: borderThickness },
    size: { x: borderThickness, y: height - borderThickness * 2 },
    type: "wood",
  })

  // Right wall
  blocks.push({
    position: { x: width - borderThickness, y: borderThickness },
    size: { x: borderThickness, y: height - borderThickness * 2 },
    type: "wood",
  })

  // Create level-specific layouts
  switch (level) {
    case 1: // LEVEL 1: TRAINING GROUNDS - Simple, open layout with few obstacles
      // Center cross
      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE, y: height / 2 - BLOCK_SIZE * 2 },
        size: { x: BLOCK_SIZE * 2, y: BLOCK_SIZE },
        type: "brick",
      })

      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE, y: height / 2 + BLOCK_SIZE },
        size: { x: BLOCK_SIZE * 2, y: BLOCK_SIZE },
        type: "brick",
      })

      // Add some wood blocks for cover
      blocks.push({
        position: { x: width / 4, y: height / 4 },
        size: { x: BLOCK_SIZE * 3, y: BLOCK_SIZE },
        type: "wood",
      })

      blocks.push({
        position: { x: (width * 3) / 4 - BLOCK_SIZE * 3, y: (height * 3) / 4 },
        size: { x: BLOCK_SIZE * 3, y: BLOCK_SIZE },
        type: "wood",
      })

      // Add a single barrier in the center
      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE / 2, y: height / 2 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })
      break

    case 2: // LEVEL 2: URBAN COMBAT - City-like grid pattern
      // Create a grid pattern of blocks
      for (let x = width / 5; x < width * 0.8; x += BLOCK_SIZE * 3) {
        for (let y = height / 5; y < height * 0.8; y += BLOCK_SIZE * 3) {
          // Skip some blocks randomly to create paths
          if (Math.random() > 0.3) {
            blocks.push({
              position: { x, y },
              size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
              type: Math.random() > 0.7 ? "brick" : "wood",
            })
          }
        }
      }

      // Add a few metal blocks for the first time
      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE, y: height / 2 - BLOCK_SIZE },
        size: { x: BLOCK_SIZE * 2, y: BLOCK_SIZE * 2 },
        type: "metal",
      })

      // Add two barriers at strategic positions
      blocks.push({
        position: { x: width / 3 - BLOCK_SIZE / 2, y: height / 3 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: (width * 2) / 3 - BLOCK_SIZE / 2, y: (height * 2) / 3 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })
      break

    case 3: // LEVEL 3: FORTRESS - Central fortress with surrounding defenses
      // Create central fortress
      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE * 3, y: height / 2 - BLOCK_SIZE * 3 },
        size: { x: BLOCK_SIZE * 6, y: BLOCK_SIZE },
        type: "brick",
      })

      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE * 3, y: height / 2 + BLOCK_SIZE * 2 },
        size: { x: BLOCK_SIZE * 6, y: BLOCK_SIZE },
        type: "brick",
      })

      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE * 3, y: height / 2 - BLOCK_SIZE * 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE * 4 },
        type: "brick",
      })

      blocks.push({
        position: { x: width / 2 + BLOCK_SIZE * 2, y: height / 2 - BLOCK_SIZE * 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE * 4 },
        type: "brick",
      })

      // Add metal reinforcements
      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE, y: height / 2 - BLOCK_SIZE },
        size: { x: BLOCK_SIZE * 2, y: BLOCK_SIZE * 2 },
        type: "metal",
      })

      // Add outer defenses
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const distance = BLOCK_SIZE * 8
        const x = width / 2 + Math.cos(angle) * distance
        const y = height / 2 + Math.sin(angle) * distance

        blocks.push({
          position: { x: x - BLOCK_SIZE / 2, y: y - BLOCK_SIZE / 2 },
          size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
          type: Math.random() > 0.5 ? "brick" : "wood",
        })
      }

      // Add a horizontal barrier
      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE * 1.5, y: height / 2 },
        size: { x: BLOCK_SIZE * 3, y: BLOCK_SIZE / 2 },
        type: "barrier",
      })
      break

    case 4: // LEVEL 4: MAZE - Complex maze-like structure
      // Create maze walls
      const mazeSegments = [
        // Horizontal segments
        { x: width * 0.2, y: height * 0.2, w: width * 0.3, h: BLOCK_SIZE },
        { x: width * 0.5, y: height * 0.3, w: width * 0.3, h: BLOCK_SIZE },
        { x: width * 0.2, y: height * 0.4, w: width * 0.2, h: BLOCK_SIZE },
        { x: width * 0.1, y: height * 0.6, w: width * 0.3, h: BLOCK_SIZE },
        { x: width * 0.5, y: height * 0.7, w: width * 0.3, h: BLOCK_SIZE },
        { x: width * 0.2, y: height * 0.8, w: width * 0.4, h: BLOCK_SIZE },

        // Vertical segments
        { x: width * 0.2, y: height * 0.2, w: BLOCK_SIZE, h: height * 0.2 },
        { x: width * 0.4, y: height * 0.4, w: BLOCK_SIZE, h: height * 0.2 },
        { x: width * 0.6, y: height * 0.3, w: BLOCK_SIZE, h: height * 0.2 },
        { x: width * 0.8, y: height * 0.1, w: BLOCK_SIZE, h: height * 0.3 },
        { x: width * 0.3, y: height * 0.6, w: BLOCK_SIZE, h: height * 0.2 },
        { x: width * 0.7, y: height * 0.5, w: BLOCK_SIZE, h: height * 0.3 },
      ]

      for (const segment of mazeSegments) {
        blocks.push({
          position: { x: segment.x, y: segment.y },
          size: { x: segment.w, y: segment.h },
          type: Math.random() > 0.3 ? "brick" : "metal",
        })
      }

      // Add metal blocks at intersections
      blocks.push({
        position: { x: width * 0.2, y: height * 0.2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.6, y: height * 0.3 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.4, y: height * 0.6 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "metal",
      })

      // Add two barriers in opposite corners
      blocks.push({
        position: { x: width / 4 - BLOCK_SIZE / 2, y: height / 4 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: (width * 3) / 4 - BLOCK_SIZE / 2, y: (height * 3) / 4 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })
      break

    case 5: // LEVEL 5: MINEFIELD - Open with many small obstacles and mines
      // Scattered small obstacles
      for (let i = 0; i < 20; i++) {
        const x = BLOCK_SIZE * 2 + Math.random() * (width - BLOCK_SIZE * 4)
        const y = BLOCK_SIZE * 2 + Math.random() * (height - BLOCK_SIZE * 4)

        // Don't place blocks too close to player start
        if (distance({ x, y }, { x: BLOCK_SIZE * 3, y: BLOCK_SIZE * 3 }) > BLOCK_SIZE * 5) {
          blocks.push({
            position: { x, y },
            size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
            type: Math.random() > 0.6 ? "metal" : "brick",
          })
        }
      }

      // Add some larger metal structures for cover
      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE, y: height / 2 - BLOCK_SIZE },
        size: { x: BLOCK_SIZE * 2, y: BLOCK_SIZE * 2 },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.75, y: height * 0.25 },
        size: { x: BLOCK_SIZE * 2, y: BLOCK_SIZE * 2 },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.25, y: height * 0.75 },
        size: { x: BLOCK_SIZE * 2, y: BLOCK_SIZE * 2 },
        type: "metal",
      })

      // Add three barriers in a triangle formation
      blocks.push({
        position: { x: width / 2, y: height / 3 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: width / 3, y: (height * 2) / 3 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: (width * 2) / 3, y: (height * 2) / 3 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })
      break

    case 6: // LEVEL 6: BUNKER ASSAULT - Heavily fortified enemy positions
      // Create central bunker
      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE * 4, y: height / 2 - BLOCK_SIZE * 3 },
        size: { x: BLOCK_SIZE * 8, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE * 4, y: height / 2 + BLOCK_SIZE * 2 },
        size: { x: BLOCK_SIZE * 8, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE * 4, y: height / 2 - BLOCK_SIZE * 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE * 4 },
        type: "metal",
      })

      blocks.push({
        position: { x: width / 2 + BLOCK_SIZE * 3, y: height / 2 - BLOCK_SIZE * 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE * 4 },
        type: "metal",
      })

      // Add defensive barriers
      blocks.push({
        position: { x: width / 2 - BLOCK_SIZE * 2, y: height / 2 - BLOCK_SIZE },
        size: { x: BLOCK_SIZE * 4, y: BLOCK_SIZE / 2 },
        type: "barrier",
      })

      // Add outer defenses
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const distance = BLOCK_SIZE * 10
        const x = width / 2 + Math.cos(angle) * distance
        const y = height / 2 + Math.sin(angle) * distance

        blocks.push({
          position: { x: x - BLOCK_SIZE, y: y - BLOCK_SIZE },
          size: { x: BLOCK_SIZE * 2, y: BLOCK_SIZE * 2 },
          type: "brick",
        })
      }

      // Add some metal reinforcements
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        const distance = BLOCK_SIZE * 6
        const x = width / 2 + Math.cos(angle) * distance
        const y = height / 2 + Math.sin(angle) * distance

        blocks.push({
          position: { x: x - BLOCK_SIZE / 2, y: y - BLOCK_SIZE / 2 },
          size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
          type: "metal",
        })
      }
      break

    case 7: // LEVEL 7: CROSSFIRE - Dangerous open areas with limited cover
      // Create a few cross-shaped structures
      for (let i = 0; i < 3; i++) {
        const x = width * (0.25 + i * 0.25)
        const y = height * 0.5

        // Horizontal part
        blocks.push({
          position: { x: x - BLOCK_SIZE * 1.5, y: y - BLOCK_SIZE / 2 },
          size: { x: BLOCK_SIZE * 3, y: BLOCK_SIZE },
          type: "metal",
        })

        // Vertical part
        blocks.push({
          position: { x: x - BLOCK_SIZE / 2, y: y - BLOCK_SIZE * 1.5 },
          size: { x: BLOCK_SIZE, y: BLOCK_SIZE * 3 },
          type: "metal",
        })
      }

      // Add some scattered cover
      for (let i = 0; i < 15; i++) {
        const x = BLOCK_SIZE * 2 + Math.random() * (width - BLOCK_SIZE * 4)
        const y = BLOCK_SIZE * 2 + Math.random() * (height - BLOCK_SIZE * 4)

        // Don't place blocks too close to player start
        if (distance({ x, y }, { x: BLOCK_SIZE * 3, y: BLOCK_SIZE * 3 }) > BLOCK_SIZE * 5) {
          blocks.push({
            position: { x, y },
            size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
            type: Math.random() > 0.7 ? "metal" : "brick",
          })
        }
      }

      // Add four barriers in a square formation
      blocks.push({
        position: { x: width / 3, y: height / 3 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: (width * 2) / 3, y: height / 3 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: width / 3, y: (height * 2) / 3 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: (width * 2) / 3, y: (height * 2) / 3 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })
      break

    case 8: // LEVEL 8: LABYRINTH - Complex maze with narrow passages
      // Create a more complex maze
      const corridorWidth = BLOCK_SIZE

      // Horizontal corridors
      for (let y = height * 0.2; y <= height * 0.8; y += height * 0.2) {
        blocks.push({
          position: { x: width * 0.1, y: y - corridorWidth / 2 },
          size: { x: width * 0.8, y: corridorWidth },
          type: "metal",
        })
      }

      // Vertical corridors
      for (let x = width * 0.2; x <= width * 0.8; x += width * 0.2) {
        blocks.push({
          position: { x: x - corridorWidth / 2, y: height * 0.1 },
          size: { x: corridorWidth, y: height * 0.8 },
          type: "metal",
        })
      }

      // Remove some blocks to create paths
      for (let i = 0; i < 15; i++) {
        const x = width * (0.2 + Math.floor(Math.random() * 4) * 0.2)
        const y = height * (0.2 + Math.floor(Math.random() * 4) * 0.2)

        // Find and remove a block at this position
        for (let j = blocks.length - 1; j >= 0; j--) {
          const block = blocks[j]
          if (
            Math.abs(block.position.x + block.size.x / 2 - x) < BLOCK_SIZE &&
            Math.abs(block.position.y + block.size.y / 2 - y) < BLOCK_SIZE
          ) {
            blocks.splice(j, 1)
            break
          }
        }
      }

      // Add barriers at key junctions
      blocks.push({
        position: { x: width * 0.2 - BLOCK_SIZE / 2, y: height * 0.2 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: width * 0.6 - BLOCK_SIZE / 2, y: height * 0.6 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })
      break

    case 9: // LEVEL 9: GAUNTLET - Long narrow path with enemies at the end
      // Create a winding path
      blocks.push({
        position: { x: width * 0.1, y: height * 0.2 },
        size: { x: width * 0.8, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.1, y: height * 0.2 },
        size: { x: BLOCK_SIZE, y: height * 0.2 },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.1, y: height * 0.4 - BLOCK_SIZE },
        size: { x: width * 0.7, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.8 - BLOCK_SIZE, y: height * 0.4 - BLOCK_SIZE },
        size: { x: BLOCK_SIZE, y: height * 0.2 },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.2, y: height * 0.6 - BLOCK_SIZE },
        size: { x: width * 0.6, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.2, y: height * 0.6 - BLOCK_SIZE },
        size: { x: BLOCK_SIZE, y: height * 0.2 },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.2, y: height * 0.8 - BLOCK_SIZE },
        size: { x: width * 0.7, y: BLOCK_SIZE },
        type: "metal",
      })

      // Add barriers along the path
      blocks.push({
        position: { x: width * 0.3, y: height * 0.3 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: width * 0.6, y: height * 0.5 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: width * 0.4, y: height * 0.7 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })
      break

    case 10: // LEVEL 10: FINAL STAND - Extremely difficult with all enemy types
      // Create a complex fortress with multiple layers

      // Outer wall
      blocks.push({
        position: { x: width * 0.2, y: height * 0.2 },
        size: { x: width * 0.6, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.2, y: height * 0.8 - BLOCK_SIZE },
        size: { x: width * 0.6, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.2, y: height * 0.2 + BLOCK_SIZE },
        size: { x: BLOCK_SIZE, y: height * 0.6 - BLOCK_SIZE * 2 },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.8 - BLOCK_SIZE, y: height * 0.2 + BLOCK_SIZE },
        size: { x: BLOCK_SIZE, y: height * 0.6 - BLOCK_SIZE * 2 },
        type: "metal",
      })

      // Inner sanctum
      blocks.push({
        position: { x: width * 0.4, y: height * 0.4 },
        size: { x: width * 0.2, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.4, y: height * 0.6 - BLOCK_SIZE },
        size: { x: width * 0.2, y: BLOCK_SIZE },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.4, y: height * 0.4 + BLOCK_SIZE },
        size: { x: BLOCK_SIZE, y: height * 0.2 - BLOCK_SIZE * 2 },
        type: "metal",
      })

      blocks.push({
        position: { x: width * 0.6 - BLOCK_SIZE, y: height * 0.4 + BLOCK_SIZE },
        size: { x: BLOCK_SIZE, y: height * 0.2 - BLOCK_SIZE * 2 },
        type: "metal",
      })

      // Add barriers at strategic points
      blocks.push({
        position: { x: width * 0.3, y: height * 0.3 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: width * 0.7 - BLOCK_SIZE, y: height * 0.3 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: width * 0.3, y: height * 0.7 - BLOCK_SIZE },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: width * 0.7 - BLOCK_SIZE, y: height * 0.7 - BLOCK_SIZE },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })

      blocks.push({
        position: { x: width * 0.5 - BLOCK_SIZE / 2, y: height * 0.5 - BLOCK_SIZE / 2 },
        size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
        type: "barrier",
      })
      break

    default: // ENDLESS LEVELS: Procedurally generated with increasing difficulty
      // For levels beyond 10, create procedurally generated layouts with high difficulty

      // Add more metal blocks as level increases
      const metalRatio = Math.min(0.8, 0.3 + (level - 10) * 0.05)

      // Create random structures
      for (let i = 0; i < 10 + level; i++) {
        const x = BLOCK_SIZE * 2 + Math.random() * (width - BLOCK_SIZE * 4)
        const y = BLOCK_SIZE * 2 + Math.random() * (height - BLOCK_SIZE * 4)
        const size = 1 + Math.floor(Math.random() * 3)

        // Don't place blocks too close to player start
        if (distance({ x, y }, { x: BLOCK_SIZE * 3, y: BLOCK_SIZE * 3 }) > BLOCK_SIZE * 5) {
          blocks.push({
            position: { x, y },
            size: { x: BLOCK_SIZE * size, y: BLOCK_SIZE * size },
            type: Math.random() < metalRatio ? "metal" : "brick",
          })
        }
      }

      // Add barriers (more as level increases)
      const barrierCount = Math.min(8, 3 + Math.floor((level - 10) / 2))
      for (let i = 0; i < barrierCount; i++) {
        const angle = (i / barrierCount) * Math.PI * 2
        const dist = BLOCK_SIZE * 5 + Math.random() * BLOCK_SIZE * 5
        const x = width / 2 + Math.cos(angle) * dist
        const y = height / 2 + Math.sin(angle) * dist

        blocks.push({
          position: { x: x - BLOCK_SIZE / 2, y: y - BLOCK_SIZE / 2 },
          size: { x: BLOCK_SIZE, y: BLOCK_SIZE },
          type: "barrier",
        })
      }
      break
  }

  // Create enemies based on level
  const enemies: Tank[] = []

  // Determine number of enemies based on level
  let numEnemies: number
  if (level <= 3) {
    numEnemies = level + 1 // 2-4 enemies for levels 1-3
  } else if (level <= 6) {
    numEnemies = level + 2 // 6-8 enemies for levels 4-6
  } else if (level <= 9) {
    numEnemies = level + 3 // 10-12 enemies for levels 7-9
  } else {
    numEnemies = Math.min(20, 10 + Math.floor((level - 10) / 2) * 2) // 10+ enemies for level 10+
  }

  // Available enemy types based on level
  const availableTypes: TankType[] = ["standard"]

  // Progressively introduce enemy types as levels increase
  if (level >= 2) availableTypes.push("light")
  if (level >= 3) availableTypes.push("heavy")
  if (level >= 4) availableTypes.push("stealth")
  if (level >= 5) availableTypes.push("artillery", "demolition")
  if (level >= 6) availableTypes.push("rocket")

  // Define spawn positions - more strategic positions for higher levels
  const spawnPositions: Vector2D[] = []

  // Add level-specific spawn positions
  switch (level) {
    case 1: // Training level - simple positions
      spawnPositions.push(
        { x: width - BLOCK_SIZE * 3, y: BLOCK_SIZE * 3 },
        { x: width - BLOCK_SIZE * 3, y: height - BLOCK_SIZE * 3 },
        { x: width / 2, y: height - BLOCK_SIZE * 3 },
        { x: width - BLOCK_SIZE * 3, y: height / 2 },
      )
      break

    case 2: // Urban combat - grid positions
    case 3: // Fortress - surrounding the fortress
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const distance = BLOCK_SIZE * 8
        spawnPositions.push({
          x: width / 2 + Math.cos(angle) * distance,
          y: height / 2 + Math.sin(angle) * distance,
        })
      }
      break

    case 4: // Maze - positions at maze exits
    case 5: // Minefield - scattered positions
      for (let i = 0; i < 12; i++) {
        spawnPositions.push({
          x: BLOCK_SIZE * 3 + Math.random() * (width - BLOCK_SIZE * 6),
          y: BLOCK_SIZE * 3 + Math.random() * (height - BLOCK_SIZE * 6),
        })
      }
      break

    case 6: // Bunker assault - enemies inside the bunker
      // Inside the bunker
      for (let i = 0; i < 4; i++) {
        spawnPositions.push({
          x: width / 2 - BLOCK_SIZE * 2 + i * BLOCK_SIZE,
          y: height / 2,
        })
      }

      // Outside the bunker
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const distance = BLOCK_SIZE * 12
        spawnPositions.push({
          x: width / 2 + Math.cos(angle) * distance,
          y: height / 2 + Math.sin(angle) * distance,
        })
      }
      break

    case 7: // Crossfire - enemies at strategic positions
    case 8: // Labyrinth - enemies throughout the maze
      // Strategic positions
      for (let x = width * 0.25; x <= width * 0.75; x += width * 0.25) {
        for (let y = height * 0.25; y <= height * 0.75; y += height * 0.25) {
          spawnPositions.push({ x, y })
        }
      }

      // Random positions
      for (let i = 0; i < 8; i++) {
        spawnPositions.push({
          x: BLOCK_SIZE * 3 + Math.random() * (width - BLOCK_SIZE * 6),
          y: BLOCK_SIZE * 3 + Math.random() * (height - BLOCK_SIZE * 6),
        })
      }
      break

    case 9: // Gauntlet - enemies at the end of the path
      // Enemies at the end of the gauntlet
      for (let i = 0; i < 5; i++) {
        spawnPositions.push({
          x: width * 0.7 + Math.random() * width * 0.2,
          y: height * 0.7 + Math.random() * height * 0.2,
        })
      }

      // Some enemies along the path
      spawnPositions.push(
        { x: width * 0.3, y: height * 0.3 },
        { x: width * 0.6, y: height * 0.5 },
        { x: width * 0.4, y: height * 0.7 },
      )
      break

    case 10: // Final stand - enemies in the inner sanctum and surrounding
      // Inner sanctum enemies
      spawnPositions.push(
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.45, y: height * 0.45 },
        { x: width * 0.55, y: height * 0.45 },
        { x: width * 0.45, y: height * 0.55 },
        { x: width * 0.55, y: height * 0.55 },
      )

      // Outer enemies
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const distance = BLOCK_SIZE * 6
        spawnPositions.push({
          x: width / 2 + Math.cos(angle) * distance,
          y: height / 2 + Math.sin(angle) * distance,
        })
      }
      break

    default: // Endless levels - enemies everywhere
      // Create a mix of strategic and random positions
      for (let i = 0; i < numEnemies + 5; i++) {
        if (i < 8) {
          // Strategic positions around the center
          const angle = (i / 8) * Math.PI * 2
          const distance = BLOCK_SIZE * (6 + Math.random() * 6)
          spawnPositions.push({
            x: width / 2 + Math.cos(angle) * distance,
            y: height / 2 + Math.sin(angle) * distance,
          })
        } else {
          // Random positions
          spawnPositions.push({
            x: BLOCK_SIZE * 3 + Math.random() * (width - BLOCK_SIZE * 6),
            y: BLOCK_SIZE * 3 + Math.random() * (height - BLOCK_SIZE * 6),
          })
        }
      }
      break
  }

  // Shuffle spawn positions to randomize enemy placement
  for (let i = spawnPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[spawnPositions[i], spawnPositions[j]] = [spawnPositions[j], spawnPositions[i]]
  }

  // Track used positions to avoid duplicates
  const usedPositions: Vector2D[] = []

  // Create enemy tanks with appropriate types for the level
  for (let i = 0; i < numEnemies; i++) {
    // Find a position that's not too close to any used position
    let position: Vector2D | null = null
    let attempts = 0
    const maxAttempts = 20

    while (!position && attempts < maxAttempts) {
      const candidatePos = spawnPositions[i % spawnPositions.length]

      // Add some randomness to the position
      const randomOffset = {
        x: (Math.random() - 0.5) * TANK_SIZE * 4,
        y: (Math.random() - 0.5) * TANK_SIZE * 4,
      }

      const testPos = {
        x: candidatePos.x + randomOffset.x,
        y: candidatePos.y + randomOffset.y,
      }

      // Keep position within bounds
      testPos.x = Math.max(BLOCK_SIZE * 2, Math.min(width - BLOCK_SIZE * 2, testPos.x))
      testPos.y = Math.max(BLOCK_SIZE * 2, Math.min(height - BLOCK_SIZE * 2, testPos.y))

      // Check if this position is far enough from all used positions
      let isFarEnough = true
      for (const usedPos of usedPositions) {
        if (distance(testPos, usedPos) < TANK_SIZE * 2) {
          isFarEnough = false
          break
        }
      }

      // Also check distance from player
      const playerPos = { x: BLOCK_SIZE * 3, y: BLOCK_SIZE * 3 }
      if (distance(testPos, playerPos) < TANK_SIZE * 4) {
        isFarEnough = false
      }

      if (isFarEnough) {
        position = testPos
        usedPositions.push(position)
      }

      attempts++
    }

    // If we couldn't find a good position after max attempts, use a fallback
    if (!position) {
      position = {
        x: width / 2 + ((Math.random() - 0.5) * width) / 2,
        y: height / 2 + ((Math.random() - 0.5) * height) / 2,
      }
      usedPositions.push(position)
    }

    // Select enemy type based on level - higher levels have more advanced enemies
    let tankType: TankType

    if (level <= 3) {
      // Lower levels have mostly standard and light tanks
      tankType = availableTypes[Math.floor(Math.random() * Math.min(2, availableTypes.length))]
    } else if (level <= 6) {
      // Mid levels have a mix of all available types
      tankType = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    } else {
      // Higher levels have more advanced tanks
      // Bias towards more advanced tank types
      const advancedTypeIndex = Math.floor(Math.random() * availableTypes.length)
      const basicTypeIndex = Math.floor(Math.random() * 3) // Only standard, light, heavy

      // 70% chance of advanced tank in higher levels
      tankType =
        Math.random() < 0.7
          ? availableTypes[Math.min(advancedTypeIndex, availableTypes.length - 1)]
          : availableTypes[Math.min(basicTypeIndex, availableTypes.length - 1)]
    }

    // Create the enemy tank with the selected type
    enemies.push(createEnemyTank(tankType, position, level))
  }

  // Create player tank (always standard)
  const playerTank = createPlayerTank({ x: BLOCK_SIZE * 3, y: BLOCK_SIZE * 3 })

  // For level 5+, add pre-placed mines
  const mines: Mine[] = []

  if (level === 5) {
    // Level 5 is the minefield level - add several mines
    for (let i = 0; i < 10; i++) {
      const x = BLOCK_SIZE * 4 + Math.random() * (width - BLOCK_SIZE * 8)
      const y = BLOCK_SIZE * 4 + Math.random() * (height - BLOCK_SIZE * 8)

      // Don't place mines too close to player start
      if (distance({ x, y }, { x: BLOCK_SIZE * 3, y: BLOCK_SIZE * 3 }) > BLOCK_SIZE * 6) {
        mines.push({
          position: { x, y },
          placedBy: "enemy",
          activationTimer: MINE_ACTIVATION_TIME + Math.random() * 2, // Staggered activation
          isActive: false,
          pulseTimer: Math.random(), // Random initial pulse phase
        })
      }
    }
  } else if (level > 5) {
    // Higher levels have some mines in strategic locations
    const mineCount = Math.min(5, Math.floor(level / 2))

    for (let i = 0; i < mineCount; i++) {
      // Place mines near the center or at choke points
      const angle = (i / mineCount) * Math.PI * 2
      const distance = width * 0.25
      const x = width / 2 + Math.cos(angle) * distance
      const y = height / 2 + Math.sin(angle) * distance

      mines.push({
        position: { x, y },
        placedBy: "enemy",
        activationTimer: MINE_ACTIVATION_TIME,
        isActive: false,
        pulseTimer: Math.random(),
      })
    }
  }

  // Create the game state with the level-specific elements
  return {
    player: playerTank,
    enemies,
    playerBullets: [],
    enemyBullets: [],
    missiles: [],
    mines,
    blocks,
    level,
    score: 0,
    playerLives: 3,
    width,
    height,
    explosion: null,
    gameSpeed: "normal",
    continuesRemaining: 3,
    levelStartCountdown: 2,
    isLevelStarting: true,
  }
}

// Create level - keep this for backward compatibility
export function createLevel(level: number, width: number, height: number): GameState {
  // Just call our new function to ensure consistency
  return createLevelWithRightWall(level, width, height)
}

// Initial game state - ensure it's created fresh each time
export const initialGameState: GameState = {
  ...createLevelWithRightWall(1, 800, 600),
  gameSpeed: "normal", // Default to normal speed
  continuesRemaining: 3, // Initialize with 3 continues
  levelStartCountdown: 2, // 2 second countdown
  isLevelStarting: true, // Start with level starting state
}

// Add this function to get a fresh initial state (for first load)
export const getInitialGameState = (width: number, height: number): GameState => {
  return {
    ...createLevelWithRightWall(1, width, height),
    gameSpeed: "normal",
    continuesRemaining: 3,
    levelStartCountdown: 2,
    isLevelStarting: true,
  }
}

// Level transition
export const nextLevel = (state: GameState): GameState => {
  const newState = createLevelWithRightWall(state.level + 1, state.width, state.height)
  const result = {
    ...newState,
    score: state.score, // Keep the score
    playerLives: state.playerLives, // Keep the remaining lives
    gameSpeed: state.gameSpeed, // Keep the game speed
    continuesRemaining: state.continuesRemaining, // Keep the continues
    levelStartCountdown: 2, // Reset countdown to 2 seconds
    isLevelStarting: true, // Set level as starting
  }

  // Separate any overlapping tanks
  return separateOverlappingTanks(result)
}

// Restart current level
export const restartLevel = (state: GameState): GameState => {
  const newState = createLevelWithRightWall(state.level, state.width, state.height)
  const result = {
    ...newState,
    score: state.score, // Keep the score
    playerLives: state.playerLives, // Keep the remaining lives
    gameSpeed: state.gameSpeed, // Keep the game speed
    continuesRemaining: state.continuesRemaining, // Keep the continues
    levelStartCountdown: 2, // Reset countdown to 2 seconds
    isLevelStarting: true, // Set level as starting
  }

  // Separate any overlapping tanks
  return separateOverlappingTanks(result)
}
