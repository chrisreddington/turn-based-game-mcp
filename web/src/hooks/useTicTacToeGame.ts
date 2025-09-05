/**
 * Unified hook for managing tic-tac-toe game state in both 2D and 3D modes
 */

import { useState, useEffect, useCallback } from 'react'
import type { 
  GameSession, 
  TicTacToeGameState, 
  TicTacToeMove, 
  Difficulty 
} from '@turn-based-mcp/shared'
import { detectWebGLCapabilities } from '../lib/3d/three-utils'

export type ViewMode = '2d' | '3d'

interface UseTicTacToeGameOptions {
  /** Initial view mode */
  initialViewMode?: ViewMode
  /** Auto-create game on mount */
  autoCreate?: boolean
  /** Default player name */
  defaultPlayerName?: string
  /** Default AI difficulty */
  defaultDifficulty?: Difficulty
  /** Auto-join game ID */
  autoJoinGameId?: string | null
}

interface UseTicTacToeGameState {
  /** Current game session */
  gameSession: GameSession<TicTacToeGameState> | null
  /** Available games list */
  availableGames: GameSession<TicTacToeGameState>[]
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Current view mode */
  viewMode: ViewMode
  /** Whether 3D is supported */
  is3DSupported: boolean
  /** Whether it's the player's turn */
  isPlayerTurn: boolean
}

/**
 * Unified hook for managing tic-tac-toe game state
 */
