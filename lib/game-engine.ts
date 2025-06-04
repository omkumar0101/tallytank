import type { Controls } from "@/hooks/use-keyboard-controls"
import {
  type GameState,
  TANK_ROTATION_SPEED,
  TANK_SIZE,
  nextLevel,
  TANK_TYPES,
  type GameSpeed,
  MISSILE_SIZE,
  MISSILE_SPEED,
  type Mine,
  MINE_SIZE,
  MINE_ACTIVATION_TIME,
  MISSILE_EXPLOSION_RADIUS,
  type Block,
  type Bullet,
  type Missile,
  type Tank,
  type Explosion,
} from "./game-state"
import { type Vector2D, add, distance, normalize, rotate, scale, subtract } from "./vector"
import { soundManager } from "./sound-manager"
import {
  createDustParticle,
  updateDustParticles,
  createExplosionParticles,
  updateExplosionParticles,
  createSmokeParticle,
  updateSmokeParticles,
} from "./particle-system"

// At the top of the file, after imports
const catTankImage = typeof window !== 'undefined' ? (() => { const img = new window.Image(); img.src = '/cat-tank.png'; return img; })() : null;

// Add this function to get the speed multiplier based on game speed
const getSpeedMultiplier = (gameSpeed: GameSpeed): number => {
  switch (gameSpeed) {
    case "slow":
      return 0.5 // Half speed
    case "fast":
      return 2.0 // Double speed
    case "normal":
    default:
      return 1.0 // Normal speed
  }
}

// Check collision between two rectangles
const checkRectCollision = (pos1: Vector2D, size1: Vector2D, pos2: Vector2D, size2: Vector2D): boolean => {
  return (
    pos1.x < pos2.x + size2.x && pos1.x + size1.x > pos2.x && pos1.y < pos2.y + size2.y && pos1.y + size1.y > pos2.y
  )
}

// Check if a point is inside a rectangle
const isPointInRect = (point: Vector2D, rectPos: Vector2D, rectSize: Vector2D): boolean => {
  return (
    point.x >= rectPos.x &&
    point.x <= rectPos.x + rectSize.x &&
    point.y >= rectPos.y &&
    point.y <= rectPos.y + rectSize.y
  )
}

// Replace the separateOverlappingTanks function with this simplified version:

// Separate overlapping tanks to prevent glitching
export function separateOverlappingTanks(state: GameState): GameState {
  const newState = { ...state }

  // Check each pair of enemies
  for (let i = 0; i < newState.enemies.length; i++) {
    for (let j = i + 1; j < newState.enemies.length; j++) {
      const tank1 = newState.enemies[i]
      const tank2 = newState.enemies[j]

      const dist = distance(tank1.position, tank2.position)
      const minDist = TANK_SIZE * 1.5 // Minimum separation distance

      if (dist < minDist) {
        // Calculate direction to push tanks apart
        const angle = Math.atan2(tank2.position.y - tank1.position.y, tank2.position.x - tank1.position.x)

        // Calculate how much to move each tank - more aggressive movement
        const moveAmount = minDist - dist + 5 // Add extra distance to ensure separation

        // Move tank1 away
        newState.enemies[i] = {
          ...tank1,
          position: {
            x: tank1.position.x - Math.cos(angle) * moveAmount * 0.5,
            y: tank1.position.y - Math.sin(angle) * moveAmount * 0.5,
          },
          // Force a rotation change to break patterns
          rotation: tank1.rotation + (Math.random() - 0.5) * Math.PI * 0.5,
        }

        // Move tank2 away
        newState.enemies[j] = {
          ...tank2,
          position: {
            x: tank2.position.x + Math.cos(angle) * moveAmount * 0.5,
            y: tank2.position.y + Math.sin(angle) * moveAmount * 0.5,
          },
          // Force a rotation change to break patterns
          rotation: tank2.rotation + (Math.random() - 0.5) * Math.PI * 0.5,
        }
      }
    }

    // Also check for overlap with player
    const playerDist = distance(newState.enemies[i].position, newState.player.position)
    const minPlayerDist = TANK_SIZE * 1.5

    if (playerDist < minPlayerDist) {
      // Calculate direction to push tanks apart
      const angle = Math.atan2(
        newState.player.position.y - newState.enemies[i].position.y,
        newState.player.position.x - newState.enemies[i].position.x,
      )

      // Move enemy away from player - more aggressive movement
      newState.enemies[i] = {
        ...newState.enemies[i],
        position: {
          x: newState.enemies[i].position.x - Math.cos(angle) * (minPlayerDist - playerDist + 5),
          y: newState.enemies[i].position.y - Math.sin(angle) * (minPlayerDist - playerDist + 5),
        },
        // Force a rotation change
        rotation: newState.enemies[i].rotation + Math.PI,
      }
    }

    // Check if tank is inside a block and move it out if needed
    for (const block of newState.blocks) {
      if (
        checkRectCollision(
          { x: newState.enemies[i].position.x - TANK_SIZE / 2, y: newState.enemies[i].position.y - TANK_SIZE / 2 },
          { x: TANK_SIZE, y: TANK_SIZE },
          block.position,
          block.size,
        )
      ) {
        // Find nearest edge to move tank to
        const tankCenterX = newState.enemies[i].position.x
        const tankCenterY = newState.enemies[i].position.y
        const blockCenterX = block.position.x + block.size.x / 2
        const blockCenterY = block.position.y + block.size.y / 2

        // Calculate direction vector from block center to tank center
        const dirX = tankCenterX - blockCenterX
        const dirY = tankCenterY - blockCenterY

        // Normalize and scale
        const length = Math.sqrt(dirX * dirX + dirY * dirY)
        const normalizedDirX = dirX / length
        const normalizedDirY = dirY / length

        // Move tank outside block with extra distance
        newState.enemies[i] = {
          ...newState.enemies[i],
          position: {
            x: blockCenterX + normalizedDirX * (block.size.x / 2 + TANK_SIZE / 2 + 10),
            y: blockCenterY + normalizedDirY * (block.size.y / 2 + TANK_SIZE / 2 + 10),
          },
          // Force a rotation change
          rotation: Math.atan2(normalizedDirY, normalizedDirX) + Math.PI / 2,
        }
      }
    }
  }

  return newState
}

