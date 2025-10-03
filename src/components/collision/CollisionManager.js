import { Collider } from './Collider.js';
import * as THREE from '../../../public/libs/three137/three.module.js';

export class CollisionManager {
  constructor() {
    this.colliders = [];
  }

  // Add a new collider
  add(mesh, type = 'box') {
    const collider = new Collider(mesh, type);
    this.colliders.push(collider);
    return collider;
  }

  // Remove a collider
  remove(collider) {
    this.colliders = this.colliders.filter(c => c !== collider);
  }

  // Check if a collider intersects any other collider
  findCollisionFor(collider) {
    for (const other of this.colliders) {
      if (other === collider) continue; // skip self
      if (collider.intersects(other)) return other;
    }
    return null;
  }

  // Register all wall meshes from a model as colliders
  registerWallsFromModel(model) {
    const wallColliders = [];
    
    model.traverse((child) => {
      if (child.isMesh && this.isWallMesh(child)) {
        const collider = this.add(child, 'box');
        wallColliders.push(collider);
        console.log(`Registered wall collider: ${child.name || 'unnamed mesh'}`);
      }
    });
    
    return wallColliders;
  }

  // Check if a mesh should be treated as a wall
  isWallMesh(mesh) {
    // Check if mesh name suggests it's a wall
    const name = mesh.name.toLowerCase();
    if (name.includes('wall') || name.includes('barrier') || name.includes('fence')) {
      return true;
    }

    // Check geometry characteristics that suggest a wall
    if (mesh.geometry) {
      const box = new THREE.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE.Vector3());
      
      // If the mesh is tall and thin, it's likely a wall
      const aspectRatio = size.y / Math.max(size.x, size.z);
      if (aspectRatio > 2 && size.y > 2) {
        return true;
      }
    }

    return false;
  }

  // Get all colliders of a specific type
  getCollidersByType(type) {
    return this.colliders.filter(collider => collider.type === type);
  }

  // Get all colliders
  getAllColliders() {
    return this.colliders;
  }

  // Get colliders count
  getColliderCount() {
    return this.colliders.length;
  }

  // Clear all colliders
  clearAll() {
    this.colliders = [];
  }
}
