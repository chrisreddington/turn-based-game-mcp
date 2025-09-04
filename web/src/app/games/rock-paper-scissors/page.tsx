'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RPSGameBoard } from '../../../components/games/RPSGameBoard'
import { GameInfoPanel } from '../../../components/games/GameInfoPanel'
import { GameContainer, GameControls, ConfirmationModal } from '../../../components/ui'
import { MCPAssistantPanel } from '../../../components/shared'
import type { RPSGameState, RPSMove, Difficulty } from '@turn-based-mcp/shared'
import type { GameSession } from '@turn-based-mcp/shared'

export default function RockPaperScissorsPage() {
  const [gameSession, setGameSession] = useState<GameSession<RPSGameState> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameId, setGameId] = useState<string>('')
  const [availableGames, setAvailableGames] = useState<GameSession<RPSGameState>[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium')
  const [maxRounds, setMaxRounds] = useState<number>(3)
  const [gamesToShow, setGamesToShow] = useState(5)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [gameToDelete, setGameToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load available games on component mount
  useEffect(() => {
    loadAvailableGames()
  }, [])

  // Poll for game updates when it's the AI's turn
  useEffect(() => {
    if (!gameSession || gameSession.gameState.status !== 'playing') {
      return
    }

    // Only poll when it's the AI's turn
    if (gameSession.gameState.currentPlayerId === 'ai') {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/games/rock-paper-scissors')
          if (response.ok) {
            const games = await response.json()
            const updatedGame = games.find((g: GameSession<RPSGameState>) => 
              g.gameState.id === gameSession.gameState.id
            )
            
            if (updatedGame && 
                (updatedGame.gameState.updatedAt !== gameSession.gameState.updatedAt ||
                 updatedGame.gameState.currentPlayerId !== gameSession.gameState.currentPlayerId)) {
              console.log('Game state updated, refreshing...')
              setGameSession(updatedGame)
            }
          }
        } catch (error) {
          console.error('Error polling for game updates:', error)
        }
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(pollInterval)
    }
  }, [gameSession])

  const loadAvailableGames = async () => {
    try {
      const response = await fetch('/api/games/rock-paper-scissors')
      if (response.ok) {
        const games = await response.json()
        setAvailableGames(games.filter((game: GameSession<RPSGameState>) => 
          game.gameState.status === 'playing'
        ))
      }
    } catch (error) {
      console.error('Error loading games:', error)
    }
  }

  const startNewGame = async (customGameId?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const body: { playerName: string; gameId?: string; difficulty: string; maxRounds: number } = { 
        playerName: 'Player',
        difficulty: aiDifficulty,
        maxRounds 
      }
      if (customGameId) {
        body.gameId = customGameId
      }

      const response = await fetch('/api/games/rock-paper-scissors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        throw new Error('Failed to start game')
      }
      
      const session = await response.json()
      setGameSession(session)
      setShowCreateForm(false)
      setShowJoinForm(false)
      setGameId('')
    } catch (err) {
      setError('Failed to start game. Please try again.')
      console.error('Error starting game:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const joinExistingGame = async (existingGameId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Try to get the existing game
      const games = await fetch('/api/games/rock-paper-scissors').then(r => r.json())
      const existingGame = games.find((g: GameSession<RPSGameState>) => 
        g.gameState.id === existingGameId
      )
      
      if (existingGame) {
        setGameSession(existingGame)
        setShowJoinForm(false)
        setGameId('')
      } else {
        setError(`Game with ID "${existingGameId}" not found.`)
      }
    } catch (err) {
      setError('Failed to join game. Please try again.')
      console.error('Error joining game:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const makeMove = async (move: RPSMove) => {
    if (!gameSession || isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/games/rock-paper-scissors/${gameSession.gameState.id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          move,
          playerId: 'player1',
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to make move')
      }
      
      const updatedSession = await response.json()
      setGameSession(updatedSession)
    } catch (err) {
      setError('Failed to make move. Please try again.')
      console.error('Error making move:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleErrorDismiss = () => {
    setError(null)
  }

  const deleteGame = async (gameId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/games/rock-paper-scissors?gameId=${encodeURIComponent(gameId)}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete game')
      }
      
      // If we're deleting the current game session, reset it
      if (gameSession && gameSession.gameState.id === gameId) {
        setGameSession(null)
      }
      
      // Reload available games
      await loadAvailableGames()
      
      // Close modal
      setShowDeleteModal(false)
      setGameToDelete(null)
      
    } catch (err) {
      setError('Failed to delete game. Please try again.')
      console.error('Error deleting game:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteGame = (gameId: string) => {
    setGameToDelete(gameId)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (gameToDelete) {
      await deleteGame(gameToDelete)
    }
  }

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setShowDeleteModal(false)
      setGameToDelete(null)
    }
  }

  // Render game when session exists
  if (gameSession) {
    const gameBoard = (
      <RPSGameBoard
        gameState={gameSession.gameState}
        onMove={makeMove}
        disabled={isLoading || gameSession.gameState.currentPlayerId === 'ai'}
      />
    )

    const sidebar = (
      <>
        <GameInfoPanel 
          gameState={gameSession.gameState} 
          aiDifficulty={gameSession.difficulty} 
        />
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Score Board
          </h3>
          <div className="space-y-2 text-sm">
            {gameSession.gameState.players.map(player => (
              <div key={player.id} className="flex justify-between">
                <span>{player.name}:</span>
                <span className="font-bold">
                  {gameSession.gameState.scores[player.id] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <MCPAssistantPanel 
          gameState={gameSession.gameState}
          gameInstructions={{
            steps: [
              'Ask your AI assistant to analyze the game',
              'Use the MCP server tools to get the optimal choice',
              'The AI will make the move automatically'
            ]
          }}
        />
        
        <GameControls 
          isLoading={isLoading}
          onNewGame={() => startNewGame()}
          onDelete={() => handleDeleteGame(gameSession.gameState.id)}
          showDelete={true}
        />
      </>
    )

    return (
      <div>
        {/* Header with 3D Link */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center justify-between">
            <div></div>
            <Link
              href="/games/rock-paper-scissors/3d"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              <span className="text-lg mr-2 group-hover:scale-110 transition-transform duration-200">⚔️</span>
              Play in 3D
            </Link>
          </div>
        </div>
        
        <GameContainer
          title="Rock Paper Scissors"
          description={`Play ${gameSession.gameState.maxRounds} round${gameSession.gameState.maxRounds !== 1 ? 's' : ''}! Rock beats Scissors, Scissors beats Paper, Paper beats Rock.`}
          gameBoard={gameBoard}
          sidebar={sidebar}
          error={error}
          onErrorDismiss={handleErrorDismiss}
        />
        <ConfirmationModal
          isOpen={showDeleteModal}
          title="Delete Game"
          message="Are you sure you want to delete this rock-paper-scissors game? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onClose={handleDeleteCancel}
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={isDeleting}
          danger={true}
        />
      </div>
    )
  }

  // Render game creation/joining UI when no session exists
  if (!gameSession && !isLoading) {
    const gameSetupContent = (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Create a new game or join an existing one
          </p>
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
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-mono">{game.gameState.id.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {game.gameState.id.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        Round: {game.gameState.currentRound + 1}/{game.gameState.maxRounds} • 
                        Turn: {game.gameState.currentPlayerId === 'player1' ? 'Player' : 'AI'} • 
                        Difficulty: {game.difficulty || 'medium'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => joinExistingGame(game.gameState.id)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Join
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game.gameState.id)}
                      className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Game</h3>
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
                  <option value="hard">🔴 Hard - Advanced pattern recognition</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Number of Rounds
                </label>
                <select
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value={1}>1 Round</option>
                  <option value={3}>3 Rounds (Best of 3)</option>
                  <option value={5}>5 Rounds (Best of 5)</option>
                  <option value={7}>7 Rounds (Best of 7)</option>
                  <option value={10}>10 Rounds</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Custom Game ID (optional)
                </label>
                <input
                  type="text"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="Leave empty for random ID"
                  className="w-full px-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => startNewGame(gameId || undefined)}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Game'
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Join Existing Game</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Game ID
                </label>
                <input
                  type="text"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="Enter game ID (e.g., cf27ec40-5690-4146-9418-f2965caa26c6)"
                  className="w-full px-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => joinExistingGame(gameId)}
                  disabled={isLoading || !gameId.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Joining...
                    </div>
                  ) : (
                    'Join Game'
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
        {/* Header with 3D Link */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center justify-between">
            <div></div>
            <Link
              href="/games/rock-paper-scissors/3d"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              <span className="text-lg mr-2 group-hover:scale-110 transition-transform duration-200">⚔️</span>
              Play in 3D
            </Link>
          </div>
        </div>
        
        <GameContainer
          title="Rock Paper Scissors"
          description={`Play ${maxRounds} round${maxRounds !== 1 ? 's' : ''}! Rock beats Scissors, Scissors beats Paper, Paper beats Rock.`}
          gameBoard={gameSetupContent}
          sidebar={<div></div>} // Empty sidebar for setup
          error={error}
          onErrorDismiss={handleErrorDismiss}
          isSetupScreen={true}
        />
        <ConfirmationModal
          isOpen={showDeleteModal}
          title="Delete Game"
          message="Are you sure you want to delete this rock-paper-scissors game? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onClose={handleDeleteCancel}
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={isDeleting}
          danger={true}
        />
      </div>
    )
  }

  // Loading state
  return (
    <div>
      {/* Header with 3D Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between">
          <div></div>
          <Link
            href="/games/rock-paper-scissors/3d"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <span className="text-lg mr-2 group-hover:scale-110 transition-transform duration-200">⚔️</span>
            Play in 3D
          </Link>
        </div>
      </div>
      
      <GameContainer
        title="Rock Paper Scissors"
        description="Best of 3 rounds! Rock beats Scissors, Scissors beats Paper, Paper beats Rock."
        gameBoard={<div className="text-center py-8">Loading...</div>}
        sidebar={<div></div>}
        error={error}
        onErrorDismiss={handleErrorDismiss}
        isSetupScreen={true}
      />
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Game"
        message="Are you sure you want to delete this rock-paper-scissors game? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        danger={true}
      />
    </div>
  )
}
