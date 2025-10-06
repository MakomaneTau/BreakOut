import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';
import { DRACOLoader } from '../../public/libs/three137/DRACOLoader.js';
import { PlayerHealth } from './player/PlayerHealth.js';
import { HealthConfig, DamageType } from '../config/healthConfig.js';

class Eve {
  constructor(game) {
    this.assetsPath = game.assetsPath;
    this.loadingBar = game.loadingBar;
    this.scene = game.scene;
    this.collisionManager = game.collisionManager;
    this.ready = false;
    this.model = null;

    this.raycaster = new THREE.Raycaster();
    this.down = new THREE.Vector3(0, -1, 0);

    this.footOffset = 0;
    this.velocityY = 0;
    this.gravity = 30;
    this.jumpSpeed = 12;
    this.runSpeed = 5;
    this.rollDistance = 1.2;
    this.epsilon = 0.05;
    this.fadeDuration = 0.12;

    this.keyStates = {};
    this.isRolling = false;
    this.rollTimer = 0;
    this.rollDuration = 0.5;
    this.rollVelocity = new THREE.Vector3();

    this.mixer = null;
    this.animations = [];
    this.actions = {};
    this.actionDurations = {};
    this.currentAction = null;
    this.currentActionName = null;

    // collision detection
    this.collider = null;

    // Initialize health system
    this.health = new PlayerHealth({
      maxHealth: HealthConfig.MAX_HEALTH,
      maxLives: HealthConfig.MAX_LIVES,
      permadeath: HealthConfig.PERMADEATH_MODE,
      initialPosition: { x: 0, y: 1, z: 0 },
      onDamage: this.onPlayerDamage.bind(this),
      onHeal: this.onPlayerHeal.bind(this),
      onDeath: this.onPlayerDeath.bind(this),
      onRespawn: this.onPlayerRespawn.bind(this),
      onGameOver: this.onPlayerGameOver.bind(this),
      onLifeLost: this.onPlayerLifeLost.bind(this),
    });

    this.load();
    this.setupKeyboardControls();
  }

