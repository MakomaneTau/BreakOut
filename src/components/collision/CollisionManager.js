import { Collider } from './Collider.js';
import * as THREE from '../../../public/libs/three137/three.module.js';
import { HealthConfig, DamageType } from '../../config/healthConfig.js';

export class CollisionManager {
  constructor(level = 1) {
    this.colliders = [];
    this.level = level; // Store current game level
    this.meshToCollider = new WeakMap(); // Track meshes to avoid duplicate colliders
    this.registeredDynamicObstacles = new Map(); // Track dynamic obstacles (cubes, spawned lasers)
    
    // Obstacle registration tracking
    this.expectedObstacleCount = 0;
    this.registeredObstacleCount = 0;
    this.registrationComplete = false;
    this.registrationStarted = false;
    
    console.log(`CollisionManager initialized for level ${this.level}`);
  }

  // Add a new collider
  add(mesh, type = 'box') {
    if (!mesh) return null;

    const existing = this.meshToCollider.get(mesh);
    if (existing) {
      return existing;
    }

    const collider = new Collider(mesh, type);
    this.colliders.push(collider);
    this.meshToCollider.set(mesh, collider);
    return collider;
  }

  // Remove a collider
  remove(collider) {
    if (!collider) return;
    this.colliders = this.colliders.filter(c => c !== collider);
    if (collider.mesh) {
      this.meshToCollider.delete(collider.mesh);
    }
  }

  // Check if we already track a collider for this mesh
  hasCollider(mesh) {
    return !!(mesh && this.meshToCollider.get(mesh));
  }

  // Check if a collider intersects any other collider
  findCollisionFor(collider) {
    // Play mode (level 4) has no collision system
    if (this.level >= 4) return null;
    
    for (const other of this.colliders) {
      if (other === collider) continue; // skip self
      if (collider.intersects(other)) {
        return other;
      }
    }
    return null;
  }

