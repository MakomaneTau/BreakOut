import { Collider } from './Collider.js';
import * as THREE from '../../../public/libs/three137/three.module.js';
import { HealthConfig, DamageType } from '../../config/healthConfig.js';

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

  // Register all obstacles from a platform
  registerPlatformObstacles(platform) {
    console.log('Starting obstacle registration...');
    console.log(`Concrete blocks: ${platform.concreteBlocks ? platform.concreteBlocks.length : 0}`);
    console.log(`Spinning blades: ${platform.spinningBlades ? platform.spinningBlades.length : 0}`);
    console.log(`Laser barriers: ${platform.laserBarriers ? platform.laserBarriers.length : 0}`);

    const registeredColliders = [];
    let registeredCount = 0;

    // Register concrete blocks
    if (platform.concreteBlocks) {
      platform.concreteBlocks.forEach((block, index) => {
        console.log(`Concrete block ${index}: ready=${block.ready}, hasModel=${!!block.model}, name=${block._name}`);
        if (block.ready && block.model) {
          const collider = this.add(block.model, 'box');
          if (collider) {
            registeredColliders.push(collider);
            registeredCount++;
            console.log(`Registered concrete block collider: ${block._name}`);
          }
        } else {
          console.log(`Concrete block ${block._name} not ready yet`);
        }
      });
    }

    // Register spinning blades
    if (platform.spinningBlades) {
      platform.spinningBlades.forEach(blade => {
        if (blade.ready && blade.model) {
          const collider = this.add(blade.model, 'box');
          if (collider) {
            registeredColliders.push(collider);
            registeredCount++;
            console.log(`Registered spinning blade collider: ${blade._name}`);
          }
        } else {
          console.log(`Spinning blade ${blade._name} not ready yet`);
        }
      });
    }

    // Register laser barriers
    if (platform.laserBarriers) {
      platform.laserBarriers.forEach(barrier => {
        if (barrier.ready && barrier.model) {
          const collider = this.add(barrier.model, 'box');
          if (collider) {
            registeredColliders.push(collider);
            registeredCount++;
            console.log(`Registered laser barrier collider: ${barrier._name}`);
          }
        } else {
          console.log(`Laser barrier ${barrier._name} not ready yet`);
        }
      });
    }

    // If not all obstacles are ready, try again later
    const expectedCount = this.getExpectedObstacleCount(platform);
    if (registeredCount < expectedCount) {
      console.log('Some obstacles not ready yet, retrying in 500ms...');
      setTimeout(() => {
        this.registerPlatformObstacles(platform);
      }, 500);
    }

    return registeredColliders;
  }

  // Get expected number of obstacles for a platform
  getExpectedObstacleCount(platform) {
    let expected = 0;
    if (platform.concreteBlocks) expected += platform.concreteBlocks.length;
    if (platform.spinningBlades) expected += platform.spinningBlades.length;
    if (platform.laserBarriers) expected += platform.laserBarriers.length;
    return expected;
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

  /**
   * Check collision and apply damage if player hits an obstacle
   */
  checkPlayerCollisions(playerCollider, player) {
    if (!playerCollider || !player) return null;

    for (const collider of this.colliders) {
      if (collider === playerCollider) continue;

      if (playerCollider.intersects(collider)) {
        // Apply damage based on obstacle type
        const obstacle = collider.mesh.userData;
        
        if (obstacle?.type === 'concrete_block') {
          player.takeDamage(HealthConfig.OBSTACLE_DAMAGE, DamageType.OBSTACLE);
        } else if (obstacle?.type === 'spinning_blade') {
          player.takeDamage(HealthConfig.TRAP_DAMAGE, DamageType.TRAP);
        } else if (obstacle?.type === 'laser') {
          player.takeDamage(HealthConfig.TRAP_DAMAGE, DamageType.TRAP);
        }
        
        return collider;
      }
    }

    return null;
  }
}