  load() {
    const loader = new GLTFLoader().setPath(`${this.assetsPath}models/eve/`);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(`../../public/libs/three137/draco/gltf/`);
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      'EveWorking.glb',
      gltf => {
        gltf.scene.scale.set(0.7, 0.7, 0.7);
        gltf.scene.position.set(3, 0, 0);
        gltf.scene.rotation.y = -Math.PI / 2;

        this.scene.add(gltf.scene);
        this.model = gltf.scene;

        const box = new THREE.Box3().setFromObject(gltf.scene);
        this.footOffset = -box.min.y || 0;

        const rayOrigin = new THREE.Vector3(this.model.position.x, this.model.position.y + 10, this.model.position.z);
        this.raycaster.set(rayOrigin, this.down);

        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
          .filter(i => !this.isDescendantOf(i.object, this.model));

        if (intersects.length > 0) {
          const groundY = intersects[0].point.y + this.footOffset;
          this.model.position.y = groundY;
        }

        // Create collider for collision detection (assumes collisionManager.add returns collider with .mesh & .update())
        if (this.collisionManager) {
          this.collider = this.collisionManager.add(this.model, 'box');
        }

        this.mixer = new THREE.AnimationMixer(gltf.scene);
        this.animations = gltf.animations || [];
        this.actions = {};
        this.actionDurations = {};

        this.animations.forEach((clip) => {
          const action = this.mixer.clipAction(clip);
          const name = clip.name;
          const lower = name.toLowerCase();

          if (lower.includes('jump') || lower.includes('roll')) {
            action.setLoop(THREE.LoopOnce, 0);
            action.clampWhenFinished = true;
          } else {
            action.setLoop(THREE.LoopRepeat);
          }

          this.actions[name] = action;
          this.actionDurations[name] = clip.duration || 0.6;
        });

        if (this.actions['idle']) {
          this.currentAction = this.actions['idle'];
          this.currentAction.play();
          this.currentActionName = 'idle';
        }

        this.mixer.addEventListener('finished', (e) => {
          const finishedName = this.getActionNameFromAction(e.action);
          if (finishedName && finishedName.toLowerCase().includes('roll')) {
            this.isRolling = false;
          }
        });

        this.loadingBar.visible = false;
        this.ready = true;
      },
      xhr => this.loadingBar.update('eve', xhr.loaded, xhr.total),
      err => console.error(err)
    );
  }

  findActionNameMatch(substr) {
    const lower = substr.toLowerCase();
    for (const name in this.actions) {
      if (name.toLowerCase().includes(lower)) return name;
    }
    return null;
  }

  getActionNameFromAction(action) {
    for (const name in this.actions) {
      if (this.actions[name] === action) return name;
    }
    return null;
  }

  setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      if (!this.ready) return;
      const key = event.key.toLowerCase();

      // allow repeat; pressing another key should still register
      this.keyStates[key] = true;

      if (key === ' ') { // Space → Jump
        if (this.onGround) {
          this.velocityY = this.jumpSpeed;
          this.onGround = false;
        }
      } else if (key === 'shift') { // Shift → Quick Roll
        if (this.onGround && !this.isRolling) {
          this.startRoll();
        }
      }
      // WASD keys and rotation keys are handled in the update loop
    });

    document.addEventListener('keyup', (event) => {
      if (!this.ready) return;
      const key = event.key.toLowerCase();
      this.keyStates[key] = false;
    });
  }

  startRoll() {
    this.isRolling = true;
    this.rollTimer = 0;

    const rollName = this.findActionNameMatch('roll') || this.findActionNameMatch('quickroll');
    this.rollDuration = (rollName && this.actionDurations[rollName]) ? this.actionDurations[rollName] : 0.5;

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.model.quaternion).setY(0).normalize();
    const rd = this.rollDistance;
    this.rollVelocity.copy(forward).multiplyScalar(rd / this.rollDuration);

    this.playAction(rollName || 'QuickRoll', this.fadeDuration);
  }

  playAction(name, fadeDuration = this.fadeDuration) {
    if (!name) return;

    let action = this.actions[name];
    let resolvedName = name;
    if (!action) {
      const match = this.findActionNameMatch(name);
      if (match) {
        action = this.actions[match];
        resolvedName = match;
      } else {
        action = this.actions['idle'];
        resolvedName = 'idle';
        if (!action) return;
      }
    }

    if (this.currentActionName === resolvedName) return;

    if (this.currentAction) {
      this.currentAction.fadeOut(fadeDuration);
    }
    action.reset();
    action.fadeIn(fadeDuration);
    action.play();

    this.currentAction = action;
    this.currentActionName = resolvedName;
  }

  isDescendantOf(obj, parent) {
    while (obj) {
      if (obj === parent) return true;
      obj = obj.parent;
    }
    return false;
  }

  detectGroundType() {
    return 'road';
  }

  // Check collision at a specific position
  checkCollisionAtPosition(testPosition) {
    if (!this.collider || !this.collisionManager) return false;

    // Temporarily move collider to test position
    const originalPos = this.collider.mesh.position.clone();
    this.collider.mesh.position.copy(testPosition);
    if (typeof this.collider.update === 'function') this.collider.update();

    // Check for collision
    const collision = this.collisionManager.findCollisionFor(this.collider);

    // Restore original position
    this.collider.mesh.position.copy(originalPos);
    this.collider.update();
    
    // If collision detected, apply damage
    if (collision) {
      this.handleCollisionDamage(collision);
    }
    
    return collision !== null;
  }

  /**
   * Health system callbacks
   */
  onPlayerDamage(damage, currentHealth, maxHealth, damageType) {
    console.log(`Took ${damage} damage from ${damageType}. Health: ${currentHealth}/${maxHealth}`);
    // Flash red or shake camera here
  }

  onPlayerHeal(amount, currentHealth, maxHealth) {
    console.log(`Healed ${amount}. Health: ${currentHealth}/${maxHealth}`);
  }

  onPlayerDeath(remainingLives) {
    console.log(`Player died! Lives remaining: ${remainingLives}`);
    // Play death animation here
  }

  onPlayerRespawn(checkpoint, health, lives) {
    console.log(`Respawning at checkpoint with ${health} HP and ${lives} lives`);
    // Teleport player to checkpoint
    if (this.model) {
      this.model.position.set(checkpoint.x, checkpoint.y, checkpoint.z);
    }
  }

  onPlayerGameOver(stats) {
    console.log('Game Over!', stats);
    // Disable player controls here
    this.ready = false;
  }

  onPlayerLifeLost(currentLives, maxLives) {
    console.log(`Lost a life! ${currentLives}/${maxLives} remaining`);
  }

  /**
   * Public method to take damage
   * This can be called from collision detection systems
   */
  takeDamage(amount, damageType = DamageType.ENVIRONMENTAL) {
    return this.health.takeDamage(amount, damageType);
  }

  /**
   * Public method to heal
   */
  heal(amount) {
    return this.health.heal(amount);
  }

  /**
   * Set a checkpoint
   */
  setCheckpoint(position) {
    this.health.setCheckpoint(position || this.model.position);
  }

  /**
   * Handle damage when collision is detected
   */
  handleCollisionDamage(collision) {
    if (!this.health || !this.health.isAlive) return;
    
    // Get obstacle type from mesh userData or mesh name
    const mesh = collision.mesh;
    const obstacleType = mesh.userData?.type || this.getObstacleTypeFromName(mesh.name);
    
    // Apply damage based on obstacle type
    let damage = HealthConfig.OBSTACLE_DAMAGE; // default damage
    let damageType = DamageType.OBSTACLE; // default type
    
    switch (obstacleType) {
      case 'concrete_block':
        damage = HealthConfig.OBSTACLE_DAMAGE;
        damageType = DamageType.OBSTACLE;
        break;
      case 'spinning_blade':
        damage = HealthConfig.TRAP_DAMAGE;
        damageType = DamageType.TRAP;
        break;
      case 'laser':
      case 'laser_barrier':
        damage = HealthConfig.TRAP_DAMAGE;
        damageType = DamageType.TRAP;
        break;
      default:
        // Try to determine type from mesh name
        const name = mesh.name.toLowerCase();
        if (name.includes('blade') || name.includes('spinning')) {
          damage = HealthConfig.TRAP_DAMAGE;
          damageType = DamageType.TRAP;
        } else if (name.includes('laser')) {
          damage = HealthConfig.TRAP_DAMAGE;
          damageType = DamageType.TRAP;
        }
        break;
    }
    
    // Apply damage
    this.takeDamage(damage, damageType);
  }

  /**
   * Determine obstacle type from mesh name
   */
  getObstacleTypeFromName(name) {
    if (!name) return 'unknown';
    
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('concrete') || lowerName.includes('block')) {
      return 'concrete_block';
    } else if (lowerName.includes('blade') || lowerName.includes('spinning')) {
      return 'spinning_blade';
    } else if (lowerName.includes('laser')) {
      return 'laser';
    }
    
    return 'unknown';
  }

  update(time, delta) {
    if (!this.ready) return;
    if (this.mixer) this.mixer.update(delta);

    // Update health system first
    this.health.update(delta);

    // Check for damage collisions (separate from movement collision)
    this.checkDamageCollisions();

    const rayOrigin = new THREE.Vector3(this.model.position.x, this.model.position.y + 0.5, this.model.position.z);
    this.raycaster.set(rayOrigin, this.down);

    const intersects = this.raycaster.intersectObjects(this.scene.children, true)
      .filter(i => !this.isDescendantOf(i.object, this.model));

    let groundY = -Infinity;
    if (intersects.length > 0) {
      groundY = intersects[0].point.y + this.footOffset;
    }

    if (groundY !== -Infinity) {
      const dist = this.model.position.y - groundY;
      if (dist <= this.epsilon && this.velocityY <= 0) {
        this.model.position.y = groundY;
        this.velocityY = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    } else {
      this.onGround = false;
    }

    if (!this.onGround) {
      this.velocityY -= this.gravity * delta;
      this.model.position.y += this.velocityY * delta;
    }

    let desiredAction = 'idle';
    let isMoving = false;

    if (this.isRolling) {
      // Check collision before rolling
      const testPos = this.model.position.clone().addScaledVector(this.rollVelocity, delta);
      if (!this.checkCollisionAtPosition(testPos)) {
        this.model.position.addScaledVector(this.rollVelocity, delta);
      }
      this.rollTimer += delta;
      if (this.rollTimer >= this.rollDuration) {
        this.isRolling = false;
      }
      desiredAction = this.findActionNameMatch('roll') || 'QuickRoll';
    } else if (!this.onGround) {
      desiredAction = this.findActionNameMatch('jump') || 'Jump';
    } else {
      // Handle rotation first (Q/E keys)
      const rotationSpeed = 3.0; // radians per second
      if (this.keyStates['q']) {
        this.model.rotation.y += rotationSpeed * delta;
      }
      if (this.keyStates['e']) {
        this.model.rotation.y -= rotationSpeed * delta;
      }

      // Handle WASD movement
      const movementVector = new THREE.Vector3();
      
      // Forward/Backward (W/S)
      if (this.keyStates['w']) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.model.quaternion).setY(0).normalize();
        movementVector.add(forward);
        isMoving = true;
      }
      if (this.keyStates['s']) {
        const backward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.model.quaternion).setY(0).normalize();
        movementVector.add(backward);
        isMoving = true;
      }
      
      // Left/Right (A/D) - Fixed the mapping
      if (this.keyStates['a']) {
        const left = new THREE.Vector3(1, 0, 0).applyQuaternion(this.model.quaternion).setY(0).normalize();
        movementVector.add(left);
        isMoving = true;
      }
      if (this.keyStates['d']) {
        const right = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.model.quaternion).setY(0).normalize();
        movementVector.add(right);
        isMoving = true;
      }

      if (isMoving) {
        // Normalize movement vector to prevent faster diagonal movement
        movementVector.normalize();
        movementVector.multiplyScalar(this.runSpeed * delta);
        
        // Check collision before moving
        const testPos = this.model.position.clone().add(movementVector);
        if (!this.checkCollisionAtPosition(testPos)) {
          this.model.position.add(movementVector);
        }

        // Determine animation based on movement direction
        const groundType = this.detectGroundType();
        if (groundType === 'stairs' && this.keyStates['w']) {
          desiredAction = this.findActionNameMatch('upstairs') || 'UpStairs';
          this.model.position.y += (this.runSpeed * 0.6) * delta;
        } else {
          // Check for specific movement patterns
          if (this.keyStates['w'] && this.keyStates['a']) {
            desiredAction = this.findActionNameMatch('leftslide') || 'LeftSlide';
          } else if (this.keyStates['w'] && this.keyStates['d']) {
            desiredAction = this.findActionNameMatch('rightslide') || 'RightSlide';
          } else if (this.keyStates['s'] && this.keyStates['a']) {
            desiredAction = this.findActionNameMatch('backleft') || 'BackLeft';
          } else if (this.keyStates['s'] && this.keyStates['d']) {
            desiredAction = this.findActionNameMatch('backright') || 'BackRight';
          } else if (this.keyStates['w']) {
            desiredAction = this.findActionNameMatch('run') || 'running';
          } else if (this.keyStates['s']) {
            desiredAction = this.findActionNameMatch('backward') || 'Backward';
          } else if (this.keyStates['a']) {
            desiredAction = this.findActionNameMatch('strafeleft') || 'StrafeLeft';
          } else if (this.keyStates['d']) {
            desiredAction = this.findActionNameMatch('straferight') || 'StrafeRight';
          }
        }
      } else {
        desiredAction = this.findActionNameMatch('idle') || 'idle';
      }
    }

    this.playAction(desiredAction, this.fadeDuration);
  }

  /**
   * Check for collisions that should cause damage
   * This runs continuously and is separate from movement collision detection
   */
  checkDamageCollisions() {
    if (!this.collider || !this.collisionManager || !this.health || !this.health.isAlive) return;
    
    // Update collider position to current player position
    this.collider.update();
    
    // Check for collisions with obstacles
    const collision = this.collisionManager.findCollisionFor(this.collider);
    
    if (collision) {
      this.handleCollisionDamage(collision);
    }
  }
}

