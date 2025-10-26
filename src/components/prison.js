import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';

class Prison {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.doors = [];
		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/prison/`);
		loader.load(
			'prison_closed.glb',
			gltf => {
				gltf.scene.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
				gltf.scene.position.set(0, -5, 0); // Adjust position as needed
				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;

				this.model.traverse((child) => {
					if (child.isMesh && child.name.toLowerCase().includes("door")) {
						child.userData.closedRotationY = child.rotation.y;
						child.userData.isOpen = false;
					 
						this.doors.push(child);
						console.log("DOOR FOUND:", child.name);
					}
				});

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
