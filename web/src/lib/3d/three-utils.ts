/**
 * Three.js utility functions for 3D game rendering
 */

import * as THREE from 'three'
import type { WebGLCapabilities, Scene3DConfig } from '../../types/3d'

/**
 * Detect WebGL capabilities and support
 */
export function detectWebGLCapabilities(): WebGLCapabilities {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') as WebGLRenderingContext | null || 
             canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
  const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null

  if (!gl) {
    return { isSupported: false }
  }

  const capabilities: WebGLCapabilities = {
    isSupported: true,
    version: gl2 ? 2 : 1,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    extensions: gl.getSupportedExtensions() || []
  }

  return capabilities
}

/**
 * Create a basic 3D scene with lighting
 */
export function createScene(config: Scene3DConfig = {}): THREE.Scene {
  const scene = new THREE.Scene()

  // Set background
  if (config.background) {
    scene.background = new THREE.Color(config.background)
  }

  // Add fog if specified
  if (config.fog) {
    scene.fog = new THREE.Fog(
      config.fog.color,
      config.fog.near,
      config.fog.far
    )
  }

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
  scene.add(ambientLight)

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 5)
  directionalLight.castShadow = config.enableShadows || false
  
  if (config.enableShadows) {
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
  }
  
  scene.add(directionalLight)

  return scene
}

/**
 * Create a perspective camera with reasonable defaults
 */
export function createCamera(
  aspectRatio: number = 1,
  position: THREE.Vector3 = new THREE.Vector3(5, 5, 5)
): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000)
  camera.position.copy(position)
  camera.lookAt(0, 0, 0)
  return camera
}

/**
 * Create a WebGL renderer with optimal settings
 */
export function createRenderer(
  container: HTMLElement,
  enableShadows: boolean = false
): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  })

  const { clientWidth, clientHeight } = container
  renderer.setSize(clientWidth, clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  
  if (enableShadows) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }

  // Tone mapping for better colors
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1

  return renderer
}

/**
 * Create standard game materials
 */
export const Materials = {
  /**
   * Create a basic colored material
   */
  colored(color: string | number, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.1,
      ...options
    })
  },

  /**
   * Create a glowing/emissive material
   */
  glowing(color: string | number, intensity: number = 0.5) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.2,
      metalness: 0.8
    })
  },

  /**
   * Create a transparent material
   */
  transparent(color: string | number, opacity: number = 0.7) {
    return new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      roughness: 0.1,
      metalness: 0.9
    })
  },

  /**
   * Create a board/surface material
   */
  board(color: string | number = 0x8B4513) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.1
    })
  }
}

/**
 * Create standard geometries for games
 */
export const Geometries = {
  /**
   * Create a game board plane
   */
  board(width: number = 3, height: number = 3, thickness: number = 0.2) {
    return new THREE.BoxGeometry(width, thickness, height)
  },

  /**
   * Create an X shape for tic-tac-toe
   */
  xShape(size: number = 0.8) {
    const shape = new THREE.Shape()
    const half = size / 2
    const thickness = size * 0.1

    // Create X shape using lines
    shape.moveTo(-half, -half)
    shape.lineTo(-half + thickness, -half)
    shape.lineTo(0, -thickness / 2)
    shape.lineTo(half - thickness, -half)
    shape.lineTo(half, -half)
    shape.lineTo(half, -half + thickness)
    shape.lineTo(thickness / 2, 0)
    shape.lineTo(half, half - thickness)
    shape.lineTo(half, half)
    shape.lineTo(half - thickness, half)
    shape.lineTo(0, thickness / 2)
    shape.lineTo(-half + thickness, half)
    shape.lineTo(-half, half)
    shape.lineTo(-half, half - thickness)
    shape.lineTo(-thickness / 2, 0)
    shape.lineTo(-half, -half + thickness)

    return new THREE.ExtrudeGeometry(shape, {
      depth: size * 0.1,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02
    })
  },

  /**
   * Create an O shape for tic-tac-toe
   */
  oShape(size: number = 0.8, thickness: number = 0.15) {
    const outerRadius = size / 2
    const innerRadius = outerRadius - thickness

    const shape = new THREE.Shape()
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)

    const hole = new THREE.Path()
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
    shape.holes.push(hole)

    return new THREE.ExtrudeGeometry(shape, {
      depth: size * 0.1,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02
    })
  },

  /**
   * Create a basic hand shape for RPS
   */
  hand() {
    // Simple hand representation using a cylinder for now
    return new THREE.CylinderGeometry(0.5, 0.3, 2, 8)
  }
}

/**
 * Animation utilities
 */
export const Animations = {
  /**
   * Create a smooth movement animation
   */
  moveTo(
    object: THREE.Object3D,
    targetPosition: THREE.Vector3,
    duration: number = 1000,
    onComplete?: () => void
  ) {
    const startPosition = object.position.clone()
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out animation
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      object.position.lerpVectors(startPosition, targetPosition, easeProgress)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else if (onComplete) {
        onComplete()
      }
    }

    animate()
  },

  /**
   * Create a scale animation
   */
  scaleTo(
    object: THREE.Object3D,
    targetScale: THREE.Vector3,
    duration: number = 500
  ) {
    const startScale = object.scale.clone()
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out animation
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      object.scale.lerpVectors(startScale, targetScale, easeProgress)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  },

  /**
   * Create a rotation animation
   */
  rotateTo(
    object: THREE.Object3D,
    targetRotation: THREE.Euler,
    duration: number = 1000
  ) {
    const startRotation = object.rotation.clone()
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease in-out animation
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      object.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easeProgress
      object.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * easeProgress
      object.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * easeProgress
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }
}

/**
 * Handle window resize for 3D scenes
 */
export function handleResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  container: HTMLElement
) {
  const { clientWidth, clientHeight } = container
  
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  
  renderer.setSize(clientWidth, clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

/**
 * Dispose of Three.js resources properly
 */
export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose()
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose())
        } else {
          child.material.dispose()
        }
      }
    }
  })
}