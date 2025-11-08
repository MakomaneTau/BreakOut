import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		// No obstacles in play mode - just free exploration
		this.load();
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
		// No obstacles to update in play mode
	}
}

export { platform };

