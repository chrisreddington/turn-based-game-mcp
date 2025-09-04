/**
 * Game HUD (Heads-Up Display) component for 3D games
 */

'use client'

import { ReactNode } from 'react'
import type { HUDProps } from '../../../types/3d'

interface GameHUDProps extends HUDProps {
  /** Game title */
  title: string
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
  /** Game controls */
  onReset?: () => void
  /** New game handler */
  onNewGame?: () => void
  /** Camera reset handler */
  onCameraReset?: () => void
  /** Additional HUD content */
  children?: ReactNode
}

/**
 * HUD component for 3D games with game state and controls
 */
export function GameHUD({
  title,
  gameState,
  playerInfo,
  aiInfo,
  showCameraHelp = true,
  isLoading = false,
  error = null,
  onReset,
  onNewGame,
  onCameraReset,
  className = '',
  children
}: GameHUDProps) {
  const currentPlayer = gameState?.currentPlayerId
  const gameStatus = gameState?.status
  const winner = gameState?.winner

  return (
    <div className={`absolute inset-0 pointer-events-none z-10 ${className}`}>
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
        {/* Game Info Panel */}
        <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white min-w-64">
          <h1 className="text-lg font-bold text-blue-400 mb-3">{title}</h1>
          
          {/* Game Status */}
          <div className="space-y-2">
            {/* Game ID */}
            {gameState?.id && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Game ID:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-cyan-400">
                    {gameState.id}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(gameState.id)}
                    className="text-xs text-slate-400 hover:text-white transition-colors duration-200"
                    title="Copy Game ID"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Status:</span>
              <span className={`text-sm font-semibold px-2 py-1 rounded ${
                gameStatus === 'playing' ? 'bg-green-600' :
                gameStatus === 'finished' ? 'bg-blue-600' :
                'bg-slate-600'
              }`}>
                {gameStatus === 'playing' ? 'In Progress' :
                 gameStatus === 'finished' ? 'Finished' :
                 'Waiting'}
              </span>
            </div>

            {/* Current Turn */}
            {gameStatus === 'playing' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Turn:</span>
                <span className="text-sm font-semibold text-yellow-400">
                  {currentPlayer === 'player1' ? playerInfo?.name || 'Player' :
                   currentPlayer === 'ai' ? aiInfo?.name || 'AI' :
                   'Unknown'}
                </span>
              </div>
            )}

            {/* Winner */}
            {gameStatus === 'finished' && winner && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Winner:</span>
                <span className="text-sm font-semibold text-green-400">
                  {winner === 'draw' ? 'Draw' :
                   winner === 'player1' ? playerInfo?.name || 'Player' :
                   winner === 'ai' ? aiInfo?.name || 'AI' :
                   winner}
                </span>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-400">Processing...</span>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="p-2 bg-red-600/20 border border-red-500 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Camera Controls Help */}
        {showCameraHelp && (
          <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white max-w-64">
            <h3 className="text-sm font-bold text-purple-400 mb-2">🎮 Camera Controls</h3>
            <div className="text-xs text-slate-300 space-y-1">
              <div>• <strong>Left click + drag:</strong> Rotate</div>
              <div>• <strong>Right click + drag:</strong> Pan</div>
              <div>• <strong>Scroll wheel:</strong> Zoom</div>
            </div>
            {onCameraReset && (
              <button
                onClick={onCameraReset}
                className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition-colors duration-200"
              >
                Reset View
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-auto">
        {/* Player Info */}
        {playerInfo && (
          <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">{playerInfo.symbol || 'P'}</span>
              </div>
              <div>
                <div className="text-sm font-semibold">{playerInfo.name}</div>
                {playerInfo.score !== undefined && (
                  <div className="text-xs text-slate-300">Score: {playerInfo.score}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Controls */}
        <div className="flex items-center space-x-2">
          {onReset && (
            <button
              onClick={onReset}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Reset
            </button>
          )}
          {onNewGame && (
            <button
              onClick={onNewGame}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              New Game
            </button>
          )}
        </div>

        {/* AI Info */}
        {aiInfo && (
          <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">{aiInfo.symbol || '🤖'}</span>
              </div>
              <div>
                <div className="text-sm font-semibold">{aiInfo.name}</div>
                <div className="text-xs text-slate-300 flex items-center space-x-2">
                  {aiInfo.difficulty && (
                    <span>Difficulty: {aiInfo.difficulty}</span>
                  )}
                  {aiInfo.score !== undefined && (
                    <span>Score: {aiInfo.score}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center HUD for additional content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          {children}
        </div>
      )}
    </div>
  )
}