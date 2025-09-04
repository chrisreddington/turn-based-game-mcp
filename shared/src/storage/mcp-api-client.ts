import type { GameSession, Player } from '../types/game'
import type { TicTacToeGameState, RPSGameState, TicTacToeMove, RPSMove } from '../types/games'
import { httpGet, httpPost, WEB_API_BASE } from '../utils/http-client'

// MCP-specific API functions that make HTTP calls to web app
export async function getTicTacToeGameForMCP(gameId: string): Promise<GameSession<TicTacToeGameState> | undefined> {
  try {
    // Get all games and find the one we want
    const games = await httpGet<GameSession<TicTacToeGameState>[]>(`${WEB_API_BASE}/api/games/tic-tac-toe`)
    return games.find((game: GameSession<TicTacToeGameState>) => game.gameState?.id === gameId)
  } catch (error) {
    console.error('Error fetching tic-tac-toe game via API:', error)
    return undefined
  }
}

export async function createTicTacToeGameForMCP(players: Player[]): Promise<GameSession<TicTacToeGameState>> {
  try {
    const playerName = players.find(p => !p.isAI)?.name || 'Player'
    return await httpPost(`${WEB_API_BASE}/api/games/tic-tac-toe`, { playerName })
  } catch (error) {
    console.error('Error creating tic-tac-toe game via API:', error)
    throw error
  }
}

export async function makeTicTacToeMove(gameId: string, move: TicTacToeMove, playerId: string): Promise<GameSession<TicTacToeGameState>> {
  try {
    return await httpPost(`${WEB_API_BASE}/api/games/tic-tac-toe/${gameId}/move`, { move, playerId })
  } catch (error) {
    console.error('Error making tic-tac-toe move via API:', error)
    throw error
  }
}

export async function getRPSGameForMCP(gameId: string): Promise<GameSession<RPSGameState> | undefined> {
  try {
    const games = await httpGet<GameSession<RPSGameState>[]>(`${WEB_API_BASE}/api/games/rock-paper-scissors/mcp`)
    return games.find((game: GameSession<RPSGameState>) => game.gameState?.id === gameId)
  } catch (error) {
    console.error('Error fetching RPS game via API:', error)
    return undefined
  }
}

export async function makeRPSMove(gameId: string, move: RPSMove, playerId: string): Promise<GameSession<RPSGameState>> {
  try {
    return await httpPost(`${WEB_API_BASE}/api/games/rock-paper-scissors/${gameId}/move`, { move, playerId })
  } catch (error) {
    console.error('Error making RPS move via API:', error)
    throw error
  }
}
