import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { spinning_blade } from './spinning_blade.js';
import { laser_barrier } from './laser_barrier.js';

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;

		this.spinningBlades = [
			new spinning_blade(game, { position: [-26, 4.2, -3.5], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
			new spinning_blade(game, { position: [-2.2, 4.2, 1], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
			new spinning_blade(game, { position: [-39, 4.2, 0.5], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
			new spinning_blade(game, { position: [-21, 4.2, 2], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
		];

		// Add laser barriers
		this.laserBarriers = [
			new laser_barrier(game, { position: [-10, 8.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-32, 8.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_B' })
		];

		// Create 3D cubes with same properties as laser barriers
		this.laserCubes = [];
		this.createLaserCubes([
			{ position: [-10, 8.7, 0], scale: [20, 2, 2], name: 'laser_cube_A' },
			{ position: [-32, 8.7, 0], scale: [20, 2, 2], name: 'laser_cube_B' }
		]);
		
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
				gltf.scene.position.set(-21.2, 4, 0); // Adjust position as needed

				// Enable shadows on platform meshes
				gltf.scene.traverse(node => {
					if (node.isMesh) {
						node.receiveShadow = true;
						node.castShadow = true;
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
		if (this.spinningBlades) this.spinningBlades.forEach(sb => sb.update(time, delta));
		if (this.laserBarriers) this.laserBarriers.forEach(lb => lb.update(time, delta));
		
		// Animate laser cubes (move up and down like laser barriers)
		if (this.laserCubes) {
			this.laserCubes.forEach(cube => {
				cube.position.y = cube.userData.initialY + Math.sin(Date.now() * 0.005) * 2;
			});
		}
	}
}

export { platform };
