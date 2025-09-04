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

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const container = containerRef.current
      const { clientWidth, clientHeight } = container

      // Create scene components
      const scene = createScene(options)
      const camera = createCamera(
        clientWidth / clientHeight,
        options.cameraPosition || new THREE.Vector3(5, 5, 5)
      )
      const renderer = createRenderer(container, options.enableShadows)

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
  }, [options])

  // Start render loop
  const startRenderLoop = useCallback((onRender?: () => void) => {
    if (!state.scene || !state.camera || !state.renderer) return

    const render = () => {
      if (onRender) onRender()
      state.renderer!.render(state.scene!, state.camera!)
      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()
  }, [state.scene, state.camera, state.renderer])

  // Stop render loop
  const stopRenderLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
  }, [])

  // Handle resize
  const handleSceneResize = useCallback(() => {
    if (!containerRef.current || !state.camera || !state.renderer) return
    
    if (state.camera instanceof THREE.PerspectiveCamera) {
      handleResize(state.camera, state.renderer, containerRef.current)
    }
  }, [state.camera, state.renderer])

  // Cleanup scene
  const cleanup = useCallback(() => {
    stopRenderLoop()

    if (state.renderer) {
      const container = containerRef.current
      if (container && container.contains(state.renderer.domElement)) {
        container.removeChild(state.renderer.domElement)
      }
      state.renderer.dispose()
    }

    if (state.scene) {
      disposeObject(state.scene)
    }

    setState({
      scene: null,
      camera: null,
      renderer: null,
      isInitialized: false,
      isLoading: false,
      error: null
    })
  }, [state.renderer, state.scene, stopRenderLoop])

  // Initialize on mount if autoStart is enabled
  useEffect(() => {
    if (options.autoStart !== false) {
      initializeScene()
    }

    return cleanup
  }, []) // Only run once on mount

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