// Update game state
export const updateGame = (state: GameState, controls: Controls, deltaTime: number): GameState => {
  // Handle level start countdown
  if (state.isLevelStarting) {
    state.levelStartCountdown -= deltaTime

    // When countdown reaches zero, start the level
    if (state.levelStartCountdown <= 0) {
      state.isLevelStarting = false
      state.levelStartCountdown = 0
    }

    // Return early - don't update gameplay during countdown
    return { ...state }
  }
  // Apply speed multiplier to deltaTime
  const speedMultiplier = getSpeedMultiplier(state.gameSpeed)
  const adjustedDeltaTime = deltaTime * speedMultiplier

  // Limit delta time to prevent large jumps if the game freezes momentarily
  const cappedDeltaTime = Math.min(adjustedDeltaTime, 0.1 * speedMultiplier)

  // Create a new state to avoid mutating the original
  const newState = { ...state }

  // Update player tank
  const player = { ...newState.player }

  // Handle player movement - classic tank controls
  let playerMoved = false;
  // Handle rotation
  if (controls.left) player.rotation -= TANK_ROTATION_SPEED * cappedDeltaTime;
  if (controls.right) player.rotation += TANK_ROTATION_SPEED * cappedDeltaTime;

  // Handle forward/backward movement in the direction the tank is facing
  let moveAmount = 0;
  if (controls.up) moveAmount += player.speed * cappedDeltaTime * 1.5;
  if (controls.down) moveAmount -= player.speed * cappedDeltaTime * 1.5;

  if (moveAmount !== 0) {
    // Move in the direction the tank is facing
    const moveVector = {
      x: Math.cos(player.rotation) * moveAmount,
      y: Math.sin(player.rotation) * moveAmount,
    };
    const newPosition = {
      x: player.position.x + moveVector.x,
      y: player.position.y + moveVector.y,
    };

    // Check collision with blocks
    let collision = false;
    for (const block of newState.blocks) {
      if (
        checkRectCollision(
          { x: newPosition.x - TANK_SIZE / 2, y: newPosition.y - TANK_SIZE / 2 },
          { x: TANK_SIZE, y: TANK_SIZE },
          block.position,
          block.size,
        )
      ) {
        collision = true;
        break;
      }
    }

    // Check collision with mines
    for (const mine of newState.mines) {
      if (distance(newPosition, mine.position) < (TANK_SIZE + MINE_SIZE) / 2) {
        collision = true;
        break;
      }
    }

    // Update position if no collision
    if (!collision) {
      player.position = newPosition;
      playerMoved = true;

      // Animate treads
      player.treadOffset += cappedDeltaTime * player.speed * 0.05;
      if (player.treadOffset > 10) player.treadOffset -= 10;
      if (player.treadOffset < 0) player.treadOffset += 10;

      // Add track marks less frequently to improve performance
      if (playerMoved && Math.random() < 0.05) {
        player.trackHistory.push({ ...player.position });
        // Limit track history more aggressively
        if (player.trackHistory.length > 30) {
          player.trackHistory.shift();
        }
      }

      // Add dust particles when moving
      if (Math.random() < cappedDeltaTime * 8) {
        // Create dust behind the tank
        const dustOffset = { x: -moveVector.x, y: -moveVector.y };
        const dustPosition = { x: player.position.x + dustOffset.x, y: player.position.y + dustOffset.y };
        player.dustParticles.push(createDustParticle(dustPosition));
      }
    }
  } else {
    // Stop engine sound if not moving
    soundManager.stopEngineSound();
    player.isMoving = false;
  }

  // Update dust particles
  player.dustParticles = updateDustParticles(player.dustParticles, cappedDeltaTime)

  // Update muzzle flash timer
  if (player.muzzleFlash > 0) {
    player.muzzleFlash -= cappedDeltaTime
  }

  // Handle player shooting
  player.reloadTime -= cappedDeltaTime
  if (controls.fire && player.reloadTime <= 0) {
    // Mouth position relative to center (must match drawTank)
    const mouthX = 32; // px right from center
    const mouthY = 0;  // px up from center
    const mouthPos = {
      x: player.position.x + Math.cos(player.rotation) * mouthX - Math.sin(player.rotation) * mouthY,
      y: player.position.y + Math.sin(player.rotation) * mouthX + Math.cos(player.rotation) * mouthY,
    };
    const bulletDirection = rotate({ x: 1, y: 0 }, player.rotation)
    const bulletPosition = mouthPos

    // Use tank's bullet speed and power
    newState.playerBullets.push({
      position: bulletPosition,
      velocity: scale(bulletDirection, player.bulletSpeed),
      bounces: 3, // Not used for player bullets anymore
      isPlayerBullet: true,
      power: player.bulletPower,
      trail: [], // Initialize empty trail
      hasRicocheted: false, // Initialize as not ricocheted
      originalShooter: "player", // Mark as player's bullet
    })

    // Play shoot sound
    soundManager.play("shoot")

    // Set muzzle flash
    player.muzzleFlash = 0.1 // Show muzzle flash for 0.1 seconds

    // Reset reload time
    player.reloadTime = TANK_TYPES[player.type].reloadTime
  }

  // Update player in state
  newState.player = player

  // Find the section where enemy tanks are updated in the updateGame function
  // Replace the enemy tank update logic with this simplified version:

  // Update enemy tanks
  newState.enemies = newState.enemies.map((enemy, enemyIndex) => {
    const updatedEnemy = { ...enemy }

    // Add a stuck timer property if it doesn't exist
    if (updatedEnemy.stuckTimer === undefined) {
      updatedEnemy.stuckTimer = 0
    }

    // Add a last position property if it doesn't exist
    if (updatedEnemy.lastPosition === undefined) {
      updatedEnemy.lastPosition = { ...updatedEnemy.position }
    }

    // Update dust particles
    updatedEnemy.dustParticles = updateDustParticles(updatedEnemy.dustParticles, cappedDeltaTime)

    // Update muzzle flash timer
    if (updatedEnemy.muzzleFlash > 0) {
      updatedEnemy.muzzleFlash -= cappedDeltaTime
    }

    // Handle special abilities for enemy tanks
    if (updatedEnemy.specialAbility) {
      // Decrease cooldown
      if (updatedEnemy.specialCooldown && updatedEnemy.specialCooldown > 0) {
        updatedEnemy.specialCooldown -= cappedDeltaTime
      }

      // Handle cloaking for stealth tank
      if (updatedEnemy.type === "stealth" && updatedEnemy.specialCooldown !== undefined && updatedEnemy.specialCooldown <= 0) {
        // Randomly toggle invisibility
        if (Math.random() < 0.01) {
          updatedEnemy.isInvisible = !updatedEnemy.isInvisible
          updatedEnemy.specialCooldown = 5 // 5 second cooldown
        }
      }

      // Handle mine laying for demolition tank
      if (updatedEnemy.type === "demolition" && updatedEnemy.mineCooldown !== undefined) {
        updatedEnemy.mineCooldown -= cappedDeltaTime

        // Lay a mine if cooldown is up and randomly decides to
        if (updatedEnemy.mineCooldown <= 0 && Math.random() < 0.02) {
          // Place mine at current position
          newState.mines.push({
            position: { ...updatedEnemy.position },
            placedBy: "enemy",
            activationTimer: MINE_ACTIVATION_TIME,
            isActive: false,
            pulseTimer: 0,
          })

          // Play mine placement sound
          soundManager.play("minePlace")

          // Reset cooldown
          updatedEnemy.mineCooldown = 5 + Math.random() * 5 // 5-10 seconds
        }
      }

      // Handle missile firing for rocket tank
      if (updatedEnemy.type === "rocket" && updatedEnemy.missileCooldown !== undefined) {
        updatedEnemy.missileCooldown -= cappedDeltaTime

        // Fire a missile if cooldown is up and randomly decides to
        if (updatedEnemy.missileCooldown <= 0 && Math.random() < 0.03) {
          // Create missile direction and position
          const missileDirection = rotate({ x: 0, y: -1 }, updatedEnemy.rotation)
          const missilePosition = add(updatedEnemy.position, scale(missileDirection, TANK_SIZE / 2))

          // Create the missile
          newState.missiles.push({
            position: missilePosition,
            velocity: scale(missileDirection, MISSILE_SPEED * 0.7),
            rotation: updatedEnemy.rotation,
            target: { ...newState.player.position }, // Target the player
            isPlayerMissile: false,
            lifetime: 0,
            trail: [],
            smokeParticles: [],
          })

          // Play missile sound
          soundManager.play("missile")

          // Set muzzle flash
          updatedEnemy.muzzleFlash = 0.2 // Show muzzle flash for 0.2 seconds

          // Reset cooldown
          updatedEnemy.missileCooldown = 8 + Math.random() * 4 // 8-12 seconds
        }
      }
    }

    // Check if tank is stuck by comparing current position to last position
    const movementThreshold = 0.5 // Minimum distance to consider movement
    const currentMovement = distance(updatedEnemy.position, updatedEnemy.lastPosition)

    if (currentMovement < movementThreshold) {
      updatedEnemy.stuckTimer += cappedDeltaTime
    } else {
      updatedEnemy.stuckTimer = 0
    }

    // Update last position for next frame
    updatedEnemy.lastPosition = { ...updatedEnemy.position }

    // SIMPLIFIED MOVEMENT LOGIC
    // Change direction more frequently if stuck
    const changeDirectionChance = updatedEnemy.stuckTimer > 1.0 ? 0.2 : 0.02

    if (Math.random() < changeDirectionChance || updatedEnemy.stuckTimer > 2.0) {
      // If stuck for too long, make a more dramatic direction change
      if (updatedEnemy.stuckTimer > 1.5) {
        // Make a significant turn (90 to 270 degrees)
        updatedEnemy.rotation += Math.PI * (0.5 + Math.random())
        updatedEnemy.stuckTimer = 0 // Reset stuck timer
      } else {
        // Normal random direction change
        updatedEnemy.rotation += (Math.random() - 0.5) * Math.PI
      }
    }

    // Move forward with simplified logic
    updatedEnemy.isMoving = true

    // Apply a simple speed adjustment
    let speedMultiplier = 1.0

    // If stuck, occasionally try reversing
    if (updatedEnemy.stuckTimer > 1.0 && Math.random() < 0.3) {
      speedMultiplier = -0.8 // Back up
    }

    // Apply speed adjustments
    const moveVector = rotate(
      { x: 0, y: -updatedEnemy.speed * cappedDeltaTime * speedMultiplier },
      updatedEnemy.rotation,
    )
    const newPosition = add(updatedEnemy.position, moveVector)

    // SIMPLIFIED COLLISION DETECTION
    let collision = false

    // Check collision with blocks
    for (const block of newState.blocks) {
      if (
        checkRectCollision(
          { x: newPosition.x - TANK_SIZE / 2, y: newPosition.y - TANK_SIZE / 2 },
          { x: TANK_SIZE, y: TANK_SIZE },
          block.position,
          block.size,
        )
      ) {
        collision = true
        // Make a significant turn when hitting a block
        updatedEnemy.rotation += Math.PI * (0.5 + Math.random() * 0.5)
        break
      }
    }

    // Check collision with mines
    for (const mine of newState.mines) {
      if (distance(newPosition, mine.position) < (TANK_SIZE + MINE_SIZE) / 2) {
        collision = true
        // Turn away from mine
        updatedEnemy.rotation += Math.PI * (0.5 + Math.random() * 0.5)
        break
      }
    }

    // Check collision with other enemies - SIMPLIFIED
    if (!collision) {
      for (let i = 0; i < newState.enemies.length; i++) {
        if (i !== enemyIndex) {
          const otherEnemy = newState.enemies[i]
          const dist = distance(newPosition, otherEnemy.position)

          if (dist < TANK_SIZE * 1.2) {
            collision = true
            // Turn in a random direction
            updatedEnemy.rotation += Math.PI * (0.5 + Math.random())
            break
          }
        }
      }
    }

    // Check collision with player
    if (!collision && distance(newPosition, newState.player.position) < TANK_SIZE * 1.2) {
      collision = true
      // Turn away from player
      updatedEnemy.rotation += Math.PI * (0.5 + Math.random())
    }

    // Update position if no collision
    if (!collision) {
      updatedEnemy.position = newPosition

      // Animate treads
      updatedEnemy.treadOffset += cappedDeltaTime * updatedEnemy.speed * 0.05
      if (updatedEnemy.treadOffset > 10) updatedEnemy.treadOffset -= 10

      // Add track marks less frequently
      if (Math.random() < 0.02) {
        // Stealth tanks don't leave tracks when invisible
        if (!(updatedEnemy.type === "stealth" && updatedEnemy.isInvisible)) {
          updatedEnemy.trackHistory.push({ ...updatedEnemy.position })
          // Limit track history more aggressively
          if (updatedEnemy.trackHistory.length > 15) {
            updatedEnemy.trackHistory.shift()
          }
        }
      }

      // Add dust particles when moving
      if (Math.random() < cappedDeltaTime * 5) {
        // Create dust behind the tank
        const dustOffset = rotate({ x: 0, y: TANK_SIZE * 0.6 }, updatedEnemy.rotation)
        const dustPosition = add(updatedEnemy.position, dustOffset)
        updatedEnemy.dustParticles.push(createDustParticle(dustPosition))
      }
    } else {
      updatedEnemy.isMoving = false
    }

    // Handle enemy shooting
    updatedEnemy.reloadTime -= cappedDeltaTime
    if (updatedEnemy.reloadTime <= 0 && Math.random() < 0.03) {
      // Create a new bullet
      const bulletDirection = rotate({ x: 0, y: -1 }, updatedEnemy.rotation)
      const bulletPosition = add(updatedEnemy.position, scale(bulletDirection, TANK_SIZE / 2))

      // Check if this tank type should have ricochet ability
      // Artillery and stealth tanks get ricochet ability on higher levels
      const hasRicochetAbility =
        (updatedEnemy.type === "artillery" && state.level >= 4) || (updatedEnemy.type === "stealth" && state.level >= 5)

      newState.enemyBullets.push({
        position: bulletPosition,
        velocity: scale(bulletDirection, updatedEnemy.bulletSpeed),
        bounces: hasRicochetAbility ? 1 : updatedEnemy.type === "artillery" ? 5 : 3, // Artillery tanks get more bounces
        isPlayerBullet: false,
        power: updatedEnemy.bulletPower,
        trail: [], // Initialize empty trail
        hasRicocheted: false, // Initialize as not ricocheted
        originalShooter: "enemy", // Mark as enemy's bullet
        canRicochet: hasRicochetAbility, // New property to track if this bullet can use the ricochet system
      })

      // Set muzzle flash
      updatedEnemy.muzzleFlash = 0.1 // Show muzzle flash for 0.1 seconds

      // Play shoot sound (at lower volume for enemy tanks)
      soundManager.play("shoot")

      // Reset reload time
      updatedEnemy.reloadTime = TANK_TYPES[updatedEnemy.type].reloadTime * 1.5
    }

    return updatedEnemy
  })

  // Add this more aggressive tank separation logic right after updating all enemies
  // This will run every frame instead of periodically
  newState.enemies = separateOverlappingTanks({ ...newState }).enemies

  // Periodically check for and fix tank overlaps
  // if (Math.random() < 0.05) {
  //   // This will run approximately every 20 frames
  //   newState.enemies = separateOverlappingTanks({ ...newState }).enemies
  // }

  // Update player bullets - THIS IS THE KEY PART FOR RICOCHETS
  newState.playerBullets = newState.playerBullets
    .map((bullet) => {
      const updatedBullet = { ...bullet }

      // Store previous position for trail
      if (bullet.trail.length > 10) {
        bullet.trail.shift()
      }
      bullet.trail.push({ ...bullet.position })

      updatedBullet.position = add(updatedBullet.position, scale(updatedBullet.velocity, cappedDeltaTime))

      // Check collision with blocks
      let hitBlock = false
      for (const block of newState.blocks) {
        if (isPointInRect(updatedBullet.position, block.position, block.size)) {
          hitBlock = true

          // Barrier blocks always cause bullets to be removed without being destroyed
          if (block.type === "barrier") {
            // Play metal hit sound
            soundManager.play("metalHit")
            return null // Remove the bullet
          }

          // If bullet has not ricocheted yet, allow one ricochet
          if (!updatedBullet.hasRicocheted) {
            // Play appropriate hit sound based on block type
            if (block.type === "metal") {
              soundManager.play("metalHit")
            } else if (block.type === "brick") {
              soundManager.play("brickHit")
            } else if (block.type === "wood") {
              soundManager.play("woodHit")
            }

            // Determine which side of the block was hit for accurate reflection
            // First, calculate the previous position (before collision)
            const prevPosition = subtract(updatedBullet.position, scale(updatedBullet.velocity, cappedDeltaTime))

            // Calculate distances to each edge to determine which side was hit
            const distToLeft = Math.abs(updatedBullet.position.x - block.position.x)
            const distToRight = Math.abs(updatedBullet.position.x - (block.position.x + block.size.x))
            const distToTop = Math.abs(updatedBullet.position.y - block.position.y)
            const distToBottom = Math.abs(updatedBullet.position.y - (block.position.y + block.size.y))

            // Find the minimum distance to determine which side was hit
            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

            // Set the normal vector based on which side was hit
            let normal: Vector2D
            if (minDist === distToLeft && prevPosition.x < block.position.x) {
              normal = { x: -1, y: 0 } // Left side
            } else if (minDist === distToRight && prevPosition.x > block.position.x + block.size.x) {
              normal = { x: 1, y: 0 } // Right side
            } else if (minDist === distToTop && prevPosition.y < block.position.y) {
              normal = { x: 0, y: -1 } // Top side
            } else if (minDist === distToBottom && prevPosition.y > block.position.y + block.size.y) {
              normal = { x: 0, y: 1 } // Bottom side
            } else {
              // Corner case or ambiguous - use vector from center as fallback
              const blockCenter = {
                x: block.position.x + block.size.x / 2,
                y: block.position.y + block.size.y / 2,
              }
              normal = normalize(subtract(updatedBullet.position, blockCenter))
            }

            // Apply the reflection formula: r = v - 2(v·n)n
            // where v is velocity, n is normal, and r is reflected velocity
            const dotProduct = updatedBullet.velocity.x * normal.x + updatedBullet.velocity.y * normal.y
            updatedBullet.velocity = {
              x: updatedBullet.velocity.x - 2 * dotProduct * normal.x,
              y: updatedBullet.velocity.y - 2 * dotProduct * normal.y,
            }

            // Mark as ricocheted
            updatedBullet.hasRicocheted = true

            // Move bullet away to prevent multiple collisions with the same block
            updatedBullet.position = add(updatedBullet.position, scale(updatedBullet.velocity, cappedDeltaTime * 2))

            // Still destroy brick blocks
            if (block.type === "brick") {
              newState.blocks = newState.blocks.filter((b) => b !== block)
            }

            // Don't remove the bullet, it continues with ricocheted path
            return updatedBullet
          } else {
            // Bullet already ricocheted once, so destroy it
            // Still play sound and destroy brick blocks
            if (block.type === "brick") {
              soundManager.play("brickHit")
              newState.blocks = newState.blocks.filter((b) => b !== block)
            } else if (block.type === "wood") {
              soundManager.play("woodHit")
            } else if (block.type === "metal") {
              soundManager.play("metalHit")
            }

            return null // Remove the bullet
          }
        }
      }

      // If we didn't hit a block, check other collisions
      if (!hitBlock) {
        // Check collision with mines
        for (let i = 0; i < newState.mines.length; i++) {
          const mine = newState.mines[i]
          if (distance(updatedBullet.position, mine.position) < MINE_SIZE / 2) {
            // Trigger mine explosion
            triggerMineExplosion(newState, mine)

            // Remove the mine
            newState.mines.splice(i, 1)

            return null // Remove bullet
          }
        }

        // Check collision with enemies
        for (let i = 0; i < newState.enemies.length; i++) {
          const enemy = newState.enemies[i]
          // Use a slightly smaller collision radius to ensure bullets can hit overlapping tanks
          if (distance(updatedBullet.position, enemy.position) < TANK_SIZE * 0.4) {
            // Play explosion sound
            soundManager.play("explosion")

            // Create explosion effect
            newState.explosion = {
              position: { ...enemy.position },
              time: 0,
              maxTime: 0.8, // Longer explosion time for better effect
              particles: createExplosionParticles(enemy.position, 30), // Add particles
              radius: TANK_SIZE, // Standard explosion radius
            }

            // Remove enemy
            newState.enemies.splice(i, 1)

            // Increase score - different scores based on enemy type
            switch (enemy.type) {
              case "standard":
                newState.score += 100
                break
              case "light":
                newState.score += 150
                break
              case "heavy":
                newState.score += 200
                break
              case "stealth":
                newState.score += 250
                break
              case "artillery":
                newState.score += 300
                break
              case "demolition":
                newState.score += 275
                break
              case "rocket":
                newState.score += 350
                break
              default:
                newState.score += 100
            }

            return null // Remove bullet
          }
        }

        // Check collision with player (for ricocheted bullets)
        if (
          updatedBullet.hasRicocheted &&
          updatedBullet.originalShooter === "player" &&
          distance(updatedBullet.position, newState.player.position) < TANK_SIZE / 2
        ) {
          // Play explosion sound
          soundManager.play("explosion")

          // Player hit by their own ricocheted bullet - instant death
          newState.playerLives = 0

          // Add explosion effect
          newState.explosion = {
            position: { ...newState.player.position },
            time: 0,
            maxTime: 0.8,
            particles: createExplosionParticles(newState.player.position, 30),
            radius: TANK_SIZE,
          }

          return null // Remove bullet
        }

        // Check if bullet is out of bounds
        if (
          updatedBullet.position.x < 0 ||
          updatedBullet.position.x > newState.width ||
          updatedBullet.position.y < 0 ||
          updatedBullet.position.y > newState.height
        ) {
          return null // Remove bullet
        }
      }

      return updatedBullet
    })
    .filter(Boolean) as typeof newState.playerBullets

  // Update enemy bullets
  newState.enemyBullets = newState.enemyBullets
    .map((bullet) => {
      const updatedBullet = { ...bullet }

      // Store previous position for trail
      if (bullet.trail.length > 10) {
        bullet.trail.shift()
      }
      bullet.trail.push({ ...bullet.position })

      updatedBullet.position = add(updatedBullet.position, scale(updatedBullet.velocity, cappedDeltaTime))

      // Check collision with blocks
      for (const block of newState.blocks) {
        if (isPointInRect(updatedBullet.position, block.position, block.size)) {
          // Barrier blocks always cause bullets to be removed without being destroyed
          if (block.type === "barrier") {
            // Play metal hit sound
            soundManager.play("metalHit")
            return null // Remove bullet
          }

          // Check if this bullet can use the ricochet system (for advanced tanks)
          if (updatedBullet.canRicochet && !updatedBullet.hasRicocheted) {
            // Play appropriate hit sound based on block type
            if (block.type === "metal") {
              soundManager.play("metalHit")
            } else if (block.type === "brick") {
              soundManager.play("brickHit")
            } else if (block.type === "wood") {
              soundManager.play("woodHit")
            }

            // Determine which side of the block was hit for accurate reflection
            // First, calculate the previous position (before collision)
            const prevPosition = subtract(updatedBullet.position, scale(updatedBullet.velocity, cappedDeltaTime))

            // Calculate distances to each edge to determine which side was hit
            const distToLeft = Math.abs(updatedBullet.position.x - block.position.x)
            const distToRight = Math.abs(updatedBullet.position.x - (block.position.x + block.size.x))
            const distToTop = Math.abs(updatedBullet.position.y - block.position.y)
            const distToBottom = Math.abs(updatedBullet.position.y - (block.position.y + block.size.y))

            // Find the minimum distance to determine which side was hit
            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

            // Set the normal vector based on which side was hit
            let normal: Vector2D
            if (minDist === distToLeft && prevPosition.x < block.position.x) {
              normal = { x: -1, y: 0 } // Left side
            } else if (minDist === distToRight && prevPosition.x > block.position.x + block.size.x) {
              normal = { x: 1, y: 0 } // Right side
            } else if (minDist === distToTop && prevPosition.y < block.position.y) {
              normal = { x: 0, y: -1 } // Top side
            } else if (minDist === distToBottom && prevPosition.y > block.position.y + block.size.y) {
              normal = { x: 0, y: 1 } // Bottom side
            } else {
              // Corner case or ambiguous - use vector from center as fallback
              const blockCenter = {
                x: block.position.x + block.size.x / 2,
                y: block.position.y + block.size.y / 2,
              }
              normal = normalize(subtract(updatedBullet.position, blockCenter))
            }

            // Apply the reflection formula: r = v - 2(v·n)n
            const dotProduct = updatedBullet.velocity.x * normal.x + updatedBullet.velocity.y * normal.y
            updatedBullet.velocity = {
              x: updatedBullet.velocity.x - 2 * dotProduct * normal.x,
              y: updatedBullet.velocity.y - 2 * dotProduct * normal.y,
            }

            // Mark as ricocheted
            updatedBullet.hasRicocheted = true

            // Move bullet away to prevent multiple collisions with the same block
            updatedBullet.position = add(updatedBullet.position, scale(updatedBullet.velocity, cappedDeltaTime * 2))

            // Still destroy brick blocks
            if (block.type === "brick") {
              newState.blocks = newState.blocks.filter((b) => b !== block)
            }

            // Don't remove the bullet, it continues with ricocheted path
            return updatedBullet
          }
          // Handle regular bouncing for non-ricochet bullets
          else if (block.type === "metal" && updatedBullet.bounces > 0) {
            // Heavy tank bullets can destroy metal blocks
            if (updatedBullet.power >= 2 && !updatedBullet.isPlayerBullet) {
              // Play metal destruction sound
              soundManager.play("metalHit")

              newState.blocks = newState.blocks.filter((b) => b !== block)
              return null // Remove bullet
            }

            // Play bounce sound
            soundManager.play("bulletBounce")

            // Determine which side of the block was hit for accurate reflection
            // First, calculate the previous position (before collision)
            const prevPosition = subtract(updatedBullet.position, scale(updatedBullet.velocity, cappedDeltaTime))

            // Calculate distances to each edge to determine which side was hit
            const distToLeft = Math.abs(updatedBullet.position.x - block.position.x)
            const distToRight = Math.abs(updatedBullet.position.x - (block.position.x + block.size.x))
            const distToTop = Math.abs(updatedBullet.position.y - block.position.y)
            const distToBottom = Math.abs(updatedBullet.position.y - (block.position.y + block.size.y))

            // Find the minimum distance to determine which side was hit
            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

            // Set the normal vector based on which side was hit
            let normal: Vector2D
            if (minDist === distToLeft && prevPosition.x < block.position.x) {
              normal = { x: -1, y: 0 } // Left side
            } else if (minDist === distToRight && prevPosition.x > block.position.x + block.size.x) {
              normal = { x: 1, y: 0 } // Right side
            } else if (minDist === distToTop && prevPosition.y < block.position.y) {
              normal = { x: 0, y: -1 } // Top side
            } else if (minDist === distToBottom && prevPosition.y > block.position.y + block.size.y) {
              normal = { x: 0, y: 1 } // Bottom side
            } else {
              // Corner case or ambiguous - use vector from center as fallback
              const blockCenter = {
                x: block.position.x + block.size.x / 2,
                y: block.position.y + block.size.y / 2,
              }
              normal = normalize(subtract(updatedBullet.position, blockCenter))
            }

            // Apply the reflection formula: r = v - 2(v·n)n
            const dotProduct = updatedBullet.velocity.x * normal.x + updatedBullet.velocity.y * normal.y
            updatedBullet.velocity = {
              x: updatedBullet.velocity.x - 2 * dotProduct * normal.x,
              y: updatedBullet.velocity.y - 2 * dotProduct * normal.y,
            }

            updatedBullet.bounces--
            updatedBullet.hasRicocheted = true

            // Move bullet away from block to prevent multiple collisions
            updatedBullet.position = add(updatedBullet.position, scale(updatedBullet.velocity, cappedDeltaTime * 2))

            return updatedBullet
          } else if (block.type === "brick") {
            // Play brick hit sound
            soundManager.play("brickHit")

            // Destroy brick blocks
            newState.blocks = newState.blocks.filter((b) => b !== block)
            return null // Remove bullet
          } else if (block.type === "wood") {
            // Play wood hit sound
            soundManager.play("woodHit")

            return null // Remove bullet, but don't destroy wood
          }
        }
      }

      // Check collision with mines
      for (let i = 0; i < newState.mines.length; i++) {
        const mine = newState.mines[i]
        if (distance(updatedBullet.position, mine.position) < MINE_SIZE / 2) {
          // Trigger mine explosion
          triggerMineExplosion(newState, mine)

          // Remove the mine
          newState.mines.splice(i, 1)

          return null // Remove bullet
        }
      }

      // Check collision with player
      if (distance(updatedBullet.position, newState.player.position) < TANK_SIZE / 2) {
        // Play explosion sound
        soundManager.play("explosion")

        // Decrement player lives
        newState.playerLives--

        // Add explosion effect
        newState.explosion = {
          position: { ...newState.player.position },
          time: 0,
          maxTime: 0.8,
          particles: createExplosionParticles(newState.player.position, 30),
          radius: TANK_SIZE,
        }

        return null // Remove bullet
      }

      // Check if bullet is out of bounds
      if (
        updatedBullet.position.x < 0 ||
        updatedBullet.position.x > newState.width ||
        updatedBullet.position.y < 0 ||
        updatedBullet.position.y > newState.height
      ) {
        return null // Remove bullet
      }

      return updatedBullet
    })
    .filter(Boolean) as typeof newState.enemyBullets

  // Update missiles
  newState.missiles = newState.missiles
    .map((missile) => {
      const updatedMissile = { ...missile }

      // Increment lifetime
      updatedMissile.lifetime += cappedDeltaTime

      // Store previous position for trail
      if (missile.trail.length > 15) {
        missile.trail.shift()
      }
      missile.trail.push({ ...missile.position })

      // Add smoke particles
      if (Math.random() < cappedDeltaTime * 15) {
        const offset = rotate({ x: 0, y: 5 }, missile.rotation)
        const smokePos = add(missile.position, offset)
        updatedMissile.smokeParticles.push(createSmokeParticle(smokePos))
      }

      // Update smoke particles
      updatedMissile.smokeParticles = updateSmokeParticles(updatedMissile.smokeParticles, cappedDeltaTime)

      // If missile has a target (guided), adjust trajectory
      if (updatedMissile.target) {
        // Calculate direction to target
        const dirToTarget = normalize(subtract(updatedMissile.target, updatedMissile.position))

        // Calculate current direction
        const currentDir = normalize(updatedMissile.velocity)

        // Gradually adjust direction (limited turning rate)
        const turnRate = 2.0 * cappedDeltaTime
        const newDir = {
          x: currentDir.x + (dirToTarget.x - currentDir.x) * turnRate,
          y: currentDir.y + (dirToTarget.y - currentDir.y) * turnRate,
        }

        // Normalize and apply speed
        const normalizedDir = normalize(newDir)
        updatedMissile.velocity = scale(normalizedDir, MISSILE_SPEED)

        // Update rotation to match direction
        updatedMissile.rotation = Math.atan2(normalizedDir.y, normalizedDir.x) + Math.PI / 2
      }

      // Move missile
      updatedMissile.position = add(updatedMissile.position, scale(updatedMissile.velocity, cappedDeltaTime))

      // Check collision with blocks
      for (const block of newState.blocks) {
        if (isPointInRect(updatedMissile.position, block.position, block.size)) {
          // Create explosion at missile position
          createMissileExplosion(newState, updatedMissile.position)

          // Destroy brick blocks and damage metal blocks, but not barriers
          if (block.type !== "metal" && block.type !== "barrier") {
            newState.blocks = newState.blocks.filter((b) => b !== block)
          }

          return null // Remove missile
        }
      }

      // Check collision with player
      if (distance(updatedMissile.position, newState.player.position) < (TANK_SIZE + MISSILE_SIZE) / 2) {
        // Create explosion at missile position
        createMissileExplosion(newState, updatedMissile.position)

        // Damage player
        newState.playerLives--

        return null // Remove missile
      }

      // Check collision with enemies - ONLY for player missiles
      if (updatedMissile.isPlayerMissile) {
        for (let i = 0; i < newState.enemies.length; i++) {
          const enemy = newState.enemies[i]
          if (distance(updatedMissile.position, enemy.position) < (TANK_SIZE + MISSILE_SIZE) / 2) {
            // Create explosion at missile position
            createMissileExplosion(newState, updatedMissile.position)

            // Remove enemy
            newState.enemies.splice(i, 1)

            // Increase score
            switch (enemy.type) {
              case "standard":
                newState.score += 100
                break
              case "light":
                newState.score += 150
                break
              case "heavy":
                newState.score += 200
                break
              case "stealth":
                newState.score += 250
                break
              case "artillery":
                newState.score += 300
                break
              case "demolition":
                newState.score += 275
                break
              case "rocket":
                newState.score += 350
                break
              default:
                newState.score += 100
            }

            return null // Remove missile
          }
        }
      }

      // Check if missile is out of bounds or has lived too long
      if (
        updatedMissile.position.x < 0 ||
        updatedMissile.position.x > newState.width ||
        updatedMissile.position.y < 0 ||
        updatedMissile.position.y > newState.height ||
        updatedMissile.lifetime > 10 // Maximum 10 seconds lifetime
      ) {
        // Create explosion at missile position if it's out of bounds
        createMissileExplosion(newState, updatedMissile.position)
        return null // Remove missile
      }

      return updatedMissile
    })
    .filter(Boolean) as typeof newState.missiles

  // Update mines
  newState.mines = newState.mines
    .map((mine) => {
      const updatedMine = { ...mine }

      // If mine is not active yet, count down activation timer
      if (!updatedMine.isActive) {
        updatedMine.activationTimer -= cappedDeltaTime

        // Activate mine when timer reaches zero
        if (updatedMine.activationTimer <= 0) {
          updatedMine.isActive = true
          soundManager.play("mineActivate")
        }
      }

      // Update pulse timer for visual effect
      updatedMine.pulseTimer = (updatedMine.pulseTimer + cappedDeltaTime) % 1.0

      // Check if active mine is triggered by player proximity
      if (updatedMine.isActive && distance(updatedMine.position, newState.player.position) < TANK_SIZE) {
        // Trigger mine explosion
        triggerMineExplosion(newState, updatedMine)

        // Damage player
        newState.playerLives--

        return null // Remove mine
      }

      return updatedMine
    })
    .filter(Boolean) as typeof newState.mines

  // Update explosion if it exists
  if (newState.explosion) {
    newState.explosion.time += cappedDeltaTime

    // Update explosion particles
    if (newState.explosion.particles) {
      newState.explosion.particles = updateExplosionParticles(newState.explosion.particles, cappedDeltaTime)
    }

    if (newState.explosion.time >= newState.explosion.maxTime) {
      newState.explosion = null
    }
  }

  // Check if level is complete (all enemies defeated)
  if (newState.enemies.length === 0) {
    // Play level complete sound
    soundManager.play("levelComplete")

    // Go to next level
    return nextLevel(newState)
  }

  return newState
}

