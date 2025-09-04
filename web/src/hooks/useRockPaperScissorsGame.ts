/**
 * Unified hook for managing rock-paper-scissors game state in both 2D and 3D modes
 */

import { useState, useEffect, useCallback } from 'react'
import type { 
  GameSession, 
  RPSGameState, 
  RPSMove, 
  Difficulty 
} from '@turn-based-mcp/shared'
import { detectWebGLCapabilities } from '../lib/3d/three-utils'

export type ViewMode = '2d' | '3d'

interface UseRockPaperScissorsGameOptions {
  /** Initial view mode */
  initialViewMode?: ViewMode
  /** Auto-create game on mount */
  autoCreate?: boolean
  /** Default player name */
  defaultPlayerName?: string
  /** Default AI difficulty */
  defaultDifficulty?: Difficulty
  /** Default max rounds */
  defaultMaxRounds?: number
  /** Auto-join game ID */
  autoJoinGameId?: string | null
}

interface UseRockPaperScissorsGameState {
  /** Current game session */
  gameSession: GameSession<RPSGameState> | null
  /** Available games list */
  availableGames: GameSession<RPSGameState>[]
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
 * Unified hook for managing rock-paper-scissors game state
 */
export function useRockPaperScissorsGame(options: UseRockPaperScissorsGameOptions = {}) {
  const {
    initialViewMode = '2d',
    autoCreate = false,
    defaultPlayerName = 'Player',
    defaultDifficulty = 'medium',
    defaultMaxRounds = 3,
    autoJoinGameId
  } = options

  const [state, setState] = useState<UseRockPaperScissorsGameState>({
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
      const gameState = state.gameSession.gameState
      const currentRoundIndex = gameState.currentRound
      const currentRound = gameState.rounds[currentRoundIndex]
      
      // Player's turn if:
      // 1. Game is playing
      // 2. Current round exists and player hasn't made a choice yet
      // 3. OR if we're waiting for a new round to start and it's player's turn
      const isPlayerTurn = gameState.status === 'playing' && (
        (currentRound && !currentRound.player1Choice) || // Player needs to make choice in current round
        (!currentRound && currentRoundIndex < gameState.maxRounds) // New round starting
      )
      
      setState(prev => ({ ...prev, isPlayerTurn }))
    } else {
      setState(prev => ({ ...prev, isPlayerTurn: false }))
    }
  }, [state.gameSession])

  // Load available games
  const loadAvailableGames = useCallback(async () => {
    try {
      const response = await fetch('/api/games/rock-paper-scissors')
      if (response.ok) {
        const games = await response.json()
        setState(prev => ({
          ...prev,
          availableGames: games.filter((game: GameSession<RPSGameState>) => 
            game.gameState.status === 'playing'
          )
        }))
      }
    } catch (error) {
      console.error('Error loading games:', error)
    }
  }, [])

  // Poll for game updates when game is active
  useEffect(() => {
    if (!state.gameSession || state.gameSession.gameState.status !== 'playing') {
      return
    }

    // Determine if we need to poll based on game state
    const gameState = state.gameSession.gameState
    const currentRoundIndex = gameState.currentRound
    const currentRound = gameState.rounds[currentRoundIndex]
    
    // Poll in these scenarios:
    // 1. AI's turn to make initial choice (no player1Choice yet)
    // 2. Player made a choice, waiting for AI response (player1Choice but no player2Choice)
    // 3. Both choices made but round not resolved yet
    const shouldPoll = (
      !currentRound?.player1Choice || // AI's turn first
      (currentRound?.player1Choice && !currentRound?.player2Choice) || // Waiting for AI response
      (currentRound?.player1Choice && currentRound?.player2Choice && !currentRound?.winner) // Round needs resolution
    )

    if (shouldPoll) {
      console.log('Starting game state polling...', {
        currentRound: currentRoundIndex,
        player1Choice: currentRound?.player1Choice,
        player2Choice: currentRound?.player2Choice,
        winner: currentRound?.winner
      })

      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/games/rock-paper-scissors')
          if (response.ok) {
            const games = await response.json()
            const updatedGame = games.find((g: GameSession<RPSGameState>) => 
              g.gameState.id === state.gameSession!.gameState.id
            )
            
            if (updatedGame && state.gameSession) {
              const hasUpdates = (
                updatedGame.gameState.updatedAt !== state.gameSession.gameState.updatedAt ||
                updatedGame.gameState.currentRound !== state.gameSession.gameState.currentRound ||
                JSON.stringify(updatedGame.gameState.rounds) !== JSON.stringify(state.gameSession.gameState.rounds) ||
                JSON.stringify(updatedGame.gameState.scores) !== JSON.stringify(state.gameSession.gameState.scores)
              )

              if (hasUpdates) {
                console.log('Game state updated, refreshing...', {
                  oldRound: state.gameSession.gameState.currentRound,
                  newRound: updatedGame.gameState.currentRound,
                  oldUpdatedAt: state.gameSession.gameState.updatedAt,
                  newUpdatedAt: updatedGame.gameState.updatedAt
                })
                setState(prev => ({ ...prev, gameSession: updatedGame }))
              }
            }
          }
        } catch (error) {
          console.error('Error polling for game updates:', error)
        }
      }, 2000) // Poll every 2 seconds for more responsive updates

