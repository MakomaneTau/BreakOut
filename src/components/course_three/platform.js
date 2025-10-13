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


		// Flying cubes spawner
		this.flyingCubesSpawner = new FlyingCubesSpawner(this.scene, {
			countMin: 2,
			countMax: 4,
			sizeMin: 1.5,
			sizeMax: 3.0,
			speedMin: 0.18,
			speedMax: 0.32,
			intervalMin: 5,
			intervalMax: 5.3,
			color: 0xff2222,
			maxActive: 5,
			initialSpawn: true,
			debug: false,
			useBasicMaterial: false
		});

		// Laser barrier spawner (dynamic moving barriers)
		this.laserBarrierSpawner = new LaserBarrierSpawner(this.scene, {
			assetsPath: this.assetsPath,
			countMin: 2,
			countMax: 4,
			sizeMin: 1,
			sizeMax: 1,
			scale: [4.5, 2, 2],
			speedMin: 0.15,
			speedMax: 0.25,
			start: [-180, 8.7, 0],
			end: [-95, 8.7, 0],
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
