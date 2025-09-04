/**
 * 3D Tic-Tac-Toe game page
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { TicTacToe3DBoard } from '../../../../components/games/3d/TicTacToe3DBoard'
import { use3DGame } from '../../../../hooks/use3DGame'
import type { TicTacToeMove, Difficulty } from '@turn-based-mcp/shared'

export default function TicTacToe3DPage() {
  const searchParams = useSearchParams()
  const joinGameId = searchParams.get('join')
  
  const [playerName, setPlayerName] = useState('Player')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [gameIdToJoin, setGameIdToJoin] = useState('')
  const [gameMode, setGameMode] = useState<'create' | 'join'>('create')

  const {
    gameSession,
    isLoading,
    error,
    is3DEnabled,
    createGame,
    loadGame,
    makeMove,
    resetGame,
    gameState,
    isPlayerTurn
  } = use3DGame({
    gameType: 'tic-tac-toe',
    autoCreate: false,
    defaultPlayerName: playerName,
    defaultDifficulty: difficulty
  })

  const handleMove = async (move: TicTacToeMove) => {
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

  const handleJoinGame = async () => {
    if (!gameIdToJoin.trim()) return
    
    try {
      resetGame()
      await loadGame(gameIdToJoin.trim())
    } catch (error) {
      console.error('Failed to join game:', error)
    }
  }

  const handleReset = () => {
    resetGame()
  }

  // Auto-join game if join parameter is provided
  useEffect(() => {
    if (joinGameId && is3DEnabled && !gameSession && !isLoading) {
      setGameIdToJoin(joinGameId)
      setGameMode('join')
      // Automatically attempt to join the game
      loadGame(joinGameId).catch((error) => {
        console.error('Failed to auto-join game:', error)
      })
    }
  }, [joinGameId, is3DEnabled, gameSession, isLoading, loadGame])

  // Show WebGL not supported message
  if (!is3DEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link 
            href="/games/tic-tac-toe" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to 2D Tic-Tac-Toe
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
            href="/games/tic-tac-toe"
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
              href="/games/tic-tac-toe" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to 2D Version
            </Link>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              3D Tic-Tac-Toe
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
          Experience Tic-Tac-Toe in immersive 3D! Use your mouse to rotate the camera and click on cells to make moves.
        </p>
      </div>

      {/* Game Setup */}
      {!gameSession && (
        <div className="mb-8 p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/50">
          {/* Game Mode Tabs */}
          <div className="flex mb-6 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <button
              onClick={() => setGameMode('create')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                gameMode === 'create'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🎮 Create New Game
            </button>
            <button
              onClick={() => setGameMode('join')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                gameMode === 'join'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔗 Join Existing Game
            </button>
          </div>

          {gameMode === 'create' ? (
            <>
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
                    <option value="easy">😌 Easy</option>
                    <option value="medium">🎯 Medium</option>
                    <option value="hard">🔥 Hard</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleNewGame}
                disabled={isLoading || !playerName.trim()}
                className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating 3D Game...</span>
                  </div>
                ) : (
                  'Start 3D Game'
                )}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Join Existing 3D Game
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Game ID
                  </label>
                  <input
                    type="text"
                    value={gameIdToJoin}
                    onChange={(e) => setGameIdToJoin(e.target.value)}
                    placeholder="Enter game ID (e.g., game_abc123)"
                    className="w-full px-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Ask someone to share their game ID with you, or use the MCP AI to join a specific game.
                  </p>
                </div>
                
                <button
                  onClick={handleJoinGame}
                  disabled={isLoading || !gameIdToJoin.trim()}
                  className="w-full px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Joining Game...</span>
                    </div>
                  ) : (
                    'Join 3D Game'
                  )}
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                {error}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Game Info Bar - Show when game is active */}
      {gameSession && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Game Active
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Game ID:</span>
                <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded border text-sm font-mono text-blue-600 dark:text-blue-400">
                  {gameState?.id}
                </code>
                <button
                  onClick={() => gameState?.id && navigator.clipboard.writeText(gameState.id)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                  title="Copy Game ID"
                >
                  📋
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Share this ID with the AI to let it join your 3D game!
              </span>
              <button
                onClick={() => resetGame()}
                className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors duration-200"
              >
                Back to Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Game Board */}
      {(gameSession || isLoading) && (
        <div className="h-96 md:h-[600px] lg:h-[700px]">
          <TicTacToe3DBoard
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

      {/* 3D Controls Help */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
          🎮 3D Controls Guide
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              🖱️
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Rotate View</div>
              <div className="text-slate-600 dark:text-slate-300">Left click + drag to orbit around the board</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              🖱️
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Pan View</div>
              <div className="text-slate-600 dark:text-slate-300">Right click + drag to move the view</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
              🎯
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Zoom & Click</div>
              <div className="text-slate-600 dark:text-slate-300">Scroll to zoom, click cells to play</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}