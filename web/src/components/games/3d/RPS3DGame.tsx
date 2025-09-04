/**
 * 3D Rock-Paper-Scissors game component with enhanced 3D models and interactions
 */

'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import * as THREE from 'three'
import type { RPSGameState, RPSMove } from '@turn-based-mcp/shared'
import { usePrevious } from '../../../hooks/usePrevious'
import { Game3DContainer } from './Game3DContainer'
import { Materials } from '../../../lib/3d/three-utils'
import { RPSModels } from '../../../lib/3d/rps-models'
import { Mini3DModel } from './Mini3DModel'
import { createMouseInteraction, type MouseInteraction } from '../../../lib/3d/mouse-interaction'

/**
 * Get the emoji representation for an RPS choice
 */
function getChoiceEmoji(choice: 'rock' | 'paper' | 'scissors'): string {
  const choiceEmojis: Record<'rock' | 'paper' | 'scissors', string> = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️'
  }
  return choiceEmojis[choice]
}

interface RPS3DGameProps {
  gameState: RPSGameState | null
  onMove: (move: RPSMove) => void
  isLoading?: boolean
  error?: string | null
  onReset?: () => void
  onNewGame?: () => void
  /** Switch to 2D mode callback */
  onSwitchTo2D?: () => void
  className?: string
  difficulty?: string
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
  onSwitchTo2D,
  className = '',
  difficulty = 'medium'
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
  const [mouseInteractionSetup, setMouseInteractionSetup] = useState(false)
  const [aiJustSelected, setAIJustSelected] = useState<'rock' | 'paper' | 'scissors' | null>(null)
  const [showAISelection, setShowAISelection] = useState(false)
  const [showRoundResult, setShowRoundResult] = useState(false)
  const [showBothSelections, setShowBothSelections] = useState(false)

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
    if (!onMove || !gameState) return

    // Use same canMakeMove logic as 2D component
    const currentRoundData = gameState.rounds[gameState.currentRound] || {}
    const canMakeCurrentMove = gameState.status === 'playing' && 
                              gameState.currentRound < gameState.maxRounds &&
                              gameState.currentPlayerId === 'player1' &&
                              !currentRoundData.player1Choice

    if (!canMakeCurrentMove) {
      // Player cannot make a move right now
      return
    }

    setPlayerChoice(choice)
    setIsCountingDown(true)

    // Immediately switch to locked state to prevent further selections
    // This will be handled by the useEffect that watches for playerChoice changes
    
    // Disable mouse interaction to prevent further clicks
    if (mouseInteractionRef.current) {
      mouseInteractionRef.current.dispose()
      mouseInteractionRef.current = null
      setMouseInteractionSetup(false)
    }

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

  // Create billboarded text that always faces the camera
  const create3DText = useCallback((text: string, position: THREE.Vector3, color: string = '#FFFFFF'): THREE.Mesh => {
    const textCanvas = createTextTexture(text, 32, color)
    const textTexture = new THREE.CanvasTexture(textCanvas)
    textTexture.minFilter = THREE.LinearFilter
    textTexture.magFilter = THREE.LinearFilter
    
    const textGeometry = new THREE.PlaneGeometry(0.8, 0.2)
    const textMaterial = new THREE.MeshBasicMaterial({ 
      map: textTexture, 
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    })
    
    const textMesh = new THREE.Mesh(textGeometry, textMaterial)
    textMesh.position.copy(position)
    
    // Mark this mesh as a billboard so it can be updated in the render loop
    textMesh.userData.isBillboard = true
    
    return textMesh
  }, [createTextTexture])

  // Create player/AI name labels
  const createPlayerLabel = useCallback((name: string, position: THREE.Vector3, color: string = '#FFFFFF'): THREE.Mesh => {
    return create3DText(name, position, color)
  }, [create3DText])