// Helper function to trigger a mine explosion
function triggerMineExplosion(state: GameState, mine: Mine) {
  // Play explosion sound
  soundManager.play("explosion")

  // Create explosion effect
  state.explosion = {
    position: { ...mine.position },
    time: 0,
    maxTime: 0.8,
    particles: createExplosionParticles(mine.position, 25),
    radius: TANK_SIZE * 1.2, // Slightly larger than tank
  }

  // Check for damage to nearby entities
  const explosionRadius = TANK_SIZE * 1.2

  // Check damage to player
  if (distance(mine.position, state.player.position) < explosionRadius) {
    state.playerLives--
  }

  // Check damage to enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    if (distance(mine.position, state.enemies[i].position) < explosionRadius) {
      // Only remove enemy if it was a player's mine
      if (mine.placedBy === "player") {
        // Remove enemy
        const enemy = state.enemies[i]
        state.enemies.splice(i, 1)

        // Increase score
        switch (enemy.type) {
          case "standard":
            state.score += 100
            break
          case "light":
            state.score += 150
            break
          case "heavy":
            state.score += 200
            break
          case "stealth":
            state.score += 250
            break
          case "artillery":
            state.score += 300
            break
          case "demolition":
            state.score += 275
            break
          case "rocket":
            state.score += 350
            break
          default:
            state.score += 100
        }
      }
    }
  }
}

