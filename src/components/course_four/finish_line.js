import * as THREE from '../../../public/libs/three137/three.module.js';

class finish_line {
	constructor(game, opts = {}) {
		this.assetsPath = game.assetsPath;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.collisionModel = null; // Separate collision mesh with larger bounds
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

		// Create finish line material with emissive glow - make it more visible
		const material = new THREE.MeshStandardMaterial({
			map: texture,
			emissive: new THREE.Color(0x00ff88), // Bright green glow
			emissiveMap: texture,
			emissiveIntensity: 0.8, // Increased from 0.3
			roughness: 0.5,
			metalness: 0.2
		});

		// Create finish line geometry (flat plane on top of platform)
		// width spans across platform (Z axis), depth is thickness along platform (X axis)
		// Increase height slightly for better visibility
		const visualHeight = Math.max(this._height, 0.15); // Ensure minimum height of 0.15
		const geometry = new THREE.BoxGeometry(this._depth, visualHeight, this._width);
		const mesh = new THREE.Mesh(geometry, material);

		// Position the finish line
		mesh.position.copy(this._position);
		// No rotation needed - geometry is already oriented correctly
		
		// Make it visible and enable shadows
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		// Set finish line type for collision detection (on visual mesh too for fallback)
		mesh.userData.type = 'finish_line';
		mesh.name = 'finish_line';

		this.scene.add(mesh);
		this.model = mesh;

		// Create a separate invisible collision box that's taller for reliable detection
		// This ensures the player can't pass through without triggering
		const collisionHeight = 3.0; // Tall collision box (from platform to above player head)
		const collisionDepth = this._depth * 1.5; // Slightly wider for better detection
		const collisionWidth = this._width * 1.2; // Slightly wider across platform
		
		const collisionGeometry = new THREE.BoxGeometry(collisionDepth, collisionHeight, collisionWidth);
		const collisionMaterial = new THREE.MeshBasicMaterial({
			visible: false, // Invisible
			transparent: true,
			opacity: 0
		});
		
		const collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
		collisionMesh.position.copy(this._position);
		collisionMesh.position.y = this._position.y + (collisionHeight / 2) - (visualHeight / 2); // Center vertically
		
		// Set finish line type for collision detection - this is the primary collision mesh
		collisionMesh.userData.type = 'finish_line';
		collisionMesh.userData.isFinishLineCollider = true; // Mark as primary collider
		collisionMesh.name = 'finish_line_collider';

		this.scene.add(collisionMesh);
		this.collisionModel = collisionMesh;

		this.ready = true;

		console.log(`✅ Finish line created at position (${this._position.x.toFixed(2)}, ${this._position.y.toFixed(2)}, ${this._position.z.toFixed(2)})`);
		console.log(`✅ Finish line collision box: height=${collisionHeight.toFixed(2)}, depth=${collisionDepth.toFixed(2)}, width=${collisionWidth.toFixed(2)}`);
	}

	update(time, delta) {
		// Optional: Add animation (pulsing glow, rotation, etc.)
		if (!this.ready || !this.model) return;
		
		// More noticeable pulsing effect with green glow
		const pulseSpeed = 2.5;
		const baseIntensity = 0.6;
		const pulseAmplitude = 0.4;
		const pulseIntensity = baseIntensity + Math.sin(time * pulseSpeed) * pulseAmplitude;
		
		if (this.model.material && this.model.material.emissiveIntensity !== undefined) {
			this.model.material.emissiveIntensity = pulseIntensity;
		}
	}

	dispose() {
		// Dispose visual mesh
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
		
		// Dispose collision mesh
		if (this.collisionModel && this.collisionModel.parent) {
			this.collisionModel.parent.remove(this.collisionModel);
		}
		if (this.collisionModel && this.collisionModel.material) {
			this.collisionModel.material.dispose();
		}
		if (this.collisionModel && this.collisionModel.geometry) {
			this.collisionModel.geometry.dispose();
		}
		this.collisionModel = null;
		
		this.ready = false;
	}
}

export { finish_line };
