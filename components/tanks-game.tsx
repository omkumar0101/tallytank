"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useKeyboardControls } from "@/hooks/use-keyboard-controls"
import { drawGame, updateGame } from "@/lib/game-engine"
import {
  type GameState,
  restartLevel,
  type TankType,
  TANK_TYPES,
  type GameSpeed,
  createLevelWithRightWall,
} from "@/lib/game-state"
import TouchControls from "./touch-controls"
import { useMobile } from "@/hooks/use-mobile"
import type { Controls } from "@/hooks/use-keyboard-controls"
import { Pause, Play, RotateCcw, Trophy, X, Heart, Volume2, Info, Gamepad2 } from "lucide-react"
import FullScreenButton from "./full-screen-button"
import SoundControl from "./sound-control"
import SpeedControl from "./speed-control"
import { soundManager } from "@/lib/sound-manager"

export default function TanksGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Initialize with a fresh game state using createLevelWithRightWall directly
  const [gameState, setGameState] = useState<GameState>(() => {
    // Create a fresh game state with default dimensions
    // We'll update the dimensions in the resize handler
    return createLevelWithRightWall(1, 800, 600)
  })
  const [isGameOver, setIsGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLevelFailed, setIsLevelFailed] = useState(false)
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>("normal")
  const keyboardControls = useKeyboardControls()
  const [touchControls, setTouchControls] = useState<Controls>({
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
  })
  const isMobile = useMobile()
  const [showSoundPrompt, setShowSoundPrompt] = useState(true)

  // Use refs to avoid unnecessary re-renders
  const gameStateRef = useRef(gameState)
  const requestAnimationRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number>(0)
  const controlsRef = useRef(touchControls)
  const currentLevelRef = useRef(1)

  // Fire animation state
  const [fireActive, setFireActive] = useState(false)

  // Modal state for How to Play
  const [showHowToPlay, setShowHowToPlay] = useState(true)

  // Fire animation runs while game is playing
  useEffect(() => {
    if (!isGameOver && !isPaused && !isLevelFailed && !gameState.isLevelStarting) {
      setFireActive(true)
    } else {
      setFireActive(false)
    }
  }, [isGameOver, isPaused, isLevelFailed, gameState.isLevelStarting])

  // Add this at the beginning of the component function
  useEffect(() => {
    // Initialize sound manager
    soundManager.init()

    // Enable sounds on any user interaction
    const handleUserInteraction = () => {
      soundManager.handleUserInteraction()
      // Play a sound to confirm audio is working
      soundManager.play("buttonClick")

      // Remove event listeners after first interaction
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)
      document.removeEventListener("touchstart", handleUserInteraction)
    }

    document.addEventListener("click", handleUserInteraction)
    document.addEventListener("keydown", handleUserInteraction)
    document.addEventListener("touchstart", handleUserInteraction)

    return () => {
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)
      document.removeEventListener("touchstart", handleUserInteraction)
    }
  }, [])

  // Handle user interaction for sounds
  const handleSoundEnable = useCallback(() => {
    soundManager.handleUserInteraction()
    setShowSoundPrompt(false)

    // Play tank start sound after a short delay
    setTimeout(() => {
      soundManager.play("tankStart")
    }, 500)
  }, [])

  // Update refs when state changes
  useEffect(() => {
    gameStateRef.current = gameState
    currentLevelRef.current = gameState.level
  }, [gameState])

  useEffect(() => {
    controlsRef.current = touchControls
  }, [touchControls])

  // Set up global click handler to enable sounds
  useEffect(() => {
    const handleGlobalClick = () => {
      if (showSoundPrompt) {
        handleSoundEnable()
      }
    }

    window.addEventListener("click", handleGlobalClick, { once: true })

    return () => {
      window.removeEventListener("click", handleGlobalClick)
    }
  }, [showSoundPrompt, handleSoundEnable])

  // Handle game speed change
  const handleSpeedChange = useCallback((speed: GameSpeed) => {
    setGameSpeed(speed)
    setGameState((prevState) => ({
      ...prevState,
      gameSpeed: speed,
    }))

    // Play sound effect when changing speed
    soundManager.play("buttonClick")
  }, [])

  // Combine keyboard and touch controls
  const controls = {
    up: keyboardControls.up || touchControls.up,
    down: keyboardControls.down || touchControls.down,
    left: keyboardControls.left || touchControls.left,
    right: keyboardControls.right || touchControls.right,
    fire: keyboardControls.fire || touchControls.fire,
  }

  // Handle touch controls change
  const handleTouchControlsChange = useCallback((newControls: Controls) => {
    setTouchControls(newControls)
  }, [])

  // Handle keyboard pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        setIsPaused((prev) => {
          // Play button click sound
          soundManager.play("buttonClick")
          return !prev
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return

      const container = canvasRef.current.parentElement
      if (!container) return

      // Get container dimensions
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // Calculate dimensions to maintain 4:3 aspect ratio
      // and use the full width of the container
      const gameWidth = containerWidth
      const gameHeight = containerWidth * (3 / 4) // 4:3 aspect ratio

      // Set canvas dimensions
      canvasRef.current.width = gameWidth
      canvasRef.current.height = gameHeight

      // Update game state dimensions with fresh initial state
      setGameState((prevState) => {
        // Always use createLevelWithRightWall to ensure right wall is at the edge
        return {
          ...createLevelWithRightWall(prevState.level, gameWidth, gameHeight),
          score: prevState.score,
          playerLives: prevState.playerLives,
          gameSpeed: prevState.gameSpeed,
          continuesRemaining: prevState.continuesRemaining,
          levelStartCountdown: prevState.levelStartCountdown,
          isLevelStarting: prevState.isLevelStarting,
        }
      })
    }

    // Initial resize
    handleResize()

    // Listen for window resize
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Prevent default touch behavior on mobile
  useEffect(() => {
    if (!isMobile) return

    const preventDefault = (e: TouchEvent) => {
      e.preventDefault()
    }

    document.addEventListener("touchmove", preventDefault, { passive: false })
    document.addEventListener("touchstart", preventDefault, { passive: false })

    return () => {
      document.removeEventListener("touchmove", preventDefault)
      document.removeEventListener("touchstart", preventDefault)
    }
  }, [isMobile])

  // Create a function to restart the current level
  const restartCurrentLevel = useCallback(() => {
    // Enable sounds if not already enabled
    soundManager.handleUserInteraction()

    // Play button click sound
    soundManager.play("buttonClick")

    // Create a new game state with the current level
    const newState = restartLevel(gameStateRef.current)

    // Reset the game state
    setGameState(newState)
    setIsLevelFailed(false)
    lastTimeRef.current = 0
  }, [])

  // Game loop function - defined outside of useEffect to avoid recreating it
  const gameLoop = useCallback(
    (timestamp: number) => {
      if (!canvasRef.current || isPaused || isLevelFailed) return

      // Calculate delta time
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0
      lastTimeRef.current = timestamp

      // Get current game state from ref
      const currentState = gameStateRef.current

      // Get current controls
      const currentControls = {
        up: keyboardControls.up || controlsRef.current.up,
        down: keyboardControls.down || controlsRef.current.down,
        left: keyboardControls.left || controlsRef.current.left,
        right: keyboardControls.right || controlsRef.current.right,
        fire: keyboardControls.fire || controlsRef.current.fire,
      }

      // Update game state based on controls
      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      // Update game state based on controls
      const newState = updateGame(currentState, currentControls, deltaTime)

      // Check for level failed (player died but has lives left)
      if (newState.playerLives < currentState.playerLives && newState.playerLives > 0) {
        setIsLevelFailed(true)
      }

      // Check for game over (no lives left)
      if (newState.playerLives <= 0 && !isGameOver) {
        setIsGameOver(true)
        soundManager.play("gameOver")
      }

      // Draw the game
      drawGame(ctx, newState)

      // Update state (less frequently to improve performance)
      setGameState(newState)

      // Continue the loop if not game over
      if (!isGameOver && !isLevelFailed) {
        requestAnimationRef.current = requestAnimationFrame(gameLoop)
      }
    },
    [keyboardControls, isPaused, isGameOver, isLevelFailed],
  )

  // Start/stop game loop
  useEffect(() => {
    if (isPaused || isGameOver || isLevelFailed) {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current)
      }
      return
    }

    requestAnimationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current)
      }
    }
  }, [gameLoop, isPaused, isGameOver, isLevelFailed])

  // Reset game
  const resetGame = useCallback(() => {
    // Enable sounds if not already enabled
    soundManager.handleUserInteraction()

    // Play button click sound
    soundManager.play("buttonClick")

    lastTimeRef.current = 0

    // Use createLevelWithRightWall directly instead of initialGameState
    setGameState({
      ...createLevelWithRightWall(1, gameStateRef.current.width, gameStateRef.current.height),
      gameSpeed: gameSpeed,
      continuesRemaining: 3, // Reset continues to 3
      levelStartCountdown: 2, // Reset countdown to 2 seconds
      isLevelStarting: true, // Set level as starting
    })

    setIsGameOver(false)
    setIsLevelFailed(false)

    // Play tank start sound
    setTimeout(() => {
      soundManager.play("tankStart")
    }, 500)
  }, [gameSpeed])

  // Toggle pause
  const togglePause = useCallback(() => {
    // Enable sounds if not already enabled
    soundManager.handleUserInteraction()

    // Play button click sound
    soundManager.play("buttonClick")
    setIsPaused((prev) => !prev)
  }, [])

  // Render hearts for lives
  const renderLives = useCallback(() => {
    const hearts = []
    for (let i = 0; i < gameState.playerLives; i++) {
      hearts.push(<Heart key={`heart-${i}`} className="w-5 h-5 fill-red-500 text-red-500" />)
    }
    return hearts
  }, [gameState.playerLives])

  // Count enemy types for display
  const countEnemyTypes = useCallback(() => {
    const counts: Record<string, number> = {}
    gameState.enemies.forEach((enemy) => {
      counts[enemy.type] = (counts[enemy.type] || 0) + 1
    })
    return counts
  }, [gameState.enemies])

  const enemyCounts = countEnemyTypes()

  // Function to calculate distance between two points
  const distance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Add a new function to handle continuing the game
  const handleContinue = useCallback(() => {
    // Enable sounds if not already enabled
    soundManager.handleUserInteraction()

    // Play button click sound
    soundManager.play("buttonClick")

    // Create a new game state with the current level but reset the level completely
    const newState = restartLevel({
      ...gameStateRef.current,
      playerLives: 3, // Reset to 3 lives
      continuesRemaining: gameStateRef.current.continuesRemaining - 1, // Decrease continues
      levelStartCountdown: 2, // Reset countdown to 2 seconds
      isLevelStarting: true, // Set level as starting
    })

    // Reset the game state
    setGameState(newState)
    setIsGameOver(false)
    lastTimeRef.current = 0

    // Play tank start sound
    setTimeout(() => {
      soundManager.play("tankStart")
    }, 500)
  }, [])

  // Add a level description component to show level information
  // Add this function inside the TanksGame component, before the return statement

  const getLevelDescription = useCallback((level: number): { title: string; description: string } => {
    switch (level) {
      case 1:
        return {
          title: "TRAINING GROUNDS",
          description: "Simple layout with few enemies. Get familiar with the controls.",
        }
      case 2:
        return {
          title: "URBAN COMBAT",
          description: "Navigate the city streets and watch for light tanks.",
        }
      case 3:
        return {
          title: "FORTRESS",
          description: "Breach the central fortress. Heavy tanks introduced.",
        }
      case 4:
        return {
          title: "MAZE",
          description: "Find your way through the complex maze. Stealth tanks lurk in the shadows.",
        }
      case 5:
        return {
          title: "MINEFIELD",
          description: "Watch your step! Mines and artillery tanks make this area dangerous.",
        }
      case 6:
        return {
          title: "BUNKER ASSAULT",
          description: "Storm the heavily fortified bunker. Demolition tanks will try to stop you.",
        }
      case 7:
        return {
          title: "CROSSFIRE",
          description: "Limited cover in open areas. Stay mobile to survive.",
        }
      case 8:
        return {
          title: "LABYRINTH",
          description: "Navigate the complex labyrinth filled with enemies.",
        }
      case 9:
        return {
          title: "GAUNTLET",
          description: "Run the gauntlet to reach the end. Enemies await at every turn.",
        }
      case 10:
        return {
          title: "FINAL STAND",
          description: "The ultimate challenge with all enemy types. Good luck!",
        }
      default:
        return {
          title: `ENDLESS MODE ${level - 10}`,
          description: "Procedurally generated levels with increasing difficulty.",
        }
    }
  }, [])

  return (
    <>
      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full flex flex-col items-center shadow-2xl">
            <div className="flex items-center gap-2 mb-2 text-blue-700">
              <Info className="h-5 w-5" />
              <h2 className="font-bold text-xl">How to Play</h2>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-700 mb-4">
              <div className="flex items-center gap-1">
                <div className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">↑↓←→</div>
                <span>Move</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center gap-1">
                <div className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">SPACE</div>
                <span>Fire</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center gap-1">
                <div className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">P</div>
                <span>Pause</span>
              </div>
            </div>
            <div className="md:hidden flex items-center gap-2 text-sm text-gray-700 mb-4">
              <Gamepad2 className="h-4 w-4" />
              <span>Use the joystick to move and the fire button to shoot</span>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
            >
              Start Game
            </button>
          </div>
        </div>
      )}
      {/* Tank images outside the game area */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {/* Fire animation ring outside the image */}
          {fireActive && (
            <span className="absolute z-10 w-36 h-36 rounded-full pointer-events-none animate-pulse bg-gradient-to-tr from-yellow-400 via-orange-500 to-transparent opacity-70 border-8 border-yellow-300 animate-fire-outer" style={{ filter: 'blur(8px)' }} />
          )}
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg bg-black flex items-center justify-center relative z-20">
            <img src="/tank1.jpg" alt="Tank 1" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {/* Fire animation ring outside the image */}
          {fireActive && (
            <span className="absolute z-10 w-36 h-36 rounded-full pointer-events-none animate-pulse bg-gradient-to-tr from-yellow-400 via-orange-500 to-transparent opacity-70 border-8 border-yellow-300 animate-fire-outer" style={{ filter: 'blur(8px)' }} />
          )}
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg bg-black flex items-center justify-center relative z-20">
            <img src="/tank2.png" alt="Tank 2" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full bg-[#f0d6a8]" />

        {/* Sound prompt overlay */}
        {showSoundPrompt && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-xs w-full flex flex-col items-center shadow-2xl">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <Volume2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Enable Sound?</h2>
              <p className="text-gray-600 mb-4 text-center">
                This game includes sound effects. Click the button below to enable sounds.
              </p>
              <button
                onClick={handleSoundEnable}
                className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Volume2 className="w-4 h-4" />
                Enable Sound
              </button>
            </div>
          </div>
        )}

        {/* Game UI */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md">
          <div className="flex items-center gap-2">
            <div className="bg-blue-700/50 backdrop-blur-sm px-3 py-1 rounded-lg">
              <div className="font-bold text-xl">P1</div>
            </div>
            <div className="bg-blue-700/50 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span className="font-bold">{gameState.score}</span>
            </div>
          </div>

          <div className="bg-red-600 px-4 py-1 rounded-md font-bold shadow-inner flex items-center gap-2">
            <span>MISSION</span>
            <span className="bg-red-700/50 backdrop-blur-sm px-2 py-0.5 rounded">{gameState.level}</span>
          </div>

          {/* Lives and continues display */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-blue-700/50 backdrop-blur-sm px-3 py-1 rounded-lg">
              {renderLives()}
            </div>
            {gameState.continuesRemaining > 0 && (
              <div className="flex items-center gap-1 bg-purple-700/50 backdrop-blur-sm px-3 py-1 rounded-lg">
                <span className="text-xs">CONT.</span>
                <div className="flex">
                  {Array.from({ length: gameState.continuesRemaining }).map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-purple-300 rounded-full mx-0.5"></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enemy counter */}
        <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-md p-2 shadow-md">
          <div className="text-xs font-bold mb-1">Enemies: {gameState.enemies.length}</div>
          <div className="flex flex-col gap-1">
            {Object.entries(enemyCounts).map(([type, count]) => (
              <div key={type} className="flex items-center gap-1 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TANK_TYPES[type as TankType]?.color || "#888" }}
                ></div>
                <span>
                  {type}: {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sound control and Speed control */}
        <div className="absolute top-2 left-36 flex gap-2">
          <SoundControl />
          <SpeedControl gameSpeed={gameSpeed} onSpeedChange={handleSpeedChange} />
        </div>

        {/* Fullscreen button for mobile */}
        {isMobile && (
          <div className="absolute top-2 right-2">
            <FullScreenButton />
          </div>
        )}

        {/* Pause button */}
        <button
          onClick={togglePause}
          className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-md hover:bg-white/90 shadow-md"
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>

        {/* Game over screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-xs w-full flex flex-col items-center shadow-2xl">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <X className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over</h2>
              <p className="text-gray-600 mb-4 text-center">
                {gameState.playerLives === 0 &&
                gameState.explosion &&
                distance(gameState.explosion.position, gameState.player.position) < 1
                  ? "You were destroyed by your own ricocheted shot!"
                  : `You scored ${gameState.score} points and reached mission ${gameState.level}`}
              </p>

              {/* Show continues if available */}
              {gameState.continuesRemaining > 0 ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-700">Continues remaining:</span>
                    <div className="flex">
                      {Array.from({ length: gameState.continuesRemaining }).map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-blue-500 rounded-full mx-0.5"></div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium w-full justify-center"
                  >
                    <Play className="w-4 h-4" />
                    Continue from Mission {gameState.level}
                  </button>

                  <button
                    onClick={resetGame}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2 font-medium mt-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Start New Game
                  </button>
                </div>
              ) : (
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Level failed screen */}
        {isLevelFailed && !isGameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-xs w-full flex flex-col items-center shadow-2xl">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mb-4">
                <X className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Tank Destroyed!</h2>
              <p className="text-gray-600 mb-4 text-center">
                You have {gameState.playerLives} {gameState.playerLives === 1 ? "life" : "lives"} remaining
              </p>
              <div className="flex gap-3">
                <button
                  onClick={restartCurrentLevel}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Level
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pause screen */}
        {isPaused && !isGameOver && !isLevelFailed && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-xs w-full flex flex-col items-center shadow-2xl">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <Pause className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Paused</h2>
              <div className="flex gap-3">
                <button
                  onClick={togglePause}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2 font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Draw level start countdown if active */}
        {gameState.isLevelStarting && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="bg-blue-600/90 backdrop-blur-sm rounded-xl p-8 max-w-md w-full flex flex-col items-center shadow-2xl">
              <h2 className="text-white text-4xl font-bold mb-2">MISSION {gameState.level}</h2>
              <h3 className="text-white text-2xl font-bold mb-6">{getLevelDescription(gameState.level).title}</h3>

              <div className="text-white text-6xl font-bold my-6">{Math.ceil(gameState.levelStartCountdown)}</div>

              <p className="text-white text-center mb-4">{getLevelDescription(gameState.level).description}</p>

              <div className="w-full bg-blue-800/50 rounded-lg p-4 mt-2">
                <h4 className="text-white text-sm font-bold mb-2">ENEMY TYPES:</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(countEnemyTypes()).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-1 bg-blue-900/50 px-2 py-1 rounded">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: TANK_TYPES[type as TankType]?.color || "#888" }}
                      ></div>
                      <span className="text-white text-xs">
                        {TANK_TYPES[type as TankType]?.name || type}: {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Touch controls for mobile */}
        {isMobile && <TouchControls onControlsChange={handleTouchControlsChange} />}
      </div>
    </>
  )
}
