/**
 * 3D Tic-Tac-Toe board component
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import type { TicTacToeGameState, TicTacToeMove } from '@turn-based-mcp/shared'
import { Game3DContainer } from './Game3DContainer'
import { Materials, Geometries, Animations } from '../../../lib/3d/three-utils'

type PiecePlacementMode = 'standing' | 'flat'

interface TicTacToe3DBoardProps {
  /** Current game state */
  gameState: TicTacToeGameState | null
  /** Move handler */
  onMove?: (move: TicTacToeMove) => void
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Game control handlers */
  onReset?: () => void
  onNewGame?: () => void
  /** Switch to 2D mode callback */
  onSwitchTo2D?: () => void
  /** Piece placement mode (external state) */
  piecePlacementMode?: 'standing' | 'flat'
  /** Piece placement mode setter (external state) */
  onPiecePlacementModeChange?: (mode: 'standing' | 'flat') => void
  /** Additional CSS classes */
  className?: string
}

/**
 * 3D Tic-Tac-Toe board with interactive cells
 */
export function TicTacToe3DBoard({
  gameState,
  onMove,
  isLoading = false,
  error = null,
  onReset,
  onNewGame,
  onSwitchTo2D,
  piecePlacementMode: externalPiecePlacementMode,
  onPiecePlacementModeChange,
  className = ''
}: TicTacToe3DBoardProps) {
  const sceneRef = useRef<THREE.Scene | null>(null)
  const boardRef = useRef<THREE.Group | null>(null)
  const cellMeshesRef = useRef<THREE.Mesh[]>([])
  const pieceMeshesRef = useRef<(THREE.Mesh | null)[]>([])
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  
  // State for piece placement mode - use external state if provided, otherwise local
  const [localPlacementMode, setLocalPlacementMode] = useState<PiecePlacementMode>('standing')
  const placementMode = externalPiecePlacementMode || localPlacementMode
  const setPlacementMode = onPiecePlacementModeChange || setLocalPlacementMode
  const [isAnimating, setIsAnimating] = useState(false)

  // Initialize 3D board
  const initializeBoard = useCallback((scene: THREE.Scene) => {
    // Clear existing board
    if (boardRef.current) {
      scene.remove(boardRef.current)
    }

    const boardGroup = new THREE.Group()
    boardRef.current = boardGroup

    // Create board base
    const boardGeometry = new THREE.BoxGeometry(4, 0.2, 4)
    const boardMaterial = Materials.board('#8B4513')
    const boardMesh = new THREE.Mesh(boardGeometry, boardMaterial)
    boardMesh.position.y = -0.1
    boardMesh.receiveShadow = true
    boardGroup.add(boardMesh)

    // Create grid lines
    const lineMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
    
    // Vertical lines
    for (let i = 1; i < 3; i++) {
      const lineGeometry = new THREE.BoxGeometry(0.05, 0.3, 4)
      const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial)
      lineMesh.position.x = (i - 1) * 1.33 - 0.67
      lineMesh.position.y = 0.15
      boardGroup.add(lineMesh)
    }

    // Horizontal lines
    for (let i = 1; i < 3; i++) {
      const lineGeometry = new THREE.BoxGeometry(4, 0.3, 0.05)
      const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial)
      lineMesh.position.z = (i - 1) * 1.33 - 0.67
      lineMesh.position.y = 0.15
      boardGroup.add(lineMesh)
    }

    // Create interactive cell areas
    cellMeshesRef.current = []
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cellGeometry = new THREE.PlaneGeometry(1.2, 1.2)
        const cellMaterial = new THREE.MeshStandardMaterial({
          color: 0x4A90E2,
          transparent: true,
          opacity: 0.1
        })
        
        const cellMesh = new THREE.Mesh(cellGeometry, cellMaterial)
        cellMesh.position.x = (col - 1) * 1.33
        cellMesh.position.z = (row - 1) * 1.33
        cellMesh.position.y = 0.31
        cellMesh.rotation.x = -Math.PI / 2
        cellMesh.userData = { row, col, isCell: true }
        
        boardGroup.add(cellMesh)
        cellMeshesRef.current.push(cellMesh)
      }
    }

    // Initialize piece meshes array
    pieceMeshesRef.current = new Array(9).fill(null)

    scene.add(boardGroup)
    sceneRef.current = scene
  }, [])

  // Get piece position and rotation based on placement mode
  const getPieceTransform = (row: number, col: number, mode: PiecePlacementMode) => {
    const baseX = (col - 1) * 1.33
    const baseZ = (row - 1) * 1.33
    
    if (mode === 'standing') {
      return {
        position: new THREE.Vector3(baseX, 0.5, baseZ),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1)
      }
    } else {
      return {
        position: new THREE.Vector3(baseX, 0.15, baseZ),
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0), // Rotate to lie flat
        scale: new THREE.Vector3(1, 1, 0.3) // Flatten the piece
      }
    }
  }

  // Update board pieces based on game state
  const updatePieces = useCallback(() => {
    if (!gameState || !boardRef.current) return

    const { board } = gameState

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const index = row * 3 + col
        const cellValue = board[row][col]
        const existingPiece = pieceMeshesRef.current[index]

        // Remove existing piece if cell is now empty
        if (!cellValue && existingPiece) {
          boardRef.current.remove(existingPiece)
          pieceMeshesRef.current[index] = null
          continue
        }

        // Add new piece if cell has value and no piece exists
        if (cellValue && !existingPiece) {
          let geometry: THREE.BufferGeometry
          let material: THREE.Material

          if (cellValue === 'X') {
            geometry = Geometries.xShape(0.8)
            material = Materials.colored('#3B82F6') // Blue to match 2D version
          } else {
            geometry = Geometries.oShape(0.8, 0.15)
            material = Materials.colored('#EF4444') // Red to match 2D version
          }

          const pieceMesh = new THREE.Mesh(geometry, material)
          
          // Set initial transform based on current placement mode
          const transform = getPieceTransform(row, col, placementMode)
          pieceMesh.position.copy(transform.position)
          pieceMesh.rotation.copy(transform.rotation)
          pieceMesh.scale.copy(transform.scale)
          pieceMesh.castShadow = true

          // Animate piece placement
          const originalScale = pieceMesh.scale.clone()
          pieceMesh.scale.set(0, 0, 0)
          Animations.scaleTo(
            pieceMesh,
            originalScale,
            500
          )

          boardRef.current.add(pieceMesh)
          pieceMeshesRef.current[index] = pieceMesh
        }
      }
    }
  }, [gameState, placementMode])

  // Animate transition between placement modes
  const animatePlacementModeChange = useCallback((newMode: PiecePlacementMode) => {
    if (!boardRef.current || isAnimating) return
    
    setIsAnimating(true)
    const pieces = pieceMeshesRef.current.filter(piece => piece !== null) as THREE.Mesh[]
    
    if (pieces.length === 0) {
      setPlacementMode(newMode)
      setIsAnimating(false)
      return
    }

    // Animate all existing pieces to new positions/rotations
    let animationsCompleted = 0
    const totalAnimations = pieces.length * 3 // 3 transforms per piece

    const onAnimationComplete = () => {
      animationsCompleted++
      if (animationsCompleted === totalAnimations) {
        setIsAnimating(false)
      }
    }

    pieces.forEach((piece) => {
      // Find the row/col for this piece
      const pieceIndex = pieceMeshesRef.current.indexOf(piece)
      const row = Math.floor(pieceIndex / 3)
      const col = pieceIndex % 3
      
      const transform = getPieceTransform(row, col, newMode)
      
      // Animate position
      Animations.moveTo(
        piece,
        transform.position,
        800,
        onAnimationComplete
      )
      
      // Animate rotation
      Animations.rotateTo(
        piece,
        transform.rotation,
        800
      )
      
      // Use a custom animation for scale since scaleTo doesn't have callback
      const startScale = piece.scale.clone()
      const startTime = Date.now()
      const duration = 800

      const animateScale = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Ease out animation
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        
        piece.scale.lerpVectors(startScale, transform.scale, easeProgress)
        
        if (progress < 1) {
          requestAnimationFrame(animateScale)
        } else {
          onAnimationComplete()
        }
      }
      animateScale()

      // Mark another animation as complete for rotation (since rotateTo doesn't have callback)
      setTimeout(onAnimationComplete, 800)
    })

    // Update the mode immediately so new pieces use correct placement
    setPlacementMode(newMode)
  }, [isAnimating, getPieceTransform, setPlacementMode])

  // Toggle placement mode
  const togglePlacementMode = useCallback(() => {
    const newMode = placementMode === 'standing' ? 'flat' : 'standing'
    animatePlacementModeChange(newMode)
  }, [placementMode, animatePlacementModeChange])

  // Handle mouse interactions
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!sceneRef.current) return

    const container = event.currentTarget as HTMLElement
    const rect = container.getBoundingClientRect()
    
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Highlight hovered cells
    if (gameState?.status === 'playing' && gameState.currentPlayerId === 'player1') {
      cellMeshesRef.current.forEach(cell => {
        const material = cell.material as THREE.MeshStandardMaterial
        material.opacity = 0.1
      })

      // Check for intersection
      const camera = sceneRef.current.userData.camera
      if (camera) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera)
        const intersects = raycasterRef.current.intersectObjects(cellMeshesRef.current)

        if (intersects.length > 0) {
          const intersected = intersects[0].object as THREE.Mesh
          const { row, col } = intersected.userData
          
          // Only highlight if cell is empty
          if (gameState.board[row][col] === null) {
            const material = intersected.material as THREE.MeshStandardMaterial
            material.opacity = 0.3
          }
        }
      }
    }
  }, [gameState])

  const handleClick = useCallback((_event: MouseEvent) => {
    if (!sceneRef.current || !onMove) return
    if (gameState?.status !== 'playing' || gameState.currentPlayerId !== 'player1') return

    const camera = sceneRef.current.userData.camera
    if (!camera) return

    raycasterRef.current.setFromCamera(mouseRef.current, camera)
    const intersects = raycasterRef.current.intersectObjects(cellMeshesRef.current)

    if (intersects.length > 0) {
      const intersected = intersects[0].object
      const { row, col } = intersected.userData
      
      // Only allow move if cell is empty
      if (gameState.board[row][col] === null) {
        onMove({ row, col })
      }
    }
  }, [gameState, onMove])

  // Render function for the 3D scene
  const handleRender = useCallback((scene: THREE.Scene, camera: THREE.Camera) => {
    // Store camera reference for raycasting
    scene.userData.camera = camera

    // Initialize board if not done
    if (!boardRef.current) {
      initializeBoard(scene)
    }

    // Update pieces when game state changes
    updatePieces()
  }, [initializeBoard, updatePieces])

  // Add event listeners
  useEffect(() => {
    const container = document.querySelector('[data-3d-container]') as HTMLElement
    if (!container) return

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('click', handleClick)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('click', handleClick)
    }
  }, [handleMouseMove, handleClick])

  // Get player info for HUD
  const playerInfo = gameState ? {
    name: gameState.players.find(p => p.id === 'player1')?.name || 'Player',
    symbol: gameState.playerSymbols['player1'] || 'X',
    score: 0 // Could track wins across multiple games
  } : undefined

  const aiInfo = gameState ? {
    name: gameState.players.find(p => p.id === 'ai')?.name || 'AI',
    symbol: gameState.playerSymbols['ai'] || 'O',
    score: 0, // Could track wins across multiple games
    difficulty: 'Medium' // Could get from game session
  } : undefined

  return (
    <div className={className} data-3d-container>
            <Game3DContainer
        title="tic-tac-toe" // Use simple slug for navigation, not displayed
        gameState={gameState || undefined}
        playerInfo={playerInfo}
        aiInfo={aiInfo}
        isLoading={isLoading}
        error={error}
        showHUD={false} // Disable built-in HUD to avoid duplication
        onRender={handleRender}
        onReset={onReset}
        onNewGame={onNewGame}
        sceneConfig={{
          enableShadows: true,
          background: '#1e1e2e'
        }}
        cameraConfig={{
          enableZoom: true,
          enablePan: true,
          enableRotate: true,
          autoRotate: false,
          minDistance: 4,
          maxDistance: 15
        }}
      >
        {/* Custom HUD Layout */}
        {/* Top Left - Game Info */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-4 text-white shadow-lg min-w-64">
            <div className="space-y-3">
              {/* Game ID */}
              {gameState?.id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Game ID:</span>
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

              {/* Players */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Players:</span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-xs font-bold">{gameState?.playerSymbols?.['player1'] || 'X'}</span>
                    </div>
                    <span className="text-xs text-blue-400">{playerInfo?.name || 'Player'}</span>
                  </div>
                  <span className="text-xs text-slate-400">vs</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center">
                      <span className="text-xs font-bold">{gameState?.playerSymbols?.['ai'] || 'O'}</span>
                    </div>
                    <span className="text-xs text-red-400">{aiInfo?.name || 'AI'}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Status:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                  gameState?.status === 'playing' ? 'bg-green-600' :
                  gameState?.status === 'finished' ? 'bg-blue-600' :
                  'bg-slate-600'
                }`}>
                  {gameState?.status === 'playing' ? 'In Progress' :
                   gameState?.status === 'finished' ? 'Finished' :
                   'Waiting'}
                </span>
              </div>

              {/* Current Turn */}
              {gameState?.status === 'playing' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Turn:</span>
                  <span className="text-sm font-semibold text-yellow-400">
                    {gameState.currentPlayerId === 'player1' ? playerInfo?.name || 'Player' :
                     gameState.currentPlayerId === 'ai' ? aiInfo?.name || 'AI' : 'Unknown'}
                  </span>
                </div>
              )}

              {/* Winner */}
              {gameState?.status === 'finished' && gameState.winner && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Winner:</span>
                  <span className="text-sm font-semibold text-green-400">
                    {gameState.winner === 'draw' ? 'Draw' :
                     gameState.winner === 'player1' ? playerInfo?.name || 'Player' :
                     gameState.winner === 'ai' ? aiInfo?.name || 'AI' :
                     gameState.winner}
                  </span>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-blue-400">Processing...</span>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="p-2 bg-red-600/20 border border-red-500 rounded text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Right - Navigation & Camera Controls */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-4 text-white shadow-lg max-w-64">
            {/* Navigation to 2D Mode */}
            <div className="mb-3 pb-3 border-b border-slate-600">
              {onSwitchTo2D ? (
                <button
                  onClick={onSwitchTo2D}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors duration-200 w-full justify-center"
                >
                  <span>📱</span>
                  <span>2D Mode</span>
                </button>
              ) : (
                <a
                  href="/games/tic-tac-toe"
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors duration-200 w-full justify-center"
                >
                  <span>📱</span>
                  <span>2D Mode</span>
                </a>
              )}
            </div>
            
            {/* Camera Controls Help */}
            <h3 className="text-sm font-bold text-purple-400 mb-2">🎮 Camera Controls</h3>
            <div className="text-xs text-slate-300 space-y-1">
              <div>• <strong>Left drag:</strong> Rotate</div>
              <div>• <strong>Right drag:</strong> Pan</div>
              <div>• <strong>Scroll:</strong> Zoom</div>
            </div>
          </div>
        </div>

        {/* Bottom Left - Piece Style Toggle */}
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-3 text-white shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="text-sm text-slate-300">
                <span className="text-cyan-400 font-semibold">🎲</span> Style:
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-cyan-400">
                  {placementMode === 'standing' ? 'Standing' : 'Flat'}
                </span>
                <button
                  onClick={togglePlacementMode}
                  disabled={isAnimating || isLoading}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isAnimating || isLoading
                      ? 'bg-slate-600 cursor-not-allowed' 
                      : 'bg-cyan-600 hover:bg-cyan-700'
                  }`}
                >
                  {isAnimating ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>...</span>
                    </div>
                  ) : (
                    <>Switch</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right - Game Controls */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-3 text-white shadow-lg">
            <div className="flex items-center space-x-2">
              {onReset && (
                <button
                  onClick={onReset}
                  disabled={isLoading}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Reset
                </button>
              )}
              {onNewGame && (
                <button
                  onClick={onNewGame}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  New Game
                </button>
              )}
            </div>
          </div>
        </div>
      </Game3DContainer>
    </div>
  )
}