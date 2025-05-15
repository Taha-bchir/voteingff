"use client"

import { useEffect, useRef } from "react"

interface Star {
  x: number
  y: number
  z: number
  size: number
  color: string
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let stars: Star[] = []
    const starCount = 200
    const speed = 0.2

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      initStars()
    }

    const initStars = () => {
      stars = []
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width - width / 2,
          y: Math.random() * height - height / 2,
          z: Math.random() * 1000,
          size: Math.random() * 1.5 + 0.5,
          color: getStarColor(),
        })
      }
    }

    const getStarColor = () => {
      const colors = [
        "rgba(255, 255, 255, 0.8)", // White
        "rgba(173, 216, 230, 0.8)", // Light blue
        "rgba(255, 223, 186, 0.8)", // Light orange
        "rgba(186, 218, 255, 0.8)", // Light blue
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    }

    const drawStar = (star: Star) => {
      const x = (star.x / star.z) * 500 + width / 2
      const y = (star.y / star.z) * 500 + height / 2
      const size = (star.size * (1000 - star.z)) / 1000

      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fillStyle = star.color
      ctx.fill()
    }

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, width, height)

      stars.forEach((star) => {
        star.z -= speed

        // Reset star if it goes too close
        if (star.z <= 1) {
          star.z = 1000
          star.x = Math.random() * width - width / 2
          star.y = Math.random() * height - height / 2
        }

        drawStar(star)
      })

      requestAnimationFrame(animate)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 h-full w-full opacity-60" />
}
