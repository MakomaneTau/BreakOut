// Simple asset loader cache so repeated GLTF or texture loads don't refetch.
// Extend as needed (add texture loader etc.)
import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';

class LoaderCache {
	constructor() {
		this._gltfLoader = new GLTFLoader();
		this._textureLoader = new THREE.TextureLoader();
		this._gltfPromises = new Map(); // key -> Promise
		this._texturePromises = new Map();
	}

	gltf(path) {
		if (this._gltfPromises.has(path)) return this._gltfPromises.get(path);
		const p = new Promise((resolve, reject) => {
			this._gltfLoader.load(path, resolve, undefined, reject);
		});
		this._gltfPromises.set(path, p);
		return p;
	}

	texture(path) {
		if (this._texturePromises.has(path)) return this._texturePromises.get(path);
		const p = new Promise((resolve, reject) => {
			this._textureLoader.load(path, tex => {
				// Set some sane defaults important for performance & quality
				tex.anisotropy = Math.min(4, this._getMaxAnisotropy());
				resolve(tex);
			}, undefined, reject);
		});
		this._texturePromises.set(path, p);
		return p;
	}

	_getMaxAnisotropy() {
		try {
			const gl = document.createElement('canvas').getContext('webgl');
			return gl.getParameter(gl.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
		} catch { return 1; }
	}
}

export const loaderCache = new LoaderCache();
