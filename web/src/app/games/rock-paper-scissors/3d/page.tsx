/**
 * 3D Rock-Paper-Scissors game page
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RPS3DGame } from '../../../../components/games/3d/RPS3DGame'
import { use3DGame } from '../../../../hooks/use3DGame'
import type { RPSMove, Difficulty, RPSGameState } from '@turn-based-mcp/shared'

export default function RockPaperScissors3DPage() {
  const [playerName, setPlayerName] = useState('Player')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  const {
    gameSession,
    isLoading,
    error,
    is3DEnabled,
    createGame,
    makeMove,
    resetGame,
    gameState: baseGameState,
    isPlayerTurn
  } = use3DGame({
    gameType: 'rock-paper-scissors',
    autoCreate: false,
    defaultPlayerName: playerName,
    defaultDifficulty: difficulty
  })

  // Cast to specific game state type
  const gameState = baseGameState as RPSGameState | null

  const handleMove = async (move: RPSMove) => {
    if (!isPlayerTurn) return
    
    try {
      await makeMove(move, 'player1')
    } catch (error) {
      console.error('Failed to make move:', error)
    }
  }

  const handleNewGame = async () => {
    try {
      resetGame()
      await createGame(playerName, difficulty)
    } catch (error) {
      console.error('Failed to create new game:', error)
    }
  }

  const handleReset = () => {
    resetGame()
  }

  // Show WebGL not supported message
  if (!is3DEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link 
            href="/games/rock-paper-scissors" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to 2D Rock Paper Scissors
          </Link>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            3D Not Supported
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
            Your browser doesn&apos;t support WebGL or 3D rendering is disabled. 
            Please try updating your browser or enabling hardware acceleration.
          </p>
          
          <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-8">
            <div>• Chrome/Firefox: Enable hardware acceleration in settings</div>
            <div>• Safari: Enable WebGL in developer settings</div>
            <div>• Mobile: Use a WebGL-compatible browser</div>
          </div>

          <Link
            href="/games/rock-paper-scissors"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200"
          >
            Play 2D Version Instead
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link 
              href="/games/rock-paper-scissors" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to 2D Version
            </Link>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              3D Rock Paper Scissors
            </h1>
          </div>
          
          {/* WebGL Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              3D Ready
            </span>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-300">
          Watch animated 3D hands battle it out! Control the camera to get the best view of the action.
        </p>
      </div>

      {/* Game Setup */}
      {!gameSession && (
        <div className="mb-8 p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Start New 3D Game
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                AI Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="easy">😌 Easy - Random choices</option>
                <option value="medium">🎯 Medium - Some strategy</option>
                <option value="hard">🔥 Hard - Adaptive AI</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleNewGame}
            disabled={isLoading || !playerName.trim()}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating 3D Arena...</span>
              </div>
            ) : (
              'Enter 3D Arena'
            )}
          </button>
        </div>
      )}

      {/* Game Stats */}
      {gameState && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Round Info */}
          <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Round Progress</h3>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {gameState.rounds.length} / {gameState.maxRounds}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {gameState.status === 'finished' ? 'Game Complete' : 'In Progress'}
            </div>
          </div>

          {/* Player Score */}
          <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Your Score</h3>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {gameState.scores.player1}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Rounds Won
            </div>
          </div>

          {/* AI Score */}
          <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">AI Score</h3>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {gameState.scores.ai}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              Rounds Won
            </div>
          </div>
        </div>
      )}

      {/* 3D Game Arena */}
      {(gameSession || isLoading) && (
        <div className="h-96 md:h-[600px] lg:h-[700px]">
          <RPS3DGame
            gameState={gameState}
            onMove={handleMove}
            isLoading={isLoading}
            error={error}
            onReset={handleReset}
            onNewGame={handleNewGame}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Game Rules & 3D Controls */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Rules */}
        <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-4">
            ⚔️ Battle Rules
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-3">
              <span className="text-xl">✊</span>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Rock crushes Scissors</div>
                <div className="text-slate-600 dark:text-slate-300">Solid beats sharp</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xl">✋</span>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Paper covers Rock</div>
                <div className="text-slate-600 dark:text-slate-300">Flexible beats solid</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xl">✌️</span>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Scissors cut Paper</div>
                <div className="text-slate-600 dark:text-slate-300">Sharp beats flexible</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Controls */}
        <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
            🎮 3D Controls
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                L+D
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Orbit Camera</div>
                <div className="text-slate-600 dark:text-slate-300">Left click + drag to rotate view</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                R+D
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Pan View</div>
                <div className="text-slate-600 dark:text-slate-300">Right click + drag to move</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                🎯
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Zoom</div>
                <div className="text-slate-600 dark:text-slate-300">Scroll wheel to zoom in/out</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}