export { Eve };










// import * as THREE from '../../public/libs/three137/three.module.js';
// import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';
// import { DRACOLoader } from '../../public/libs/three137/DRACOLoader.js';
// import { PlayerHealth } from './player/PlayerHealth.js';
// import { HealthConfig, DamageType } from '../config/healthConfig.js';

// class Eve {
//   constructor(game) {
//     this.assetsPath = game.assetsPath;
//     this.loadingBar = game.loadingBar;
//     this.scene = game.scene;
//     this.collisionManager = game.collisionManager;
//     this.ready = false;
//     this.model = null;

//     this.raycaster = new THREE.Raycaster();
//     this.down = new THREE.Vector3(0, -1, 0);

//     this.footOffset = 0;
//     this.velocityY = 0;
//     this.gravity = 30;
//     this.jumpSpeed = 12;
//     this.runSpeed = 5;
//     this.rollDistance = 1.2;
//     this.epsilon = 0.05;
//     this.fadeDuration = 0.12;

//     this.keyStates = {};
//     this.isRolling = false;
//     this.rollTimer = 0;
//     this.rollDuration = 0.5;
//     this.rollVelocity = new THREE.Vector3();

//     this.mixer = null;
//     this.animations = [];
//     this.actions = {};
//     this.actionDurations = {};
//     this.currentAction = null;
//     this.currentActionName = null;

