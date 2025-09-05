/**
 * Custom hook for camera controls in 3D scenes
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { CameraControlsConfig } from '../types/3d'

interface UseCameraControlsOptions extends CameraControlsConfig {
  /** Enable damping for smooth controls */
  enableDamping?: boolean
  /** Damping factor */
  dampingFactor?: number
}

/**
 * Hook for managing camera controls in a 3D scene
 */
export function useCameraControls(
  camera: THREE.Camera | null,
  renderer: THREE.WebGLRenderer | null,
  options: UseCameraControlsOptions = {}
) {
  const controlsRef = useRef<OrbitControls | null>(null)
  const [isEnabled, setIsEnabled] = useState(true)

  // Initialize controls
  const initializeControls = useCallback(() => {
    if (!camera || !renderer) return

    // Default configuration
    const config = {
      enableZoom: true,
      enablePan: true,
      enableRotate: true,
      autoRotate: false,
      autoRotateSpeed: 2.0,
      enableDamping: true,
      dampingFactor: 0.1,
      minDistance: 2,
      maxDistance: 50,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
      ...options
    }

    const controls = new OrbitControls(camera, renderer.domElement)
    
    // Configure controls
    controls.enableZoom = config.enableZoom
    controls.enablePan = config.enablePan
    controls.enableRotate = config.enableRotate
    controls.autoRotate = config.autoRotate
    controls.autoRotateSpeed = config.autoRotateSpeed
    controls.enableDamping = config.enableDamping
    controls.dampingFactor = config.dampingFactor
    controls.minDistance = config.minDistance
    controls.maxDistance = config.maxDistance
    controls.minPolarAngle = config.minPolarAngle
    controls.maxPolarAngle = config.maxPolarAngle

    // Set target to center of scene
    controls.target.set(0, 0, 0)
    controls.update()

    controlsRef.current = controls
    return controls
  }, [camera, renderer, options])

  // Update controls in animation loop
  const updateControls = useCallback(() => {
    if (controlsRef.current && isEnabled) {
      controlsRef.current.update()
    }
  }, [isEnabled])

  // Enable/disable controls
  const setControlsEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled)
    if (controlsRef.current) {
      controlsRef.current.enabled = enabled
    }
  }, [])

  // Reset camera to default position
  const resetCamera = useCallback(() => {
    if (!camera || !controlsRef.current) return

    // Animate camera back to default position
    const defaultPosition = new THREE.Vector3(5, 5, 5)
    const startPosition = camera.position.clone()
    const startTime = Date.now()
    const duration = 1000

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out animation
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      camera.position.lerpVectors(startPosition, defaultPosition, easeProgress)
      controlsRef.current!.target.set(0, 0, 0)
      controlsRef.current!.update()
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }, [camera])

  // Set camera to specific position
  const setCameraPosition = useCallback((position: THREE.Vector3, target?: THREE.Vector3) => {
    if (!camera || !controlsRef.current) return

    camera.position.copy(position)
    if (target) {
      controlsRef.current.target.copy(target)
    }
    controlsRef.current.update()
  }, [camera])

  // Zoom to fit object
  const zoomToFit = useCallback((object: THREE.Object3D, offset: number = 1.5) => {
    if (!camera || !controlsRef.current) return

    const box = new THREE.Box3().setFromObject(object)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    // Calculate optimal distance
    const maxDimension = Math.max(size.x, size.y, size.z)

    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = camera.fov * (Math.PI / 180)
      const optimalDistance = maxDimension / (2 * Math.tan(fov / 2))
      camera.position.copy(center)
      camera.position.z += optimalDistance * offset
    }

    controlsRef.current.target.copy(center)
    controlsRef.current.update()
  }, [camera])

  // Initialize controls when camera and renderer are available
  useEffect(() => {
    if (camera && renderer) {
      const controls = initializeControls()
      return () => {
        if (controls) {
          controls.dispose()
        }
      }
    }
  }, [camera, renderer, initializeControls])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.dispose()
        controlsRef.current = null
      }
    }
  }, [])

  return {
    controls: controlsRef.current,
    isEnabled,
    updateControls,
    setControlsEnabled,
    resetCamera,
    setCameraPosition,
    zoomToFit
  }
}