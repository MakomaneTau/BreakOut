// flying_cubes.js
// Loads and adds flying cubes to a Three.js scene
import * as THREE from '../../../public/libs/three137/three.module.js';

// Spawner class for repeated cube spawning
export class FlyingCubesSpawner {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = Object.assign({
            countMin: 3,
            countMax: 7,
            sizeMin: 0.6,
            sizeMax: 1.4,
            color: 0xff0000,
            speedMin: 0.04,
            speedMax: 0.12,
            start: [-180, 5.7, -3.5],
            end: [-95, 5.7, -3.5],
            intervalMin: 0.8, // seconds
            intervalMax: 2.2,
            maxActive: 4, // cap to avoid infinite growth
            initialSpawn: true, // spawn immediately
            debug: false,
            useBasicMaterial: false // bypass lighting for visibility if needed
        }, options);
        this.cubes = [];
        this.timer = 0;
        this.nextInterval = this._rand(this.options.intervalMin, this.options.intervalMax);
        if (this.options.initialSpawn) {
            this.spawnCubes();
        }
    }

    spawnCubes() {
        const count = Math.floor(this._rand(this.options.countMin, this.options.countMax + 1));
        const newCubes = [];
        for (let i = 0; i < count; i++) {
            const size = this._rand(this.options.sizeMin, this.options.sizeMax);
            const speed = this._rand(this.options.speedMin, this.options.speedMax);
            const cube = this._createCube({ size, speed });
            newCubes.push(cube);
        }
        // Enforce cap
        if (this.cubes.length + newCubes.length > this.options.maxActive) {
            const overflow = this.cubes.length + newCubes.length - this.options.maxActive;
            const remove = this.cubes.splice(0, overflow);
            remove.forEach(c => this.scene.remove(c));
        }
        this.cubes.push(...newCubes);
    }

    update(delta) {
        // delta in seconds
        this.timer += delta;
        if (this.timer >= this.nextInterval) {
            this.spawnCubes();
            this.timer = 0;
            this.nextInterval = this._rand(this.options.intervalMin, this.options.intervalMax);
        }
        // Update cubes and remove those that reached target
        this.cubes = this.cubes.filter(cube => {
            const toTarget = new THREE.Vector3().subVectors(cube.userData.target, cube.position);
            if (toTarget.length() > cube.userData.velocity.length()) {
                cube.position.add(cube.userData.velocity);
                return true;
            } else {
                cube.position.copy(cube.userData.target);
                // Optionally remove from scene
                this.scene.remove(cube);
                return false;
            }
        });
    }

    _createCube({ size, speed }) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = this.options.useBasicMaterial
            ? new THREE.MeshBasicMaterial({ color: this.options.color })
            : new THREE.MeshStandardMaterial({ color: this.options.color });
        const cube = new THREE.Mesh(geometry, material);
    const z = this._rand(-4, 4); // -4 to 4
        cube.position.set(this.options.start[0], this.options.start[1], z);
        const target = new THREE.Vector3(this.options.end[0], this.options.end[1], z);
        const direction = new THREE.Vector3().subVectors(target, cube.position).normalize();
        cube.userData.velocity = direction.multiplyScalar(speed);
        cube.userData.target = target;
        this.scene.add(cube);
        if (this.options.debug) {
            // Simple console debug (can be swapped for on-screen later)
            console.log('Spawn cube', { pos: cube.position.toArray(), speed, size });
        }
        return cube;
    }

    _rand(min, max) {
        return Math.random() * (max - min) + min;
    }
}


export function loadFlyingCubes(scene, options = {}) {
    const {
        count = 10,
        size = 1,
        color = 0x00ff00,
        speed = 0.05,
        start = [-80, 4.7, -3.5], // default start
        end = [-45, 2.3, -3.5]    // default end
    } = options;

    const cubes = [];
    for (let i = 0; i < count; i++) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
    // Randomize Z between -4 and 4
    const z = Math.random() * 8 - 4; // (-4..4)
        cube.position.set(start[0], start[1], z);
        // Target position with same Z
        const target = new THREE.Vector3(end[0], end[1], z);
        // Direction vector from start to end
        const direction = new THREE.Vector3().subVectors(target, cube.position).normalize();
        // Velocity toward target
        cube.userData.velocity = direction.multiplyScalar(speed);
        cube.userData.target = target;
        scene.add(cube);
        cubes.push(cube);
    }
    return cubes;
}

// Call this in your animation loop to update cube positions
export function updateFlyingCubes(cubes) {
    cubes.forEach(cube => {
        // Move only if not past target
        const toTarget = new THREE.Vector3().subVectors(cube.userData.target, cube.position);
        if (toTarget.length() > cube.userData.velocity.length()) {
            cube.position.add(cube.userData.velocity);
        } else {
            cube.position.copy(cube.userData.target); // Snap to target
        }
    });
}