//     // collision detection
//     this.collider = null;

//     // Finish line detection
//     this.hasFinished = false;
//     this.finishLineReached = false;
//     this.victoryEffects = [];
//     this.victoryTimer = 0;
//     this.victoryDuration = 3; // seconds for victory sequence

//     // Initialize health system
//     this.health = new PlayerHealth({
//       maxHealth: HealthConfig.MAX_HEALTH,
//       maxLives: HealthConfig.MAX_LIVES,
//       permadeath: HealthConfig.PERMADEATH_MODE,
//       initialPosition: { x: 0, y: 1, z: 0 },
//       onDamage: this.onPlayerDamage.bind(this),
//       onHeal: this.onPlayerHeal.bind(this),
//       onDeath: this.onPlayerDeath.bind(this),
//       onRespawn: this.onPlayerRespawn.bind(this),
//       onGameOver: this.onPlayerGameOver.bind(this),
//       onLifeLost: this.onPlayerLifeLost.bind(this),
//     });

//     this.load();
//     this.setupKeyboardControls();
//   }

//   load() {
//     const loader = new GLTFLoader().setPath(`${this.assetsPath}models/eve/`);

//     const dracoLoader = new DRACOLoader();
//     dracoLoader.setDecoderPath(`../../public/libs/three137/draco/gltf/`);
//     loader.setDRACOLoader(dracoLoader);

