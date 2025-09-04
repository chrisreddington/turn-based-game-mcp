/**
 * 3D Game Container component that manages the overall 3D game experience
 */

'use client'

import { ReactNode, useEffect } from 'react'
import * as THREE from 'three'
import { useThreeScene } from '../../../hooks/useThreeScene'
import { useCameraControls } from '../../../hooks/useCameraControls'
import { LoadingScreen3D } from './LoadingScreen'
import { GameHUD } from './GameHUD'
import type { Scene3DConfig, CameraControlsConfig } from '../../../types/3d'

interface Game3DContainerProps {
  /** Game title for HUD */
  title: string
  /** Game state for HUD */
  gameState?: any
  /** Player information */
  playerInfo?: {
    name: string
    symbol?: string
    score?: number
  }
  /** AI information */
  aiInfo?: {
    name: string
    symbol?: string
    score?: number
    difficulty?: string
  }
  /** 3D scene configuration */
  sceneConfig?: Scene3DConfig
  /** Camera controls configuration */
  cameraConfig?: CameraControlsConfig
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Show WebGL fallback */
  showFallback?: boolean
  /** Show built-in HUD */
  showHUD?: boolean
  /** Render function for 3D content */
  onRender?: (scene: THREE.Scene, camera: THREE.Camera) => void
  /** Game control handlers */
  onReset?: () => void
  onNewGame?: () => void
  /** Children to render in HUD center */
  children?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Container component for 3D games with scene management and HUD
 */
export function Game3DContainer({
  title,
  gameState,
  playerInfo,
  aiInfo,
  sceneConfig = {},
  cameraConfig = {},
  isLoading: externalLoading = false,
  error: externalError = null,
  showFallback = true,
  showHUD = true,
  onRender,
  onReset,
  onNewGame,
  children,
  className = ''
}: Game3DContainerProps) {
  // Initialize 3D scene
  const {
    containerRef,
    scene,
    camera,
    renderer,
    isInitialized,
    isLoading: sceneLoading,
    error: sceneError,
    startRenderLoop,
    stopRenderLoop
  } = useThreeScene({
    enableShadows: true,
    background: '#1a1a2e',
    autoStart: true,
    ...sceneConfig
  })

  // Initialize camera controls
  const {
    updateControls,
    resetCamera,
    setControlsEnabled
  } = useCameraControls(camera, renderer, {
    enableDamping: true,
    dampingFactor: 0.1,
    autoRotate: false,
    minDistance: 3,
    maxDistance: 20,
    ...cameraConfig
  })

  // Combined loading and error states
  const isLoadingCombined = externalLoading || sceneLoading
  const errorCombined = externalError || sceneError

  // Start render loop when scene is ready
  useEffect(() => {
    if (isInitialized && scene && camera) {
      startRenderLoop(() => {
        // Update camera controls
        updateControls()
        
        // Call custom render function
        if (onRender) {
          onRender(scene, camera)
        }
      })

      return () => {
        stopRenderLoop()
      }
    }
  }, [isInitialized, scene, camera, startRenderLoop, stopRenderLoop, updateControls, onRender])

  // Handle camera reset
  const handleCameraReset = () => {
    resetCamera()
  }

  // Disable controls when loading
  useEffect(() => {
    setControlsEnabled(!isLoadingCombined)
  }, [isLoadingCombined, setControlsEnabled])

  // WebGL fallback content
  const renderFallback = () => (
    <div className="flex flex-col items-center justify-center min-h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white p-8">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold mb-4">3D Not Supported</h3>
      <p className="text-slate-300 text-center max-w-md mb-6">
        Your browser doesn&apos;t support WebGL or 3D rendering is disabled. 
        Please try updating your browser or enabling hardware acceleration.
      </p>
      <div className="space-y-2 text-sm text-slate-400">
        <div>• Chrome/Firefox: Enable hardware acceleration</div>
        <div>• Safari: Enable WebGL in developer settings</div>
        <div>• Mobile: Use a supported browser</div>
      </div>
      <a
        href={`/games/${title.toLowerCase().replace(/\s+/g, '-')}`}
        className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
      >
        Play 2D Version Instead
      </a>
    </div>
  )

  return (
    <div className={`relative w-full h-full min-h-96 ${className}`}>
      {/* 3D Scene Container */}
      <div 
        ref={containerRef}
        className="w-full h-full min-h-96 rounded-xl overflow-hidden bg-slate-900"
        style={{ touchAction: 'none' }} // Prevent touch scrolling
      />

      {/* Loading Screen */}
      {isLoadingCombined && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingScreen3D 
            message={sceneLoading ? 'Initializing 3D scene...' : 'Loading game...'}
            showWebGLCheck={sceneLoading}
          />
        </div>
      )}

      {/* Error Screen */}
      {errorCombined && showFallback && (
        <div className="absolute inset-0 flex items-center justify-center">
          {errorCombined.includes('WebGL') ? renderFallback() : (
            <div className="bg-red-600/20 border border-red-500 rounded-xl p-6 text-white max-w-md text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-bold mb-2">Error</h3>
              <p className="text-red-300">{errorCombined}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Game HUD */}
      {isInitialized && !errorCombined && showHUD && (
        <GameHUD
          title={title}
          gameState={gameState}
          playerInfo={playerInfo}
          aiInfo={aiInfo}
          isLoading={isLoadingCombined}
          error={errorCombined}
          onReset={onReset}
          onNewGame={onNewGame}
          onCameraReset={handleCameraReset}
        >
          {children}
        </GameHUD>
      )}

      {/* Custom HUD when built-in is disabled */}
      {isInitialized && !errorCombined && !showHUD && children && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {children}
        </div>
      )}
    </div>
  )
}