  // Register all wall meshes from a model as colliders
  registerWallsFromModel(model) {
    // Play mode (level 4) has no collision system - don't register walls
    if (this.level >= 4) {
      console.log(`🎮 Play Mode: Skipping wall registration - no collision system`);
      return [];
    }
    
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
  registerPlatformObstacles(platform, platformName = 'unknown') {
    console.log(`[${platformName}] Starting obstacle registration...`);
    console.log(`[${platformName}] Concrete blocks: ${platform.concreteBlocks ? platform.concreteBlocks.length : 0}`);
    console.log(`[${platformName}] Spinning blades: ${platform.spinningBlades ? platform.spinningBlades.length : 0}`);
    console.log(`[${platformName}] Laser barriers: ${platform.laserBarriers ? platform.laserBarriers.length : 0}`);

    const registeredColliders = [];
    let platformRegisteredCount = 0;

    // Register concrete blocks
    if (platform.concreteBlocks) {
      platform.concreteBlocks.forEach((block, index) => {
        console.log(`[${platformName}] Concrete block ${index}: ready=${block.ready}, hasModel=${!!block.model}, name=${block._name}`);
        if (block.ready && block.model) {
          if (this.hasCollider(block.model)) {
            console.log(`[${platformName}] ▶ Already registered concrete block collider: ${block._name}`);
            return;
          }
          const collider = this.add(block.model, 'box');
          if (collider) {
            registeredColliders.push(collider);
            platformRegisteredCount++;
            this.registeredObstacleCount++;
            console.log(`[${platformName}] ✓ Registered concrete block collider: ${block._name} (${this.registeredObstacleCount}/${this.expectedObstacleCount})`);
          }
        } else {
          console.log(`[${platformName}] ⏳ Concrete block ${block._name} not ready yet`);
        }
      });
    }

    // Register spinning blades
    if (platform.spinningBlades) {
      platform.spinningBlades.forEach(blade => {
        if (blade.ready && blade.model) {
          if (this.hasCollider(blade.model)) {
            console.log(`[${platformName}] ▶ Already registered spinning blade collider: ${blade._name}`);
            return;
          }
          const collider = this.add(blade.model, 'box');
          if (collider) {
            registeredColliders.push(collider);
            platformRegisteredCount++;
            this.registeredObstacleCount++;
            console.log(`[${platformName}] ✓ Registered spinning blade collider: ${blade._name} (${this.registeredObstacleCount}/${this.expectedObstacleCount})`);
          }
        } else {
          console.log(`[${platformName}] ⏳ Spinning blade ${blade._name} not ready yet`);
        }
      });
    }

    // Register laser barriers
    if (platform.laserBarriers) {
      platform.laserBarriers.forEach(barrier => {
        if (barrier.ready && barrier.model) {
          if (this.hasCollider(barrier.model)) {
            console.log(`[${platformName}] ▶ Already registered laser barrier collider: ${barrier._name}`);
            return;
          }
          const collider = this.add(barrier.model, 'box');
          if (collider) {
            registeredColliders.push(collider);
            platformRegisteredCount++;
            this.registeredObstacleCount++;
            console.log(`[${platformName}] ✓ Registered laser barrier collider: ${barrier._name} (${this.registeredObstacleCount}/${this.expectedObstacleCount})`);
          }
        } else {
          console.log(`[${platformName}] ⏳ Laser barrier ${barrier._name} not ready yet`);
        }
      });
    }

    // Register finish line
    if (platform.finishLine) {
      if (platform.finishLine.ready) {
        // Prioritize collision mesh if available (larger, more reliable)
        const meshToRegister = platform.finishLine.collisionModel || platform.finishLine.model;
        
        if (meshToRegister) {
          if (this.hasCollider(meshToRegister)) {
            console.log(`[${platformName}] ▶ Already registered finish line collider`);
          } else {
            const collider = this.add(meshToRegister, 'box');
            if (collider) {
              registeredColliders.push(collider);
              platformRegisteredCount++;
              // Finish lines don't count towards obstacle count, but we track them
              const colliderType = platform.finishLine.collisionModel ? 'collision mesh' : 'visual mesh';
              console.log(`[${platformName}] ✓ Registered finish line collider (${colliderType})`);
            }
          }
        } else {
          console.log(`[${platformName}] ⚠️ Finish line ready but no mesh found`);
        }
      } else {
        console.log(`[${platformName}] ⏳ Finish line not ready yet`);
      }
    }

    console.log(`[${platformName}] Registered ${platformRegisteredCount} obstacles this attempt`);
    
    // Check if all obstacles are registered
    this._checkRegistrationComplete();

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
    // Play mode (level 4) has no collision system
    if (this.level >= 4) return null;
    
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
        } else if (obstacle?.type === 'flying_cube') {
          player.takeDamage(HealthConfig.OBSTACLE_DAMAGE, DamageType.OBSTACLE);
        }
        // Note: finish_line is handled in Eve.checkDamageCollisions() to avoid damage
        
        return collider;
      }
    }

    return null;
  }

  /**
   * Calculate expected obstacle count based on level
   * @param {Object} platforms - Object containing structure, platform_two, platform_three, platform_four
   */
  _calculateExpectedObstacles(platforms) {
    // Play mode (level 4) has no obstacles
    if (this.level >= 4) {
      return 0;
    }
    
    let expected = 0;
    
    // Level 1 (always present)
    if (platforms.structure && platforms.structure.platform) {
      expected += this.getExpectedObstacleCount(platforms.structure.platform);
    }
    
    // Level 2 obstacles
    if (this.level >= 2 && platforms.platform_two) {
      expected += this.getExpectedObstacleCount(platforms.platform_two);
    }
    
    // Level 3 obstacles
    if (this.level >= 3 && platforms.platform_three) {
      expected += this.getExpectedObstacleCount(platforms.platform_three);
    }
    
    return expected;
  }

  /**
   * Check if all obstacles are registered and mark complete
   */
  _checkRegistrationComplete() {
    if (!this.registrationComplete && this.registeredObstacleCount >= this.expectedObstacleCount && this.expectedObstacleCount > 0) {
      this.registrationComplete = true;
      console.log(`🎯 All obstacles registered! (${this.registeredObstacleCount}/${this.expectedObstacleCount})`);
    }
  }

  /**
   * Register obstacles for the current level
   * @param {Object} platforms - Object containing structure, platform_two, platform_three, platform_four
   */
  registerObstaclesForLevel(platforms) {
    if (!platforms) return;

    // Play mode (level 4) has no obstacles - mark as complete immediately
    if (this.level >= 4) {
      if (!this.registrationStarted) {
        this.registrationStarted = true;
        this.expectedObstacleCount = 0;
        this.registeredObstacleCount = 0;
        this.registrationComplete = true;
        console.log(`🎮 Play Mode (Level 4): No obstacles - free exploration!`);
      }
      return;
    }

    if (!this.registrationStarted) {
      this.registrationStarted = true;
      console.log(`🚀 Starting obstacle registration for level ${this.level}...`);

      // Calculate expected obstacle count
      this.expectedObstacleCount = this._calculateExpectedObstacles(platforms);
      console.log(`📊 Expected obstacles: ${this.expectedObstacleCount}`);
    } else if (this.registrationComplete) {
      return;
    } else {
      console.log(`🔁 Continuing obstacle registration for level ${this.level}...`);
    }

    // Always register Level 1 obstacles (structure.platform)
    if (platforms.structure && platforms.structure.platform) {
      console.log('📍 Registering Level 1 obstacles...');
      this.registerPlatformObstacles(platforms.structure.platform, 'Level 1');
    }

    // Register Level 2 obstacles if level >= 2
    if (this.level >= 2 && platforms.platform_two) {
      console.log('📍 Registering Level 2 obstacles...');
      this.registerPlatformObstacles(platforms.platform_two, 'Level 2');
      
      // Register initial flying cubes from spawner
      if (platforms.platform_two.flyingCubesSpawner) {
        this.registerFlyingCubes(platforms.platform_two.flyingCubesSpawner);
      }
    }

    // Register Level 3 obstacles if level >= 3
    if (this.level >= 3 && platforms.platform_three) {
      console.log('📍 Registering Level 3 obstacles...');
      this.registerPlatformObstacles(platforms.platform_three, 'Level 3');
      
      // Register initial flying cubes from spawner
      if (platforms.platform_three.flyingCubesSpawner) {
        this.registerFlyingCubes(platforms.platform_three.flyingCubesSpawner);
      }
      
      // Register initial laser barriers from spawner
      if (platforms.platform_three.laserBarrierSpawner) {
        this.registerDynamicLasers(platforms.platform_three.laserBarrierSpawner);
      }
    }

    console.log(`📈 Total colliders registered so far: ${this.colliders.length}`);
    console.log(`📊 Progress: ${this.registeredObstacleCount}/${this.expectedObstacleCount}`);
  }

  /**
   * Register flying cubes from a spawner
   * @param {FlyingCubesSpawner} spawner 
   */
  registerFlyingCubes(spawner) {
    if (!spawner || !spawner.cubes) return;
    
    spawner.cubes.forEach(cube => {
      this.registerDynamicObstacle(cube, 'flying_cube', spawner);
    });
    
    console.log(`Registered ${spawner.cubes.length} flying cubes`);
  }

  /**
   * Register dynamic laser barriers from a spawner
   * @param {LaserBarrierSpawner} spawner 
   */
  registerDynamicLasers(spawner) {
    if (!spawner || !spawner.barriers) return;
    
    spawner.barriers.forEach(barrier => {
      this.registerDynamicObstacle(barrier, 'laser', spawner);
    });
    
    console.log(`Registered ${spawner.barriers.length} dynamic laser barriers`);
  }

  /**
   * Register a single dynamic obstacle
   * @param {THREE.Mesh|THREE.Group} obstacle - The obstacle mesh/group
   * @param {string} type - The obstacle type
   * @returns {Collider|null} The created collider or null if already registered
   */
  registerDynamicObstacle(obstacle, type, source = null) {
    if (!obstacle) return null;
    
    // Check if already registered
    if (this.registeredDynamicObstacles.has(obstacle)) {
      const entry = this.registeredDynamicObstacles.get(obstacle);
      return entry?.collider || null;
    }
    
    // Ensure userData.type is set
    if (!obstacle.userData) obstacle.userData = {};
    if (!obstacle.userData.type) obstacle.userData.type = type;
    obstacle.visible = true;
    
    // Create collider
    const collider = this.add(obstacle, 'box');
    
    // Store in Map with metadata
    this.registeredDynamicObstacles.set(obstacle, { collider, type, source });
    
    return collider;
  }

  /**
   * Unregister a single dynamic obstacle
   * @param {THREE.Mesh|THREE.Group} obstacle - The obstacle to remove
   * @returns {boolean} True if successfully removed
   */
  unregisterDynamicObstacle(obstacle) {
    if (!obstacle || !this.registeredDynamicObstacles.has(obstacle)) {
      return false;
    }
    
    const entry = this.registeredDynamicObstacles.get(obstacle);
    const collider = entry?.collider;
    
    // Remove from colliders array
    this.remove(collider);
    
    // Remove from WeakMap
    this.registeredDynamicObstacles.delete(obstacle);
    
    return true;
  }

  /**
   * Sync dynamic obstacles - called every frame to keep collisions up to date
   * @param {Object} platforms - Object containing structure, platform_two, platform_three
   */
  syncDynamicObstacles(platforms) {
    // Sync Level 2 flying cubes
    if (this.level >= 2 && platforms.platform_two?.flyingCubesSpawner) {
      this.syncFlyingCubes(platforms.platform_two.flyingCubesSpawner);
    }

    // Sync Level 3 flying cubes and laser barriers
    if (this.level >= 3 && platforms.platform_three) {
      if (platforms.platform_three.flyingCubesSpawner) {
        this.syncFlyingCubes(platforms.platform_three.flyingCubesSpawner);
      }
      
      if (platforms.platform_three.laserBarrierSpawner) {
        this.syncLaserBarriers(platforms.platform_three.laserBarrierSpawner);
      }
    }
  }

  /**
   * Sync flying cubes from a spawner
   * @param {FlyingCubesSpawner} spawner 
   */
  syncFlyingCubes(spawner) {
    if (!spawner || !spawner.cubes) return;
    
    // Register any new cubes that aren't tracked yet
    spawner.cubes.forEach(cube => {
      if (!this.registeredDynamicObstacles.has(cube)) {
        this.registerDynamicObstacle(cube, 'flying_cube', spawner);
      }
    });
    
    // Note: We don't need to manually remove old cubes because:
    // 1. WeakMap automatically cleans up when objects are garbage collected
    // 2. FlyingCubesSpawner loops cubes (they don't get removed)
  }

  /**
   * Sync laser barriers from a spawner
   * @param {LaserBarrierSpawner} spawner 
   */
  syncLaserBarriers(spawner) {
    if (!spawner || !spawner.barriers) return;
    
    // Get current barriers from spawner
    const currentBarriers = new Set(spawner.barriers);
    
    // Register any new barriers
    spawner.barriers.forEach(barrier => {
      if (!this.registeredDynamicObstacles.has(barrier)) {
        this.registerDynamicObstacle(barrier, 'laser', spawner);
      }
    });
    
    // Remove barriers that no longer exist in spawner
    const toRemove = [];
    for (const [obstacle, entry] of this.registeredDynamicObstacles.entries()) {
      if (entry.type === 'laser' && entry.source === spawner && !currentBarriers.has(obstacle)) {
        toRemove.push(obstacle);
      }
    }

    toRemove.forEach(obstacle => this.unregisterDynamicObstacle(obstacle));
  }

  /**
   * Get registration status
   * @returns {Object} Status object with registration info
   */
  getRegistrationStatus() {
    return {
      started: this.registrationStarted,
      complete: this.registrationComplete,
      registered: this.registeredObstacleCount,
      expected: this.expectedObstacleCount,
      progress: this.expectedObstacleCount > 0 ? (this.registeredObstacleCount / this.expectedObstacleCount) : 0
    };
  }

  /**
   * Check if obstacle registration is complete
   * @returns {boolean}
   */
  isRegistrationComplete() {
    return this.registrationComplete;
  }

  /**
   * Get registration progress (0-1)
   * @returns {number}
   */
  getRegistrationProgress() {
    if (this.expectedObstacleCount === 0) return 0;
    return Math.min(1, this.registeredObstacleCount / this.expectedObstacleCount);
  }

  /**
   * Clear all colliders (useful for level switching)
   */
  clearAllColliders() {
    this.colliders = [];
    this.meshToCollider = new WeakMap();
    this.registeredDynamicObstacles = new Map();
    this.registeredObstacleCount = 0;
    this.expectedObstacleCount = 0;
    this.registrationComplete = false;
    this.registrationStarted = false;
    console.log('All colliders cleared');
  }
}