//     loader.load(
//       'EveWorking.glb',
//       gltf => {
//         gltf.scene.scale.set(0.7, 0.7, 0.7);
//         gltf.scene.position.set(3, 0, 0);
//         gltf.scene.rotation.y = -Math.PI / 2;

//         this.scene.add(gltf.scene);
//         this.model = gltf.scene;

//         const box = new THREE.Box3().setFromObject(gltf.scene);
//         this.footOffset = -box.min.y || 0;

//         const rayOrigin = new THREE.Vector3(this.model.position.x, this.model.position.y + 10, this.model.position.z);
//         this.raycaster.set(rayOrigin, this.down);

//         const intersects = this.raycaster.intersectObjects(this.scene.children, true)
//           .filter(i => !this.isDescendantOf(i.object, this.model));

//         if (intersects.length > 0) {
//           const groundY = intersects[0].point.y + this.footOffset;
//           this.model.position.y = groundY;
//         }

//         // Create collider for collision detection (assumes collisionManager.add returns collider with .mesh & .update())
//         if (this.collisionManager) {
//           this.collider = this.collisionManager.add(this.model, 'box');
//         }

//         this.mixer = new THREE.AnimationMixer(gltf.scene);
//         this.animations = gltf.animations || [];
//         this.actions = {};
//         this.actionDurations = {};

//         this.animations.forEach((clip) => {
//           const action = this.mixer.clipAction(clip);
//           const name = clip.name;
//           const lower = name.toLowerCase();

//           if (lower.includes('jump') || lower.includes('roll') || lower.includes('victory')) {
//             action.setLoop(THREE.LoopOnce, 0);
//             action.clampWhenFinished = true;
//           } else {
//             action.setLoop(THREE.LoopRepeat);
//           }

