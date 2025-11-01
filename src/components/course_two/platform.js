import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { laser_barrier } from './laser_barrier.js';
import { FlyingCubesSpawner } from './flying_cubes.js'; // Handles repeated spawning of moving cubes
import { createPlatformMaterial } from '../../shaders/platformShader.js';

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.shaderMaterials = []; // Store shader materials for time updates

		this.laserBarriers = [
			new laser_barrier(game, { position: [-71, 7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-80, 7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-63, 7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-50, 7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' })
		];

		// Flying cubes spawner (deterministic: edit coordinates/scale below)
		this.flyingCubesSpawner = new FlyingCubesSpawner(this.scene, {
			color: 0xff2222,
			useBasicMaterial: false,
			loop: true,
			debug: false,
			// EDIT ME: exactly 5 cubes, choose start/end coordinates, scale, and speed
			cubeConfigs: [
				{ start: [-80, 4.5, -4.5], end: [-42, 4.5, -4.5], scale: [1.2, 1, 3.2], speed: 0.03 },
				{ start: [-80, 4.5, -1.5], end: [-42, 4.5, -1.5], scale: [1.0, 1.0, 3.0], speed: 0.04 },
				{ start: [-80, 4.5,  0.0], end: [-42, 4.5,  0.0], scale: [1.5, 1, 2.0], speed: 0.09 },
				{ start: [-80, 4.5,  1.8], end: [-42, 4.5,  1.8], scale: [0.9, 1, 2.4], speed: 0.06 },
				{ start: [-80, 4.5,  4.5], end: [-42, 4.5,  4.2], scale: [1.3, 1, 3.3], speed: 0.05 },
			]
		});
		this.load();
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
		if (this.laserBarriers) this.laserBarriers.forEach(lb => lb.update(time, delta));
		if (this.flyingCubesSpawner) this.flyingCubesSpawner.update(delta); // delta already seconds
	}
}

export { platform };
