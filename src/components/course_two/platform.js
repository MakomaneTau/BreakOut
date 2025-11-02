import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { laser_barrier } from './laser_barrier.js';
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

		this.laserBarriers = [
			new laser_barrier(game, { position: [-71, 7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-80, 7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-63, 7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-50, 7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' })
		];

		// Create 3D cubes with same properties as laser barriers
		this.laserCubes = [];
		this.createLaserCubes([
			{ position: [-71, 7, 0], scale: [20, 2, 0.5], name: 'laser_cube_A' },
			{ position: [-80, 7, 0], scale: [20, 2, 0.5], name: 'laser_cube_B' },
			{ position: [-63, 7, 0], scale: [20, 2, 0.2], name: 'laser_cube_C' },
			{ position: [-50, 7, 0], scale: [20, 2, 0.5], name: 'laser_cube_D' }
		]);

		// Flying cubes spawner (deterministic: edit coordinates/scale below)
		this.flyingCubesSpawner = new FlyingCubesSpawner(this.scene, {
			color: 0xff2222,
			useBasicMaterial: false,
			loop: true,
			debug: false,
			// EDIT ME: exactly 5 cubes, choose start/end coordinates, scale, and speed
			cubeConfigs: [
				{ start: [-80, 6.5, -4.5], end: [-42, 6.5, -4.5], scale: [1.2, 5, 3.2], speed: 0.03 },
				{ start: [-80, 4.5, -1.5], end: [-42, 4.5, -1.5], scale: [1.0, 1.0, 3.0], speed: 0.04 },
				{ start: [-80, 6.5,  -4.5], end: [-42, 6.5,  4.5], scale: [1.5, 5, 2.0], speed: 0.09 },
				{ start: [-80, 6.5,  4.5], end: [-42, 6.5,  -4.5], scale: [0.9, 5, 2.4], speed: 0.06 },
				{ start: [-80, 6.5,  4.5], end: [-42, 6.5,  4.2], scale: [1.3, 5, 3.3], speed: 0.05 },
				{ start: [-80, 6.5,  7], end: [-42, 6.5,  7], scale: [0.2, 5, 6], speed: 0.04 },
				{ start: [-80, 6.5,  -3], end: [-42, 6.5,  -3], scale: [1, 5, 6], speed: 0.07 },

			]
		});
		
		// Helicopter will be created after platform loads to calculate its actual dimensions
		this.load();
	}

	createLaserCubes(configs) {
		configs.forEach(config => {
			// Create cube geometry
			const geometry = new THREE.BoxGeometry(1, 1, 1);
			
			// Use an invisible collider material: fully transparent, no depth/color writes
			const material = new THREE.MeshStandardMaterial({
				color: 0x000000,
				emissive: 0x000000,
				emissiveIntensity: 0.0,
				transparent: true,
				opacity: 0.0,
				metalness: 0.0,
				roughness: 1.0
			});
			material.depthWrite = false;
			material.colorWrite = false;
			
			const cube = new THREE.Mesh(geometry, material);
			
			// Apply position and scale
			cube.position.set(config.position[0], config.position[1], config.position[2]);
			cube.scale.set(config.scale[0], config.scale[1], config.scale[2]);
			cube.rotation.y = Math.PI / 2;
			
			// Do not cast/receive shadows since it's invisible
			cube.castShadow = false;
			cube.receiveShadow = false;
			
			// Set obstacle type for collision detection
			cube.userData.type = 'laser';
			cube.userData.initialY = config.position[1];
			cube.name = config.name;
			
			this.scene.add(cube);
			this.laserCubes.push(cube);
		});
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/platform/`);
		loader.load(
			'scene.gltf',
			gltf => {
				gltf.scene.rotation.y = Math.PI / 2; // Rotate 180 degrees if needed
				gltf.scene.scale.set(0.05, 1, 0.2); // Adjust scale as needed
				gltf.scene.position.set(-72.3, 4, 0); // Adjust position as needed

				// Ensure platform meshes cast and receive shadows and apply shader
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
						node.castShadow = true;
						node.receiveShadow = true;
						// Apply shader material to platform meshes
						if (platformMaterial) {
							node.material = platformMaterial;
						}
					}
				});

				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
				
				// Only create helicopter and finish line if NOT level 3 (level 3 uses platform_three's finish line)
				const currentLevel = this.game?.level || 1;
				if (currentLevel !== 3) {
					// Calculate platform dimensions and place helicopter and finish line at the end
					this.positionHelicopterAtEnd();
					this.positionFinishLineAtEnd();
				} else {
					// Level 3: Clean up any existing helicopter/finish line from platform_two
					if (this.helicopter && this.helicopter.model) {
						this.scene.remove(this.helicopter.model);
						this.helicopter = null;
					}
					if (this.finishLine && this.finishLine.model) {
						this.scene.remove(this.finishLine.model);
						this.finishLine = null;
					}
					console.log('🚫 Level 3: Skipping helicopter and finish line creation for platform_two (using platform_three instead)');
				}
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
		
		// Level 2: Platform is at -72.3, player starts at beginning of platform (around -72 to -70 area)
		// Hardcoded player start position for level 2
		const playerStartX = -72;
		const distanceToMin = Math.abs(platformMinX - playerStartX);
		const distanceToMax = Math.abs(platformMaxX - playerStartX);
		
		// The end is the one farther from the player start (farthest end = finish line)
		const platformEndX = distanceToMin > distanceToMax ? platformMinX : platformMaxX;
		
		// Create helicopter at the end (only one helicopter per platform)
		this.helicopter = new Helicopter(this.game, {
			position: new THREE.Vector3(platformEndX, 8, 0),
			scale: new THREE.Vector3(1, 1, 1),
			rotation: new THREE.Euler(0, Math.PI / 2, 0)
		});
		console.log(`🚁 Level 2: Helicopter positioned at end of platform (X: ${platformEndX.toFixed(2)}, platform extends from ${platformMinX.toFixed(2)} to ${platformMaxX.toFixed(2)}, player starts at ${playerStartX})`);
	}

	positionFinishLineAtEnd() {
		if (!this.model) return;
		
		// Calculate bounding box of the platform to get actual dimensions
		const box = new THREE.Box3().setFromObject(this.model);
		const platformMinX = box.min.x;
		const platformMaxX = box.max.x;
		
		// Level 2: Platform is at -72.3, player starts at beginning of platform (around -72 to -70 area)
		// Hardcoded player start position for level 2
		const playerStartX = -72;
		const distanceToMin = Math.abs(platformMinX - playerStartX);
		const distanceToMax = Math.abs(platformMaxX - playerStartX);
		
		// The end is the one farther from the player start (farthest end = finish line)
		const platformEndX = distanceToMin > distanceToMax ? platformMinX : platformMaxX;
		
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
			console.log(`🏁 Level 2: Finish line positioned at end of platform (X: ${platformEndX.toFixed(2)})`);
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
		if (this.laserBarriers) this.laserBarriers.forEach(lb => lb.update(time, delta));
		if (this.flyingCubesSpawner) this.flyingCubesSpawner.update(delta); // delta already seconds
		
		// Animate laser cubes (move up and down like laser barriers)
		if (this.laserCubes) {
			this.laserCubes.forEach(cube => {
				cube.position.y = cube.userData.initialY + Math.sin(Date.now() * 0.005) * 2;
			});
		}
		
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
