export type Vector2D = {
  x: number
  y: number
}

export const add = (a: Vector2D, b: Vector2D): Vector2D => ({
  x: a.x + b.x,
  y: a.y + b.y,
})

export const subtract = (a: Vector2D, b: Vector2D): Vector2D => ({
  x: a.x - b.x,
  y: a.y - b.y,
})

export const scale = (v: Vector2D, scalar: number): Vector2D => ({
  x: v.x * scalar,
  y: v.y * scalar,
})

export const normalize = (v: Vector2D): Vector2D => {
  const length = Math.sqrt(v.x * v.x + v.y * v.y)
  if (length === 0) return { x: 0, y: 0 }
  return {
    x: v.x / length,
    y: v.y / length,
  }
}

export const length = (v: Vector2D): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

export const distance = (a: Vector2D, b: Vector2D): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export const rotate = (v: Vector2D, angle: number): Vector2D => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  }
}

export const dot = (a: Vector2D, b: Vector2D): number => {
  return a.x * b.x + a.y * b.y
}
