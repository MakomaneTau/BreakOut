import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';
import { DRACOLoader } from '../../public/libs/three137/DRACOLoader.js';
import { PlayerHealth } from './player/PlayerHealth.js';
import { HealthConfig, DamageType } from '../config/healthConfig.js';
import { WinAnimation } from './effects/WinAnimation.js';

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

    // Winning animation system using component
    this.winAnimation = new WinAnimation({
      scene: this.scene,
      character: this,
      duration: 4.0,
      particleCount: 60,
      volume: 0.3,
      soundEnabled: true
    });

    // Prevent multiple win triggers
    this.winTriggered = false;

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
    
    // If collision detected, check if it's a finish line first
    if (collision) {
      // Handle special cases first (like checkpoints)
      if (collision.mesh.userData?.type === 'finish_line') {
        // This is a checkpoint, not a damaging obstacle - don't apply damage
        return false; // Return false to indicate no damaging collision
      }
      
      // Handle damaging obstacles
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
   * Trigger winning animation when passing green checkpoint
   */
  triggerWinAnimation() {
    if (this.winAnimation.isRunning() || this.winTriggered) return; // Prevent multiple triggers
    
    this.winTriggered = true;
    
    // Trigger the component-based winning animation
    this.winAnimation.trigger(this.model.position);
  }

  /**
   * Configure winning animation settings
   * @param {Object} options - Configuration options
   */
  configureWinAnimation(options) {
    this.winAnimation.configure(options);
  }

  /**
   * Check if winning animation is currently running
   * @returns {boolean}
   */
  isWinningAnimationActive() {
    return this.winAnimation.isRunning();
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

    // Update winning animation component
    this.winAnimation.update(delta);

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
      // Handle special cases first (like checkpoints)
      if (collision.mesh.userData?.type === 'finish_line') {
        // This is a checkpoint, not a damaging obstacle
        if (this.triggerWinAnimation) {
          this.triggerWinAnimation();
        }
        return; // Don't process as damage
      }
      
      // Handle damaging obstacles
      this.handleCollisionDamage(collision);
    }
  }
}

export { Eve };