//           this.actions[name] = action;
//           this.actionDurations[name] = clip.duration || 0.6;
//         });

//         if (this.actions['idle']) {
//           this.currentAction = this.actions['idle'];
//           this.currentAction.play();
//           this.currentActionName = 'idle';
//         }

//         this.mixer.addEventListener('finished', (e) => {
//           const finishedName = this.getActionNameFromAction(e.action);
//           if (finishedName && finishedName.toLowerCase().includes('roll')) {
//             this.isRolling = false;
//           }
//         });

//         this.loadingBar.visible = false;
//         this.ready = true;
//       },
//       xhr => this.loadingBar.update('eve', xhr.loaded, xhr.total),
//       err => console.error(err)
//     );
//   }

//   /**
//    * Check if player has reached the finish line
//    */
//   checkFinishLine() {
//     if (this.hasFinished || !this.model || !this.scene) return;

//     // Find finish line in scene
//     this.scene.traverse((child) => {
//       if (child.userData && child.userData.isFinishLine && !this.finishLineReached) {
//         const finishLine = child;
//         const playerBox = new THREE.Box3().setFromObject(this.model);
//         const finishBox = new THREE.Box3().setFromObject(finishLine);

//         if (playerBox.intersectsBox(finishBox)) {
//           this.finishLineReached = true;
//           this.startVictorySequence();
//         }
//       }
//     });

//     // Alternative: Check position-based finish line (x <= -45)
//     if (!this.finishLineReached && this.model.position.x <= -45) {
//       this.finishLineReached = true;
//       this.startVictorySequence();
//     }
//   }

//   /**
//    * Start victory sequence when finish line is reached
//    */
//   startVictorySequence() {
//     if (this.hasFinished) return;

//     this.hasFinished = true;
//     this.victoryTimer = 0;

//     console.log('🎉 Finish line reached! Victory!');

//     // Play victory animation
//     this.playVictoryAnimation();

//     // Create victory effects
//     this.createVictoryEffects();

//     // Disable player controls
//     this.ready = false;

//     // Trigger any game completion callbacks
//     if (this.onVictory) {
//       this.onVictory();
//     }
//   }

//   /**
//    * Play victory animation if available
//    */
//   playVictoryAnimation() {
//     const victoryAction = this.findActionNameMatch('victory') || 
//                          this.findActionNameMatch('celebrate') || 
//                          this.findActionNameMatch('dance');

//     if (victoryAction) {
//       this.playAction(victoryAction, 0.2);
//     } else {
//       // Fallback: play idle animation
//       this.playAction('idle', 0.2);
//     }
//   }

//   /**
//    * Create visual effects for victory
//    */
//   createVictoryEffects() {
//     if (!this.model) return;

//     const playerPos = this.model.position.clone();

//     // 1. Confetti particles
//     this.createConfettiEffect(playerPos);

//     // 2. Victory text/particles
//     this.createVictoryText(playerPos);

//     // 3. Light effects
//     this.createLightEffects(playerPos);

//     // 4. Screen flash
//     this.createScreenFlash();
//   }

//   /**
//    * Create confetti particle effect
//    */
//   createConfettiEffect(center) {
//     const confettiCount = 50;
//     const confettiGeometry = new THREE.PlaneGeometry(0.2, 0.2);
    
//     for (let i = 0; i < confettiCount; i++) {
//       const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
//       const color = colors[Math.floor(Math.random() * colors.length)];
      
//       const confettiMaterial = new THREE.MeshBasicMaterial({
//         color: color,
//         side: THREE.DoubleSide
//       });

//       const confetti = new THREE.Mesh(confettiGeometry, confettiMaterial);
      
//       // Random position around player
//       confetti.position.copy(center);
//       confetti.position.x += (Math.random() - 0.5) * 3;
//       confetti.position.y += Math.random() * 5;
//       confetti.position.z += (Math.random() - 0.5) * 3;
      
//       // Random rotation
//       confetti.rotation.x = Math.random() * Math.PI;
//       confetti.rotation.y = Math.random() * Math.PI;
      
