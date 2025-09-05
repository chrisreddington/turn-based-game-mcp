/**
 * Unified tic-tac-toe game component supporting both 2D and 3D modes
 */

'use client'

import React, { useState } from 'react'
import { TicTacToeBoard } from '../games/TicTacToeBoard'
import { TicTacToe3DBoard } from '../games/3d/TicTacToe3DBoard'
import { GameInfoPanel } from '../games/GameInfoPanel'
import { GameContainer, GameControls, ConfirmationModal } from '../ui'
import { MCPAssistantPanel } from '../shared'
import { useTicTacToeGame, ViewMode } from '../../hooks/useTicTacToeGame'
import type { TicTacToeMove, Difficulty } from '@turn-based-mcp/shared'

interface UnifiedTicTacToeProps {
  /** Initial view mode */
  initialViewMode?: ViewMode
  /** Auto-join game ID from URL parameters */
  autoJoinGameId?: string | null
}

/**
 * Unified tic-tac-toe component that handles both 2D and 3D gameplay
 */
export function UnifiedTicTacToe({ 
  initialViewMode = '2d',
  autoJoinGameId 
}: UnifiedTicTacToeProps) {
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
    // loadAvailableGames // Commented out as it's not used in this component
  } = useTicTacToeGame({
    initialViewMode,
    autoJoinGameId
  })

  // Form state for game creation
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium')
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O'>('X')
  const [customGameId, setCustomGameId] = useState('')
  const [joinGameId, setJoinGameId] = useState('')
  const [gamesToShow, setGamesToShow] = useState(5)

  // 3D-specific state that persists across view mode switches
  const [piecePlacementMode, setPiecePlacementMode] = useState<'standing' | 'flat'>('standing')

  // Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [gameToDelete, setGameToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle game creation
  const handleCreateGame = async (viewModeForGame: ViewMode = viewMode) => {
    try {
      setViewMode(viewModeForGame)
      await createGame('Player', aiDifficulty, playerSymbol, customGameId || undefined)
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
  const handleMove = async (move: TicTacToeMove) => {
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
        <TicTacToe3DBoard
          gameState={gameState}
          onMove={handleMove}
          isLoading={isLoading}
          error={error}
          onReset={resetGame}
          onNewGame={() => handleCreateGame('3d')}
          onSwitchTo2D={handleSwitchTo2D}
          piecePlacementMode={piecePlacementMode}
          onPiecePlacementModeChange={setPiecePlacementMode}
          className="w-full h-full"
        />
      )
    } else {
      return (
        <TicTacToeBoard
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
          title="Tic-Tac-Toe"
          description="Get three in a row to win! Experience it in 2D or immersive 3D."
          gameBoard={renderGameBoard()}
          sidebar={sidebar}
          error={error}
          onErrorDismiss={clearError}
        />
        
        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Game"
          message="Are you sure you want to delete this tic-tac-toe game? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={isDeleting}
          danger={true}
        />
      </div>
    )
  }

  // Game lobby / setup screen
  const gameSetupContent = (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM7 15h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
          </svg>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Create a new game or join an existing one
        </p>
        
        {/* View mode toggle for lobby */}
        <div className="flex items-center justify-center space-x-1 mt-4 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit mx-auto">
          <button
            onClick={() => setViewMode('2d')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === '2d'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📱 2D Mode
          </button>
          <button
            onClick={() => setViewMode('3d')}
            disabled={!is3DSupported}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === '3d'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                : is3DSupported
                  ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
            title={!is3DSupported ? '3D not supported on this device' : 'Switch to 3D mode'}
          >
            🎮 3D Mode
          </button>
        </div>
      </div>

      {/* Available Games */}
      {availableGames.length > 0 && (
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              Available Games
            </h3>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Showing {Math.min(gamesToShow, availableGames.length)} of {availableGames.length}
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {availableGames.slice(0, gamesToShow).map((game) => (
              <div key={game.gameState.id} className="group flex items-center justify-between p-4 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/50 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-mono">{game.gameState.id.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {game.gameState.id.slice(0, 8)}...
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        game.gameState.currentPlayerId === 'player1' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        Turn: {game.gameState.currentPlayerId === 'player1' ? 'Player' : 'AI'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        game.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        game.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {game.difficulty || 'medium'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleJoinGame(game.gameState.id, '2d')}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                  >
                    📱 2D
                  </button>
                  <button
                    onClick={() => handleJoinGame(game.gameState.id, '3d')}
                    disabled={!is3DSupported}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold rounded-lg hover:from-purple-600 hover:to-violet-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-200"
                    title={!is3DSupported ? '3D not supported' : 'Join in 3D mode'}
                  >
                    🎮 3D
                  </button>
                  <button
                    onClick={() => handleDeleteGame(game.gameState.id)}
                    className="px-2 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                    title="Delete game"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Show More/Less buttons */}
          {availableGames.length > 5 && (
            <div className="mt-4 flex justify-center">
              {gamesToShow < availableGames.length ? (
                <button
                  onClick={() => setGamesToShow(availableGames.length)}
                  className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
                >
                  Show All ({availableGames.length - gamesToShow} more)
                </button>
              ) : (
                <button
                  onClick={() => setGamesToShow(5)}
                  className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
                >
                  Show Less
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="group flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          Create New Game
        </button>
        <button
          onClick={() => setShowJoinForm(!showJoinForm)}
          className="group flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
          Join by ID
        </button>
      </div>

      {/* Create Game Form */}
      {showCreateForm && (
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Create New Game ({viewMode === '3d' ? '3D' : '2D'} Mode)
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                AI Difficulty
              </label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}
                className="w-full px-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              >
                <option value="easy">🟢 Easy - Random moves</option>
                <option value="medium">🟡 Medium - Strategic play</option>
                <option value="hard">🔴 Hard - Optimal play (never loses)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Your Symbol
              </label>
              <select
                value={playerSymbol}
                onChange={(e) => setPlayerSymbol(e.target.value as 'X' | 'O')}
                className="w-full px-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              >
                <option value="X">❌ X - You go first</option>
                <option value="O">⭕ O - AI goes first</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Custom Game ID (optional)
              </label>
              <input
                type="text"
                value={customGameId}
                onChange={(e) => setCustomGameId(e.target.value)}
                placeholder="Leave empty for random ID"
                className="w-full px-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleCreateGame(viewMode)}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  `Create ${viewMode === '3d' ? '3D' : '2D'} Game`
                )}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Game Form */}
      {showJoinForm && (
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Join Existing Game ({viewMode === '3d' ? '3D' : '2D'} Mode)
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Game ID
              </label>
              <input
                type="text"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                placeholder="Enter game ID (e.g., cf27ec40-5690-4146-9418-f2965caa26c6)"
                className="w-full px-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleJoinGame(joinGameId, viewMode)}
                disabled={isLoading || !joinGameId.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Joining...
                  </div>
                ) : (
                  `Join ${viewMode === '3d' ? '3D' : '2D'} Game`
                )}
              </button>
              <button
                onClick={() => setShowJoinForm(false)}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <GameContainer
        title="Tic-Tac-Toe"
        description="Get three in a row to win! Experience it in 2D or immersive 3D."
        gameBoard={gameSetupContent}
        sidebar={<div></div>} // Empty sidebar for setup
        error={error}
        onErrorDismiss={clearError}
        isSetupScreen={true}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Game"
        message="Are you sure you want to delete this tic-tac-toe game? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        danger={true}
      />
    </div>
  )
}
