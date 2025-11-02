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
  this.collisionSystem = game.collisionSystem || null;
  this.lastSafePosition = null;
    this.collisionSystem = game.collisionSystem || null;
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

    // Jump related
    this.jumpVelocity = new THREE.Vector3();
    this.jumpDuration = 0.6;
    this.jumpTimer = 0;
    this.isJumping = false;
    this.currentJumpName = null;
    this.jumpDistance = 1.67;
    this.jumpDistanceBoost = 2.0;

    this.mixer = null;
    this.animations = [];
    this.actions = {};
    this.actionDurations = {};
    this.currentAction = null;
    this.currentActionName = null;

    this.winAnimation = new WinAnimation({
      scene: this.scene,
      character: this,
      helicopter: null,
      duration: 4.0,
      particleCount: 60,
      volume: 0.3,
      soundEnabled: true
    });

    this.winTriggered = false;

    this.health = new PlayerHealth({
      maxHealth: HealthConfig.MAX_HEALTH,
      maxLives: HealthConfig.MAX_LIVES,
      permadeath: HealthConfig.PERMADEATH_MODE,
      initialPosition: { x: 3, y: 1, z: 0 }, // Start position matches resetToStartPosition
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
        // Basic transform
        gltf.scene.scale.set(1.5, 1.5, 1.5);
        gltf.scene.position.set(3, 0, 0);
        gltf.scene.rotation.y = -Math.PI / 2;

        // Enable shadows on character meshes
        gltf.scene.traverse(node => {
          if (node.isMesh || node.isSkinnedMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        this.scene.add(gltf.scene);
        this.model = gltf.scene;

        // Foot offset from bounding box
        const box = new THREE.Box3().setFromObject(gltf.scene);
        this.footOffset = -box.min.y || 0;

        // Raycast down to position model on ground
        const rayOrigin = new THREE.Vector3(
          this.model.position.x,
          this.model.position.y + 10,
          this.model.position.z
        );
        this.raycaster.set(rayOrigin, this.down);

        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
          .filter(i => !this.isDescendantOf(i.object, this.model));

        if (intersects.length > 0) {
          const groundY = intersects[0].point.y + this.footOffset;
          this.model.position.y = groundY;
        }

        // Setup mixer & strip root motion
        this.mixer = new THREE.AnimationMixer(gltf.scene);

        const rawClips = gltf.animations || [];
        this.animations = rawClips.map((clip) => {
          const c = clip.clone();
          if (!c.tracks || c.tracks.length === 0) {
            return c;
          }
          const clipNameLower = (c.name || '').toLowerCase();
          if (clipNameLower.includes('jump') || clipNameLower.includes('roll') || clipNameLower.includes('quickroll')) {
            // keep jump / roll animations as is (retain root motion)
            return c;
          }

          // Otherwise remove position tracks that look like root tracks
          const modelNameLower = (this.model && this.model.name) ? this.model.name.toLowerCase() : '';
          const isLikelyRootTarget = (targetLower) => {
            if (!targetLower) return true;
            const checks = ['root', 'hip', 'pelv', 'mixamo', 'scene', 'armatur'];
            if (targetLower === modelNameLower) return true;
            return checks.some(s => targetLower.includes(s));
          };

          c.tracks = c.tracks.filter((track) => {
            const trackName = track.name || '';
            const lowerTrack = trackName.toLowerCase();
            if (!lowerTrack.includes('.position')) return true;
            const target = trackName.split('.')[0] || '';
            const targetLower = target.toLowerCase();
            if (isLikelyRootTarget(targetLower)) {
              return false; // drop this track
            }
            return true;
          });

          return c;
        });

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
          if (!finishedName) return;

          // After roll, reset state
          if (finishedName.toLowerCase().includes('roll')) {
            this.isRolling = false;
            this.currentRollName = null;
            // Optional: apply a small teleport forward if needed, as in your original logic:
            try {
              if (this.model) {
                const forward = new THREE.Vector3(0, 0, 1)
                  .applyQuaternion(this.model.quaternion)
                  .setY(0)
                  .normalize();
                const candidate = this.model.position.clone().add(forward.multiplyScalar(5));
                this.model.position.copy(candidate);
              }
            } catch (err) {
              console.error('Error applying post-roll teleport:', err);
            }
            return;
          }

          // After jump, reset jump state
          if (finishedName.toLowerCase().includes('jump')) {
            this.isJumping = false;
            this.currentJumpName = null;
            this.jumpTimer = 0;
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
      if (!this.ready || !this.model) return;
      const key = event.key.toLowerCase();
      this.keyStates[key] = true;

      if (key === ' ') { // jump
        // Prevent page scroll and ensure we're in a valid state
        event.preventDefault();
        if (this.onGround && !this.isJumping && !this.isRolling) {
          this.startJump();
        }
      } else if (key === 'shift') { // roll
        if (this.onGround && !this.isRolling && !this.isJumping) {
          this.startRoll();
        }
      }
    });

    document.addEventListener('keyup', (event) => {
      if (!this.ready) return;
      const key = event.key.toLowerCase();
      this.keyStates[key] = false;
    });
  }

  startJump() {
    if (!this.model || !this.mixer) return;
    this.velocityY = this.jumpSpeed;
    this.onGround = false;

    const forward = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(this.model.quaternion)
      .setY(0)
      .normalize();

    const jumpName = this.findActionNameMatch('jump') || 'Jump';
    const duration = this.actionDurations[jumpName] && this.actionDurations[jumpName] > 0
      ? this.actionDurations[jumpName]
      : this.jumpDuration;
    this.jumpDuration = duration;
    this.jumpTimer = 0;
    this.isJumping = true;
    this.currentJumpName = jumpName;

    // Compute horizontal velocity (pre-boost)
    const jd = this.jumpDistance || 1.67;
    this.jumpVelocity.copy(forward).multiplyScalar(jd / this.jumpDuration);

    this.playAction(jumpName, this.fadeDuration);
  }

  startRoll() {
    this.isRolling = true;
    this.rollTimer = 0;

    const rollName = this.findActionNameMatch('roll') || this.findActionNameMatch('quickroll');
    this.currentRollName = rollName || 'QuickRoll';
    this.rollDuration = (rollName && this.actionDurations[rollName]) ? this.actionDurations[rollName] : 0.5;

    const forward = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(this.model.quaternion)
      .setY(0)
      .normalize();
    const rd = this.rollDistance * (this.rollDistanceBoost || 1.0);
    this.rollVelocity.copy(forward).multiplyScalar(rd / this.rollDuration);

    this.playAction(this.currentRollName, this.fadeDuration);
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

  onPlayerDamage(damage, currentHealth, maxHealth, damageType) {
    console.log(`Took ${damage} damage from ${damageType}. Health: ${currentHealth}/${maxHealth}`);
  }

  onPlayerHeal(amount, currentHealth, maxHealth) {
    console.log(`Healed ${amount}. Health: ${currentHealth}/${maxHealth}`);
  }

  onPlayerDeath(remainingLives) {
    console.log(`Player died! Lives remaining: ${remainingLives}`);
  }

  onPlayerRespawn(checkpoint, health, lives) {
    console.log(`Respawning at checkpoint with ${health} HP and ${lives} lives`);
    
    // Use the same reset logic as restart button but keep the timer running
    this.resetToStartPosition();
    
    // Re-enable player controls after respawn
    this.ready = true;
    
    // Note: Timer is NOT reset during respawn, only during full game restart
  }

  /**
   * Reset player to starting position with proper ground detection
   */
  resetToStartPosition() {
    if (!this.model) return;

    // Reset to starting position
    const startX = 3;
    const startZ = 0;
    
    // Clear all key states to prevent stuck keys
    this.keyStates = {};
    
    // Reset velocity and movement states
    this.velocityY = 0;
    this.isJumping = false;
    this.isRolling = false;
    this.rollTimer = 0;
    this.jumpTimer = 0;
    this.onGround = true;
    
    // Reset rotation
    this.model.rotation.y = -Math.PI / 2;
    
    // Set initial position high up for raycasting
    this.model.position.set(startX, 10, startZ);
    
    // Raycast down to find ground
    const rayOrigin = new THREE.Vector3(startX, 10, startZ);
    this.raycaster.set(rayOrigin, this.down);
    
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)
      .filter(i => !this.isDescendantOf(i.object, this.model));
    
    if (intersects.length > 0) {
      const groundY = intersects[0].point.y + this.footOffset;
      this.model.position.y = groundY;
      console.log(`Player reset to position: (${startX}, ${groundY}, ${startZ})`);
    } else {
      // Fallback to a safe Y position if no ground found
      this.model.position.y = 1;
      console.log(`Player reset to fallback position: (${startX}, 1, ${startZ})`);
    }
    
    // Reset animation to idle
    if (this.actions.idle) {
      this.setAction('idle');
    }
    
    // Note: Don't modify this.ready here - let the caller handle it
  }

  onPlayerGameOver(stats) {
    console.log('Game Over!', stats);
    this.ready = false;
  }

  onPlayerLifeLost(currentLives, maxLives) {
    console.log(`Lost a life! ${currentLives}/${maxLives} remaining`);
  }

  takeDamage(amount, damageType = DamageType.ENVIRONMENTAL) {
    return this.health.takeDamage(amount, damageType);
  }

  heal(amount) {
    return this.health.heal(amount);
  }

  setCheckpoint(position) {
    this.health.setCheckpoint(position || this.model.position);
  }

  triggerWinAnimation() {
    if (this.winAnimation.isRunning() || this.winTriggered) return;
    this.winTriggered = true;
    this.winAnimation.trigger(this.model.position);
  }

  setHelicopter(helicopter) {
    this.winAnimation.helicopter = helicopter;
    this.winAnimation.helicopterEscape.helicopter = helicopter;
  }

  configureWinAnimation(options) {
    this.winAnimation.configure(options);
  }

  isWinningAnimationActive() {
    return this.winAnimation.isRunning();
  }

  getObstacleTypeFromName(name) {
    if (!name) return 'unknown';
    const lower = name.toLowerCase();
    if (lower.includes('laser')) {
      return 'laser';
    }
    return 'unknown';
  }

  // Determine collider type by checking userData.type on the object or its ancestors
  _getTypeFromHierarchy(obj) {
    let o = obj;
    while (o) {
      if (o.userData && o.userData.type) return o.userData.type;
      o = o.parent;
    }
    return null;
  }

  // Check if currently intersecting a laser and apply strict 20 HP damage
  _applyLaserContactDamage() {
    if (!this.collisionSystem || !this.model) return;
    const hits = this.collisionSystem.getAllIntersections(this.model);
    if (!hits || hits.length === 0) return;
    // If any overlapping collider is a laser, apply damage once
    for (const h of hits) {
      const type = this._getTypeFromHierarchy(h.object);
      if (type === 'laser') {
        this.takeDamage(HealthConfig.OBSTACLE_DAMAGE, DamageType.OBSTACLE);
        break;
      }
    }
  }

  update(time, delta) {
    if (!this.ready) return;
    if (this.mixer) this.mixer.update(delta);

    this.winAnimation.update(delta);

    this.health.update(delta);

    // If controls disabled (e.g. during escape), skip movement
    if (this.controlsDisabled) {
      return;
    }

    const rayOrigin = new THREE.Vector3(
      this.model.position.x,
      this.model.position.y + 0.5,
      this.model.position.z
    );
    this.raycaster.set(rayOrigin, this.down);

    const intersects = this.raycaster.intersectObjects(this.scene.children, true)
      .filter(i => !this.isDescendantOf(i.object, this.model));

    let groundY = -Infinity;
    if (intersects.length > 0) {
      groundY = intersects[0].point.y + this.footOffset;
    }

    if (groundY !== -Infinity) {
      const dist = this.model.position.y - groundY;
      
      // If falling and about to go through or already below the platform, snap to it
      if (this.velocityY <= 0) {
        // Increased tolerance to catch fast falls and prevent tunneling
        const fallTolerance = Math.abs(this.velocityY * delta) + this.epsilon;
        
        if (dist <= fallTolerance) {
          // Snap to ground level
          this.model.position.y = groundY;
          this.velocityY = 0;
          this.onGround = true;
          this.isJumping = false;
        } else {
          this.onGround = false;
        }
      } else {
        // Player is moving upward (jumping)
        this.onGround = false;
      }
      
      // Safety clamp: Never let player fall below detected ground
      if (this.model.position.y < groundY && this.velocityY <= 0) {
        this.model.position.y = groundY;
        this.velocityY = 0;
        this.onGround = true;
        this.isJumping = false;
      }
    } else {
      this.onGround = false;
    }

    if (!this.onGround) {
      this.velocityY -= this.gravity * delta;
      this.model.position.y += this.velocityY * delta;
      
      // Additional safety check after movement
      if (groundY !== -Infinity && this.model.position.y < groundY) {
        this.model.position.y = groundY;
        this.velocityY = 0;
        this.onGround = true;
        this.isJumping = false;
      }
    }

    let desiredAction = 'idle';
    let isMoving = false;

  if (this.isRolling) {
      // roll movement
  const deltaMove = this.rollVelocity.clone().multiplyScalar(delta);
  const prevPos = this.model.position.clone();
      this.model.position.add(deltaMove);
    // Apply damage if intersecting laser at this position, then resolve
    this._applyLaserContactDamage();
      // Resolve horizontal collisions
  if (this.collisionSystem) this.collisionSystem.resolveContinuous(this.model, prevPos);
      this.rollTimer += delta;
      if (this.rollTimer >= this.rollDuration) {
        this.isRolling = false;
      }
      desiredAction = this.findActionNameMatch('roll') || 'QuickRoll';
    } else if (!this.onGround) {
      desiredAction = this.findActionNameMatch('jump') || 'Jump';

  if (this.isJumping) {
        // horizontal jump movement
        const singleDeltaMove = new THREE.Vector3(
          this.jumpVelocity.x * delta,
          0,
          this.jumpVelocity.z * delta
        );
        const doubledMove = singleDeltaMove.clone().multiplyScalar(this.jumpDistanceBoost || 1.0);
  const prevPos = this.model.position.clone();
        this.model.position.add(doubledMove);
  	    // Apply damage if intersecting laser at this position, then resolve
  	    this._applyLaserContactDamage();
  if (this.collisionSystem) this.collisionSystem.resolveContinuous(this.model, prevPos);
        this.jumpTimer += delta;
        if (this.jumpTimer >= this.jumpDuration) {
          this.isJumping = false;
          this.currentJumpName = null;
        }
      }
    } else {
      // on ground & not rolling
      const rotationSpeed = 3.0;
      if (this.keyStates['q']) {
        this.model.rotation.y += rotationSpeed * delta;
      }
      if (this.keyStates['e']) {
        this.model.rotation.y -= rotationSpeed * delta;
      }

      const movementVector = new THREE.Vector3();
      if (this.keyStates['w']) {
        const forward = new THREE.Vector3(0, 0, 1)
          .applyQuaternion(this.model.quaternion)
          .setY(0)
          .normalize();
        movementVector.add(forward);
        isMoving = true;
      }
      if (this.keyStates['s']) {
        const backward = new THREE.Vector3(0, 0, -1)
          .applyQuaternion(this.model.quaternion)
          .setY(0)
          .normalize();
        movementVector.add(backward);
        isMoving = true;
      }
      if (this.keyStates['a']) {
        const left = new THREE.Vector3(1, 0, 0)
          .applyQuaternion(this.model.quaternion)
          .setY(0)
          .normalize();
        movementVector.add(left);
        isMoving = true;
      }
      if (this.keyStates['d']) {
        const right = new THREE.Vector3(-1, 0, 0)
          .applyQuaternion(this.model.quaternion)
          .setY(0)
          .normalize();
        movementVector.add(right);
        isMoving = true;
      }

  if (isMoving) {
        movementVector.normalize();
        movementVector.multiplyScalar(this.runSpeed * delta);

  const prevPos = this.model.position.clone();
        this.model.position.add(movementVector);
    // Apply damage if intersecting laser at this position, then resolve
    this._applyLaserContactDamage();
  if (this.collisionSystem) this.collisionSystem.resolveContinuous(this.model, prevPos);

        const groundType = this.detectGroundType();
        if (groundType === 'stairs' && this.keyStates['w']) {
          desiredAction = this.findActionNameMatch('upstairs') || 'UpStairs';
          this.model.position.y += (this.runSpeed * 0.6) * delta;
        } else {
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

    // Idle collision handling: if something (like a flying cube) moves into the player,
    // push the player away even if no input.
    if (this.collisionSystem && this.model) {
      const hit = this.collisionSystem.getFirstIntersection(this.model);
      if (hit) {
        // Apply damage if the collider is a laser
        const type = this._getTypeFromHierarchy(hit.object);
        if (type === 'laser') {
          this.takeDamage(HealthConfig.OBSTACLE_DAMAGE, DamageType.OBSTACLE);
        }
        // Revert to last safe if we have one
        if (this.lastSafePosition) {
          this.model.position.copy(this.lastSafePosition);
        }
        // Push away from collider center on horizontal plane
        const pushDir = new THREE.Vector3().subVectors(this.model.position, hit.center).setY(0);
        if (pushDir.lengthSq() > 1e-6) {
          pushDir.normalize().multiplyScalar(this.collisionSystem.options.pushback || 0.12);
          this.model.position.add(pushDir);
        }
      } else {
        // Record last safe position when not intersecting
        if (!this.lastSafePosition) this.lastSafePosition = new THREE.Vector3();
        this.lastSafePosition.copy(this.model.position);
      }
    }

    this.playAction(desiredAction, this.fadeDuration);
  }
}

export { Eve };
