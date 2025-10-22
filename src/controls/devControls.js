// src/controls/devControls.js
// WASD and OrbitControls for developer camera movement
import { OrbitControls } from '../../public/libs/three137/OrbitControls.js';
import * as THREE from '../../public/libs/three137/three.module.js';

export class DevControls {
    constructor(camera, rendererDomElement) {
        this.camera = camera;
        this.controls = new OrbitControls(camera, rendererDomElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        // Start with generous distances; will be tuned when framing the scene
        this.controls.minDistance = 0.1;
        this.controls.maxDistance = 10000;
        this.controls.maxPolarAngle = Math.PI / 2;

        // Mouse sensitivity (affects rotate/zoom/pan speeds)
        // Lower default than OrbitControls to reduce sensitivity
        this._mouseSensitivity = this._loadMouseSensitivity() ?? 0.6; // 60% of default
        this._applyMouseSensitivity();

        this.move = { forward: false, backward: false, left: false, right: false };
        this.direction = new THREE.Vector3();
        this.speed = 5;
        this._addListeners();

        // Persistence: save/restore camera + orbit target
        this._storageKey = 'devCameraStateV1';
        this._saveCameraState = this._saveCameraState.bind(this);
        this._saveCameraStateDebounced = this._debounce(this._saveCameraState, 250);
        this.restoredFromStorage = this._restoreCameraState();
        this.controls.addEventListener('change', this._saveCameraStateDebounced);
        window.addEventListener('beforeunload', this._saveCameraState);
    }

    _addListeners() {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW': this.move.forward = true; break;
                case 'KeyS': this.move.backward = true; break;
                case 'KeyA': this.move.left = true; break;
                case 'KeyD': this.move.right = true; break;
            }
        });
        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': this.move.forward = false; break;
                case 'KeyS': this.move.backward = false; break;
                case 'KeyA': this.move.left = false; break;
                case 'KeyD': this.move.right = false; break;
            }
        });
    }

    update(dt) {
        this.direction.set(0, 0, 0);
        if (this.move.forward) this.direction.z -= 1;
        if (this.move.backward) this.direction.z += 1;
        if (this.move.left) this.direction.x -= 1;
        if (this.move.right) this.direction.x += 1;
        this.direction.normalize();
        if (this.direction.length() > 0) {
            // Move in camera local space (keep movement on ground plane)
            const moveVector = new THREE.Vector3(this.direction.x, 0, this.direction.z)
                .applyQuaternion(this.camera.quaternion);
            moveVector.y = 0; // lock to ground plane
            if (moveVector.lengthSq() > 0) moveVector.normalize();

            const delta = this.speed * dt;
            this.camera.position.addScaledVector(moveVector, delta);
            // Keep orbit target in sync with camera strafing to avoid weird rotations
            this.controls.target.addScaledVector(moveVector, delta);
            // Persist position/target when moved via WASD
            this._saveCameraStateDebounced();
        }
        this.controls.update();
    }

    // Fit the camera and controls to frame the given object/scene
    // object: THREE.Object3D (can be the whole scene)
    // fitOffset: padding multiplier (>1 adds margin around the object)
    frameObject(object, fitOffset = 1.2) {
        if (!object) return;

        const box = new THREE.Box3().setFromObject(object);
        if (!isFinite(box.min.x) || !isFinite(box.max.x)) return; // nothing to frame

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxSize = Math.max(size.x, size.y, size.z);
        const fitHeightDistance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
        const fitWidthDistance = fitHeightDistance / this.camera.aspect;
        const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

        // Update camera clipping planes based on distance
        this.camera.near = Math.max(0.01, distance / 100);
        this.camera.far = Math.max(this.camera.far, distance * 100);
        this.camera.updateProjectionMatrix();

        // Aim controls at center and place camera back along current view direction
        const direction = new THREE.Vector3()
            .subVectors(this.camera.position, this.controls.target)
            .normalize();
        if (!isFinite(direction.lengthSq()) || direction.lengthSq() === 0) {
            direction.set(0, 0, 1); // default backwards if degenerate
        }

        this.controls.target.copy(center);
        this.camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));

        // Update controls limits to make sense for this scene size
        this.controls.minDistance = Math.min(distance / 10, 10);
        this.controls.maxDistance = Math.max(distance * 10, 1000);

        this.controls.update();
    }

    // ---- Persistence helpers ----
    _saveCameraState() {
        try {
            const cam = this.camera;
            const tgt = this.controls?.target;
            const data = {
                position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
                quaternion: { x: cam.quaternion.x, y: cam.quaternion.y, z: cam.quaternion.z, w: cam.quaternion.w },
                fov: cam.fov,
                near: cam.near,
                far: cam.far,
                target: tgt ? { x: tgt.x, y: tgt.y, z: tgt.z } : null,
                mouseSensitivity: this._mouseSensitivity,
            };
            localStorage.setItem(this._storageKey, JSON.stringify(data));
        } catch (e) {
            // ignore
        }
    }

    _restoreCameraState() {
        try {
            const raw = localStorage.getItem(this._storageKey);
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!data || !data.position || !data.quaternion) return false;

            this.camera.position.set(data.position.x, data.position.y, data.position.z);
            this.camera.quaternion.set(data.quaternion.x, data.quaternion.y, data.quaternion.z, data.quaternion.w);
            if (typeof data.fov === 'number') this.camera.fov = data.fov;
            if (typeof data.near === 'number') this.camera.near = data.near;
            if (typeof data.far === 'number') this.camera.far = data.far;
            this.camera.updateProjectionMatrix();

            if (data.target && this.controls) {
                this.controls.target.set(data.target.x, data.target.y, data.target.z);
                this.controls.update();
            }
            if (typeof data.mouseSensitivity === 'number') {
                this.mouseSensitivity = data.mouseSensitivity;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    _debounce(fn, delay = 150) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ---- Sensitivity helpers ----
    _applyMouseSensitivity() {
        // Map a single sensitivity scalar to relevant OrbitControls speeds
        // Base defaults in OrbitControls are ~1.0; we scale them down
        const s = this._mouseSensitivity;
        // Rotation tends to feel most sensitive; scale directly
        this.controls.rotateSpeed = 1.0 * s;
        // Zoom a bit less sensitive than rotate by default
        this.controls.zoomSpeed = 0.9 * s;
        // Pan usually fine at parity with rotate
        this.controls.panSpeed = 1.0 * s;
    }

    _loadMouseSensitivity() {
        try {
            const v = localStorage.getItem('devMouseSensitivity');
            const n = v != null ? Number(JSON.parse(v)) : NaN;
            return isFinite(n) ? n : null;
        } catch {
            return null;
        }
    }

    _saveMouseSensitivity(val) {
        try { localStorage.setItem('devMouseSensitivity', JSON.stringify(val)); } catch {}
    }

    get mouseSensitivity() { return this._mouseSensitivity; }
    set mouseSensitivity(v) {
        const num = Number(v);
        // Clamp to a reasonable range [0.1, 2.0]
        const clamped = isFinite(num) ? Math.max(0.1, Math.min(2.0, num)) : this._mouseSensitivity;
        if (clamped !== this._mouseSensitivity) {
            this._mouseSensitivity = clamped;
            this._applyMouseSensitivity();
            this._saveMouseSensitivity(clamped);
        }
    }
}
