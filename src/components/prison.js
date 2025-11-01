import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';

class Prison {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/prison/`);
		loader.load(
			'scene.gltf',
			gltf => {
				gltf.scene.scale.set(1, 1, 1); // Adjust scale as needed
				gltf.scene.position.set(-10, -17.5, 30); // Adjust position as needed
				gltf.scene.rotation.y = Math.PI / 2; // Rotate 90 degrees around the Y-axis
				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
			},
			xhr => this.loadingBar.update('prison', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	update(time, delta) {
		if (!this.ready) return;
		// Optional: animate or update prison model here
	}
}

export { Prison };