      return () => {
        console.log('Stopping game state polling...')
        clearInterval(pollInterval)
      }
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
      createGame(defaultPlayerName, defaultDifficulty, defaultMaxRounds)
    }
  }, [autoCreate, state.gameSession, state.isLoading, state.is3DSupported, defaultPlayerName, defaultDifficulty, defaultMaxRounds])

  // Create a new game
  const createGame = useCallback(async (
    playerName: string = defaultPlayerName,
    difficulty: Difficulty = defaultDifficulty,
    maxRounds: number = defaultMaxRounds,
    customGameId?: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const body: {
        playerName: string
        difficulty: Difficulty
        maxRounds: number
        gameId?: string
      } = { 
        playerName,
        difficulty,
        maxRounds
      }
      if (customGameId) {
        body.gameId = customGameId
      }

      const response = await fetch('/api/games/rock-paper-scissors', {
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
  }, [defaultPlayerName, defaultDifficulty, defaultMaxRounds, loadAvailableGames])

  // Join an existing game
  const joinGame = useCallback(async (gameId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/games/rock-paper-scissors')
      if (!response.ok) {
        throw new Error('Failed to load games')
      }

      const games = await response.json()
      const gameToJoin = games.find((game: GameSession<RPSGameState>) => 
        game.gameState.id === gameId
      )

      if (!gameToJoin) {
        throw new Error('Game not found')
      }

      setState(prev => ({ ...prev, gameSession: gameToJoin, isLoading: false }))
      return gameToJoin
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join game'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [])

  // Make a move
  const makeMove = useCallback(async (move: RPSMove) => {
    if (!state.gameSession || !state.isPlayerTurn) {
      throw new Error('Cannot make move at this time')
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/games/rock-paper-scissors/${state.gameSession.gameState.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move, playerId: 'player1' })
      })

      if (!response.ok) {
        throw new Error('Failed to make move')
      }

      const updatedGameSession = await response.json()
      setState(prev => ({ ...prev, gameSession: updatedGameSession, isLoading: false }))
      return updatedGameSession
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to make move'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [state.gameSession, state.isPlayerTurn])

  // Delete a game
  const deleteGame = useCallback(async (gameId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/games/rock-paper-scissors/${gameId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete game')
      }

      // If we're deleting the current game, clear the session
      if (state.gameSession?.gameState.id === gameId) {
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

  // Reset/restart the current game
  const resetGame = useCallback(() => {
    setState(prev => ({ ...prev, gameSession: null, error: null }))
  }, [])

  // Set view mode
  const setViewMode = useCallback((mode: ViewMode) => {
    if (mode === '3d' && !state.is3DSupported) {
      setState(prev => ({ ...prev, error: '3D mode is not supported on this device' }))
      return
    }
    setState(prev => ({ ...prev, viewMode: mode }))
  }, [state.is3DSupported])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Get current game state
  const gameState = state.gameSession?.gameState || null

  return {
    // State
    gameSession: state.gameSession,
    availableGames: state.availableGames,
    isLoading: state.isLoading,
    error: state.error,
    viewMode: state.viewMode,
    is3DSupported: state.is3DSupported,
    isPlayerTurn: state.isPlayerTurn,
    gameState,

    // Actions
    createGame,
    joinGame,
    makeMove,
    deleteGame,
    resetGame,
    setViewMode,
    clearError,
    loadAvailableGames
  }
}
