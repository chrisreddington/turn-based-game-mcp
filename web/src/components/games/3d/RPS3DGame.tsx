/**
 * 3D Rock-Paper-Scissors game component
 */

'use client'

import { useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import type { RPSGameState, RPSMove } from '@turn-based-mcp/shared'
import { Game3DContainer } from './Game3DContainer'
import { Materials } from '../../../lib/3d/three-utils'

interface RPS3DGameProps {
  /** Current game state */
  gameState: RPSGameState | null
  /** Move handler */
  onMove?: (move: RPSMove) => void
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Game control handlers */
  onReset?: () => void
  onNewGame?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * 3D Rock-Paper-Scissors game with animated hands
 */
export function RPS3DGame({
  gameState,
  onMove,
  isLoading = false,
  error = null,
  onReset,
  onNewGame,
  className = ''
}: RPS3DGameProps) {
  const sceneRef = useRef<THREE.Scene | null>(null)
  const gameGroupRef = useRef<THREE.Group | null>(null)
  const playerHandRef = useRef<THREE.Group | null>(null)
  const aiHandRef = useRef<THREE.Group | null>(null)
  const [aiChoice, setAIChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [playerChoice, setPlayerChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null)

  // Create hand geometry for different poses
  const createHandGeometry = useCallback((pose: 'rock' | 'paper' | 'scissors') => {
    const handGroup = new THREE.Group()

    switch (pose) {
      case 'rock': {
        // Create a fist shape
        const fistGeometry = new THREE.SphereGeometry(0.5, 16, 12)
        const fistMesh = new THREE.Mesh(fistGeometry, Materials.colored('#D2B48C'))
        handGroup.add(fistMesh)
        break
      }

      case 'paper': {
        // Create a flat hand shape
        const palmGeometry = new THREE.BoxGeometry(0.8, 0.1, 1.2)
        const palmMesh = new THREE.Mesh(palmGeometry, Materials.colored('#D2B48C'))
        handGroup.add(palmMesh)
        
        // Add fingers
        for (let i = 0; i < 5; i++) {
          const fingerGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6)
          const fingerMesh = new THREE.Mesh(fingerGeometry, Materials.colored('#D2B48C'))
          fingerMesh.position.x = (i - 2) * 0.15
          fingerMesh.position.y = 0.35
          fingerMesh.rotation.z = Math.PI / 2
          handGroup.add(fingerMesh)
        }
        break
      }

      case 'scissors': {
        // Create scissors shape with two extended fingers
        const baseGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.8)
        const baseMesh = new THREE.Mesh(baseGeometry, Materials.colored('#D2B48C'))
        handGroup.add(baseMesh)
        
        // Index finger
        const finger1Geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8)
        const finger1Mesh = new THREE.Mesh(finger1Geometry, Materials.colored('#D2B48C'))
        finger1Mesh.position.x = -0.1
        finger1Mesh.position.y = 0.4
        finger1Mesh.rotation.z = Math.PI / 2
        finger1Mesh.rotation.y = -0.2
        handGroup.add(finger1Mesh)
        
        // Middle finger
        const finger2Geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8)
        const finger2Mesh = new THREE.Mesh(finger2Geometry, Materials.colored('#D2B48C'))
        finger2Mesh.position.x = 0.1
        finger2Mesh.position.y = 0.4
        finger2Mesh.rotation.z = Math.PI / 2
        finger2Mesh.rotation.y = 0.2
        handGroup.add(finger2Mesh)
        break
      }
    }

    handGroup.castShadow = true
    return handGroup
  }, [])

  // Initialize 3D game scene
  const initializeGame = useCallback((scene: THREE.Scene) => {
    // Clear existing game
    if (gameGroupRef.current) {
      scene.remove(gameGroupRef.current)
    }

    const gameGroup = new THREE.Group()
    gameGroupRef.current = gameGroup

    // Create arena platform
    const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.2, 32)
    const platformMaterial = Materials.board('#4A4A4A')
    const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial)
    platformMesh.position.y = -0.1
    platformMesh.receiveShadow = true
    gameGroup.add(platformMesh)

    // Create player hand area
    const playerHand = new THREE.Group()
    playerHand.position.set(-1.5, 0.5, 0)
    playerHandRef.current = playerHand
    gameGroup.add(playerHand)

    // Create AI hand area
    const aiHand = new THREE.Group()
    aiHand.position.set(1.5, 0.5, 0)
    aiHandRef.current = aiHand
    gameGroup.add(aiHand)

    // Add VS text in the middle
    const textGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.8)
    const textMaterial = Materials.glowing('#FFD700', 0.3)
    const textMesh = new THREE.Mesh(textGeometry, textMaterial)
    textMesh.position.y = 1
    gameGroup.add(textMesh)

    scene.add(gameGroup)
    sceneRef.current = scene
  }, [])

  // Animate AI cycling through choices
  const animateAICycling = useCallback(() => {
    if (!aiHandRef.current) return

    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors']
    let currentIndex = 0

    const cycleInterval = setInterval(() => {
      if (!aiHandRef.current || isCountingDown) {
        clearInterval(cycleInterval)
        return
      }

      // Clear previous hand
      aiHandRef.current.clear()
      
      // Add new cycling hand
      const aiHand = createHandGeometry(choices[currentIndex])
      aiHand.rotation.y = -Math.PI / 4
      
      // Add slight glow to show it's cycling
      aiHand.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.material = Materials.transparent('#87CEEB', 0.8)
        }
      })
      
      aiHandRef.current.add(aiHand)
      currentIndex = (currentIndex + 1) % choices.length
    }, 500)

    return () => clearInterval(cycleInterval)
  }, [isCountingDown, createHandGeometry])

  // Update hands based on game state
  const updateHands = useCallback(() => {
    if (!gameState || !playerHandRef.current || !aiHandRef.current) return

    // Get current round
    const currentRound = gameState.rounds[gameState.rounds.length - 1]
    
    if (currentRound) {
      // Update player hand
      if (currentRound.player1Choice && playerChoice !== currentRound.player1Choice) {
        // Clear previous hand
        playerHandRef.current.clear()
        
        // Add new hand
        const playerHand = createHandGeometry(currentRound.player1Choice)
        playerHand.rotation.y = Math.PI / 4
        playerHandRef.current.add(playerHand)
        setPlayerChoice(currentRound.player1Choice)
      }

      // Update AI hand
      if (currentRound.player2Choice && aiChoice !== currentRound.player2Choice) {
        // Clear previous hand
        aiHandRef.current.clear()
        
        // Add new hand
        const aiHandMesh = createHandGeometry(currentRound.player2Choice)
        aiHandMesh.rotation.y = -Math.PI / 4
        aiHandRef.current.add(aiHandMesh)
        setAIChoice(currentRound.player2Choice)
      }

      // If round is complete, animate reveal
      if (currentRound.player1Choice && currentRound.player2Choice && currentRound.winner) {
        // Add winner effects
        setTimeout(() => {
          if (currentRound.winner === 'player1' && playerHandRef.current) {
            // Player wins - glow effect
            playerHandRef.current.children.forEach(child => {
              if (child instanceof THREE.Mesh) {
                child.material = Materials.glowing('#00FF00', 0.5)
              }
            })
          } else if (currentRound.winner === 'ai' && aiHandRef.current) {
            // AI wins - glow effect
            aiHandRef.current.children.forEach(child => {
              if (child instanceof THREE.Mesh) {
                child.material = Materials.glowing('#FF0000', 0.5)
              }
            })
          }
        }, 500)
      }
    } else {
      // No current round - show default neutral poses or cycling animation for AI
      if (gameState.status === 'playing') {
        // Start AI cycling animation
        if (!aiHandRef.current.children.length) {
          animateAICycling()
        }
      }
    }
  }, [gameState, aiChoice, playerChoice, createHandGeometry, animateAICycling])

  // Handle choice selection
  const handleChoiceSelect = useCallback((choice: 'rock' | 'paper' | 'scissors') => {
    if (!onMove || gameState?.status !== 'playing') return

    setPlayerChoice(choice)
    setIsCountingDown(true)

    // Start countdown animation
    setTimeout(() => {
      onMove({ choice })
      setIsCountingDown(false)
    }, 2000) // 2 second countdown
  }, [onMove, gameState])

  // Render function for the 3D scene
  const handleRender = useCallback((scene: THREE.Scene, _camera: THREE.Camera) => {
    // Initialize game if not done
    if (!gameGroupRef.current) {
      initializeGame(scene)
    }

    // Update hands when game state changes
    updateHands()
  }, [initializeGame, updateHands])

  // Get game info for HUD
  const currentRound = gameState?.rounds[gameState.rounds.length - 1]
  const playerScore = gameState?.scores.player1 || 0
  const aiScore = gameState?.scores.ai || 0

  const playerInfo = gameState ? {
    name: gameState.players.find(p => p.id === 'player1')?.name || 'Player',
    symbol: '👤',
    score: playerScore
  } : undefined

  const aiInfo = gameState ? {
    name: gameState.players.find(p => p.id === 'ai')?.name || 'AI',
    symbol: '🤖',
    score: aiScore,
    difficulty: 'Medium' // Could get from game session
  } : undefined

  return (
    <div className={className}>
      <Game3DContainer
        title="3D Rock Paper Scissors"
        gameState={gameState || undefined}
        playerInfo={playerInfo}
        aiInfo={aiInfo}
        isLoading={isLoading}
        error={error}
        onRender={handleRender}
        onReset={onReset}
        onNewGame={onNewGame}
        sceneConfig={{
          enableShadows: true,
          background: '#2a1810'
        }}
        cameraConfig={{
          enableZoom: true,
          enablePan: true,
          enableRotate: true,
          autoRotate: false,
          minDistance: 4,
          maxDistance: 12
        }}
      >
        {/* Choice selector overlay */}
        {gameState?.status === 'playing' && !currentRound?.player1Choice && (
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold text-center mb-4">Choose Your Move</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handleChoiceSelect('rock')}
                disabled={isCountingDown}
                className="flex flex-col items-center p-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 rounded-lg transition-colors duration-200"
              >
                <span className="text-3xl mb-2">✊</span>
                <span className="text-sm font-medium">Rock</span>
              </button>
              <button
                onClick={() => handleChoiceSelect('paper')}
                disabled={isCountingDown}
                className="flex flex-col items-center p-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 rounded-lg transition-colors duration-200"
              >
                <span className="text-3xl mb-2">✋</span>
                <span className="text-sm font-medium">Paper</span>
              </button>
              <button
                onClick={() => handleChoiceSelect('scissors')}
                disabled={isCountingDown}
                className="flex flex-col items-center p-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 rounded-lg transition-colors duration-200"
              >
                <span className="text-3xl mb-2">✌️</span>
                <span className="text-sm font-medium">Scissors</span>
              </button>
            </div>
            {isCountingDown && (
              <div className="text-center mt-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-sm text-blue-400">Revealing choices...</span>
              </div>
            )}
          </div>
        )}

        {/* Round result display */}
        {currentRound?.winner && (
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 text-white text-center">
            <h3 className="text-lg font-bold mb-2">Round Result</h3>
            <div className="flex justify-center space-x-8 mb-4">
              <div className="text-center">
                <div className="text-2xl mb-1">
                  {currentRound.player1Choice === 'rock' ? '✊' :
                   currentRound.player1Choice === 'paper' ? '✋' : '✌️'}
                </div>
                <div className="text-sm">You</div>
              </div>
              <div className="text-2xl">vs</div>
              <div className="text-center">
                <div className="text-2xl mb-1">
                  {currentRound.player2Choice === 'rock' ? '✊' :
                   currentRound.player2Choice === 'paper' ? '✋' : '✌️'}
                </div>
                <div className="text-sm">AI</div>
              </div>
            </div>
            <div className={`text-lg font-bold ${
              currentRound.winner === 'player1' ? 'text-green-400' :
              currentRound.winner === 'ai' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
              {currentRound.winner === 'player1' ? 'You Win!' :
               currentRound.winner === 'ai' ? 'AI Wins!' :
               'Draw!'}
            </div>
          </div>
        )}
      </Game3DContainer>
    </div>
  )
}