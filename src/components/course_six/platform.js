import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { laser_barrier, LaserBarrierSpawner } from './laser_barrier.js';
import { FlyingCubesSpawner } from './flying_cubes.js'; // Handles repeated spawning of moving cubes
import { createPlatformMaterial } from '../../shaders/platformShader.js';
import { Helicopter } from '../helicopter.js';
import { finish_line } from '../course/finish_line.js';

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.shaderMaterials = []; // Store shader materials for time updates
		this.helicopter = null; // Helicopter at finish line (will be created after platform loads)
		this.finishLine = null; // Finish line (will be created after platform loads)
		this.game = game; // Store game reference for helicopter creation

		// Concrete blocks removed

		// Flying cubes spawner (deterministic: edit coordinates/scale below)
		this.flyingCubesSpawner = new FlyingCubesSpawner(this.scene, {
			color: 0xff2222,
			useBasicMaterial: false,
			loop: true,
			debug: false,
			// Exactly 5 cubes; customize start/end, scale (or size), and speed
			cubeConfigs: [
				{ start: [-180, 14, -4.5], end: [-95, 14, -4.5], scale: [0.2, 20.0, 8], speed: 0.1 },
				{ start: [-180, 4.5, -1.5], end: [-95, 4.5, -1.5], scale: [1.0, 1.0, 3.0], speed: 0.06 },
				{ start: [-180, 4.5, 0.0], end: [-95, 4.5, 0.0], scale: [1.5, 1.0, 6], speed: 0.07 },
				{ start: [-180, -5, 1.8], end: [-95, 14, 1.8], scale: [0.9, 20.0, 2.4], speed: 0.055 },
				{ start: [-180, 4.5, 7], end: [-95, 4.5, 7], scale: [0.2, 1.0, 7], speed: 0.06 },
				{ start: [-180, 4.5, 4.5], end: [-95, 4.5, 4.5], scale: [1.3, 1.0, 3.3], speed: 0.07 },
				{ start: [-180, 4.5, -7], end: [-95, 4.5, -7], scale: [1.3, 1.0, 6], speed: 0.08 },
				{ start: [-180, 8, 4.5], end: [-95, 8, 4.5], scale: [0.2, 10.0, 6], speed: 0.04 },
				{ start: [-180, 4.5, 4.5], end: [-95, 4.5, 4.5], scale: [1.3, 1.0, 3.3], speed: 0.08 },
				{ start: [-180, 4.5, 4.5], end: [-95, 4.5, 4.5], scale: [1.3, 1.0, 3.3], speed: 0.09 },
			]
		});

		// Laser barrier spawner (dynamic moving barriers)
		this.laserBarrierSpawner = new LaserBarrierSpawner(this.scene, {
			assetsPath: this.assetsPath,
			collisionSystem: this.game?.collisionSystem,
			countMin: 2,
			countMax: 4,
			sizeMin: 1,
			sizeMax: 1,
			scale: [4.5, 2, 2],
			speedMin: 0.05,
			speedMax: 0.15,
			start: [-180, 6.2, 0],
			end: [-95, 6.2, 0],
			intervalMin: 5.2,
			intervalMax: 5.5,
			maxActive: 5,
			initialSpawn: true,
			debug: false
		});

		// Helicopter will be created after platform loads to calculate its actual dimensions
		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/platform/`);
		loader.load(
			'scene.gltf',
			gltf => {
				gltf.scene.rotation.y = Math.PI / 2; // Rotate 180 degrees if needed
				gltf.scene.scale.set(0.05, 1, 0.9); // Reduced X scale from 0.08 to 0.05 to shorten platform
				gltf.scene.position.set(-213.1, 4, 0); // Adjust position as needed

				// Enable shadows on platform meshes and apply shader
				const platformMaterial = createPlatformMaterial({
					color: new THREE.Color(0.3, 0.3, 0.35),
					noiseScale: 0.1,
					wearIntensity: 0.4,
					grimeIntensity: 0.3,
					patternScale: 0.5
				});

				// Store material reference once for time updates
				if (platformMaterial) {
					this.shaderMaterials.push(platformMaterial);
				}

				gltf.scene.traverse(node => {
					if (node.isMesh) {
						node.receiveShadow = true;
						node.castShadow = true;
						// Apply shader material to platform meshes
						if (platformMaterial) {
							node.material = platformMaterial;
						}
					}
				});

				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
				
				// Calculate platform dimensions and place helicopter and finish line at the end
				this.positionHelicopterAtEnd();
				this.positionFinishLineAtEnd();
			},
			xhr => this.loadingBar.update('platform', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}
	
	positionHelicopterAtEnd() {
		if (!this.model) return;
		
		// Remove any existing helicopters first (safeguard against duplicates)
		if (this.helicopter && this.helicopter.model) {
			this.scene.remove(this.helicopter.model);
			this.helicopter = null;
		}
		
		// Calculate bounding box of the platform to get actual dimensions
		const box = new THREE.Box3().setFromObject(this.model);
		const platformMinX = box.min.x;
		const platformMaxX = box.max.x;
		
		// Level 3: Platform is at -213.1, player starts at beginning of platform (around -213 to -210 area)
		// Level 3 has level 2's platform PLUS an extra platform segment
		// The finish line should be at the OTHER end of the extra platform segment (minimum X, the opposite end)
		const platformEndX = platformMinX; // End of extra platform is at the minimum X (the other end)
		
		// Position helicopter slightly after the finish line (at the end of the extra platform)
		const helicopterOffset = 3; // Small offset to place helicopter at the end
		const helicopterX = platformEndX + helicopterOffset;
		
		// Create helicopter at the end (only one helicopter per platform)
		this.helicopter = new Helicopter(this.game, {
			position: new THREE.Vector3(helicopterX, 8, 0),
			scale: new THREE.Vector3(1, 1, 1),
			rotation: new THREE.Euler(0, Math.PI / 2, 0)
		});
		console.log(`🚁 Level 3: Helicopter positioned at end of EXTRA platform (X: ${helicopterX.toFixed(2)}, platform extends from ${platformMinX.toFixed(2)} to ${platformMaxX.toFixed(2)}, extra platform ends at ${platformEndX.toFixed(2)})`);
	}

	positionFinishLineAtEnd() {
		if (!this.model) return;
		
		// Calculate bounding box of the platform to get actual dimensions
		const box = new THREE.Box3().setFromObject(this.model);
		const platformMinX = box.min.x;
		const platformMaxX = box.max.x;
		
		// Level 3: Platform is at -213.1, player starts at beginning of platform (around -213 to -210 area)
		// Level 3 has level 2's platform PLUS an extra platform segment
		// The finish line should be at the OTHER end of the extra platform segment (minimum X, the opposite end)
		const platformEndX = platformMinX; // End of extra platform is at the minimum X (the other end)
		
		// Only create finish line if it doesn't exist yet
		if (!this.finishLine) {
			// Position finish line on the platform surface (y=4.05 is slightly above platform surface)
			// width = span across platform (Z), depth = thickness along platform (X)
			this.finishLine = new finish_line(this.game, {
				position: [platformEndX, 4.05, 0],
				width: 6,  // spans across platform (Z axis)
				height: 0.1,
				depth: 2  // thickness along platform (X axis)
			});
			console.log(`🏁 Level 3: Finish line positioned at end of EXTRA platform (X: ${platformEndX.toFixed(2)}, platform extends from ${platformMinX.toFixed(2)} to ${platformMaxX.toFixed(2)})`);
		}
	}

	update(time, delta) {
		if (!this.ready) return;
		// Update shader time uniforms
		this.shaderMaterials.forEach(mat => {
			if (mat.uniforms && mat.uniforms.uTime) {
				mat.uniforms.uTime.value = time;
			}
		});
		if (this.flyingCubesSpawner) this.flyingCubesSpawner.update(delta); // delta already seconds
		if (this.laserBarrierSpawner) this.laserBarrierSpawner.update(delta);
	// Concrete blocks removed
		// Update helicopter animation
		if (this.helicopter && this.helicopter.ready) {
			this.helicopter.update(time, delta);
		}
		// Update finish line animation
		if (this.finishLine && this.finishLine.ready) {
			this.finishLine.update(time, delta);
		}
	}
}

export { platform };
