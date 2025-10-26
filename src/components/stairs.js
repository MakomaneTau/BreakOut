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
		const platformLoader = new GLTFLoader().setPath(`${this.assetsPath}models/platform/`);

		platformLoader.load(
			'scene.gltf',
			gltf => {
				gltf.scene.rotation.y = Math.PI / 2; // Rotate 180 degrees if needed
				gltf.scene.scale.set(0.05, 2, 0.03); // Adjust scale as needed
				gltf.scene.position.set(0.5, -8.0, 0.4); // Adjust position as needed

				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
			},
			xhr => this.loadingBar.update('stairs', xhr.loaded, xhr.total),
			err => console.error(err)
		);

		loader.load(
			'scene.gltf',
			gltf => {
				gltf.scene.rotation.y = Math.PI / 2; // Rotate 180 degrees if needed
				gltf.scene.scale.set(5, 3.5, 5); // Adjust scale as needed
				gltf.scene.position.set(-80, -21, -62.9); // Adjust position as needed

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