// Helper function to create a missile explosion
function createMissileExplosion(state: GameState, position: Vector2D) {
  // Play big explosion sound
  soundManager.play("bigExplosion")

  // Create explosion effect
  state.explosion = {
    position: { ...position },
    time: 0,
    maxTime: 1.0, // Longer explosion time for missiles
    particles: createExplosionParticles(position, 40), // More particles
    radius: MISSILE_EXPLOSION_RADIUS,
  }

  // Check for damage to nearby entities

  // Check damage to player
  if (distance(position, state.player.position) < MISSILE_EXPLOSION_RADIUS) {
    state.playerLives--
  }

  // Check damage to enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    if (distance(position, state.enemies[i].position) < MISSILE_EXPLOSION_RADIUS) {
      // Only remove enemy if it was a player's missile
      if (state.missiles.some((m) => m.isPlayerMissile && distance(m.position, position) < 5)) {
        // Remove enemy
        state.enemies.splice(i, 1)

        // Increase score
        state.score += 150
      }
    }
  }

  // Check damage to blocks
  for (let i = state.blocks.length - 1; i >= 0; i--) {
    const block = state.blocks[i]
    // Check if explosion overlaps with block
    if (
      position.x + MISSILE_EXPLOSION_RADIUS > block.position.x &&
      position.x - MISSILE_EXPLOSION_RADIUS < block.position.x + block.size.x &&
      position.y + MISSILE_EXPLOSION_RADIUS > block.position.y &&
      position.y - MISSILE_EXPLOSION_RADIUS < block.position.y + block.size.y
    ) {
      // Destroy non-metal and non-barrier blocks
      if (block.type !== "metal" && block.type !== "barrier") {
        state.blocks.splice(i, 1)
      }
    }
  }

  // Check damage to mines - trigger chain reaction
  for (let i = state.mines.length - 1; i >= 0; i--) {
    if (distance(position, state.mines[i].position) < MISSILE_EXPLOSION_RADIUS) {
      // Trigger mine explosion
      triggerMineExplosion(state, state.mines[i])

      // Remove mine
      state.mines.splice(i, 1)
    }
  }
}

