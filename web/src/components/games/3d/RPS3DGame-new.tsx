/**
 * 3D Rock-Paper-Scissors game component with enhanced 3D models and interactions
 */

'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import * as THREE from 'three'
import type { RPSGameState, RPSMove } from '@turn-based-mcp/shared'
import { Game3DContainer } from './Game3DContainer'
import { Materials } from '../../../lib/3d/three-utils'
import { RPSModels } from '../../../lib/3d/rps-models'
import { Mini3DModel } from './Mini3DModel'
import { createMouseInteraction, type MouseInteraction } from '../../../lib/3d/mouse-interaction'

interface RPS3DGameProps {
  gameState: RPSGameState | null
  onMove: (move: RPSMove) => void
  isLoading?: boolean
  error?: string | null
  onReset?: () => void
  onNewGame?: () => void
  className?: string
}

/**
 * 3D Rock-Paper-Scissors game with enhanced models and click interaction
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
  const playerChoicesRef = useRef<THREE.Group | null>(null)
  const aiChoicesRef = useRef<THREE.Group | null>(null)
  const mouseInteractionRef = useRef<MouseInteraction | null>(null)
  
  const [aiChoice, setAIChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [playerChoice, setPlayerChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null)
  const [hoveredChoice, setHoveredChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null)
  const [aiCycleIndex, setAICycleIndex] = useState(0)

  // Create hand geometry for different poses using enhanced models
  const createHandGeometry = useCallback((pose: 'rock' | 'paper' | 'scissors') => {
    switch (pose) {
      case 'rock':
        return RPSModels.createRock()
      case 'paper':
        return RPSModels.createPaper()
      case 'scissors':
        return RPSModels.createScissors()
    }
  }, [])

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

  // Create text texture for labels
  const createTextTexture = useCallback((text: string, size: number, color: string): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 256
    canvas.height = 64
    
    context.fillStyle = color
    context.font = `${size}px Arial`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text, canvas.width / 2, canvas.height / 2)
    
    return canvas
  }, [])

  // Setup player choice models (interactable)
  const setupPlayerChoiceModels = useCallback(() => {
    if (!playerChoicesRef.current) return

    // Clear existing models
    playerChoicesRef.current.clear()

    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors']
    const selectableObjects: THREE.Object3D[] = []

    choices.forEach((choice, index) => {
      let model: THREE.Group
      switch (choice) {
        case 'rock':
          model = RPSModels.createRock(0.6)
          break
        case 'paper':
          model = RPSModels.createPaper(0.6)
          break
        case 'scissors':
          model = RPSModels.createScissors(0.6)
          break
      }

      // Position models in a horizontal line
      model.position.x = (index - 1) * 1.2
      model.position.y = 0
      model.userData = { choice, type: 'player-choice' }
      model.name = `player-choice-${choice}`
      
      // Add selection highlight
      RPSModels.addGlowEffect(model, '#4A90E2', 0.2)
      
      playerChoicesRef.current!.add(model)
      selectableObjects.push(model)

      // Add floating label
      const labelGeometry = new THREE.PlaneGeometry(0.6, 0.2)
      const labelTexture = new THREE.CanvasTexture(createTextTexture(choice.toUpperCase(), 64, '#FFFFFF'))
      const labelMaterial = new THREE.MeshBasicMaterial({ 
        map: labelTexture, 
        transparent: true,
        alphaTest: 0.1
      })
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial)
      labelMesh.position.copy(model.position)
      labelMesh.position.y += 0.8
      labelMesh.lookAt(0, labelMesh.position.y, -5) // Face the camera
      playerChoicesRef.current!.add(labelMesh)
    })

    return selectableObjects
  }, [createTextTexture])

  // Setup AI choice models (all 3 visible with cycling lighting)
  const setupAIChoiceModels = useCallback(() => {
    if (!aiChoicesRef.current) return

    // Clear existing models
    aiChoicesRef.current.clear()

    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors']

    choices.forEach((choice, index) => {
      let model: THREE.Group
      switch (choice) {
        case 'rock':
          model = RPSModels.createRock(0.6)
          break
        case 'paper':
          model = RPSModels.createPaper(0.6)
          break
        case 'scissors':
          model = RPSModels.createScissors(0.6)
          break
      }

      // Position models in a horizontal line
      model.position.x = (index - 1) * 1.2
      model.position.y = 0
      model.userData = { choice, type: 'ai-choice' }
      model.name = `ai-choice-${choice}`
      
      aiChoicesRef.current!.add(model)

      // Add floating label
      const labelGeometry = new THREE.PlaneGeometry(0.6, 0.2)
      const labelTexture = new THREE.CanvasTexture(createTextTexture(choice.toUpperCase(), 64, '#FFFFFF'))
      const labelMaterial = new THREE.MeshBasicMaterial({ 
        map: labelTexture, 
        transparent: true,
        alphaTest: 0.1
      })
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial)
      labelMesh.position.copy(model.position)
      labelMesh.position.y += 0.8
      labelMesh.lookAt(0, labelMesh.position.y, -5) // Face the camera
      aiChoicesRef.current!.add(labelMesh)
    })
  }, [createTextTexture])

  // Setup mouse interaction for player choices
  const setupMouseInteraction = useCallback((selectableObjects: THREE.Object3D[], container: HTMLElement, camera: THREE.Camera, scene: THREE.Scene) => {
    // Dispose existing mouse interaction
    if (mouseInteractionRef.current) {
      mouseInteractionRef.current.dispose()
    }

    // Create new mouse interaction
    mouseInteractionRef.current = createMouseInteraction({
      camera,
      scene,
      container,
      selectableObjects,
      onHover: (object, point) => {
        if (object?.userData?.choice) {
          setHoveredChoice(object.userData.choice)
          // Add stronger glow on hover
          RPSModels.addGlowEffect(object as THREE.Group, '#66FF66', 0.5)
        } else {
          // Reset glow for all objects
          selectableObjects.forEach(obj => {
            if (obj.userData.choice !== hoveredChoice) {
              RPSModels.addGlowEffect(obj as THREE.Group, '#4A90E2', 0.2)
            }
          })
          setHoveredChoice(null)
        }
      },
      onClick: (object, point) => {
        if (object?.userData?.choice && object.userData.type === 'player-choice') {
          handleChoiceSelect(object.userData.choice)
        }
      }
    })
  }, [hoveredChoice, handleChoiceSelect])

  // Initialize 3D game scene
  const initializeGame = useCallback((scene: THREE.Scene) => {
    // Clear existing game
    if (gameGroupRef.current) {
      scene.remove(gameGroupRef.current)
    }

    const gameGroup = new THREE.Group()
    gameGroupRef.current = gameGroup

    // Create arena platform
    const platformGeometry = new THREE.CylinderGeometry(4, 4, 0.2, 32)
    const platformMaterial = Materials.board('#4A4A4A')
    const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial)
    platformMesh.position.y = -0.1
    platformMesh.receiveShadow = true
    gameGroup.add(platformMesh)

    // Create player hand area (center-left)
    const playerHand = new THREE.Group()
    playerHand.position.set(-2, 0.5, 0)
    playerHandRef.current = playerHand
    gameGroup.add(playerHand)

    // Create AI hand area (center-right)
    const aiHand = new THREE.Group()
    aiHand.position.set(2, 0.5, 0)
    aiHandRef.current = aiHand
    gameGroup.add(aiHand)

    // Create player choice models area (front-left, closer to camera)
    const playerChoices = new THREE.Group()
    playerChoices.position.set(-2, 0.8, -2)
    playerChoicesRef.current = playerChoices
    gameGroup.add(playerChoices)

    // Create AI choice models area (front-right)
    const aiChoices = new THREE.Group()
    aiChoices.position.set(2, 0.8, -2)
    aiChoicesRef.current = aiChoices
    gameGroup.add(aiChoices)

    // Add VS text in the middle
    const textGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.8)
    const textMaterial = Materials.glowing('#FFD700', 0.3)
    const textMesh = new THREE.Mesh(textGeometry, textMaterial)
    textMesh.position.y = 1
    gameGroup.add(textMesh)

    // Setup choice models if game is active
    if (gameState?.status === 'playing') {
      const currentRound = gameState.rounds[gameState.rounds.length - 1]
      if (!currentRound?.player1Choice) {
        const selectableObjects = setupPlayerChoiceModels()
        // Setup mouse interaction once we have a container
        setTimeout(() => {
          const canvas = document.querySelector('canvas')
          if (canvas && selectableObjects) {
            setupMouseInteraction(selectableObjects, canvas, new THREE.PerspectiveCamera(), scene)
          }
        }, 100)
      }
      setupAIChoiceModels()
    }

    scene.add(gameGroup)
    sceneRef.current = scene
  }, [gameState, setupPlayerChoiceModels, setupAIChoiceModels, setupMouseInteraction])

  // Animate AI cycling through choices using enhanced models
  const animateAICycling = useCallback(() => {
    if (!aiChoicesRef.current || !gameState?.status || gameState.status !== 'playing') return

    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors']
    
    // Reset all models to default state
    aiChoicesRef.current.children.forEach(child => {
      if (child.userData?.choice) {
        RPSModels.removeGlowEffect(child as THREE.Group)
      }
    })

    // Highlight current choice
    const currentChoice = choices[aiCycleIndex]
    const currentModel = aiChoicesRef.current.children.find(child => 
      child.userData?.choice === currentChoice
    )
    
    if (currentModel) {
      RPSModels.addGlowEffect(currentModel as THREE.Group, '#87CEEB', 0.6)
    }

    // Update cycle index
    setAICycleIndex((prev) => (prev + 1) % choices.length)
  }, [aiCycleIndex, gameState])

  // Start AI cycling animation
  useEffect(() => {
    if (!gameState?.status || gameState.status !== 'playing') return

    const currentRound = gameState.rounds[gameState.rounds.length - 1]
    if (!currentRound?.player1Choice && !isCountingDown) {
      const interval = setInterval(animateAICycling, 800)
      return () => clearInterval(interval)
    }
  }, [animateAICycling, gameState, isCountingDown])

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
        // Add winner effects using enhanced glow system
        setTimeout(() => {
          if (currentRound.winner === 'player1' && playerHandRef.current?.children[0]) {
            // Player wins - green glow effect
            RPSModels.addGlowEffect(playerHandRef.current.children[0] as THREE.Group, '#00FF00', 0.7)
          } else if (currentRound.winner === 'ai' && aiHandRef.current?.children[0]) {
            // AI wins - red glow effect
            RPSModels.addGlowEffect(aiHandRef.current.children[0] as THREE.Group, '#FF0000', 0.7)
          } else if (currentRound.winner === 'draw') {
            // Draw - both get yellow glow
            if (playerHandRef.current?.children[0]) {
              RPSModels.addGlowEffect(playerHandRef.current.children[0] as THREE.Group, '#FFD700', 0.5)
            }
            if (aiHandRef.current?.children[0]) {
              RPSModels.addGlowEffect(aiHandRef.current.children[0] as THREE.Group, '#FFD700', 0.5)
            }
          }
        }, 500)
      }
    }
  }, [gameState, aiChoice, playerChoice, createHandGeometry])

  // Render function for the 3D scene
  const handleRender = useCallback((scene: THREE.Scene, camera: THREE.Camera) => {
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

  // Cleanup mouse interaction on unmount
  useEffect(() => {
    return () => {
      if (mouseInteractionRef.current) {
        mouseInteractionRef.current.dispose()
      }
    }
  }, [])

  return (
    <div className={className}>
      <Game3DContainer
        title="3D Rock Paper Scissors"
        gameState={gameState || undefined}
        playerInfo={playerInfo}
        aiInfo={aiInfo}
        isLoading={isLoading}
        error={error}
        onReset={onReset}
        onNewGame={onNewGame}
        onRender={handleRender}
        sceneConfig={{
          background: '#1a1a2e',
          fog: { color: '#1a1a2e', near: 5, far: 15 }
        }}
        cameraConfig={{
          autoRotate: false,
          minDistance: 4,
          maxDistance: 12
        }}
      >
        {/* Instructions overlay when waiting for player choice */}
        {gameState?.status === 'playing' && !currentRound?.player1Choice && !isCountingDown && (
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold text-center mb-4">Choose Your Move</h3>
            <p className="text-center text-sm text-slate-300 mb-4">
              Click on one of the 3D models on your side (left) to make your choice
            </p>
            <p className="text-center text-xs text-slate-400">
              The AI models on the right are cycling to show it's thinking...
            </p>
          </div>
        )}

        {/* Countdown overlay */}
        {isCountingDown && (
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 text-white text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-sm text-blue-400">Revealing choices...</span>
          </div>
        )}

        {/* Round result display */}
        {currentRound?.winner && (
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 text-white text-center">
            <h3 className="text-lg font-bold mb-2">Round Result</h3>
            <div className="flex justify-center space-x-8 mb-4">
              <div className="text-center">
                <div className="mb-1 flex justify-center">
                  <Mini3DModel 
                    choice={currentRound.player1Choice!} 
                    size={48} 
                    glowColor={currentRound.winner === 'player1' ? '#00FF00' : currentRound.winner === 'draw' ? '#FFD700' : undefined}
                  />
                </div>
                <div className="text-sm">You</div>
              </div>
              <div className="text-2xl flex items-center">vs</div>
              <div className="text-center">
                <div className="mb-1 flex justify-center">
                  <Mini3DModel 
                    choice={currentRound.player2Choice!} 
                    size={48} 
                    glowColor={currentRound.winner === 'ai' ? '#FF0000' : currentRound.winner === 'draw' ? '#FFD700' : undefined}
                  />
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
