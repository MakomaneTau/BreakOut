// flying_cubes.js
// Deterministic, looping flying cubes (no randomness)
import * as THREE from '../../../public/libs/three137/three.module.js';
import { TextureLoader } from '../../../public/libs/three137/three.module.js';

/**
 * FlyingCubesSpawner
 * - Spawns exactly the cubes you configure (no randomization)
 * - Each cube moves from start -> end at a fixed speed
 * - When it reaches end, it resets back to start and continues (loop)
 */
export class FlyingCubesSpawner {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = Object.assign({
            color: 0xff0000,
            loop: true,
            useBasicMaterial: false,
            debug: false,
            // Provide 5 cubes by default; edit these to choose coordinates and scale
            cubeConfigs: [
                { start: [-80, 5.5, -3.5], end: [-42, 5.5, -3.5], scale: [1.2, 1.2, 1.2], speed: 0.08 },
                { start: [-80, 6.0, -1.5], end: [-42, 6.0, -1.5], scale: [1.0, 1.0, 1.0], speed: 0.07 },
                { start: [-80, 5.0,  0.0], end: [-42, 5.0,  0.0], scale: [1.5, 1.0, 1.0], speed: 0.09 },
                { start: [-80, 6.5,  1.8], end: [-42, 6.5,  1.8], scale: [0.9, 0.9, 1.4], speed: 0.06 },
                { start: [-80, 5.2,  3.2], end: [-42, 5.2,  3.2], scale: [1.3, 1.3, 1.3], speed: 0.085 },
            ],
        }, options);
        this.cubes = [];
        this._initCubes();
    }

    _initCubes() {
        // Remove any old cubes
        this.cubes.forEach(c => this.scene.remove(c));
        this.cubes.length = 0;

        for (const cfg of this.options.cubeConfigs) {
            const cube = this._createCube(cfg);
            this.cubes.push(cube);
        }
    }

    update(delta) {
        // Move each cube; reset to start when it reaches end (loop)
        for (const cube of this.cubes) {
            const toTarget = new THREE.Vector3().subVectors(cube.userData.target, cube.position);
            const step = cube.userData.velocity.clone().multiplyScalar(delta / (1 / 60));
            // Ensure consistent speed per frame baseline; or just use velocity directly per tick
            if (toTarget.length() > step.length()) {
                cube.position.add(step);
            } else {
                // Arrived at end
                cube.position.copy(cube.userData.target);
                if (this.options.loop) {
                    // Reset to start and recompute direction
                    cube.position.set(cube.userData.start.x, cube.userData.start.y, cube.userData.start.z);
                    const dir = new THREE.Vector3().subVectors(cube.userData.target, cube.position).normalize();
                    cube.userData.velocity.copy(dir.multiplyScalar(cube.userData.speed));
                }
            }
        }
    }

    /**
     * Reset all cubes to their starting positions
     */
    reset() {
        for (const cube of this.cubes) {
            cube.position.copy(cube.userData.start);
            const dir = new THREE.Vector3().subVectors(cube.userData.target, cube.position).normalize();
            cube.userData.velocity.copy(dir.multiplyScalar(cube.userData.speed));
        }
    }

    _createCube(cfg) {
        const { start, end, speed = 0.08, color, size, scale } = cfg;
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const textureLoader = new TextureLoader();
        const grainyTexture = textureLoader.load('../../../public/textures/grainy_texture.jpg');
        const material = (this.options.useBasicMaterial
            ? new THREE.MeshBasicMaterial({ map: grainyTexture })
            : new THREE.MeshStandardMaterial({ map: grainyTexture }));

        const cube = new THREE.Mesh(geometry, material);
        cube.castShadow = true;
        cube.receiveShadow = true;

        // Size vs scale: support either a uniform size or explicit scale vector
        if (Array.isArray(scale) && scale.length === 3) {
            cube.scale.set(scale[0], scale[1], scale[2]);
        } else if (typeof size === 'number') {
            cube.scale.set(size, size, size);
        } else {
            cube.scale.set(1, 1, 1);
        }

        const startV = new THREE.Vector3(start[0], start[1], start[2]);
        const endV = new THREE.Vector3(end[0], end[1], end[2]);
        cube.position.copy(startV);

        const dir = new THREE.Vector3().subVectors(endV, startV).normalize();
        cube.userData = {
            speed,
            start: startV.clone(),
            target: endV.clone(),
            velocity: dir.multiplyScalar(speed),
            type: 'flying_cube', // Set obstacle type for collision detection
        };

        this.scene.add(cube);
        if (this.options.debug) {
            console.log('Spawn cube', { start, end, speed, scale: cube.scale.toArray() });
        }
        return cube;
    }
}

// Optional helpers (kept for compatibility, now deterministic if passed cubeConfigs)
export function loadFlyingCubes(scene, options = {}) {
    const spawner = new FlyingCubesSpawner(scene, options);
    return spawner.cubes;
}

export function updateFlyingCubes(cubesOrSpawner, delta = 1 / 60) {
    // Allow passing the spawner directly
    if (cubesOrSpawner && typeof cubesOrSpawner.update === 'function') {
        cubesOrSpawner.update(delta);
        return;
    }
    // No-op fallback for old call shape
    if (Array.isArray(cubesOrSpawner)) {
        // Cannot move without velocity context; recommend switching to spawner usage
    }
}
