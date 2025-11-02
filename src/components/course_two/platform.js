import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { laser_barrier } from './laser_barrier.js';
import { FlyingCubesSpawner } from './flying_cubes.js'; // Handles repeated spawning of moving cubes

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;

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
		this.load();
	}

	createLaserCubes(configs) {
		configs.forEach(config => {
			// Create cube geometry
			const geometry = new THREE.BoxGeometry(1, 1, 1);
			
			// Create glowing laser-like material
			const material = new THREE.MeshStandardMaterial({
				color: 0xff0000, // Red laser color
				emissive: 0xff0000, // Self-illuminating
				emissiveIntensity: 0.8,
				transparent: true,
				opacity: 0.7,
				metalness: 0.5,
				roughness: 0.2
			});
			
			const cube = new THREE.Mesh(geometry, material);
			
			// Apply position and scale
			cube.position.set(config.position[0], config.position[1], config.position[2]);
			cube.scale.set(config.scale[0], config.scale[1], config.scale[2]);
			cube.rotation.y = Math.PI / 2;
			
			// Enable shadows
			cube.castShadow = true;
			cube.receiveShadow = true;
			
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

				// Ensure platform meshes cast and receive shadows
				gltf.scene.traverse(node => {
					if (node.isMesh) {
						node.castShadow = true;
						node.receiveShadow = true;
					}
				});

				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
			},
			xhr => this.loadingBar.update('platform', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	update(time, delta) {
		if (!this.ready) return;
		if (this.laserBarriers) this.laserBarriers.forEach(lb => lb.update(time, delta));
		if (this.flyingCubesSpawner) this.flyingCubesSpawner.update(delta); // delta already seconds
		
		// Animate laser cubes (move up and down like laser barriers)
		if (this.laserCubes) {
			this.laserCubes.forEach(cube => {
				cube.position.y = cube.userData.initialY + Math.sin(Date.now() * 0.005) * 2;
			});
		}
	}
}

export { platform };
