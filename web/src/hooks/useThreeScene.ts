/**
 * Custom hook for managing Three.js scene
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { createScene, createCamera, createRenderer, handleResize, disposeObject } from '../lib/3d/three-utils'
import type { Scene3DState, Scene3DConfig } from '../types/3d'

interface UseThreeSceneOptions extends Scene3DConfig {
  /** Auto-start the scene */
  autoStart?: boolean
  /** Camera position */
  cameraPosition?: THREE.Vector3
}

/**
 * Hook for managing a Three.js scene lifecycle
 */
export function useThreeScene(options: UseThreeSceneOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.Camera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const [state, setState] = useState<Scene3DState>({
    scene: null,
    camera: null,
    renderer: null,
    isInitialized: false,
    isLoading: true,
    error: null
  })

  // Initialize the scene
  const initializeScene = useCallback(() => {
    if (!containerRef.current) return

    // Prevent duplicate initialization
    if (sceneRef.current && rendererRef.current) {
      console.warn('Three.js scene already initialized, skipping...')
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const container = containerRef.current
      const { clientWidth, clientHeight } = container

      // Check if container already has a canvas to prevent duplicates
      const existingCanvas = container.querySelector('canvas')
      if (existingCanvas) {
        console.warn('Canvas already exists in container, cleaning up...')
        existingCanvas.remove()
      }

      // Create scene components
      const scene = createScene(options)
      const camera = createCamera(
        clientWidth / clientHeight,
        options.cameraPosition || new THREE.Vector3(5, 5, 5)
      )
      const renderer = createRenderer(container, options.enableShadows)

      // Store in refs for stable access
      sceneRef.current = scene
      cameraRef.current = camera
      rendererRef.current = renderer

      // Add renderer to DOM
      container.appendChild(renderer.domElement)

      setState({
        scene,
        camera,
        renderer,
        isInitialized: true,
        isLoading: false,
        error: null
      })

    } catch (error) {
      console.error('Error initializing 3D scene:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize 3D scene'
      }))
    }
  }, [options.enableShadows, options.background, options.cameraPosition])

  // Start render loop
  const startRenderLoop = useCallback((onRender?: () => void) => {
    const scene = sceneRef.current
    const camera = cameraRef.current  
    const renderer = rendererRef.current
    
    if (!scene || !camera || !renderer) return

    const render = () => {
      if (onRender) onRender()
      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()
  }, [])

  // Stop render loop
  const stopRenderLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
  }, [])

  // Handle resize
  const handleSceneResize = useCallback(() => {
    const container = containerRef.current
    const camera = cameraRef.current
    const renderer = rendererRef.current
    
    if (!container || !camera || !renderer) return
    
    if (camera instanceof THREE.PerspectiveCamera) {
      handleResize(camera, renderer, container)
    }
  }, [])

  // Cleanup scene
  const cleanup = useCallback(() => {
    stopRenderLoop()

    const renderer = rendererRef.current
    const scene = sceneRef.current
    
    if (renderer) {
      const container = containerRef.current
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
      rendererRef.current = null
    }

    if (scene) {
      disposeObject(scene)
      sceneRef.current = null
    }

    cameraRef.current = null

    setState({
      scene: null,
      camera: null,
      renderer: null,
      isInitialized: false,
      isLoading: false,
      error: null
    })
  }, [stopRenderLoop])

  // Initialize on mount if autoStart is enabled
  useEffect(() => {
    let mounted = true

    if (options.autoStart !== false) {
      // Add a small delay to allow container to be fully mounted
      const timer = setTimeout(() => {
        if (mounted) {
          initializeScene()
        }
      }, 10)

      return () => {
        mounted = false
        clearTimeout(timer)
        cleanup()
      }
    }

    return () => {
      mounted = false
      cleanup()
    }
  }, [initializeScene, cleanup, options.autoStart])

  // Handle window resize
  useEffect(() => {
    window.addEventListener('resize', handleSceneResize)
    return () => window.removeEventListener('resize', handleSceneResize)
  }, [handleSceneResize])

  return {
    containerRef,
    scene: state.scene,
    camera: state.camera,
    renderer: state.renderer,
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    error: state.error,
    initializeScene,
    startRenderLoop,
    stopRenderLoop,
    cleanup
  }
}