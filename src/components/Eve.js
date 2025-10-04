import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';
import { DRACOLoader } from '../../public/libs/three137/DRACOLoader.js';

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

        // Create collider for collision detection
        this.collider = this.collisionManager.add(this.model, 'box');

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

      if (this.keyStates[key]) return;
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
    this.collider.update();
    
    // Check for collision
    const collision = this.collisionManager.findCollisionFor(this.collider);
    
    // Restore original position
    this.collider.mesh.position.copy(originalPos);
    this.collider.update();
    
    return collision !== null;
  }

  update(time, delta) {
    if (!this.ready) return;
    if (this.mixer) this.mixer.update(delta);

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
    } else if (this.keyStates['w']) {
      const groundType = this.detectGroundType();
      if (groundType === 'stairs') {
        desiredAction = this.findActionNameMatch('upstairs') || 'UpStairs';
        this.model.position.y += (this.runSpeed * 0.6) * delta;
      } else {
        // Running forward with collision detection
        desiredAction = this.findActionNameMatch('run') || 'running';
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.model.quaternion).setY(0).normalize();
        const movementVector = forward.multiplyScalar(this.runSpeed * delta);
        
        // Check collision before moving
        const testPos = this.model.position.clone().add(movementVector);
        if (!this.checkCollisionAtPosition(testPos)) {
          this.model.position.add(movementVector);
        }

        // Check for combined inputs with A or D for sliding
        if (this.keyStates['a']) {
          desiredAction = this.findActionNameMatch('leftslide') || 'LeftSlide';
        } else if (this.keyStates['d']) {
          desiredAction = this.findActionNameMatch('rightslide') || 'RightSlide';
        }
      }
    } else {
      desiredAction = this.findActionNameMatch('idle') || 'idle';
    }

    this.playAction(desiredAction, this.fadeDuration);
  }
}

export { Eve };