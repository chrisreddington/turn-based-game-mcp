/**
 * Full viewport layout for immersive 3D game experiences
 */

'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'

interface FullViewport3DLayoutProps {
  /** Main 3D game content */
  children: ReactNode
  /** Game title */
  title?: string
  /** Callback to switch back to 2D mode */
  onSwitchTo2D?: () => void
  /** Whether to show the floating controls */
  showControls?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Full viewport layout component for 3D games
 * 
 * This layout takes up the full browser viewport for an immersive 3D experience.
 * It removes the default page header and provides floating controls for switching
 * back to 2D mode and other essential functions.
 */
export function FullViewport3DLayout({
  children,
  title = '3D Game',
  onSwitchTo2D,
  showControls = true,
  className = ''
}: FullViewport3DLayoutProps) {
  return (
    <div className={`fixed inset-0 bg-slate-900 ${className}`}>
      {/* Full viewport game content */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* Floating controls */}
      {showControls && (
        <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none">
          <div className="flex items-center justify-between">
            {/* Left side controls */}
            <div className="flex items-center space-x-3 pointer-events-auto">
              {onSwitchTo2D ? (
                <button
                  onClick={onSwitchTo2D}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  title="Switch to 2D mode"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                  </svg>
                  <span>2D Mode</span>
                </button>
              ) : (
                <Link
                  href="/games/tic-tac-toe"
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  title="Back to 2D mode"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                  </svg>
                  <span>Back to 2D</span>
                </Link>
              )}
            </div>

            {/* Title */}
            <div className="pointer-events-auto">
              <div className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
                <h1 className="text-white font-bold text-lg">
                  {title}
                </h1>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-3 pointer-events-auto">
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-100 font-medium text-sm">3D Mode</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating 3D controls help - bottom right */}
      {showControls && (
        <div className="absolute bottom-4 right-4 z-50 pointer-events-auto">
          <div className="p-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl max-w-xs">
            <h3 className="text-white font-semibold text-sm mb-2">🎮 3D Controls</h3>
            <div className="space-y-1 text-xs text-white/80">
              <div>• <strong>Rotate:</strong> Left click + drag</div>
              <div>• <strong>Pan:</strong> Right click + drag</div>
              <div>• <strong>Zoom:</strong> Mouse wheel</div>
              <div>• <strong>Play:</strong> Click cells</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