// Draw game
export const drawGame = (ctx: CanvasRenderingContext2D, state: GameState) => {
  // Clear canvas
  ctx.clearRect(0, 0, state.width, state.height)

  // Draw background (wooden texture)
  ctx.fillStyle = "#f0d6a8"
  ctx.fillRect(0, 0, state.width, state.height)

  // Draw grid pattern for the floor - simplified for performance
  ctx.strokeStyle = "rgba(139, 69, 19, 0.1)"
  ctx.lineWidth = 1
  const gridSize = 80 // Larger grid for better performance

  for (let x = 0; x < state.width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, state.height)
    ctx.stroke()
  }

  for (let y = 0; y < state.height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(state.width, y)
    ctx.stroke()
  }

  // Draw track marks for all tanks
  drawTrackMarks(ctx, state)

  // Draw blocks
  for (const block of state.blocks) {
    drawBlock(ctx, block)
  }

  // Draw mines
  for (const mine of state.mines) {
    drawMine(ctx, mine)
  }

  // Draw player bullets
  for (const bullet of state.playerBullets) {
    drawBullet(ctx, bullet)
  }

  // Draw enemy bullets
  for (const bullet of state.enemyBullets) {
    drawBullet(ctx, bullet)
  }

  // Draw missiles
  for (const missile of state.missiles) {
    drawMissile(ctx, missile)
  }

  // Draw player tank
  drawTank(ctx, state.player, true)

  // Draw enemy tanks
  for (const enemy of state.enemies) {
    drawTank(ctx, enemy, false)
  }

  // Draw explosion if it exists
  if (state.explosion) {
    drawExplosion(ctx, state.explosion)
  }

  // Draw level start countdown if active
  if (state.isLevelStarting) {
    // Create semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(0, 0, state.width, state.height)

    // Draw "Get Ready" text
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 48px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("GET READY", state.width / 2, state.height / 2 - 40)

    // Draw countdown number
    ctx.font = "bold 72px Arial"
    ctx.fillText(Math.ceil(state.levelStartCountdown).toString(), state.width / 2, state.height / 2 + 40)

    // Draw level info
    ctx.font = "bold 32px Arial"
    ctx.fillText(`MISSION ${state.level}`, state.width / 2, state.height / 2 + 120)
  }
}

