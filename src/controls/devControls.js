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
//code for camera view movement
        this.isFirstPerson = true; // this would be the default
        this.thirdPersonOffset = new THREE.Vector3(0, 1, -5); // offset for third-person view


        this._addListeners();
    }

    _addListeners() {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW': this.move.forward = true; break;
                case 'KeyS': this.move.backward = true; break;
                case 'KeyA': this.move.left = true; break;
                case 'KeyD': this.move.right = true; break;
                //code for camera view movement
                case 'KeyV': // Toggle between first-person and third-person view
                    this.isFirstPerson = !this.isFirstPerson;
                    this._updateCameraPosition(true);
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
/*
    _updateCameraPosition(immediate = false) {
        if (this.isFirstPerson) {
            this.targetPosition = this.camera.position.clone();
        }else{
            //third person code
            const offset = this.thirdPersonOffset.clone().applyQuaternion(this.camera.quaternion);
            this.targetPosition = this.camera.position.clone().add(offset);
        }
        if (immediate) {
            this.camera.position.copy(this.targetPosition);
        }
            
        }*/

        _updateCameraPosition(immediate = false) {
    const targetPos = this.targetObject.position.clone(); // cube center
    if (this.isFirstPerson) {
        //this.targetPosition = targetPos.clone(); // first-person at cube
        const eyeHeight = 1.6; // height from base of cube to "eyes"
    this.targetPosition = targetPos.clone().add(new THREE.Vector3(0, eyeHeight, 0));
    } else {
        const offset = this.thirdPersonOffset.clone();
        //this.targetPosition = targetPos.add(offset); // third-person behind cube
        offset.applyQuaternion(this.targetObject.quaternion); // rotate offset with cube
        this.targetPosition = targetPos.clone().add(offset); // position behind cube
    }

    if (immediate) {
        this.camera.position.copy(this.targetPosition);
    }
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

        if (!this.isFirstPerson) {
    // smooth lerp to third-person
            this.camera.position.lerp(this.targetPosition, 0.1);
        }

        this.controls.update();
    }
}
