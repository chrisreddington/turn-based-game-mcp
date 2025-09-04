/**
 * Miniature 3D model component for RPS choices in UI
 */

'use client'

import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { RPSModels } from '../../../lib/3d/rps-models'

interface Mini3DModelProps {
  choice: 'rock' | 'paper' | 'scissors'
  size?: number
  animate?: boolean
  glowColor?: string
  className?: string
}

export function Mini3DModel({ 
  choice, 
  size = 80, 
  animate = false, 
  glowColor,
  className = '' 
}: Mini3DModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const animationIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Setup scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    sceneRef.current = scene

    // Setup camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 0, 2)

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    })
    renderer.setSize(size, size)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Create and add model
    const model = RPSModels.createMiniature(choice, 0.8)
    modelRef.current = model
    scene.add(model)

    // Apply glow effect if specified
    if (glowColor) {
      RPSModels.addGlowEffect(model, glowColor, 0.3)
    }

    // Animation loop
    let startTime = Date.now()
    const animateModel = () => {
      if (!modelRef.current) return

      const elapsed = Date.now() - startTime
      
      if (animate) {
        // Gentle rotation
        modelRef.current.rotation.y = Math.sin(elapsed * 0.001) * 0.3
        modelRef.current.rotation.x = Math.sin(elapsed * 0.0007) * 0.1
        
        // Gentle bobbing
        modelRef.current.position.y = Math.sin(elapsed * 0.002) * 0.05
      }

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animateModel)
    }
    animateModel()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      renderer.dispose()
    }
  }, [choice, size, animate, glowColor])

  return (
    <canvas 
      ref={canvasRef}
      className={`${className}`}
      style={{ width: size, height: size }}
    />
  )
}