//       // Random velocity
//       confetti.userData = {
//         velocity: new THREE.Vector3(
//           (Math.random() - 0.5) * 4,
//           Math.random() * 3 + 2,
//           (Math.random() - 0.5) * 4
//         ),
//         rotationSpeed: new THREE.Vector3(
//           Math.random() - 0.5,
//           Math.random() - 0.5,
//           Math.random() - 0.5
//         ),
//         gravity: -8
//       };

//       this.scene.add(confetti);
//       this.victoryEffects.push(confetti);
//     }
//   }

//   /**
//    * Create victory text particles
//    */
//   createVictoryText(center) {
//     // You could add 3D text or particle text here
//     // For now, we'll create a simple particle effect that forms a V shape
//     this.createVictoryParticles(center);
//   }

//   /**
//    * Create particles that form victory patterns
//    */
//   createVictoryParticles(center) {
//     const particleCount = 20;
//     const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
//     const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

//     // Create V shape pattern
//     for (let i = 0; i < particleCount; i++) {
//       const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
//       const t = i / particleCount;
//       const angle = Math.PI * 0.8; // V shape angle
//       const radius = 2;
      
//       const x = radius * Math.cos(angle * (t - 0.5));
//       const y = radius * Math.sin(angle * Math.abs(t - 0.5));
      
//       particle.position.copy(center);
//       particle.position.x += x;
//       particle.position.y += y + 2;
//       particle.position.z += (Math.random() - 0.5) * 0.5;
      
//       particle.userData = {
//         initialPosition: particle.position.clone(),
//         timeOffset: Math.random() * Math.PI * 2,
//         floatSpeed: 2 + Math.random() * 2
//       };

//       this.scene.add(particle);
//       this.victoryEffects.push(particle);
//     }
//   }

//   /**
//    * Create light effects for victory
//    */
//   createLightEffects(center) {
//     // Add point light
//     const pointLight = new THREE.PointLight(0x00ff00, 2, 10);
//     pointLight.position.copy(center);
//     pointLight.position.y += 2;
//     this.scene.add(pointLight);
//     this.victoryEffects.push(pointLight);

//     // Add directional light with color changes
//     const dirLight = new THREE.DirectionalLight(0xff0000, 1);
//     dirLight.position.set(5, 5, 5);
//     this.scene.add(dirLight);
//     this.victoryEffects.push(dirLight);

//     // Store light references for animation
//     pointLight.userData = { pulseSpeed: 3 };
//     dirLight.userData = { colorChangeSpeed: 2, hue: 0 };
//   }

//   /**
//    * Create screen flash effect
//    */
//   createScreenFlash() {
//     // This would typically be handled by a post-processing system or camera effect
//     // For now, we'll log it - you can implement based on your rendering setup
//     console.log('💥 Screen flash effect - implement with your post-processing system');
//   }

//   /**
//    * Update victory effects
//    */
//   updateVictoryEffects(delta) {
//     if (!this.hasFinished) return;

//     this.victoryTimer += delta;

//     // Update confetti
//     this.victoryEffects.forEach(effect => {
//       if (effect.userData && effect.userData.velocity) {
//         // Confetti physics
//         effect.userData.velocity.y += effect.userData.gravity * delta;
//         effect.position.add(effect.userData.velocity.clone().multiplyScalar(delta));
//         effect.rotation.x += effect.userData.rotationSpeed.x * delta;
//         effect.rotation.y += effect.userData.rotationSpeed.y * delta;
//         effect.rotation.z += effect.userData.rotationSpeed.z * delta;

//         // Remove confetti that falls too far
//         if (effect.position.y < -5) {
//           this.scene.remove(effect);
//         }
//       }

//       // Update victory particle floating
//       if (effect.userData && effect.userData.initialPosition) {
//         const time = this.victoryTimer * effect.userData.floatSpeed + effect.userData.timeOffset;
//         effect.position.y = effect.userData.initialPosition.y + Math.sin(time) * 0.3;
//       }

//       // Update light effects
//       if (effect.isPointLight && effect.userData) {
//         // Pulse effect
//         effect.intensity = 1 + Math.sin(this.victoryTimer * effect.userData.pulseSpeed) * 0.5;
//       }

//       if (effect.isDirectionalLight && effect.userData) {
//         // Color cycle
//         effect.userData.hue += delta * effect.userData.colorChangeSpeed;
//         const hue = effect.userData.hue % 1;
//         effect.color.setHSL(hue, 1, 0.5);
//       }
//     });

