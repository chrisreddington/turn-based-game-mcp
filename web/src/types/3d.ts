/**
 * Type definitions for 3D components and utilities
 */

import type { Camera, Scene, WebGLRenderer, Vector3 } from 'three'
import type { TicTacToeGameState, RPSGameState } from '@turn-based-mcp/shared'

/**
 * Configuration for 3D scene setup
 */
export interface Scene3DConfig {
  /** Enable shadows in the scene */
  enableShadows?: boolean
  /** Background color or environment */
  background?: string | null
  /** Fog settings */
  fog?: {
    color: string
    near: number
    far: number
  }
}

/**
 * Camera controls configuration
 */
export interface CameraControlsConfig {
  /** Enable zoom controls */
  enableZoom?: boolean
  /** Enable pan controls */
  enablePan?: boolean
  /** Enable rotate controls */
  enableRotate?: boolean
  /** Auto rotate speed */
  autoRotateSpeed?: number
  /** Enable auto rotate */
  autoRotate?: boolean
  /** Minimum distance for zoom */
  minDistance?: number
  /** Maximum distance for zoom */
  maxDistance?: number
  /** Minimum polar angle */
  minPolarAngle?: number
  /** Maximum polar angle */
  maxPolarAngle?: number
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Animation duration in milliseconds */
  duration?: number
  /** Animation easing function */
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  /** Delay before animation starts */
  delay?: number
}

/**
 * 3D game piece properties
 */
export interface GamePiece3D {
  /** Position in 3D space */
  position: Vector3
  /** Rotation in 3D space */
  rotation?: Vector3
  /** Scale factor */
  scale?: Vector3
  /** Material color */
  color?: string
  /** Animation state */
  isAnimating?: boolean
}

/**
 * HUD component properties
 */
export interface HUDProps {
  /** Current game state */
  gameState: TicTacToeGameState | RPSGameState
  /** Camera controls help visibility */
  showCameraHelp?: boolean
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Additional CSS classes */
  className?: string
}

/**
 * WebGL capabilities detection
 */
export interface WebGLCapabilities {
  /** WebGL support available */
  isSupported: boolean
  /** WebGL version (1 or 2) */
  version?: number
  /** Max texture size */
  maxTextureSize?: number
  /** Max vertex attributes */
  maxVertexAttributes?: number
  /** Extensions supported */
  extensions?: string[]
}

/**
 * 3D scene state
 */
export interface Scene3DState {
  /** Three.js scene */
  scene: Scene | null
  /** Three.js camera */
  camera: Camera | null
  /** Three.js renderer */
  renderer: WebGLRenderer | null
  /** Scene is initialized */
  isInitialized: boolean
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: string | null
}

/**
 * Performance metrics for 3D rendering
 */
export interface Performance3D {
  /** Frame rate */
  fps: number
  /** Render time in milliseconds */
  renderTime: number
  /** Draw calls count */
  drawCalls: number
  /** Triangle count */
  triangles: number
}