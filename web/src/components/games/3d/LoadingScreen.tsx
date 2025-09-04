/**
 * Loading screen component for 3D games
 */

'use client'

import { ReactNode } from 'react'

interface LoadingScreen3DProps {
  /** Loading message */
  message?: string
  /** Show WebGL check */
  showWebGLCheck?: boolean
  /** Additional content */
  children?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Loading screen for 3D game initialization
 */
export function LoadingScreen3D({ 
  message = 'Loading 3D game...', 
  showWebGLCheck = false,
  children,
  className = ''
}: LoadingScreen3DProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl text-white p-8 ${className}`}>
      {/* 3D Loading Animation */}
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>

      {/* Loading Message */}
      <h3 className="text-xl font-bold mb-2">{message}</h3>
      
      {/* WebGL Check */}
      {showWebGLCheck && (
        <div className="flex items-center space-x-2 text-sm text-slate-300 mb-4">
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Checking WebGL support...</span>
        </div>
      )}

      {/* Loading Steps */}
      <div className="space-y-2 text-sm text-slate-400 text-center max-w-md">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Initializing 3D renderer</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Setting up camera controls</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
          <span>Loading game assets</span>
        </div>
      </div>

      {/* Additional Content */}
      {children}

      {/* Tips */}
      <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 3D Controls</h4>
        <div className="text-xs text-slate-300 space-y-1">
          <div>• <strong>Left click + drag:</strong> Rotate camera</div>
          <div>• <strong>Right click + drag:</strong> Pan view</div>
          <div>• <strong>Scroll wheel:</strong> Zoom in/out</div>
        </div>
      </div>
    </div>
  )
}