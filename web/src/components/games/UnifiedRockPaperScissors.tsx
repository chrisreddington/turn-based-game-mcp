/**
 * Unified rock-paper-scissors game component supporting both 2D and 3D modes
 */

'use client'

import React, { useState } from 'react'
import { RPSGameBoard } from '../games/RPSGameBoard'
import { RPS3DGame } from '../games/3d/RPS3DGame'
import { GameInfoPanel } from '../games/GameInfoPanel'
import { GameContainer, GameControls, ConfirmationModal } from '../ui'
import { MCPAssistantPanel } from '../shared'
import { useRockPaperScissorsGame, ViewMode } from '../../hooks/useRockPaperScissorsGame'
import type { RPSMove, Difficulty } from '@turn-based-mcp/shared'

interface UnifiedRockPaperScissorsProps {
  /** Initial view mode */
  initialViewMode?: ViewMode
  /** Auto-join game ID from URL parameters */
  autoJoinGameId?: string | null
}

/**
 * Unified rock-paper-scissors component that handles both 2D and 3D gameplay
 */
export function UnifiedRockPaperScissors({ 
  initialViewMode = '2d',
  autoJoinGameId 
}: UnifiedRockPaperScissorsProps) {
  const {
    gameSession,
    availableGames,
    isLoading,
    error,
    viewMode,
    is3DSupported,
    isPlayerTurn,
    gameState,
    createGame,
    joinGame,
    makeMove,
    deleteGame,
    setViewMode,
    resetGame,
    clearError
  } = useRockPaperScissorsGame({
    initialViewMode,
    autoJoinGameId
  })

  // Form state for game creation
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium')
  const [maxRounds, setMaxRounds] = useState<number>(3)
  const [customGameId, setCustomGameId] = useState('')
  const [joinGameId, setJoinGameId] = useState('')
  const [gamesToShow, setGamesToShow] = useState(5)

  // Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [gameToDelete, setGameToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle game creation
  const handleCreateGame = async (viewModeForGame: ViewMode = viewMode) => {
    try {
      setViewMode(viewModeForGame)
      await createGame('Player', aiDifficulty, maxRounds, customGameId || undefined)
      setShowCreateForm(false)
      setCustomGameId('')
    } catch (error) {
      console.error('Failed to create game:', error)
    }
  }

  // Handle joining game
  const handleJoinGame = async (gameId: string, viewModeForGame: ViewMode = viewMode) => {
    try {
      setViewMode(viewModeForGame)
      await joinGame(gameId)
      setShowJoinForm(false)
      setJoinGameId('')
    } catch (error) {
      console.error('Failed to join game:', error)
    }
  }

  // Handle move
  const handleMove = async (move: RPSMove) => {
    if (!isPlayerTurn) return
    try {
      await makeMove(move)
    } catch (error) {
      console.error('Failed to make move:', error)
    }
  }

  // Handle delete game
  const handleDeleteGame = (gameId: string) => {
    setGameToDelete(gameId)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (gameToDelete) {
      setIsDeleting(true)
      try {
        await deleteGame(gameToDelete)
        setShowDeleteModal(false)
        setGameToDelete(null)
      } catch (error) {
        console.error('Failed to delete game:', error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setShowDeleteModal(false)
      setGameToDelete(null)
    }
  }

  // View mode switching
  const handleSwitchTo3D = () => {
    if (!is3DSupported) {
      return // Will show error in UI
    }
    setViewMode('3d')
  }

  const handleSwitchTo2D = () => {
    setViewMode('2d')
  }

  // Render appropriate board based on view mode
  const renderGameBoard = () => {
    if (!gameState) return null

    if (viewMode === '3d') {
      return (
        <RPS3DGame
          gameState={gameState}
          onMove={handleMove}
          isLoading={isLoading}
          error={error}
          onReset={resetGame}
          onNewGame={() => handleCreateGame('3d')}
          onSwitchTo2D={handleSwitchTo2D}
          className="w-full h-full"
        />
      )
    } else {
      return (
        <RPSGameBoard
          gameState={gameState}
          onMove={handleMove}
          disabled={isLoading || !isPlayerTurn}
        />
      )
    }
  }

  // 3D full-screen mode
  if (gameSession && viewMode === '3d') {
    return (
      <div className="fixed inset-0 bg-slate-900">
        <div className="w-full h-full">
          {renderGameBoard()}
        </div>
      </div>
    )
  }

  // Regular 2D mode when game is active
  if (gameSession && viewMode === '2d') {
    const sidebar = (
      <>
      {/* View Mode Switcher */}
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-700/50">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Game View</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSwitchTo2D}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === '2d'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              📱 2D Mode
            </button>
            <button
              onClick={handleSwitchTo3D}
              disabled={!is3DSupported}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              (viewMode as ViewMode) === '3d'
                ? 'bg-purple-500 text-white'
                : is3DSupported
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
              title={!is3DSupported ? '3D not supported on this device' : 'Switch to 3D mode'}
            >
              🎮 3D Mode
            </button>
          </div>
        </div>
        <GameInfoPanel 
          gameState={gameState!} 
          aiDifficulty={gameSession.difficulty} 
        />
        <MCPAssistantPanel 
          gameState={gameState!}
          gameInstructions={{
            steps: [
              'Ask your AI assistant to analyze the game',
              'Use the MCP server tools to get the optimal move',
              'The AI will make the move automatically'
            ]
          }}
        />
        <GameControls 
          isLoading={isLoading}
          onNewGame={() => handleCreateGame('2d')}
          onDelete={() => handleDeleteGame(gameState!.id)}
          showDelete={true}
        />
      </>
    )

    return (
      <div>
        <GameContainer
          title="Rock Paper Scissors"
          description="Best of 3 rounds! Rock beats Scissors, Scissors beats Paper, Paper beats Rock. Experience it in 2D or immersive 3D."
          gameBoard={renderGameBoard()}
          sidebar={sidebar}
          error={error}
          onErrorDismiss={clearError}
        />
        
        {/* Delete confirmation modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          title="Delete Game"
          message="Are you sure you want to delete this game? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onClose={handleDeleteCancel}
          isLoading={isDeleting}
          danger={true}
        />
      </div>
    )
  }

  // Game selection screen
  return (
    <div>
      <GameContainer
        title="Rock Paper Scissors"
        description="Best of 3 rounds! Rock beats Scissors, Scissors beats Paper, Paper beats Rock. Experience it in 2D or immersive 3D."
        error={error}
        onErrorDismiss={clearError}
        gameBoard={
          <div className="flex flex-col items-center justify-center min-h-96 p-8 space-y-6">
            <div className="text-6xl mb-4">✂️📄🗿</div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Rock Paper Scissors
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                Create a new game or join an existing one
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={isLoading}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="text-xl">🎮</span>
                Create New Game
              </button>
              <button
                onClick={() => setShowJoinForm(true)}
                disabled={isLoading}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="text-xl">🔗</span>
                Join by ID
              </button>
            </div>
          </div>
        }
        sidebar={
          <div className="space-y-6">
            {/* Available Games */}
            {availableGames.length > 0 && (
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-700/50">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Active Games</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableGames.slice(0, gamesToShow).map(game => (
                    <div key={game.gameState.id} className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-700/20 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {game.gameState.id.slice(-8)}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Round {game.gameState.rounds.length}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleJoinGame(game.gameState.id, '2d')}
                          className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-200"
                          title="Join in 2D"
                        >
                          2D
                        </button>
                        <button
                          onClick={() => handleJoinGame(game.gameState.id, '3d')}
                          disabled={!is3DSupported}
                          className="px-2 py-1 text-xs bg-purple-500 hover:bg-purple-600 disabled:bg-slate-400 text-white rounded transition-colors duration-200"
                          title={is3DSupported ? "Join in 3D" : "3D not supported"}
                        >
                          3D
                        </button>
                      </div>
                    </div>
                  ))}
                  {availableGames.length > gamesToShow && (
                    <button
                      onClick={() => setGamesToShow(prev => prev + 5)}
                      className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                      Show {Math.min(5, availableGames.length - gamesToShow)} more...
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* Create game modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create New Game</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  AI Difficulty
                </label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Max Rounds
                </label>
                <select
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={1}>1 Round</option>
                  <option value={3}>3 Rounds</option>
                  <option value={5}>5 Rounds</option>
                  <option value={7}>7 Rounds</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Custom Game ID (optional)
                </label>
                <input
                  type="text"
                  value={customGameId}
                  onChange={(e) => setCustomGameId(e.target.value)}
                  placeholder="Leave empty for random ID"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Game Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCreateGame('2d')}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    📱 2D Mode
                  </button>
                  <button
                    onClick={() => handleCreateGame('3d')}
                    disabled={isLoading || !is3DSupported}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors duration-200"
                    title={!is3DSupported ? '3D not supported on this device' : ''}
                  >
                    🎮 3D Mode
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join game modal */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Join Game</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Game ID
                </label>
                <input
                  type="text"
                  value={joinGameId}
                  onChange={(e) => setJoinGameId(e.target.value)}
                  placeholder="Enter game ID"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Game Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleJoinGame(joinGameId, '2d')}
                    disabled={isLoading || !joinGameId.trim()}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    📱 2D Mode
                  </button>
                  <button
                    onClick={() => handleJoinGame(joinGameId, '3d')}
                    disabled={isLoading || !joinGameId.trim() || !is3DSupported}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors duration-200"
                    title={!is3DSupported ? '3D not supported on this device' : ''}
                  >
                    🎮 3D Mode
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowJoinForm(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