export function useTicTacToeGame(options: UseTicTacToeGameOptions = {}) {
  const {
    initialViewMode = '2d',
    autoCreate = false,
    defaultPlayerName = 'Player',
    defaultDifficulty = 'medium',
    autoJoinGameId
  } = options

  const [state, setState] = useState<UseTicTacToeGameState>({
    gameSession: null,
    availableGames: [],
    isLoading: false,
    error: null,
    viewMode: initialViewMode,
    is3DSupported: false,
    isPlayerTurn: false
  })

  // Check WebGL capabilities on mount
  useEffect(() => {
    const capabilities = detectWebGLCapabilities()
    setState(prev => ({
      ...prev,
      is3DSupported: capabilities.isSupported
    }))

    if (!capabilities.isSupported && initialViewMode === '3d') {
      console.warn('WebGL not supported, falling back to 2D mode')
      setState(prev => ({ ...prev, viewMode: '2d' }))
    }
  }, [initialViewMode])

  // Update player turn status when game state changes
  useEffect(() => {
    if (state.gameSession?.gameState) {
      const isPlayerTurn = state.gameSession.gameState.currentPlayerId === 'player1' &&
                          state.gameSession.gameState.status === 'playing'
      setState(prev => ({ ...prev, isPlayerTurn }))
    }
  }, [state.gameSession])

  // Load available games
  const loadAvailableGames = useCallback(async () => {
    try {
      const response = await fetch('/api/games/tic-tac-toe')
      if (response.ok) {
        const games = await response.json()
        setState(prev => ({
          ...prev,
          availableGames: games.filter((game: GameSession<TicTacToeGameState>) => 
            game.gameState.status === 'playing'
          )
        }))
      }
    } catch (error) {
      console.error('Error loading games:', error)
    }
  }, [])

  // Poll for game updates when it's AI's turn
  useEffect(() => {
    if (!state.gameSession || state.gameSession.gameState.status !== 'playing') {
      return
    }

    if (state.gameSession.gameState.currentPlayerId === 'ai') {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/games/tic-tac-toe')
          if (response.ok) {
            const games = await response.json()
            const updatedGame = games.find((g: GameSession<TicTacToeGameState>) => 
              g.gameState.id === state.gameSession!.gameState.id
            )
            
            if (updatedGame && state.gameSession &&
                (updatedGame.gameState.updatedAt !== state.gameSession.gameState.updatedAt ||
                 updatedGame.gameState.currentPlayerId !== state.gameSession.gameState.currentPlayerId)) {
              console.log('Game state updated, refreshing...')
              setState(prev => ({ ...prev, gameSession: updatedGame }))
            }
          }
        } catch (error) {
          console.error('Error polling for game updates:', error)
        }
      }, 3000)

      return () => clearInterval(pollInterval)
    }
  }, [state.gameSession])

  // Auto-join game if specified
  useEffect(() => {
    if (autoJoinGameId && !state.gameSession && !state.isLoading) {
      joinGame(autoJoinGameId)
    }
  }, [autoJoinGameId, state.gameSession, state.isLoading])

  // Load available games on mount
  useEffect(() => {
    loadAvailableGames()
  }, [loadAvailableGames])

  // Auto-create game if specified
  useEffect(() => {
    if (autoCreate && !state.gameSession && !state.isLoading && state.is3DSupported !== undefined) {
      createGame(defaultPlayerName, defaultDifficulty)
    }
  }, [autoCreate, state.gameSession, state.isLoading, state.is3DSupported, defaultPlayerName, defaultDifficulty])

  // Create a new game
  const createGame = useCallback(async (
    playerName: string = defaultPlayerName,
    difficulty: Difficulty = defaultDifficulty,
    playerSymbol: 'X' | 'O' = 'X',
    customGameId?: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const body: {
        playerName: string
        difficulty: Difficulty
        playerSymbol: 'X' | 'O'
        gameId?: string
      } = { 
        playerName,
        difficulty,
        playerSymbol
      }
      if (customGameId) {
        body.gameId = customGameId
      }

      const response = await fetch('/api/games/tic-tac-toe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error('Failed to create game')
      }

      const gameSession = await response.json()
      setState(prev => ({ ...prev, gameSession, isLoading: false }))
      await loadAvailableGames()
      return gameSession
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create game'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [defaultPlayerName, defaultDifficulty, loadAvailableGames])

  // Join existing game
  const joinGame = useCallback(async (gameId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/games/tic-tac-toe')
      if (!response.ok) {
        throw new Error('Failed to fetch games')
      }

      const games = await response.json()
      const existingGame = games.find((g: GameSession<TicTacToeGameState>) => 
        g.gameState.id === gameId
      )

      if (existingGame) {
        setState(prev => ({ ...prev, gameSession: existingGame, isLoading: false }))
        return existingGame
      } else {
        throw new Error(`Game with ID "${gameId}" not found`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join game'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [])

  // Make a move
  const makeMove = useCallback(async (move: TicTacToeMove, playerId: string = 'player1') => {
    if (!state.gameSession || state.isLoading) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/games/tic-tac-toe/${state.gameSession.gameState.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move, playerId })
      })

      if (!response.ok) {
        throw new Error('Failed to make move')
      }

      const updatedSession = await response.json()
      setState(prev => ({ ...prev, gameSession: updatedSession, isLoading: false }))
      return updatedSession
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to make move'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [state.gameSession, state.isLoading])

  // Delete a game
  const deleteGame = useCallback(async (gameId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/games/tic-tac-toe?gameId=${encodeURIComponent(gameId)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete game')
      }

      // If we're deleting the current game session, reset it
      if (state.gameSession && state.gameSession.gameState.id === gameId) {
        setState(prev => ({ ...prev, gameSession: null }))
      }

      await loadAvailableGames()
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete game'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [state.gameSession, loadAvailableGames])

  // Switch view mode
  const setViewMode = useCallback((mode: ViewMode) => {
    if (mode === '3d' && !state.is3DSupported) {
      setState(prev => ({ ...prev, error: '3D mode is not supported on this device' }))
      return
    }
    setState(prev => ({ ...prev, viewMode: mode }))
  }, [state.is3DSupported])

  // Reset game session
  const resetGame = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      gameSession: null, 
      isLoading: false, 
      error: null 
    }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // State
    gameSession: state.gameSession,
    availableGames: state.availableGames,
    isLoading: state.isLoading,
    error: state.error,
    viewMode: state.viewMode,
    is3DSupported: state.is3DSupported,
    isPlayerTurn: state.isPlayerTurn,
    gameState: state.gameSession?.gameState,

    // Actions
    createGame,
    joinGame,
    makeMove,
    deleteGame,
    setViewMode,
    resetGame,
    clearError,
    loadAvailableGames
  }
}
