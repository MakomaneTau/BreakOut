import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { laser_barrier, LaserBarrierSpawner } from './laser_barrier.js';
import { FlyingCubesSpawner } from './flying_cubes.js'; // Handles repeated spawning of moving cubes
import { concrete_blocks } from './concrete_blocks.js';
import { createPlatformMaterial } from '../../shaders/platformShader.js';

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.shaderMaterials = []; // Store shader materials for time updates

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
				{ start: [-180, 4.5, -4.5], end: [-95, 5.7, -4.5], scale: [1.2, 1.0, 3.2], speed: 0.05 },
				{ start: [-180, 4.5, -1.5], end: [-95, 4.5, -1.5], scale: [1.0, 1.0, 3.0], speed: 0.06 },
				{ start: [-180, 4.5, 0.0], end: [-95, 4.5, 0.0], scale: [1.5, 1.0, 6], speed: 0.07 },
				{ start: [-180, 4.5, 1.8], end: [-95, 4.5, 1.8], scale: [0.9, 1.0, 2.4], speed: 0.055 },
				{ start: [-180, 4.5, 7], end: [-95, 4.5, 7], scale: [1.3, 1.0, 7], speed: 0.06 },
				{ start: [-180, 4.5, 4.5], end: [-95, 4.5, 4.5], scale: [1.3, 1.0, 3.3], speed: 0.07 },
				{ start: [-180, 4.5, -7], end: [-95, 4.5, -7], scale: [1.3, 1.0, 6], speed: 0.08 },
				{ start: [-180, 4.5, 4.5], end: [-95, 4.5, 4.5], scale: [1.3, 1.0, 6], speed: 0.04 },
				{ start: [-180, 4.5, 4.5], end: [-95, 4.5, 4.5], scale: [1.3, 1.0, 3.3], speed: 0.08 },
				{ start: [-180, 4.5, 4.5], end: [-95, 4.5, 4.5], scale: [1.3, 1.0, 3.3], speed: 0.09 },
			]
		});

		// Laser barrier spawner (dynamic moving barriers)
		this.laserBarrierSpawner = new LaserBarrierSpawner(this.scene, {
			assetsPath: this.assetsPath,
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
			},
			xhr => this.loadingBar.update('platform', xhr.loaded, xhr.total),
			err => console.error(err)
		);
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
	}
}

export { platform };
