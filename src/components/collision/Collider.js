import * as THREE from '../../../public/libs/three137/three.module.js';

/**
 * Simple AABB collider wrapper around THREE.Box3
 * - Call update() after the mesh moves to refresh bounds
 * - intersects(other) returns true if AABBs overlap
 */
export class Collider {
  constructor(mesh, type = 'box') {
    this.mesh = mesh;
    this.type = type;
    this.box = new THREE.Box3();
    this._tmp = new THREE.Box3();
    this._testBox = new THREE.Box3();
    this.update();
  }

  /**
   * Refresh the world-space bounding box from the mesh
   */
  update() {
    if (!this.mesh) return;
    // setFromObject traverses children and accounts for world matrix
    this.box.setFromObject(this.mesh);
  }

  /**
   * Test intersection vs another collider at a specific position
   * @param {THREE.Vector3} testPosition - Position to test at
   * @param {Collider} other - Other collider to test against
   */
  intersectsAtPosition(testPosition, other) {
    if (!other || !other.box || !this.mesh) return false;
    
    // Store original position
    const originalPos = this.mesh.position.clone();
    
    // Temporarily move mesh to test position and compute box
    this.mesh.position.copy(testPosition);
    this._testBox.setFromObject(this.mesh);
    
    // Restore original position immediately
    this.mesh.position.copy(originalPos);
    
    // Update other collider to ensure it's current
    other.update();
    
    // Test intersection using the temporary test box
    return this._testBox.intersectsBox(other.box);
  }

  /**
   * Test intersection vs another collider
   * Ensures both boxes are up to date before testing
   * @param {Collider} other
   */
  intersects(other) {
    if (!other || !other.box) return false;
    // Keep boxes fresh
    this.update();
    other.update();
    return this.box.intersectsBox(other.box);
  }
}
