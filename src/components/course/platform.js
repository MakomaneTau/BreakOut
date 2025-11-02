import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { laser_barrier } from './laser_barrier.js';
import { FlyingCubesSpawner } from './flying_cubes.js';
import { Helicopter } from '../helicopter.js';
import { createPlatformMaterial } from '../../shaders/platformShader.js';

class platform {
	constructor(game, opts = {}) {
		this.game = game;
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.shaderMaterials = [];
		this.level = opts.level || 1;

		// Add laser barriers
		this.laserBarriers = [
			new laser_barrier(game, { position: [-10, 7.5, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-32, 7.5, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_B' })
		];

		// Create 3D cubes with same properties as laser barriers
		this.laserCubes = [];
		this.createLaserCubes([
			{ position: [-10, 8.7, 0], scale: [20, 2, 0.2], name: 'laser_cube_A' },
			{ position: [-32, 8.7, 0], scale: [20, 2, 0.2], name: 'laser_cube_B' }
		]);

		// Flying cubes spawner
		this.flyingCubesSpawner = new FlyingCubesSpawner(this.scene, {
			color: 0xff2222,
			useBasicMaterial: false,
			loop: true,
			debug: false,
			cubeConfigs: [
				{ start: [-40, 4.5, -3.5], end: [-5, 4.5, -3.5], scale: [1.2, 1.0, 2.5], speed: 0.04 },
				{ start: [-40, 4.5, -1.0], end: [-5, 4.5, -1.0], scale: [1.0, 1.0, 2.0], speed: 0.05 },
				{ start: [-40, 4.5, 1.5], end: [-5, 4.5, 1.5], scale: [1.5, 1.0, 3.0], speed: 0.06 },
				{ start: [-40, 4.5, 3.5], end: [-5, 4.5, 3.5], scale: [0.9, 1.0, 2.2], speed: 0.045 },

				{ start: [-40, 5.5, -2], end: [-5, 5.5, -2], scale: [0.2, 3.0, 2.5], speed: 0.07 },
				{ start: [-40, 5.5, -1.0], end: [-5, 5.5, -1.0], scale: [0.2, 3.0, 2.0], speed: 0.09 },
				{ start: [-40, 5.5, -4.5], end: [-5, 5.5, -4.5], scale: [0.2, 3.0, 3.0], speed: 0.08 },
				{ start: [-40, 4.5, 4.5], end: [-5, 4.5, 4.5], scale: [0.2, 1.0, 2.9], speed: 0.035 },
			]
		});

		this.load();
	}

	createLaserCubes(configs) {
		configs.forEach(config => {
			// Create cube geometry
			const geometry = new THREE.BoxGeometry(1, 1, 1);

			// Invisible collider material: fully transparent, no depth/color writes
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
				gltf.scene.position.set(-21.2, 4, 0); // Adjust position as needed

			// Enable shadows on platform meshes
			// Shader material application disabled - kept for future use
			const platformMat = createPlatformMaterial({
				color: new THREE.Color(0.3, 0.3, 0.35),
				noiseScale: 0.1,
				wearIntensity: 0.4,
				grimeIntensity: 0.3,
				patternScale: 0.5
			});

			// Store material reference once for time updates
			if (platformMat) {
				this.shaderMaterials.push(platformMat);
			}

			gltf.scene.traverse(node => {
				if (node.isMesh) {
					node.receiveShadow = true;
					node.castShadow = true;
					// Apply shader material to platform meshes
					if (platformMat) {
						node.material = platformMat;
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
		if (!this.model || this.level !== 1) return; // Only create helicopter for level 1
		
		// Calculate bounding box of the platform to get actual dimensions
		const box = new THREE.Box3().setFromObject(this.model);
		const platformMinX = box.min.x;
		const platformMaxX = box.max.x;
		const platformCenterX = (platformMinX + platformMaxX) / 2;
		
		// Player starts around x=3 (based on resetToStartPosition)
		const playerStartX = 3;
		
		// Determine which end is closer to player start (that's the start of the platform)
		const distanceToMin = Math.abs(platformMinX - playerStartX);
		const distanceToMax = Math.abs(platformMaxX - playerStartX);
		
		// The end is the one farther from the player start
		const platformEndX = distanceToMin > distanceToMax ? platformMinX : platformMaxX;
		
		// Only create helicopter if it doesn't exist yet (one helicopter per platform)
		if (!this.helicopter) {
			this.helicopter = new Helicopter(this.game, {
				position: new THREE.Vector3(platformEndX, 8, 0),
				scale: new THREE.Vector3(1, 1, 1),
				rotation: new THREE.Euler(0, Math.PI / 2, 0)
			});
			console.log(`🚁 Level 1: Helicopter positioned at end of platform (X: ${platformEndX.toFixed(2)}, platform extends from ${platformMinX.toFixed(2)} to ${platformMaxX.toFixed(2)})`);
		}
	}

	update(time, delta) {
		if (!this.ready) return;
		if (this.laserBarriers) this.laserBarriers.forEach(lb => lb.update(time, delta));
		if (this.flyingCubesSpawner) this.flyingCubesSpawner.update(delta);

		// Animate laser cubes (move up and down like laser barriers)
		if (this.laserCubes) {
			this.laserCubes.forEach(cube => {
				cube.position.y = cube.userData.initialY + Math.sin(Date.now() * 0.005) * 2;
			});
		}
	}
}

export { platform };
