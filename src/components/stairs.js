import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';

class stairs {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/stairs/`);
		loader.load(
			'scene.gltf',
			gltf => {
				gltf.scene.rotation.y = Math.PI/2; // Rotate 180 degrees if needed
				gltf.scene.scale.set(1, 1, 1); // Adjust scale as needed
				gltf.scene.position.set(-12.5, -5.5, -12.2); // Adjust position as needed
				
				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
			},
			xhr => this.loadingBar.update('stairs', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	update(time, delta) {
		if (!this.ready) return;
		// Optional: animate or update stairs model here
	}
}

export { stairs };
