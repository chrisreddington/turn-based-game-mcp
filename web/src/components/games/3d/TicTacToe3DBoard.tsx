/**
 * 3D Tic-Tac-Toe board component
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import type { TicTacToeGameState, TicTacToeMove } from '@turn-based-mcp/shared'
import { Game3DContainer } from './Game3DContainer'
import { Materials, Geometries, Animations } from '../../../lib/3d/three-utils'

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
  className = ''
}: TicTacToe3DBoardProps) {
  const sceneRef = useRef<THREE.Scene | null>(null)
  const boardRef = useRef<THREE.Group | null>(null)
  const cellMeshesRef = useRef<THREE.Mesh[]>([])
  const pieceMeshesRef = useRef<(THREE.Mesh | null)[]>([])
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())

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
            material = Materials.colored('#E74C3C')
          } else {
            geometry = Geometries.oShape(0.8, 0.15)
            material = Materials.colored('#3498DB')
          }

          const pieceMesh = new THREE.Mesh(geometry, material)
          pieceMesh.position.x = (col - 1) * 1.33
          pieceMesh.position.z = (row - 1) * 1.33
          pieceMesh.position.y = 0.5
          pieceMesh.castShadow = true

          // Animate piece placement
          pieceMesh.scale.set(0, 0, 0)
          Animations.scaleTo(
            pieceMesh,
            new THREE.Vector3(1, 1, 1),
            500
          )

          boardRef.current.add(pieceMesh)
          pieceMeshesRef.current[index] = pieceMesh
        }
      }
    }
  }, [gameState])

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
        title="3D Tic-Tac-Toe"
        gameState={gameState}
        playerInfo={playerInfo}
        aiInfo={aiInfo}
        isLoading={isLoading}
        error={error}
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
      />
    </div>
  )
}