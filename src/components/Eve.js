import * as THREE from '../../public/libs/three137/three.module.js'; 
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';
import { DRACOLoader } from '../../public/libs/three137/DRACOLoader.js';

class Eve {
  constructor(game) {
    this.assetsPath = game.assetsPath;
    this.loadingBar = game.loadingBar;
    this.scene = game.scene;
    this.ready = false;
    this.model = null;

    // physics / ground detection state
    this.raycaster = new THREE.Raycaster();
    this.down = new THREE.Vector3(0, -1, 0);

    // tuning parameters (adjust if needed)
    this.footOffset = 0;           
    this.velocityY = 0;
    this.gravity = 30;             
    this.jumpSpeed = 12;           
    this.runSpeed = 5;             
    this.rollDistance = 1.2;       
    this.epsilon = 0.05;           
    this.fadeDuration = 0.12;      

    // input / state flags
    this.keyStates = {};
    this.isRolling = false;
    this.rollTimer = 0;
    this.rollDuration = 0.5;
    this.rollVelocity = new THREE.Vector3();

    // animation bookkeeping
    this.mixer = null;
    this.animations = [];
    this.actions = {};
    this.actionDurations = {};
    this.currentAction = null;
    this.currentActionName = null;

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

        // 🔹 Start at x/z, leave y = 0
        gltf.scene.position.set(3, 0, 0);

        // 🔹 Rotate 90 degrees to her right (around Y axis)
        gltf.scene.rotation.y = -Math.PI / 2;

        this.scene.add(gltf.scene);
        this.model = gltf.scene;

        // compute foot offset so we can align model feet to intersection point
        const box = new THREE.Box3().setFromObject(gltf.scene);
        this.footOffset = -box.min.y || 0;

        // 🔹 One-time snap to ground after adding model
        const rayOrigin = new THREE.Vector3(
          this.model.position.x,
          this.model.position.y + 10, // cast from above
          this.model.position.z
        );
        this.raycaster.set(rayOrigin, this.down);

        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
          .filter(i => !this.isDescendantOf(i.object, this.model));

        if (intersects.length > 0) {
          const groundY = intersects[0].point.y + this.footOffset;
          this.model.position.y = groundY;
        }

        this.mixer = new THREE.AnimationMixer(gltf.scene);
        this.animations = gltf.animations || [];
        this.actions = {};
        this.actionDurations = {};

        if (this.animations.length === 0) {
          console.warn('Eve: no animations found (gltf.animations length = 0)');
        } else {
          this.animations.forEach((clip) => {
            const action = this.mixer.clipAction(clip);
            const name = clip.name;
            const lower = name.toLowerCase();

            if (lower.includes('jump')) {
              action.setLoop(THREE.LoopOnce, 0);
              action.clampWhenFinished = true;
            } else if (lower.includes('roll')) {
              action.setLoop(THREE.LoopOnce, 0);
              action.clampWhenFinished = true;
            } else {
              action.setLoop(THREE.LoopRepeat);
            }

            this.actions[name] = action;
            this.actionDurations[name] = clip.duration || 0.6;
          });
        }

        if (this.actions['idle']) {
          this.currentAction = this.actions['idle'];
          this.currentAction.play();
          this.currentActionName = 'idle';
        } else {
          const first = Object.keys(this.actions)[0];
          if (first) {
            this.currentAction = this.actions[first];
            this.currentAction.play();
            this.currentActionName = first;
          }
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

      if (key === 'a') {
        if (this.onGround) {
          this.velocityY = this.jumpSpeed;
          this.onGround = false;
        }
      } else if (key === 'd') {
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
      this.model.position.addScaledVector(this.rollVelocity, delta);
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
        desiredAction = this.findActionNameMatch('run') || 'running';
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.model.quaternion).setY(0).normalize();
        this.model.position.addScaledVector(forward, this.runSpeed * delta);
      }
    } else {
      desiredAction = this.findActionNameMatch('idle') || 'idle';
    }

    this.playAction(desiredAction, this.fadeDuration);
  }
}

export { Eve };
