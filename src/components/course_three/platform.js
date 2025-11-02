import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { laser_barrier, LaserBarrierSpawner } from './laser_barrier.js';
import { FlyingCubesSpawner } from './flying_cubes.js'; // Handles repeated spawning of moving cubes

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;

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
		if (this.flyingCubesSpawner) this.flyingCubesSpawner.update(delta); // delta already seconds
		if (this.laserBarrierSpawner) this.laserBarrierSpawner.update(delta);
	}
}

export { platform };
