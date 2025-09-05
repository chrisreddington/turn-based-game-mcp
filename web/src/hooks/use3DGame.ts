/**
 * Custom hook for managing 3D game state and rendering
 */

import { useState, useEffect, useCallback } from 'react'
import type { GameSession, GameType, Difficulty, BaseGameState } from '@turn-based-mcp/shared'
import { detectWebGLCapabilities } from '../lib/3d/three-utils'
import type { WebGLCapabilities } from '../types/3d'

interface Use3DGameOptions {
  /** Game type */
  gameType: GameType
  /** Auto-create game on mount */
  autoCreate?: boolean
  /** Default player name */
  defaultPlayerName?: string
  /** Default AI difficulty */
  defaultDifficulty?: Difficulty
}

interface Use3DGameState<T extends BaseGameState = BaseGameState> {
  /** Current game session */
  gameSession: GameSession<T> | null
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** WebGL capabilities */
  webglCapabilities: WebGLCapabilities
  /** 3D rendering enabled */
  is3DEnabled: boolean
}

/**
 * Hook for managing 3D game state
 */
export function use3DGame(options: Use3DGameOptions) {
  const [state, setState] = useState<Use3DGameState>({
    gameSession: null,
    isLoading: false,
    error: null,
    webglCapabilities: { isSupported: false },
    is3DEnabled: false
  })

  // Check WebGL capabilities on mount
  useEffect(() => {
    const capabilities = detectWebGLCapabilities()
    setState(prev => ({
      ...prev,
      webglCapabilities: capabilities,
      is3DEnabled: capabilities.isSupported
    }))

    if (!capabilities.isSupported) {
      console.warn('WebGL not supported, 3D features will be disabled')
    }
  }, [])

  // Create a new game
  const createGame = useCallback(async (
    playerName: string = options.defaultPlayerName || 'Player',
    difficulty: Difficulty = options.defaultDifficulty || 'medium'
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/games/${options.gameType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, difficulty })
      })

      if (!response.ok) {
        throw new Error(`Failed to create game: ${response.statusText}`)
      }

      const gameSession = await response.json()
      setState(prev => ({
        ...prev,
        gameSession,
        isLoading: false
      }))

      return gameSession
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create game'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }))
      throw error
    }
  }, [options.gameType, options.defaultPlayerName, options.defaultDifficulty])

  // Load existing game
  const loadGame = useCallback(async (gameId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/games/${options.gameType}`)
      if (!response.ok) {
        throw new Error(`Failed to load games: ${response.statusText}`)
      }

      const games = await response.json()
      const gameSession = games.find((game: GameSession<BaseGameState>) => game.gameState.id === gameId)

      if (!gameSession) {
        throw new Error('Game not found')
      }

      setState(prev => ({
        ...prev,
        gameSession,
        isLoading: false
      }))

      return gameSession
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load game'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }))
      throw error
    }
  }, [options.gameType])

  // Make a move in the game
  const makeMove = useCallback(async (move: unknown, playerId: string = 'player1') => {
    if (!state.gameSession) {
      throw new Error('No active game session')
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/games/${options.gameType}/${state.gameSession.gameState.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move, playerId })
      })

      if (!response.ok) {
        throw new Error(`Failed to make move: ${response.statusText}`)
      }

      const updatedGameSession = await response.json()
      setState(prev => ({
        ...prev,
        gameSession: updatedGameSession,
        isLoading: false
      }))

      return updatedGameSession
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to make move'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }))
      throw error
    }
  }, [state.gameSession, options.gameType])

  // Reset game state
  const resetGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      gameSession: null,
      error: null
    }))
  }, [])

  // Request AI move (for testing or manual triggers)
  const requestAIMove = useCallback(async () => {
    if (!state.gameSession) {
      throw new Error('No active game session')
    }

    // This would typically be handled automatically by the MCP server
    // but we can provide manual trigger for testing
    console.log('AI move requested for game:', state.gameSession.gameState.id)
  }, [state.gameSession])

  // Auto-create game on mount if enabled
  useEffect(() => {
    if (options.autoCreate && state.is3DEnabled && !state.gameSession && !state.isLoading) {
      createGame().catch(console.error)
    }
  }, [options.autoCreate, state.is3DEnabled, state.gameSession, state.isLoading, createGame])

  return {
    // State
    gameSession: state.gameSession,
    isLoading: state.isLoading,
    error: state.error,
    webglCapabilities: state.webglCapabilities,
    is3DEnabled: state.is3DEnabled,
    
    // Actions
    createGame,
    loadGame,
    makeMove,
    resetGame,
    requestAIMove,
    
    // Helpers
    gameState: state.gameSession?.gameState || null,
    isPlayerTurn: state.gameSession?.gameState?.currentPlayerId === 'player1',
    isAITurn: state.gameSession?.gameState?.currentPlayerId === 'ai',
    isGameFinished: state.gameSession?.gameState?.status === 'finished'
  }
}