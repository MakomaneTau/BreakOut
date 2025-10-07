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
			new laser_barrier(game, { position: [-71, 4.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-80, 4.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-63, 4.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-50, 4.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' })
		];

		// Flying cubes spawner
		this.flyingCubesSpawner = new FlyingCubesSpawner(this.scene, {
			countMin: 1,
			countMax: 2,
			sizeMin: 1.5,
			sizeMax: 3.0,
			speedMin: 0.7 * 0.06,
			speedMax: 1.1 * 0.09,
			intervalMin: 1.5,
			intervalMax: 3.0,
			color: 0xff2222,
			maxActive: 10,
			initialSpawn: false,
			debug: false,
			useBasicMaterial: false
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
				gltf.scene.position.set(-72.3, 1.8, 0); // Adjust position as needed

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
	}
}

export { platform };
