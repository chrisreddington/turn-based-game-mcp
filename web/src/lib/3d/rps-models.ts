/**
 * Enhanced 3D model creation utilities for Rock Paper Scissors game
 */

import * as THREE from 'three'

/**
 * Create detailed 3D models for Rock Paper Scissors game
 */
export class RPSModels {
  /**
   * Create a detailed rock model with texture and roughness
   */
  static createRock(scale: number = 1): THREE.Group {
    const rockGroup = new THREE.Group()
    
    // Main rock body - irregular shape using multiple spheres
    const mainGeometry = new THREE.SphereGeometry(0.5 * scale, 12, 8)
    // Modify vertices to create irregular rock shape
    const positions = mainGeometry.attributes.position.array
    for (let i = 0; i < positions.length; i += 3) {
      const variation = (Math.random() - 0.5) * 0.2 * scale
      positions[i] += variation     // x
      positions[i + 1] += variation // y  
      positions[i + 2] += variation // z
    }
    mainGeometry.attributes.position.needsUpdate = true
    mainGeometry.computeVertexNormals()
    
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.9,
      metalness: 0.1,
      bumpScale: 0.3
    })
    
    const mainRock = new THREE.Mesh(mainGeometry, rockMaterial)
    rockGroup.add(mainRock)
    
    // Add smaller rock details
    for (let i = 0; i < 3; i++) {
      const detailGeometry = new THREE.SphereGeometry(0.15 * scale, 6, 4)
      const detailMesh = new THREE.Mesh(detailGeometry, rockMaterial)
      detailMesh.position.x = (Math.random() - 0.5) * 0.8 * scale
      detailMesh.position.y = (Math.random() - 0.5) * 0.8 * scale
      detailMesh.position.z = (Math.random() - 0.5) * 0.8 * scale
      rockGroup.add(detailMesh)
    }
    
    rockGroup.castShadow = true
    rockGroup.receiveShadow = true
    return rockGroup
  }
  
  /**
   * Create a detailed paper model with folded sheet appearance
   */
  static createPaper(scale: number = 1): THREE.Group {
    const paperGroup = new THREE.Group()
    
    // Main paper sheet
    const paperGeometry = new THREE.PlaneGeometry(0.8 * scale, 1.0 * scale, 8, 10)
    
    // Add slight wave effect to make it look like paper
    const positions = paperGeometry.attributes.position.array
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const wave = Math.sin(x * 4) * Math.sin(y * 3) * 0.05 * scale
      positions[i + 2] = wave // z position for wave effect
    }
    paperGeometry.attributes.position.needsUpdate = true
    paperGeometry.computeVertexNormals()
    
    const paperMaterial = new THREE.MeshStandardMaterial({
      color: 0xF5F5F5,
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    })
    
    const paperMesh = new THREE.Mesh(paperGeometry, paperMaterial)
    paperGroup.add(paperMesh)
    
    // Add fold line for realism
    const foldGeometry = new THREE.CylinderGeometry(0.005 * scale, 0.005 * scale, 0.8 * scale)
    const foldMaterial = new THREE.MeshStandardMaterial({
      color: 0xE0E0E0,
      roughness: 0.9
    })
    const foldMesh = new THREE.Mesh(foldGeometry, foldMaterial)
    foldMesh.rotation.z = Math.PI / 2
    foldMesh.position.y = -0.2 * scale
    paperGroup.add(foldMesh)
    
    paperGroup.castShadow = true
    paperGroup.receiveShadow = true
    return paperGroup
  }
  
  /**
   * Create detailed scissors model with realistic blade shapes
   */
  static createScissors(scale: number = 1): THREE.Group {
    const scissorsGroup = new THREE.Group()
    
    // Left blade
    const leftBladeGeometry = new THREE.CylinderGeometry(0.02 * scale, 0.08 * scale, 0.6 * scale, 8)
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0,
      roughness: 0.1,
      metalness: 0.9
    })
    
    const leftBlade = new THREE.Mesh(leftBladeGeometry, bladeMaterial)
    leftBlade.rotation.z = Math.PI / 6
    leftBlade.position.x = -0.1 * scale
    leftBlade.position.y = 0.2 * scale
    scissorsGroup.add(leftBlade)
    
    // Right blade
    const rightBlade = new THREE.Mesh(leftBladeGeometry, bladeMaterial)
    rightBlade.rotation.z = -Math.PI / 6
    rightBlade.position.x = 0.1 * scale
    rightBlade.position.y = 0.2 * scale
    scissorsGroup.add(rightBlade)
    
    // Handle for left blade
    const handleGeometry = new THREE.TorusGeometry(0.12 * scale, 0.02 * scale, 6, 10)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.7,
      metalness: 0.2
    })
    
    const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial)
    leftHandle.position.x = -0.15 * scale
    leftHandle.position.y = -0.2 * scale
    leftHandle.rotation.x = Math.PI / 2
    scissorsGroup.add(leftHandle)
    
    // Handle for right blade
    const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial)
    rightHandle.position.x = 0.15 * scale
    rightHandle.position.y = -0.2 * scale
    rightHandle.rotation.x = Math.PI / 2
    scissorsGroup.add(rightHandle)
    
    // Central pivot
    const pivotGeometry = new THREE.SphereGeometry(0.03 * scale, 8, 6)
    const pivotMesh = new THREE.Mesh(pivotGeometry, bladeMaterial)
    pivotMesh.position.y = -0.05 * scale
    scissorsGroup.add(pivotMesh)
    
    scissorsGroup.castShadow = true
    scissorsGroup.receiveShadow = true
    return scissorsGroup
  }
  
  /**
   * Create a miniature version for UI buttons
   */
  static createMiniature(choice: 'rock' | 'paper' | 'scissors', scale: number = 0.3): THREE.Group {
    switch (choice) {
      case 'rock':
        return this.createRock(scale)
      case 'paper':
        return this.createPaper(scale)
      case 'scissors':
        return this.createScissors(scale)
    }
  }
  
  /**
   * Create an animated version that can cycle between choices
   */
  static createAnimatedChoice(_scale: number = 1): THREE.Group {
    const container = new THREE.Group()
    container.name = 'animated-choice-container'
    return container
  }
  
  /**
   * Update animated choice to show specific option
   */
  static updateAnimatedChoice(container: THREE.Group, choice: 'rock' | 'paper' | 'scissors', _scale: number = 1): void {
    // Clear existing model
    container.clear()
    
    // Add new model with fade-in animation
    let newModel: THREE.Group
    switch (choice) {
      case 'rock':
        newModel = this.createRock(_scale)
        break
      case 'paper':
        newModel = this.createPaper(_scale)
        break
      case 'scissors':
        newModel = this.createScissors(_scale)
        break
    }
    
    // Start with transparent and fade in
    newModel.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material = child.material.clone()
        child.material.transparent = true
        child.material.opacity = 0
      }
    })
    
    container.add(newModel)
    
    // Animate fade in
    const startTime = Date.now()
    const animateOpacity = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 300, 1) // 300ms fade in
      
      newModel.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.opacity = progress
        }
      })
      
      if (progress < 1) {
        requestAnimationFrame(animateOpacity)
      }
    }
    animateOpacity()
  }
  
  /**
   * Add glowing effect to a model (for selections or wins)
   */
  static addGlowEffect(model: THREE.Group, color: string = '#4A90E2', intensity: number = 0.5): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const glowMaterial = child.material.clone()
        glowMaterial.emissive = new THREE.Color(color)
        glowMaterial.emissiveIntensity = intensity
        child.material = glowMaterial
      }
    })
  }
  
  /**
   * Remove glow effect from a model
   */
  static removeGlowEffect(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const normalMaterial = child.material.clone()
        normalMaterial.emissive = new THREE.Color(0x000000)
        normalMaterial.emissiveIntensity = 0
        child.material = normalMaterial
      }
    })
  }
}