// Draw track marks
function drawTrackMarks(ctx: CanvasRenderingContext2D, state: GameState) {
  // Draw player track marks
  ctx.fillStyle = "rgba(100, 100, 100, 0.2)"
  for (const track of state.player.trackHistory) {
    ctx.beginPath()
    ctx.arc(track.x, track.y, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw enemy track marks
  for (const enemy of state.enemies) {
    ctx.fillStyle = `rgba(100, 100, 100, 0.2)`
    for (const track of enemy.trackHistory) {
      ctx.beginPath()
      ctx.arc(track.x, track.y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// Draw a block
function drawBlock(ctx: CanvasRenderingContext2D, block: Block) {
  // Set color based on block type
  switch (block.type) {
    case "wood":
      ctx.fillStyle = "#8B4513" // Saddle brown
      break
    case "brick":
      ctx.fillStyle = "#CD5C5C" // Indian red
      break
    case "metal":
      ctx.fillStyle = "#708090" // Slate gray
      break
    case "barrier":
      ctx.fillStyle = "#1E1E1E" // Almost black
      break
  }

  // Draw block
  ctx.fillRect(block.position.x, block.position.y, block.size.x, block.size.y)

  // Draw block border
  ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
  ctx.lineWidth = 2
  ctx.strokeRect(block.position.x, block.position.y, block.size.x, block.size.y)

  // Draw block details based on type
  switch (block.type) {
    case "wood":
      // Wood grain
      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)"
      ctx.lineWidth = 1
      for (let i = 0; i < block.size.x; i += 8) {
        ctx.beginPath()
        ctx.moveTo(block.position.x + i, block.position.y)
        ctx.lineTo(block.position.x + i, block.position.y + block.size.y)
        ctx.stroke()
      }
      break
    case "brick":
      // Brick pattern
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
      ctx.lineWidth = 1
      for (let i = 0; i < block.size.y; i += 10) {
        ctx.beginPath()
        ctx.moveTo(block.position.x, block.position.y + i)
        ctx.lineTo(block.position.x + block.size.x, block.position.y + i)
        ctx.stroke()
      }
      for (let i = 0; i < block.size.x; i += 20) {
        ctx.beginPath()
        ctx.moveTo(block.position.x + i, block.position.y)
        ctx.lineTo(block.position.x + i, block.position.y + block.size.y)
        ctx.stroke()
      }
      break
    case "metal":
      // Metal shine
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
      ctx.beginPath()
      ctx.moveTo(block.position.x, block.position.y)
      ctx.lineTo(block.position.x + 10, block.position.y)
      ctx.lineTo(block.position.x, block.position.y + 10)
      ctx.fill()
      break
    case "barrier":
      // Simplified barrier appearance - just a border
      ctx.strokeStyle = "#444444" // Dark gray border
      ctx.lineWidth = 3
      ctx.strokeRect(block.position.x + 2, block.position.y + 2, block.size.x - 4, block.size.y - 4)

      // Add a subtle inner border
      ctx.strokeStyle = "#666666" // Lighter gray inner border
      ctx.lineWidth = 1
      ctx.strokeRect(block.position.x + 5, block.position.y + 5, block.size.x - 10, block.size.y - 10)
      break
  }
}

// Draw a mine
function drawMine(ctx: CanvasRenderingContext2D, mine: Mine) {
  // Calculate pulse effect
  const pulseScale = mine.isActive ? 1 + Math.sin(mine.pulseTimer * Math.PI * 2) * 0.1 : 1

  // Draw mine body
  ctx.fillStyle = mine.isActive ? "#FF0000" : "#555555"
  ctx.beginPath()
  ctx.arc(mine.position.x, mine.position.y, (MINE_SIZE / 2) * pulseScale, 0, Math.PI * 2)
  ctx.fill()

  // Draw mine details
  ctx.strokeStyle = "#000000"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(mine.position.x, mine.position.y, (MINE_SIZE / 2) * pulseScale, 0, Math.PI * 2)
  ctx.stroke()

  // Draw activation indicator
  if (!mine.isActive) {
    const progress = 1 - mine.activationTimer / MINE_ACTIVATION_TIME
    ctx.strokeStyle = "#FFFF00"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(mine.position.x, mine.position.y, (MINE_SIZE / 2) * 0.8, 0, Math.PI * 2 * progress)
    ctx.stroke()
  } else {
    // Draw blinking light when active
    if (Math.sin(mine.pulseTimer * Math.PI * 10) > 0) {
      ctx.fillStyle = "#FFFF00"
      ctx.beginPath()
      ctx.arc(mine.position.x, mine.position.y, MINE_SIZE / 6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// Draw a bullet
function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet) {
  // Draw bullet trail
  if (bullet.trail.length > 1) {
    ctx.strokeStyle = bullet.hasRicocheted ? "rgba(255, 165, 0, 0.3)" : "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y)
    for (let i = 1; i < bullet.trail.length; i++) {
      ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y)
    }
    ctx.stroke()
  }

  // Draw bullet glow
  const glowSize = bullet.hasRicocheted ? 12 : 8
  const gradient = ctx.createRadialGradient(
    bullet.position.x,
    bullet.position.y,
    0,
    bullet.position.x,
    bullet.position.y,
    glowSize,
  )

  if (bullet.hasRicocheted) {
    // Orange glow for ricocheted bullets
    gradient.addColorStop(0, "rgba(255, 165, 0, 0.8)")
    gradient.addColorStop(1, "rgba(255, 165, 0, 0)")
  } else if (bullet.isPlayerBullet) {
    // Blue glow for player bullets
    gradient.addColorStop(0, "rgba(0, 100, 255, 0.5)")
    gradient.addColorStop(1, "rgba(0, 100, 255, 0)")
  } else {
    // Red glow for enemy bullets
    gradient.addColorStop(0, "rgba(255, 0, 0, 0.5)")
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)")
  }

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(bullet.position.x, bullet.position.y, glowSize, 0, Math.PI * 2)
  ctx.fill()

  // Draw bullet
  ctx.fillStyle = bullet.hasRicocheted ? "#FFA500" : bullet.isPlayerBullet ? "#FFFFFF" : "#FF0000"
  ctx.beginPath()
  ctx.arc(bullet.position.x, bullet.position.y, 3, 0, Math.PI * 2)
  ctx.fill()
}

// Draw a missile
function drawMissile(ctx: CanvasRenderingContext2D, missile: Missile) {
  // Draw smoke particles
  for (const particle of missile.smokeParticles) {
    ctx.fillStyle = `rgba(100, 100, 100, ${particle.opacity})`
    ctx.beginPath()
    ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw missile trail
  if (missile.trail.length > 1) {
    ctx.strokeStyle = missile.isPlayerMissile ? "rgba(0, 100, 255, 0.3)" : "rgba(255, 0, 0, 0.3)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(missile.trail[0].x, missile.trail[0].y)
    for (let i = 1; i < missile.trail.length; i++) {
      ctx.lineTo(missile.trail[i].x, missile.trail[i].y)
    }
    ctx.stroke()
  }

  // Save context for rotation
  ctx.save()
  ctx.translate(missile.position.x, missile.position.y)
  ctx.rotate(missile.rotation)

  // Draw missile body
  ctx.fillStyle = missile.isPlayerMissile ? "#0064FF" : "#FF0000"
  ctx.beginPath()
  ctx.moveTo(0, -MISSILE_SIZE / 2)
  ctx.lineTo(MISSILE_SIZE / 4, MISSILE_SIZE / 4)
  ctx.lineTo(-MISSILE_SIZE / 4, MISSILE_SIZE / 4)
  ctx.closePath()
  ctx.fill()

  // Draw missile fins
  ctx.fillStyle = "#555555"
  ctx.beginPath()
  ctx.moveTo(MISSILE_SIZE / 4, MISSILE_SIZE / 4)
  ctx.lineTo(MISSILE_SIZE / 2, MISSILE_SIZE / 2)
  ctx.lineTo(MISSILE_SIZE / 4, MISSILE_SIZE / 2)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(-MISSILE_SIZE / 4, MISSILE_SIZE / 4)
  ctx.lineTo(-MISSILE_SIZE / 2, MISSILE_SIZE / 2)
  ctx.lineTo(-MISSILE_SIZE / 4, MISSILE_SIZE / 2)
  ctx.closePath()
  ctx.fill()

  // Draw missile exhaust flame
  const flameSize = 0.5 + Math.random() * 0.5
  ctx.fillStyle = "#FFA500"
  ctx.beginPath()
  ctx.moveTo(MISSILE_SIZE / 8, MISSILE_SIZE / 4)
  ctx.lineTo(0, MISSILE_SIZE * flameSize)
  ctx.lineTo(-MISSILE_SIZE / 8, MISSILE_SIZE / 4)
  ctx.closePath()
  ctx.fill()

  // Restore context
  ctx.restore()

  // Draw missile glow
  const glowSize = 16
  const gradient = ctx.createRadialGradient(
    missile.position.x,
    missile.position.y,
    0,
    missile.position.x,
    missile.position.y,
    glowSize,
  )

  if (missile.isPlayerMissile) {
    // Blue glow for player missiles
    gradient.addColorStop(0, "rgba(0, 100, 255, 0.3)")
    gradient.addColorStop(1, "rgba(0, 100, 255, 0)")
  } else {
    // Red glow for enemy missiles
    gradient.addColorStop(0, "rgba(255, 0, 0, 0.3)")
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)")
  }

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(missile.position.x, missile.position.y, glowSize, 0, Math.PI * 2)
  ctx.fill()
}

// Draw a tank
function drawTank(ctx: CanvasRenderingContext2D, tank: Tank, isPlayer: boolean) {
  if (isPlayer && catTankImage && catTankImage.complete) {
    ctx.save();
    ctx.translate(tank.position.x, tank.position.y);
    ctx.rotate(tank.rotation);
    const imgW = 60; // Adjust to your image's pixel size
    const imgH = 60;
    ctx.drawImage(catTankImage, -imgW/2, -imgH/2, imgW, imgH);
    ctx.restore();
    // Draw muzzle flash if firing (from mouth)
    if (tank.muzzleFlash > 0) {
      ctx.save();
      ctx.translate(tank.position.x, tank.position.y);
      ctx.rotate(tank.rotation);
      // Mouth position relative to center (adjust as needed)
      const mouthX = 32; // px right from center
      const mouthY = 0;  // px up from center
      ctx.beginPath();
      ctx.arc(mouthX, mouthY, 12, 10, Math.PI * 2);
      ctx.fillStyle = '#FFFF00';
      ctx.globalAlpha = 0.8;
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.restore();
    }
    return;
  }
  // Skip drawing if tank is invisible (stealth tank)
  if (tank.isInvisible) {
    // Draw a faint outline for stealth tanks
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(tank.position.x, tank.position.y, TANK_SIZE / 2, 0, Math.PI * 2)
    ctx.stroke()
    return
  }

  // Draw tank dust particles
  for (const particle of tank.dustParticles) {
    ctx.fillStyle = `rgba(210, 180, 140, ${particle.opacity})`
    ctx.beginPath()
    ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Save context for rotation
  ctx.save()
  ctx.translate(tank.position.x, tank.position.y)
  ctx.rotate(tank.rotation)

  // Draw tank shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
  ctx.beginPath()
  ctx.ellipse(2, 2, TANK_SIZE / 2, TANK_SIZE / 1.8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Draw tank treads
  ctx.fillStyle = "#333333"

  // Left tread
  ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE / 6, TANK_SIZE)

  // Right tread
  ctx.fillRect(TANK_SIZE / 3, -TANK_SIZE / 2, TANK_SIZE / 6, TANK_SIZE)

  // Draw tread details (animated)
  ctx.fillStyle = "#222222"
  for (let i = -TANK_SIZE / 2; i < TANK_SIZE / 2; i += 5) {
    // Left tread details
    ctx.fillRect(-TANK_SIZE / 2, i + (tank.treadOffset % 5), TANK_SIZE / 6, 2)

    // Right tread details
    ctx.fillRect(TANK_SIZE / 3, i + (tank.treadOffset % 5), TANK_SIZE / 6, 2)
  }

  // Draw tank body
  ctx.fillStyle = tank.color
  ctx.beginPath()
  ctx.roundRect(-TANK_SIZE / 3, -TANK_SIZE / 3, (TANK_SIZE * 2) / 3, (TANK_SIZE * 2) / 3, 3)
  ctx.fill()

  // Draw tank turret
  ctx.fillStyle = tank.color
  ctx.beginPath()
  ctx.arc(0, 0, TANK_SIZE / 4, 0, Math.PI * 2)
  ctx.fill()

  // Draw tank barrel - longer for more realistic appearance
  ctx.fillStyle = "#555555"
  ctx.fillRect(-TANK_SIZE / 12, -TANK_SIZE * 0.7, TANK_SIZE / 6, TANK_SIZE / 2)

  // Add barrel detail
  ctx.fillStyle = "#444444"
  ctx.fillRect(-TANK_SIZE / 24, -TANK_SIZE * 0.65, TANK_SIZE / 12, TANK_SIZE / 2.2)

  // Draw muzzle flash if firing
  if (tank.muzzleFlash > 0) {
    ctx.fillStyle = "#FFFF00"
    ctx.beginPath()
    ctx.arc(0, -TANK_SIZE / 2, TANK_SIZE / 6, 0, Math.PI * 2)
    ctx.fill()
  }

  // Restore context
  ctx.restore()

  // Draw tank health bar if damaged
  if (tank.health < 100) {
    const healthBarWidth = TANK_SIZE * 0.8
    const healthPercent = tank.health / 100

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(tank.position.x - healthBarWidth / 2, tank.position.y - TANK_SIZE / 2 - 10, healthBarWidth, 5)

    // Health
    ctx.fillStyle = healthPercent > 0.5 ? "#00FF00" : healthPercent > 0.25 ? "#FFFF00" : "#FF0000"
    ctx.fillRect(
      tank.position.x - healthBarWidth / 2,
      tank.position.y - TANK_SIZE / 2 - 10,
      healthBarWidth * healthPercent,
      5,
    )
  }
}

// Add the missing drawExplosion function
function drawExplosion(ctx: CanvasRenderingContext2D, explosion: NonNullable<Explosion>) {
  // Draw explosion particles
  for (const particle of explosion.particles) {
    ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255)
      .toString(16)
      .padStart(2, "0")}`
    ctx.beginPath()
    ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw explosion shockwave
  const progress = explosion.time / explosion.maxTime
  const radius = explosion.radius * progress
  const alpha = 1 - progress

  const gradient = ctx.createRadialGradient(
    explosion.position.x,
    explosion.position.y,
    0,
    explosion.position.x,
    explosion.position.y,
    radius,
  )

  gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha * 0.8})`)
  gradient.addColorStop(0.5, `rgba(255, 100, 50, ${alpha * 0.5})`)
  gradient.addColorStop(1, `rgba(255, 50, 50, 0)`)

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(explosion.position.x, explosion.position.y, radius, 0, Math.PI * 2)
  ctx.fill()
}
