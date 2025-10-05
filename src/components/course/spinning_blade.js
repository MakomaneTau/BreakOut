import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';

class spinning_blade {
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
			name = 'c'
		} = opts;

		// Normalize transforms
		this._position = Array.isArray(position) ? new THREE.Vector3(...position) : position.clone?.() ?? new THREE.Vector3(position.x, position.y, position.z);
		this._scale = Array.isArray(scale) ? new THREE.Vector3(...scale) : scale.clone?.() ?? new THREE.Vector3(scale.x, scale.y, scale.z);
		this._rotationY = rotationY;
		this._name = name;

		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/obstacles/spinning_blade_obstacle/`);
		loader.load(
			'scene.gltf',
			gltf => {
				const obj = gltf.scene;
				obj.name = this._name;
				obj.rotation.y = this._rotationY;
				obj.rotation.x = Math.PI / 2;
				obj.scale.copy(this._scale);
				obj.position.copy(this._position);

				this.scene.add(obj);
				this.model = obj;
				this.ready = true;
			},
			xhr => this.loadingBar.update('spinning_blade', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	// Register this obstacle as a collider
	registerCollider(collisionManager) {
		if (!this.model || !collisionManager) return null;
		return collisionManager.add(this.model, 'box');
	}

	update(time, delta) {
		if (!this.ready) return;
		// Optional: animate or update platform model here
		this.model.rotation.y += delta * 9; // Spin the blade

	}
}

export { spinning_blade };
