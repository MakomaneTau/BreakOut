import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';

class laser_barrier {
	constructor(game, opts = {}) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;

		const {
			position = [-21.2, 1.8, 0],
			rotationY = Math.PI / 2,
			scale = [1, 1, 1],
			name = 'laser_barrier'
		} = opts;

		// Normalize transforms
		this._position = Array.isArray(position) ? new THREE.Vector3(...position) : position.clone?.() ?? new THREE.Vector3(position.x, position.y, position.z);
		this._scale = Array.isArray(scale) ? new THREE.Vector3(...scale) : scale.clone?.() ?? new THREE.Vector3(scale.x, scale.y, scale.z);
		this._rotationY = rotationY;
		this._name = name;

		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/obstacles/laser/`);
		loader.load(
			'scene.gltf',
			gltf => {
				const obj = gltf.scene;
				obj.name = this._name;
				obj.rotation.y = this._rotationY;
				obj.scale.copy(this._scale);
				obj.position.copy(this._position);

				// Enable shadows on barrier meshes
				obj.traverse(node => {
					if (node.isMesh) {
						node.castShadow = true;
						node.receiveShadow = true;
					}
				});

				// Set obstacle type for collision detection
				obj.userData.type = 'laser';

				this.scene.add(obj);
				this.model = obj;
				this.ready = true;
			},
			xhr => this.loadingBar.update('laser_barrier', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	update(time, delta) {
		if (!this.ready) return;
		// Optional: animate or update platform model here
		this.model.position.x = this._position.x + Math.sin(Date.now() * 0.005) * 1; // Sway left and right from original x
	}
}

export { laser_barrier };
