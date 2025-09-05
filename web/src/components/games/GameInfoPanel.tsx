'use client'

import type { BaseGameState, Difficulty, RPSGameState, RPSChoice } from '@turn-based-mcp/shared'
import { DifficultyBadge } from '../shared'

/**
 * Type guard to check if a game state is an RPS game state
 */
function isRPSGame(gameState: BaseGameState): gameState is RPSGameState {
  return 'rounds' in gameState && 'currentRound' in gameState && 'maxRounds' in gameState
}

/**
 * Get the emoji representation for an RPS choice
 */
function getChoiceEmoji(choice: RPSChoice): string {
  const choiceEmojis: Record<RPSChoice, string> = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️'
  }
  return choiceEmojis[choice]
}

/**
 * Props for the GameInfoPanel component
 */
interface GameInfoPanelProps {
  /** Current game state */
  gameState: BaseGameState
  /** AI difficulty level */
  aiDifficulty?: Difficulty
  /** Additional CSS classes */
  className?: string
}

/**
 * Unified game information panel component
 * 
 * Consolidates game status, player turn, and critical information like Game ID
 * into a single, well-organized component. Reduces duplication while ensuring
 * the Game ID is prominently displayed for MCP server integration.
 * 
 * @param props - Component props
 * @returns JSX element representing the unified game info
 */
export function GameInfoPanel({ 
  gameState, 
  aiDifficulty,
  className = '' 
}: GameInfoPanelProps) {
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId)
  const isGameActive = gameState.status === 'playing'
  
  return (
    <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 9h-2V7a1 1 0 00-2 0v2H7a1 1 0 000 2h2v2a1 1 0 002 0v-2h2a1 1 0 000-2z"/>
            <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Game Information
        </h3>
      </div>
      
      <div className="space-y-4">
        {/* Game ID - Prominently displayed for MCP integration */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4">
          <div className="flex flex-col space-y-2">
            <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">Game ID:</span>
            <code className="text-blue-800 dark:text-blue-200 font-mono text-xs bg-white/80 dark:bg-slate-800/80 px-3 py-2 rounded-lg break-all">
              {gameState.id}
            </code>
          </div>
        </div>
        
        {/* Current Turn - Clear visual indicator */}
        {isGameActive && (
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Current Turn:</span>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                {currentPlayer?.isAI ? `🤖 ${currentPlayer.name}` : currentPlayer?.name || 'Unknown'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                Active
              </span>
            </div>
          </div>
        )}
        
        {/* Game Status */}
        <div className="flex justify-between items-center py-2">
          <span className="text-slate-600 dark:text-slate-300 font-medium">Status:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {gameState.status === 'playing' ? '🎮 Playing' : '🏁 Finished'}
          </span>
        </div>
        
        {/* Players */}
        <div className="flex justify-between items-center py-2">
          <span className="text-slate-600 dark:text-slate-300 font-medium">Players:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {gameState.players.map(p => p.name).join(' vs ')}
          </span>
        </div>
        
        {/* AI Difficulty */}
        {aiDifficulty && (
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600 dark:text-slate-300 font-medium">AI Difficulty:</span>
            <DifficultyBadge difficulty={aiDifficulty} />
          </div>
        )}
        
        {/* Winner Information */}
        {gameState.winner && (
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Winner:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {gameState.winner === 'draw' 
                ? '🤝 Draw' 
                : `🏆 ${gameState.players.find(p => p.id === gameState.winner)?.name || 'Unknown'}`
              }
            </span>
          </div>
        )}
        
        {/* Round History for RPS Games */}
        {isRPSGame(gameState) && gameState.currentRound > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>Round History</span>
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {gameState.rounds.slice(0, gameState.currentRound).map((round, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-600 dark:text-slate-400">R{index + 1}:</span>
                    <div className="flex items-center space-x-1">
                      <span title={`You chose ${round.player1Choice}`}>
                        {getChoiceEmoji(round.player1Choice!)}
                      </span>
                      <span className="text-slate-400">vs</span>
                      <span title={`AI chose ${round.player2Choice}`}>
                        {getChoiceEmoji(round.player2Choice!)}
                      </span>
                    </div>
                  </div>
                  <div className="font-semibold">
                    {round.winner === 'draw' ? '🤝' :
                     round.winner === 'player1' ? '🎉' : '🤖'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Game Timestamp */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Started: {new Date(gameState.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}