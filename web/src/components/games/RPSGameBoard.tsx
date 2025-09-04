'use client'

import { useState, useEffect } from 'react'
import type { RPSGameState, RPSMove, RPSChoice } from '@turn-based-mcp/shared'

interface RPSGameBoardProps {
  gameState: RPSGameState
  onMove: (move: RPSMove) => void
  disabled?: boolean
}

const choiceEmojis: Record<RPSChoice, string> = {
  rock: '🪨',
  paper: '📄', 
  scissors: '✂️'
}

const choiceNames: Record<RPSChoice, string> = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors'
}

export function RPSGameBoard({ gameState, onMove, disabled }: RPSGameBoardProps) {
  const [showAIChoice, setShowAIChoice] = useState(false)
  const [showRoundResult, setShowRoundResult] = useState(false)
  const [aiJustSelected, setAIJustSelected] = useState<RPSChoice | null>(null)
  
  const currentRound = gameState.rounds[gameState.currentRound] || {}
  const canMakeMove = !disabled && 
                     gameState.status === 'playing' && 
                     gameState.currentRound < gameState.maxRounds &&
                     gameState.currentPlayerId === 'player1' &&
                     !currentRound.player1Choice

  // Effect to handle AI choice reveal sequence
  useEffect(() => {
    if (!gameState) return
    
    const currentRoundData = gameState.rounds[gameState.currentRound] || {}
    
    // Check if AI just made a move (round is complete)
    if (currentRoundData.player1Choice && currentRoundData.player2Choice && currentRoundData.winner) {
      // If we haven't shown the AI choice yet, start the sequence
      if (!showAIChoice && currentRoundData.player2Choice !== aiJustSelected) {
        setAIJustSelected(currentRoundData.player2Choice)
        setShowAIChoice(true)
        setShowRoundResult(false)
        
        // Show AI choice for 2 seconds, then show round result
        setTimeout(() => {
          setShowRoundResult(true)
        }, 2000)
        
        // Hide AI choice highlight after 3 seconds total
        setTimeout(() => {
          setShowAIChoice(false)
        }, 3000)
      }
    } else {
      // Reset states when starting a new round or if round isn't complete
      if (!currentRoundData.player1Choice || !currentRoundData.player2Choice) {
        setShowAIChoice(false)
        setShowRoundResult(false)
        setAIJustSelected(null)
      }
    }
  }, [gameState, gameState?.currentRound, aiJustSelected, showAIChoice])

  const handleChoiceClick = (choice: RPSChoice) => {
    if (!canMakeMove) return
    onMove({ choice })
  }

  const renderChoiceButton = (choice: RPSChoice) => {
    const isSelected = currentRound.player1Choice === choice
    
    let classes = 'flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all duration-200 min-h-32 '
    classes += 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 '
    
    if (canMakeMove) {
      classes += 'hover:border-blue-500 hover:scale-105 hover:shadow-md cursor-pointer '
    } else {
      classes += 'cursor-not-allowed opacity-75 '
    }
    
    if (isSelected) {
      classes += 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 '
    }
    
    return (
      <button
        key={choice}
        onClick={() => handleChoiceClick(choice)}
        disabled={!canMakeMove}
        className={classes}
      >
        <div className="text-4xl mb-2">{choiceEmojis[choice]}</div>
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {choiceNames[choice]}
        </div>
      </button>
    )
  }

  const renderRoundHistory = () => {
    if (gameState.currentRound === 0) return null

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Round History
        </h3>
        <div className="space-y-2">
          {gameState.rounds.slice(0, gameState.currentRound).map((round, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-sm">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Round {index + 1}:</span>
                <div className="flex items-center space-x-2">
                  <span>{choiceEmojis[round.player1Choice!]} You</span>
                  <span className="text-gray-400">vs</span>
                  <span>AI {choiceEmojis[round.player2Choice!]}</span>
                </div>
              </div>
              <div className="font-semibold">
                {round.winner === 'draw' ? '🤝 Draw' :
                 round.winner === 'player1' ? '🎉 You Win!' : '🤖 AI Wins'}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 relative">
      {disabled && gameState.currentPlayerId === 'ai' && gameState.status === 'playing' && (
        <div className="absolute inset-0 bg-blue-500/10 rounded-lg flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              🤖 AI&apos;s Turn - Choices Locked
            </p>
          </div>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {gameState.status === 'finished' ? 
            `Game Complete (${gameState.currentRound} of ${gameState.maxRounds} rounds played)` :
            `Round ${gameState.currentRound + 1} of ${gameState.maxRounds}`
          }
        </h2>
        
        {gameState.status === 'playing' && (
          <p className="text-gray-600 dark:text-gray-300">
            {showAIChoice ? 'AI is revealing its choice...' :
             canMakeMove ? 'Choose your move!' : 
             currentRound.player1Choice ? 'Waiting for AI...' : 'Waiting...'}
          </p>
        )}
        
        {gameState.status === 'finished' && (
          <p className="text-lg font-semibold">
            {gameState.winner === 'player1' && '🎉 You won the match!'}
            {gameState.winner === 'ai' && '🤖 AI won the match!'}
            {gameState.winner === 'draw' && '🤝 The match is a draw!'}
          </p>
        )}
      </div>

      {/* AI Choice Reveal Display */}
      {showAIChoice && aiJustSelected && currentRound.player1Choice && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-300">AI Selected!</h3>
            </div>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center opacity-60">
                <div className="text-3xl mb-2">{choiceEmojis[currentRound.player1Choice]}</div>
                <div className="font-medium text-gray-600 dark:text-gray-400">You</div>
              </div>
              <div className="text-2xl text-gray-400">vs</div>
              <div className="text-center">
                <div className="text-3xl mb-2 animate-bounce">{choiceEmojis[aiJustSelected]}</div>
                <div className="font-medium text-yellow-700 dark:text-yellow-300">AI chose {choiceNames[aiJustSelected]}!</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Round Result Display */}
      {showRoundResult && currentRound.player1Choice && currentRound.player2Choice && currentRound.winner && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="text-3xl mb-2">{choiceEmojis[currentRound.player1Choice]}</div>
              <div className="font-medium">You</div>
            </div>
            <div className="text-2xl">vs</div>
            <div className="text-center">
              <div className="text-3xl mb-2">{choiceEmojis[currentRound.player2Choice]}</div>
              <div className="font-medium">AI</div>
            </div>
          </div>
          <div className={`text-center mt-3 font-semibold text-lg ${
            currentRound.winner === 'player1' ? 'text-green-600 dark:text-green-400' :
            currentRound.winner === 'ai' ? 'text-red-600 dark:text-red-400' :
            'text-yellow-600 dark:text-yellow-400'
          }`}>
            {currentRound.winner === 'draw' ? '🤝 Draw!' :
             currentRound.winner === 'player1' ? '🎉 You win this round!' : '🤖 AI wins this round!'}
          </div>
        </div>
      )}

      {/* Classic Round Display (fallback for completed rounds in history) */}
      {!showAIChoice && !showRoundResult && currentRound.player1Choice && currentRound.player2Choice && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="text-3xl mb-2">{choiceEmojis[currentRound.player1Choice]}</div>
              <div className="font-medium">You</div>
            </div>
            <div className="text-2xl">vs</div>
            <div className="text-center">
              <div className="text-3xl mb-2">{choiceEmojis[currentRound.player2Choice]}</div>
              <div className="font-medium">AI</div>
            </div>
          </div>
          <div className="text-center mt-3 font-semibold">
            {currentRound.winner === 'draw' ? 'Draw!' :
             currentRound.winner === 'player1' ? 'You win this round!' : 'AI wins this round!'}
          </div>
        </div>
      )}

      {/* Choice buttons */}
      {gameState.status === 'playing' && gameState.currentRound < gameState.maxRounds && (
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {(['rock', 'paper', 'scissors'] as RPSChoice[]).map(renderChoiceButton)}
        </div>
      )}

      {renderRoundHistory()}
    </div>
  )
}
