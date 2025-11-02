import * as THREE from '../../../public/libs/three137/three.module.js';

class finish_line {
	constructor(game, opts = {}) {
		this.assetsPath = game.assetsPath;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.game = game;

		const {
			position = [0, 4, 0],
			width = 2,
			height = 0.1,
			depth = 6
		} = opts;

		// Normalize position
		this._position = Array.isArray(position) ? new THREE.Vector3(...position) : position.clone?.() ?? new THREE.Vector3(position.x, position.y, position.z);
		this._width = width;
		this._height = height;
		this._depth = depth;

		this.create();
	}

	create() {
		// Create a checkerboard pattern material
		const checkerSize = 0.5;
		const canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 256;
		const ctx = canvas.getContext('2d');

		// Create checkerboard pattern (black and white)
		const cols = Math.floor(canvas.width / checkerSize);
		const rows = Math.floor(canvas.height / checkerSize);
		
		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				ctx.fillStyle = (i + j) % 2 === 0 ? '#000000' : '#ffffff';
				ctx.fillRect(j * checkerSize, i * checkerSize, checkerSize, checkerSize);
			}
		}

		const texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(8, 2); // Repeat pattern across the finish line

		// Create finish line material with emissive glow
		const material = new THREE.MeshStandardMaterial({
			map: texture,
			emissive: new THREE.Color(0x333333),
			emissiveMap: texture,
			emissiveIntensity: 0.3,
			roughness: 0.5,
			metalness: 0.2
		});

		// Create finish line geometry (flat plane on top of platform)
		// width spans across platform (Z axis), depth is thickness along platform (X axis)
		const geometry = new THREE.BoxGeometry(this._depth, this._height, this._width);
		const mesh = new THREE.Mesh(geometry, material);

		// Position the finish line
		mesh.position.copy(this._position);
		// No rotation needed - geometry is already oriented correctly
		
		// Make it visible and enable shadows
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		// Set finish line type for collision detection
		mesh.userData.type = 'finish_line';
		mesh.name = 'finish_line';

		this.scene.add(mesh);
		this.model = mesh;
		this.ready = true;

		console.log(`✅ Finish line created at position (${this._position.x.toFixed(2)}, ${this._position.y.toFixed(2)}, ${this._position.z.toFixed(2)})`);
	}

	update(time, delta) {
		// Optional: Add animation (pulsing glow, rotation, etc.)
		if (!this.ready || !this.model) return;
		
		// Subtle pulsing effect
		const pulseSpeed = 2;
		const pulseIntensity = 0.2 + Math.sin(time * pulseSpeed) * 0.1;
		if (this.model.material && this.model.material.emissiveIntensity !== undefined) {
			this.model.material.emissiveIntensity = pulseIntensity;
		}
	}

	dispose() {
		if (this.model && this.model.parent) {
			this.model.parent.remove(this.model);
		}
		if (this.model && this.model.material) {
			this.model.material.dispose();
		}
		if (this.model && this.model.geometry) {
			this.model.geometry.dispose();
		}
		this.model = null;
		this.ready = false;
	}
}

export { finish_line };