//     // Clean up finished effects after victory duration
//     if (this.victoryTimer >= this.victoryDuration) {
//       this.cleanupVictoryEffects();
//     }
//   }

//   /**
//    * Clean up victory effects
//    */
//   cleanupVictoryEffects() {
//     this.victoryEffects.forEach(effect => {
//       if (effect.parent) {
//         effect.parent.remove(effect);
//       }
//     });
//     this.victoryEffects = [];
//   }

//   // ... (rest of the existing methods remain the same)

//   update(time, delta) {
//     if (!this.ready && !this.hasFinished) return;
//     if (this.mixer) this.mixer.update(delta);

//     // Update health system first
//     this.health.update(delta);

//     // Check for finish line
//     this.checkFinishLine();

//     // Update victory effects if finished
//     if (this.hasFinished) {
//       this.updateVictoryEffects(delta);
//       return; // Stop normal movement when finished
//     }

//     // Check for damage collisions (separate from movement collision)
//     this.checkDamageCollisions();

//     const rayOrigin = new THREE.Vector3(this.model.position.x, this.model.position.y + 0.5, this.model.position.z);
//     this.raycaster.set(rayOrigin, this.down);

//     const intersects = this.raycaster.intersectObjects(this.scene.children, true)
//       .filter(i => !this.isDescendantOf(i.object, this.model));

//     let groundY = -Infinity;
//     if (intersects.length > 0) {
//       groundY = intersects[0].point.y + this.footOffset;
//     }

//     if (groundY !== -Infinity) {
//       const dist = this.model.position.y - groundY;
//       if (dist <= this.epsilon && this.velocityY <= 0) {
//         this.model.position.y = groundY;
//         this.velocityY = 0;
//         this.onGround = true;
//       } else {
//         this.onGround = false;
//       }
//     } else {
//       this.onGround = false;
//     }

//     if (!this.onGround) {
//       this.velocityY -= this.gravity * delta;
//       this.model.position.y += this.velocityY * delta;
//     }

//     let desiredAction = 'idle';

//     if (this.isRolling) {
//       // Check collision before rolling
//       const testPos = this.model.position.clone().addScaledVector(this.rollVelocity, delta);
//       if (!this.checkCollisionAtPosition(testPos)) {
//         this.model.position.addScaledVector(this.rollVelocity, delta);
//       }
//       this.rollTimer += delta;
//       if (this.rollTimer >= this.rollDuration) {
//         this.isRolling = false;
//       }
//       desiredAction = this.findActionNameMatch('roll') || 'QuickRoll';
//     } else if (!this.onGround) {
//       desiredAction = this.findActionNameMatch('jump') || 'Jump';
//     } else if (this.keyStates['w']) {
//       const groundType = this.detectGroundType();
//       if (groundType === 'stairs') {
//         desiredAction = this.findActionNameMatch('upstairs') || 'UpStairs';
//         this.model.position.y += (this.runSpeed * 0.6) * delta;
//       } else {
//         // Running forward with collision detection
//         desiredAction = this.findActionNameMatch('run') || 'running';
//         const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.model.quaternion).setY(0).normalize();
//         const movementVector = forward.clone().multiplyScalar(this.runSpeed * delta);

//         // Check collision before moving
//         const testPos = this.model.position.clone().add(movementVector);
//         if (!this.checkCollisionAtPosition(testPos)) {
//           this.model.position.add(movementVector);
//         }

//         // Check for combined inputs with A or D for sliding
//         if (this.keyStates['a']) {
//           desiredAction = this.findActionNameMatch('leftslide') || 'LeftSlide';
//         } else if (this.keyStates['d']) {
//           desiredAction = this.findActionNameMatch('rightslide') || 'RightSlide';
//         }
//       }
//     }

//     this.playAction(desiredAction, this.fadeDuration);
//   }

//   /**
//    * Callback for when victory is complete
//    */
//   onVictory() {
//     // This can be overridden by the game instance
//     console.log('🏆 Victory callback - override this for game completion logic');
//   }

//   // ... (rest of the existing methods remain the same)
// }

// export { Eve };
