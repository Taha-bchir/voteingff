"use client"

import { useEffect, useRef } from "react"

export function AnimatedGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Define gradient colors
    const colors = [
      { r: 0, g: 128, b: 128 }, // Teal
      { r: 0, g: 150, b: 136 }, // Green-Teal
      { r: 0, g: 105, b: 92 }, // Dark Teal
    ]

    // Create gradient points
    const points = Array.from({ length: 5 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))

    const animate = () => {
      // Clear canvas with a very dark background
      ctx.fillStyle = "rgba(10, 10, 20, 0.03)"
      ctx.fillRect(0, 0, width, height)

      // Move points
      points.forEach((point) => {
        point.x += point.vx
        point.y += point.vy

        // Bounce off edges
        if (point.x < 0 || point.x > width) point.vx *= -1
        if (point.y < 0 || point.y > height) point.vy *= -1
      })

      // Draw gradients
      points.forEach((point) => {
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, Math.max(width, height) * 0.5)

        const { r, g, b } = point.color
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`)
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 h-full w-full" />
}