  // Setup player choice models (interactable)
  const setupPlayerChoiceModels = useCallback(() => {
    if (!playerChoicesRef.current) return

    // Clear existing models
    playerChoicesRef.current.clear()

    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors']
    const selectableObjects: THREE.Object3D[] = []

    // Add player name label above the choices
    const playerName = gameState?.players.find(p => p.id === 'player1')?.name || 'Player'
    const playerLabel = createPlayerLabel(playerName, new THREE.Vector3(0, 1.5, 0), '#4A90E2')
    playerChoicesRef.current.add(playerLabel)

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

      // Add 3D floating label that's visible from all directions
      const label3D = create3DText(choice.toUpperCase(), new THREE.Vector3(model.position.x, 0.8, 0), '#FFFFFF')
      playerChoicesRef.current!.add(label3D)
    })

    return selectableObjects
  }, [gameState, createPlayerLabel, create3DText])

  // Setup player choice models in locked state (player has already chosen)
  const setupPlayerChoiceModelsLocked = useCallback((selectedChoice: 'rock' | 'paper' | 'scissors') => {
    if (!playerChoicesRef.current) return

    // Clear existing models
    playerChoicesRef.current.clear()

    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors']

    // Add player name label above the choices
    const playerName = gameState?.players.find(p => p.id === 'player1')?.name || 'Player'
    const playerLabel = createPlayerLabel(playerName, new THREE.Vector3(0, 1.5, 0), '#4A90E2')
    playerChoicesRef.current.add(playerLabel)

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
      model.userData = { choice, type: 'player-choice-locked', isSelected: choice === selectedChoice }
      model.name = `player-choice-locked-${choice}`
      
      if (choice === selectedChoice) {
        // Selected choice gets a strong green glow and is larger
        model.scale.setScalar(1.3)
        RPSModels.addGlowEffect(model, '#00FF00', 1.0)
        
        // Add "SELECTED" label above the chosen model
        const selectedLabel = create3DText('SELECTED', new THREE.Vector3(model.position.x, 1.2, 0), '#00FF00')
        playerChoicesRef.current!.add(selectedLabel)
        
        // Add a pulsing animation to the selected choice
        model.userData.animateSelection = true
      } else {
        // Non-selected choices are significantly dimmed and smaller
        model.scale.setScalar(0.5)
        RPSModels.addGlowEffect(model, '#333333', 0.05)
        
        // Make the material much more transparent for non-selected choices
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.opacity = 0.2
                  mat.transparent = true
                }
              })
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.opacity = 0.2
              child.material.transparent = true
            }
          }
        })
      }
      
      playerChoicesRef.current!.add(model)

      // Add 3D floating label
      const labelColor = choice === selectedChoice ? '#00FF00' : '#888888'
      const label3D = create3DText(choice.toUpperCase(), new THREE.Vector3(model.position.x, 0.8, 0), labelColor)
      playerChoicesRef.current!.add(label3D)
    })
  }, [gameState, createPlayerLabel, create3DText])

  // Setup AI choice models (all 3 visible with cycling lighting or highlighting selected choice)
  const setupAIChoiceModels = useCallback(() => {
    if (!aiChoicesRef.current) return

    // Clear existing models
    aiChoicesRef.current.clear()

    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors']

    // Add AI name label above the choices
    const aiName = gameState?.players.find(p => p.id === 'ai')?.name || 'AI'
    const aiLabel = createPlayerLabel(aiName, new THREE.Vector3(0, 1.5, 0), '#FF6B6B')
    aiChoicesRef.current.add(aiLabel)

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
      
      // If we're showing AI selection and this is the selected choice, highlight it
      if (showAISelection && aiJustSelected === choice) {
        model.scale.setScalar(1.3)
        RPSModels.addGlowEffect(model, '#FF6B6B', 1.0)
        
        // Add "AI SELECTED" label above the chosen model
        const selectedLabel = create3DText('AI SELECTED', new THREE.Vector3(model.position.x, 1.2, 0), '#FF6B6B')
        aiChoicesRef.current!.add(selectedLabel)
        
        // Add a pulsing animation to the selected choice
        model.userData.animateSelection = true
      } else if (!showAISelection) {
        // Normal state - just add the model without highlighting
        RPSModels.addGlowEffect(model, '#FF6B6B', 0.1)
      } else {
        // Non-selected choices during AI selection display are dimmed
        model.scale.setScalar(0.5)
        RPSModels.addGlowEffect(model, '#333333', 0.05)
        
        // Make the material more transparent for non-selected choices
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.opacity = 0.3
                  mat.transparent = true
                }
              })
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.opacity = 0.3
              child.material.transparent = true
            }
          }
        })
      }
      
      aiChoicesRef.current!.add(model)

      // Add 3D floating label that's visible from all directions
      const labelColor = showAISelection && aiJustSelected === choice ? '#FF6B6B' : '#FFFFFF'
      const label3D = create3DText(choice.toUpperCase(), new THREE.Vector3(model.position.x, 0.8, 0), labelColor)
      aiChoicesRef.current!.add(label3D)
    })
  }, [gameState, createPlayerLabel, create3DText, showAISelection, aiJustSelected])

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
      onHover: (object, _point) => {
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
      onClick: (object, _point) => {
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

    // Create player hand area (closer to camera, facing AI)
    const playerHand = new THREE.Group()
    playerHand.position.set(0, 0.5, 1.5)  // Closer to camera
    playerHandRef.current = playerHand
    gameGroup.add(playerHand)

    // Create AI hand area (farther from camera, facing player)
    const aiHand = new THREE.Group()
    aiHand.position.set(0, 0.5, -1.5)  // Farther from camera
    aiHandRef.current = aiHand
    gameGroup.add(aiHand)

    // Create player choice models area (front, closer to camera)
    const playerChoices = new THREE.Group()
    playerChoices.position.set(0, 0.8, 2.5)  // Very close to camera for easy interaction
    playerChoicesRef.current = playerChoices
    gameGroup.add(playerChoices)

    // Create AI choice models area (back, farther from camera)
    const aiChoices = new THREE.Group()
    aiChoices.position.set(0, 0.8, -2.5)  // Far from camera
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
      const currentRoundData = gameState.rounds[gameState.currentRound] || {}
      
      // Player choice setup logic
      if (!currentRoundData.player1Choice && !playerChoice) {
        // Player hasn't made their choice yet - show interactive models
        setupPlayerChoiceModels()
      } else {
        // Player has made their choice or is in the process of making it - show locked/selected state
        const choiceToHighlight = currentRoundData.player1Choice || playerChoice
        if (choiceToHighlight) {
          setupPlayerChoiceModelsLocked(choiceToHighlight)
        }
      }
      
      // AI choice setup - will handle highlighting internally based on showAISelection state
      setupAIChoiceModels()
    }

    scene.add(gameGroup)
    sceneRef.current = scene
  }, [gameState, setupPlayerChoiceModels, setupPlayerChoiceModelsLocked, setupAIChoiceModels, playerChoice])

  // Animate AI cycling through choices using enhanced models
  const animateAICycling = useCallback(() => {
    if (!aiChoicesRef.current || !gameState?.status || gameState.status !== 'playing' || showAISelection || showBothSelections) return

    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors']
    
    // Reset all models to default state
    aiChoicesRef.current.children.forEach(child => {
      if (child.userData?.choice) {
        RPSModels.removeGlowEffect(child as THREE.Group)
        // Reset scale and opacity
        child.scale.setScalar(1.0)
        child.traverse((subChild) => {
          if (subChild instanceof THREE.Mesh && subChild.material) {
            if (Array.isArray(subChild.material)) {
              subChild.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.opacity = 1.0
                  mat.transparent = false
                }
              })
            } else if (subChild.material instanceof THREE.MeshStandardMaterial) {
              subChild.material.opacity = 1.0
              subChild.material.transparent = false
            }
          }
        })
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
  }, [aiCycleIndex, gameState, showAISelection, showBothSelections])

  // Start AI cycling animation
  useEffect(() => {
    if (!gameState?.status || gameState.status !== 'playing' || showAISelection || showBothSelections) return

    const currentRoundData = gameState.rounds[gameState.currentRound] || {}
    // Continue AI cycling until the AI has made their choice (player2Choice exists)
    if (!currentRoundData.player2Choice && !isCountingDown) {
      const interval = setInterval(animateAICycling, 800)
      return () => clearInterval(interval)
    }
  }, [animateAICycling, gameState, isCountingDown, showAISelection, showBothSelections])

  // Reset mouse interaction setup when game state changes
  useEffect(() => {
    setMouseInteractionSetup(false)
  }, [gameState?.status])

  // Handle immediate switch to locked state when player makes a choice
  useEffect(() => {
    if (playerChoice && gameState?.status === 'playing' && playerChoicesRef.current) {
      const currentRoundData = gameState.rounds[gameState.currentRound] || {}
      // Only switch to locked state if the player choice is for the current round
      if (!currentRoundData.player1Choice) {
        setupPlayerChoiceModelsLocked(playerChoice)
      }
    }
  }, [playerChoice, gameState, setupPlayerChoiceModelsLocked])

  // Reset player choice when starting a new round
  useEffect(() => {
    if (gameState?.status === 'playing') {
      const currentRoundData = gameState.rounds[gameState.currentRound] || {}
      
      // Reset for new round when current round has no player choice yet
      if (!currentRoundData.player1Choice) {
        // New round started, reset player choice and prepare for new selections
        setPlayerChoice(null)
        setAIJustSelected(null)
        setShowAISelection(false)
        setShowRoundResult(false)
        setShowBothSelections(false)
        setAIChoice(null)
        
        // Reset processed rounds tracking for new game
        if (gameState.currentRound === 0) {
          processedRoundsRef.current.clear()
        }
        
        // Reset to interactive player choice models
        if (playerChoicesRef.current) {
          setupPlayerChoiceModels()
        }
      }
    }
  }, [gameState?.currentRound, gameState?.status, gameState?.rounds, gameState?.id, setupPlayerChoiceModels])

  // Track which rounds have already had their 3-second display shown
  const processedRoundsRef = useRef<Set<number>>(new Set())
  
  // Use usePrevious to track round completion and trigger 3-second display
  const previousGameState = usePrevious(gameState)
  
  // Check for round completion and trigger 3-second display
  useEffect(() => {
    if (!gameState || !previousGameState) return
    
    // Check if currentRound just advanced (indicating a round was completed)
    const roundJustCompleted = gameState.currentRound > previousGameState.currentRound
    
    if (roundJustCompleted) {
      // The completed round is the previous current round
      const completedRoundIndex = previousGameState.currentRound
      const completedRoundData = gameState.rounds[completedRoundIndex] || {}
      
      // Verify the round actually has complete data
      const isRoundComplete = completedRoundData.player1Choice && 
                             completedRoundData.player2Choice && 
                             completedRoundData.winner !== undefined
      
      // Only trigger if round is complete and we haven't processed it yet
      if (isRoundComplete && 
          !showBothSelections &&
          !processedRoundsRef.current.has(completedRoundIndex)) {
        
        // Mark this round as processed to prevent duplicate displays
        processedRoundsRef.current.add(completedRoundIndex)
        
        // Both player and AI have made their selections and round is complete
        // Type assertion since we've already checked these values exist
        setAIJustSelected(completedRoundData.player2Choice as 'rock' | 'paper' | 'scissors')
        setPlayerChoice(completedRoundData.player1Choice as 'rock' | 'paper' | 'scissors')
        setShowBothSelections(true)
        setShowAISelection(true)
        setShowRoundResult(false)
        
        console.log('3-second display started for round:', completedRoundIndex, {
          player1Choice: completedRoundData.player1Choice,
          player2Choice: completedRoundData.player2Choice,
          winner: completedRoundData.winner,
          processedRounds: Array.from(processedRoundsRef.current),
          currentRound: gameState.currentRound,
          previousCurrentRound: previousGameState.currentRound
        })
        
        // Rebuild both player and AI choice models to show selections
        setupPlayerChoiceModelsLocked(completedRoundData.player1Choice as 'rock' | 'paper' | 'scissors')
        setupAIChoiceModels()
        
        // Show both selections for exactly 3 seconds
        setTimeout(() => {
          console.log('3-second display ended for round:', completedRoundIndex)
          
          // After 3 seconds, remove highlights and show round result
          setShowBothSelections(false)
          setShowAISelection(false)
          setShowRoundResult(true)
          setAIJustSelected(null)
          
          // Clear player choice for the next round so they can make a fresh selection
          setPlayerChoice(null)
          
          // Rebuild AI models without selection highlight to remove all highlights
          setupAIChoiceModels()
          
          // Rebuild interactive player choice models for the next round
          setupPlayerChoiceModels()
        }, 3000) // Exactly 3 seconds as requested
      }
    }
  }, [gameState, previousGameState, showBothSelections, setupPlayerChoiceModelsLocked, setupAIChoiceModels])

  // Update hands based on game state
  const updateHands = useCallback(() => {
    if (!gameState || !playerHandRef.current || !aiHandRef.current) return

    // Get current round using proper index
    const currentRoundData = gameState.rounds[gameState.currentRound] || {}
    
    if (currentRoundData) {
      // Update player hand
      if (currentRoundData.player1Choice && playerChoice !== currentRoundData.player1Choice) {
        // Clear previous hand
        playerHandRef.current.clear()
        
        // Add new hand
        const playerHand = createHandGeometry(currentRoundData.player1Choice)
        playerHand.rotation.y = Math.PI / 4
        playerHandRef.current.add(playerHand)
        setPlayerChoice(currentRoundData.player1Choice)
      }

      // Update AI hand
      if (currentRoundData.player2Choice && aiChoice !== currentRoundData.player2Choice) {
        // Clear previous hand
        aiHandRef.current.clear()
        
        // Add new hand
        const aiHandMesh = createHandGeometry(currentRoundData.player2Choice)
        aiHandMesh.rotation.y = -Math.PI / 4
        aiHandRef.current.add(aiHandMesh)
        setAIChoice(currentRoundData.player2Choice)
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

  // Update billboarded text to always face the camera
  const updateBillboards = useCallback((scene: THREE.Scene, camera: THREE.Camera) => {
    scene.traverse((object) => {
      if (object.userData.isBillboard) {
        object.lookAt(camera.position)
      }
    })
  }, [])

  // Render function for the 3D scene
  const handleRender = useCallback((scene: THREE.Scene, camera: THREE.Camera, renderer?: THREE.WebGLRenderer) => {
    // Initialize game if not done
    if (!gameGroupRef.current) {
      initializeGame(scene)
    }

    // Update billboarded text to face the camera
    updateBillboards(scene, camera)

    // Animate selected player choice with pulsing effect
    if (playerChoicesRef.current) {
      playerChoicesRef.current.children.forEach(child => {
        if (child.userData?.animateSelection) {
          const time = Date.now() * 0.003
          const pulse = Math.sin(time) * 0.1 + 1.3
          child.scale.setScalar(pulse)
        }
      })
    }

    // Animate selected AI choice with pulsing effect during AI selection display
    if (aiChoicesRef.current && showAISelection) {
      aiChoicesRef.current.children.forEach(child => {
        if (child.userData?.animateSelection) {
          const time = Date.now() * 0.003
          const pulse = Math.sin(time) * 0.1 + 1.3
          child.scale.setScalar(pulse)
        }
      })
    }

    // Set up mouse interaction if we have renderer and it's not set up yet
    if (renderer && !mouseInteractionSetup && playerChoicesRef.current) {
      // Only set up mouse interaction if player hasn't made their choice yet
      const currentRoundData = gameState?.rounds[gameState.currentRound] || {}
      if (!currentRoundData.player1Choice && !playerChoice) {
        const selectableObjects: THREE.Object3D[] = []
        playerChoicesRef.current.children.forEach(child => {
          if (child.userData?.type === 'player-choice') {
            selectableObjects.push(child)
          }
        })
        
        if (selectableObjects.length > 0) {
          setupMouseInteraction(selectableObjects, renderer.domElement, camera, scene)
          setMouseInteractionSetup(true)
        }
      }
    }

    // Update hands when game state changes
    updateHands()
  }, [initializeGame, updateHands, setupMouseInteraction, mouseInteractionSetup, updateBillboards, gameState, playerChoice])

  // Get game info for HUD - use same logic as 2D component
  const currentRound = gameState?.rounds[gameState.currentRound] || {}
  const playerScore = gameState?.scores.player1 || 0
  const aiScore = gameState?.scores.ai || 0
  
  // Calculate if player can make a move (same logic as 2D component)
  const canMakeMove = gameState && !isLoading && 
                     gameState.status === 'playing' && 
                     gameState.currentRound < gameState.maxRounds &&
                     gameState.currentPlayerId === 'player1' &&
                     !currentRound.player1Choice

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
        showHUD={false}  // Disable built-in HUD to avoid overlay conflicts
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
        {/* Custom UI overlays positioned to not interfere with 3D interaction */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Instructions overlay when waiting for player choice - use same logic as 2D */}
          {canMakeMove && !isCountingDown && !playerChoice && (
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-xl p-6 text-white max-w-sm">
              <h3 className="text-lg font-bold text-center mb-4">Choose Your Move</h3>
              <p className="text-center text-sm text-slate-300 mb-4">
                Click on one of the 3D models on your side (left) to make your choice
              </p>
              <p className="text-center text-xs text-slate-400">
                The AI models on the right are cycling to show it&apos;s thinking...
              </p>
            </div>
          )}

          {/* AI Selection Display Overlay */}
          {showAISelection && aiJustSelected && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-xl p-6 text-white max-w-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-red-400">AI Selected!</h3>
              </div>
              <p className="text-center text-sm text-slate-300 mb-2">
                AI chose: <span className="font-bold text-red-400">{aiJustSelected.toUpperCase()}</span>
              </p>
              <p className="text-center text-xs text-slate-400">
                Watch the highlighted model on the right side!
              </p>
            </div>
          )}

          {/* Waiting for AI move overlay - use same logic as 2D */}
          {gameState?.status === 'playing' && (playerChoice || currentRound.player1Choice) && !currentRound.player2Choice && (
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-xl p-6 text-white max-w-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <h3 className="text-lg font-bold">Waiting for AI...</h3>
              </div>
              <p className="text-center text-sm text-slate-300 mb-2">
                You chose: <span className="font-bold text-green-400">{(playerChoice || currentRound.player1Choice)?.toUpperCase()}</span>
              </p>
              <p className="text-center text-xs text-slate-400">
                The AI is making its decision. Watch the cycling animations on the right!
              </p>
            </div>
          )}

          {/* Countdown overlay */}
          {isCountingDown && (
            <div className="absolute top-20 right-4 bg-black/80 backdrop-blur-sm rounded-xl p-4 text-white text-center max-w-xs">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-sm text-blue-400">Revealing choices...</span>
            </div>
          )}

          {/* Round result display */}
          {showRoundResult && currentRound?.winner && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-xl p-6 text-white text-center max-w-md">
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

          {/* Game info HUD - only show when not counting down */}
          {!isCountingDown && (
            <div className="absolute top-4 right-4 pointer-events-auto">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white min-w-48">
              {/* Game Status */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Status:</span>
                  <span className={`font-medium ${
                    gameState?.status === 'playing' ? 'text-green-400' :
                    gameState?.status === 'finished' ? 'text-blue-400' :
                    'text-yellow-400'
                  }`}>
                    {gameState?.status === 'playing' ? 'In Progress' :
                     gameState?.status === 'finished' ? 'Game Complete' :
                     'Waiting'}
                  </span>
                </div>

                {/* Game ID */}
                {gameState?.id && (
                  <div className="flex justify-between">
                    <span className="text-slate-300">Game ID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-cyan-400">
                        {gameState.id}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(gameState.id)}
                        className="text-xs text-slate-400 hover:text-white transition-colors duration-200"
                        title="Copy Game ID"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                )}

                {/* Difficulty */}
                <div className="flex justify-between">
                  <span className="text-slate-300">Difficulty:</span>
                  <span className="text-orange-400 font-medium capitalize">
                    {difficulty}
                  </span>
                </div>
                
                {/* Scores */}
                {playerInfo && aiInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-300">{playerInfo.name}:</span>
                      <span className="text-blue-400 font-bold">{playerInfo.score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">{aiInfo.name}:</span>
                      <span className="text-red-400 font-bold">{aiInfo.score}</span>
                    </div>
                  </>
                )}

                {/* Game Winner Display */}
                {gameState?.status === 'finished' && gameState.winner && (
                  <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold mb-1">
                      {gameState.winner === 'player1' && (
                        <span className="text-green-400">🎉 You Won!</span>
                      )}
                      {gameState.winner === 'ai' && (
                        <span className="text-red-400">🤖 AI Won!</span>
                      )}
                      {gameState.winner === 'draw' && (
                        <span className="text-yellow-400">🤝 Draw!</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300">
                      Final Score: {playerInfo?.score || 0} - {aiInfo?.score || 0}
                    </div>
                  </div>
                )}

                {/* Current Round */}
                {gameState && (
                  <div className="flex justify-between">
                    <span className="text-slate-300">Round:</span>
                    <span className="text-cyan-400">
                      {gameState.currentRound + 1} / {gameState.maxRounds}
                    </span>
                  </div>
                )}

                {/* Round History */}
                {gameState && gameState.currentRound > 0 && (
                  <div className="pt-2 border-t border-slate-600">
                    <div className="text-xs text-slate-300 mb-2 flex items-center space-x-1">
                      <span>🏆</span>
                      <span>Round History</span>
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {gameState.rounds.slice(0, gameState.currentRound).map((round, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-800/50 p-1 rounded text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-400">R{index + 1}:</span>
                            <span title={`You chose ${round.player1Choice}`}>
                              {getChoiceEmoji(round.player1Choice!)}
                            </span>
                            <span className="text-slate-500">vs</span>
                            <span title={`AI chose ${round.player2Choice}`}>
                              {getChoiceEmoji(round.player2Choice!)}
                            </span>
                          </div>
                          <span className="text-xs">
                            {round.winner === 'draw' ? '🤝' :
                             round.winner === 'player1' ? '🎉' : '🤖'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* View Mode Switcher */}
              {onSwitchTo2D && (
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <button
                    onClick={onSwitchTo2D}
                    className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors duration-200 w-full justify-center"
                  >
                    <span>📱</span>
                    <span>Switch to 2D</span>
                  </button>
                </div>
              )}

              {/* Camera Controls Help */}
              <div className="mt-4 pt-4 border-t border-slate-600">
                <div className="text-xs text-slate-400 space-y-1">
                  <div>🖱️ Drag: Rotate view</div>
                  <div>🎯 Right-click: Pan</div>
                  <div>🔍 Scroll: Zoom</div>
                </div>
              </div>

              {/* Action Buttons */}
              {(onReset || onNewGame) && (
                <div className="mt-4 flex space-x-2">
                  {onReset && (
                    <button
                      onClick={onReset}
                      className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors duration-200"
                    >
                      Reset
                    </button>
                  )}
                  {onNewGame && (
                    <button
                      onClick={onNewGame}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors duration-200"
                    >
                      New Game
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </Game3DContainer>
    </div>
  )
}
