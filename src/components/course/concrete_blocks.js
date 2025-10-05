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
		this.collisionManager = game.collisionManager;
		this.ready = false;
		this.model = null;
		this.shaderMaterials = []; // Store multiple materials

		const {
			position = [-21.2, 1.8, 0],
			rotationY = Math.PI / 2,
			scale = [1, 1, 1],
			name = 'concrete_blocks',
			shaderOptions = {},
			useShader = true
		} = opts;

		// Normalize transforms
		this._position = Array.isArray(position) ? new THREE.Vector3(...position) : position.clone?.() ?? new THREE.Vector3(position.x, position.y, position.z);
		this._scale = Array.isArray(scale) ? new THREE.Vector3(...scale) : scale.clone?.() ?? new THREE.Vector3(scale.x, scale.y, scale.z);
		this._rotationY = rotationY;
		this._name = name;
		this._shaderOptions = shaderOptions;
		this._useShader = useShader;

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

		// Apply custom shader material to all meshes only if enabled
		if (this._useShader) {
			this._applyShaderMaterial(clone);
		}

		this.scene.add(clone);
		this.model = clone;
		this.ready = true;
		console.log(`Concrete block ${this._name} instantiated ${this._useShader ? 'with shader' : 'without shader'} and ready`);
	}

	_applyShaderMaterial(object) {
		object.traverse((child) => {
			if (child.isMesh) {
				// Create a NEW shader material for each mesh
				const shaderMaterial = createConcreteMaterial({
					color: new THREE.Color(0.5, 0.5, 0.5),
					roughness: 0.9,
					metallic: 0.05,
					noiseScale: 0.15,
					emissive: new THREE.Color(0.1, 0.1, 0.1),
					emissiveIntensity: 0.1,
					...this._shaderOptions
				});

				// Store the material for cleanup
				this.shaderMaterials.push(shaderMaterial);
				
				// Replace the material
				child.material = shaderMaterial;
			}
		});
	}

	// Register this obstacle as a collider
	registerCollider(collisionManager) {
		if (!this.model || !collisionManager) return null;
		return collisionManager.add(this.model, 'box');
	}

	update(time, delta) {
		if (!this.ready || !this._useShader) return;
		
		// Update all shader materials for animation
		this.shaderMaterials.forEach(material => {
			if (material.uniforms) {
				material.uniforms.uTime.value = time * 0.001;
			}
		});
	}

	dispose() {
		if (this.model && this.model.parent) this.model.parent.remove(this.model);
		
		// Dispose all shader materials
		this.shaderMaterials.forEach(material => {
			if (material) material.dispose();
		});
		this.shaderMaterials = [];
		
		this.model = null;
		this.ready = false;
	}
}

export { concrete_blocks };
