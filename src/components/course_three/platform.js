import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { laser_barrier, LaserBarrierSpawner } from './laser_barrier.js';
import { FlyingCubesSpawner } from './flying_cubes.js'; // Handles repeated spawning of moving cubes
import { concrete_blocks } from './concrete_blocks.js';
import { createPlatformMaterial } from '../../shaders/platformShader.js';
import { Helicopter } from '../helicopter.js';

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.shaderMaterials = []; // Store shader materials for time updates
		this.helicopter = null; // Helicopter at finish line (will be created after platform loads)
		this.game = game; // Store game reference for helicopter creation

		this.concreteBlocks = [
			new concrete_blocks(game, { position: [-170, 4.6, -7], scale: [6.5, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-160, 4.6, 3], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-150, 4.6, -1], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-139, 4.6, 3.9], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-130, 4.6, 5.5], scale: [9, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-120, 4.6, -4.9], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-110, 4.6, 0], scale: [12, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-100, 4.6, -3], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-115, 4.6, 4], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-103, 4.6, 4], scale: [12, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-105, 4.6, -4], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
		];

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
				gltf.scene.scale.set(0.08, 1, 0.9); // Adjust scale as needed
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
				
				// Calculate platform dimensions and place helicopter at the end
				this.positionHelicopterAtEnd();
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
		// Hardcoded player start position for level 3
		const playerStartX = -213;
		const distanceToMin = Math.abs(platformMinX - playerStartX);
		const distanceToMax = Math.abs(platformMaxX - playerStartX);
		
		// The end is the one farther from the player start (farthest end = finish line)
		const platformEndX = distanceToMin > distanceToMax ? platformMinX : platformMaxX;
		
		// Push helicopter further backwards (more negative X)
		const helicopterOffset = -5; // Offset to push helicopter further back
		const helicopterX = platformEndX + helicopterOffset;
		
		// Create helicopter at the end (only one helicopter per platform)
		this.helicopter = new Helicopter(this.game, {
			position: new THREE.Vector3(helicopterX, 2, 0),
			scale: new THREE.Vector3(1, 1, 1),
			rotation: new THREE.Euler(0, Math.PI / 2, 0)
		});
		console.log(`🚁 Level 3: Helicopter positioned at end of platform (X: ${helicopterX.toFixed(2)}, platform extends from ${platformMinX.toFixed(2)} to ${platformMaxX.toFixed(2)}, player starts at ${playerStartX}, offset: ${helicopterOffset})`);
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
		if (this.concreteBlocks) this.concreteBlocks.forEach(cb => cb.update(time, delta));
		// Update helicopter animation
		if (this.helicopter && this.helicopter.ready) {
			this.helicopter.update(time, delta);
		}
	}
}

export { platform };
