/**
 * Mouse interaction utilities for Three.js 3D scenes
 */

import * as THREE from 'three'

export interface MouseInteractionOptions {
  camera: THREE.Camera
  scene: THREE.Scene
  container: HTMLElement
  onHover?: (object: THREE.Object3D | null, point?: THREE.Vector3) => void
  onClick?: (object: THREE.Object3D, point: THREE.Vector3) => void
  onDoubleClick?: (object: THREE.Object3D, point: THREE.Vector3) => void
  selectableObjects?: THREE.Object3D[]
  hoverCursor?: string
}

/**
 * Class to handle mouse interactions with 3D objects
 */
export class MouseInteraction {
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private camera: THREE.Camera
  private scene: THREE.Scene
  private container: HTMLElement
  private selectableObjects: THREE.Object3D[]
  private hoveredObject: THREE.Object3D | null = null
  private originalCursor: string
  
  // Callbacks
  private onHover?: (object: THREE.Object3D | null, point?: THREE.Vector3) => void
  private onClick?: (object: THREE.Object3D, point: THREE.Vector3) => void
  private onDoubleClick?: (object: THREE.Object3D, point: THREE.Vector3) => void
  
  // Options
  private hoverCursor: string

  constructor(options: MouseInteractionOptions) {
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.camera = options.camera
    this.scene = options.scene
    this.container = options.container
    this.selectableObjects = options.selectableObjects || []
    this.originalCursor = this.container.style.cursor || 'default'
    this.hoverCursor = options.hoverCursor || 'pointer'
    
    // Bind callbacks
    this.onHover = options.onHover
    this.onClick = options.onClick
    this.onDoubleClick = options.onDoubleClick
    
    // Add event listeners
    this.addEventListeners()
  }

  /**
   * Update selectable objects
   */
  setSelectableObjects(objects: THREE.Object3D[]): void {
    this.selectableObjects = objects
  }

  /**
   * Add an object to the selectable list
   */
  addSelectableObject(object: THREE.Object3D): void {
    if (!this.selectableObjects.includes(object)) {
      this.selectableObjects.push(object)
    }
  }

  /**
   * Remove an object from the selectable list
   */
  removeSelectableObject(object: THREE.Object3D): void {
    const index = this.selectableObjects.indexOf(object)
    if (index > -1) {
      this.selectableObjects.splice(index, 1)
    }
  }

  /**
   * Update mouse position and perform raycasting
   */
  private updateMouse(event: MouseEvent): THREE.Intersection[] {
    const rect = this.container.getBoundingClientRect()
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // Find intersections
    return this.raycaster.intersectObjects(this.selectableObjects, true)
  }

  /**
   * Handle mouse move events
   */
  private onMouseMove = (event: MouseEvent): void => {
    const intersects = this.updateMouse(event)
    
    if (intersects.length > 0) {
      const intersectedObject = this.findSelectableParent(intersects[0].object)
      
      if (intersectedObject !== this.hoveredObject) {
        // Handle hover out
        if (this.hoveredObject) {
          this.container.style.cursor = this.originalCursor
          this.onHover?.(null)
        }
        
        // Handle hover in
        this.hoveredObject = intersectedObject
        if (this.hoveredObject) {
          this.container.style.cursor = this.hoverCursor
          this.onHover?.(this.hoveredObject, intersects[0].point)
        }
      }
    } else {
      // No intersection
      if (this.hoveredObject) {
        this.container.style.cursor = this.originalCursor
        this.onHover?.(null)
        this.hoveredObject = null
      }
    }
  }

  /**
   * Handle mouse click events
   */
  private onMouseClick = (event: MouseEvent): void => {
    const intersects = this.updateMouse(event)
    
    if (intersects.length > 0) {
      const intersectedObject = this.findSelectableParent(intersects[0].object)
      if (intersectedObject) {
        this.onClick?.(intersectedObject, intersects[0].point)
      }
    }
  }

  /**
   * Handle double click events
   */
  private onMouseDoubleClick = (event: MouseEvent): void => {
    const intersects = this.updateMouse(event)
    
    if (intersects.length > 0) {
      const intersectedObject = this.findSelectableParent(intersects[0].object)
      if (intersectedObject) {
        this.onDoubleClick?.(intersectedObject, intersects[0].point)
      }
    }
  }

  /**
   * Find the selectable parent object in the hierarchy
   */
  private findSelectableParent(object: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = object
    
    while (current) {
      if (this.selectableObjects.includes(current)) {
        return current
      }
      current = current.parent
    }
    
    return null
  }

  /**
   * Add event listeners to the container
   */
  private addEventListeners(): void {
    this.container.addEventListener('mousemove', this.onMouseMove)
    this.container.addEventListener('click', this.onMouseClick)
    this.container.addEventListener('dblclick', this.onMouseDoubleClick)
  }

  /**
   * Remove event listeners and clean up
   */
  dispose(): void {
    this.container.removeEventListener('mousemove', this.onMouseMove)
    this.container.removeEventListener('click', this.onMouseClick)
    this.container.removeEventListener('dblclick', this.onMouseDoubleClick)
    
    // Reset cursor
    this.container.style.cursor = this.originalCursor
  }
}

/**
 * Create a mouse interaction instance
 */
export function createMouseInteraction(options: MouseInteractionOptions): MouseInteraction {
  return new MouseInteraction(options)
}
