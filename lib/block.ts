import type { Vector2D } from "./vector"

export type Block = {
  position: Vector2D
  size: Vector2D
  type: "wood" | "brick" | "metal" | "barrier"
}
