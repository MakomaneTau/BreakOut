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
        this.controls.minDistance = 1;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI / 2;

        this.move = { forward: false, backward: false, left: false, right: false };
        this.direction = new THREE.Vector3();
        this.speed = 5;
        this._addListeners();
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
            // Move in camera local space (ignoring y for ground movement)
            const moveVector = new THREE.Vector3(this.direction.x, 0, this.direction.z).applyQuaternion(this.camera.quaternion);
            this.camera.position.addScaledVector(moveVector, this.speed * dt);
        }
        this.controls.update();
    }
}
