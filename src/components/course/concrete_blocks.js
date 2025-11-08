import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { createConcreteMaterial } from '../../shaders/concreteShader.js';

class concrete_blocks {
	static _gltf = null;
	static _loading = null;

	constructor(game, opts = {}) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.shaderMaterial = null; // Store shader material for time updates

		const {
			position = [-21.2, 1.8, 0],
			rotationY = Math.PI / 2,
			scale = [1, 1, 1],
			name = 'concrete_blocks'
		} = opts;

		// Normalize transforms
		this._position = Array.isArray(position) ? new THREE.Vector3(...position) : position.clone?.() ?? new THREE.Vector3(position.x, position.y, position.z);
		this._scale = Array.isArray(scale) ? new THREE.Vector3(...scale) : scale.clone?.() ?? new THREE.Vector3(scale.x, scale.y, scale.z);
		this._rotationY = rotationY;
		this._name = name;

		// Load once, clone for each instance
		if (concrete_blocks._gltf) {
			this._instantiateFromCache();
		} else if (concrete_blocks._loading) {
			concrete_blocks._loading.then(() => this._instantiateFromCache());
		} else {
			const loader = new GLTFLoader().setPath(`${this.assetsPath}models/obstacles/concrete_obstacle/`);
			concrete_blocks._loading = new Promise((resolve, reject) => {
				loader.load(
					'scene.gltf',
					(gltf) => {
						concrete_blocks._gltf = gltf;
						resolve(gltf);
					},
					(xhr) => this.loadingBar.update('concrete_blocks', xhr.loaded, xhr.total),
					(err) => {
						console.error(err);
						reject(err);
					}
				);
			}).then(() => this._instantiateFromCache());
		}
	}

	_instantiateFromCache() {
		if (!concrete_blocks._gltf) return;
		const clone = concrete_blocks._gltf.scene.clone(true);
		clone.name = this._name;
		clone.rotation.y = this._rotationY;
		clone.scale.copy(this._scale);
		clone.position.copy(this._position);

		// Create concrete shader material
		this.shaderMaterial = createConcreteMaterial({
			color: new THREE.Color(0.6, 0.6, 0.6),
			noiseScale: 0.1,
			roughness: 0.8,
			metallic: 0.1
		});

		// Enable shadows on all meshes and apply shader
		clone.traverse(node => {
			if (node.isMesh) {
				node.castShadow = true;
				node.receiveShadow = true;
				// Apply shader material to concrete meshes
				if (this.shaderMaterial) {
					node.material = this.shaderMaterial;
				}
				// Set obstacle type on child meshes as well for reliable collision detection
				if (!node.userData) node.userData = {};
				node.userData.type = 'concrete_block';
			}
		});

		// Set obstacle type for collision detection on root object
		clone.userData.type = 'concrete_block';

		this.scene.add(clone);
		this.model = clone;
		this.ready = true;
	}

	update(time, delta) {
		if (!this.ready) return;
		// Update shader time uniform
		if (this.shaderMaterial && this.shaderMaterial.uniforms && this.shaderMaterial.uniforms.uTime) {
			this.shaderMaterial.uniforms.uTime.value = time;
		}
	}

	dispose() {
		if (this.model && this.model.parent) this.model.parent.remove(this.model);
		this.model = null;
		this.ready = false;
	}
}

export { concrete_blocks };
