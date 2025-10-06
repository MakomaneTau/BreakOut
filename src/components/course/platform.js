// import * as THREE from '../../../public/libs/three137/three.module.js';
// import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
// import { concrete_blocks } from './concrete_blocks.js';
// import { spinning_blade } from './spinning_blade.js';
// import { laser_barrier } from './laser_barrier.js';

// class platform {
// 	constructor(game) {
// 		this.assetsPath = game.assetsPath;
// 		this.loadingBar = game.loadingBar;
// 		this.scene = game.scene;
// 		this.collisionManager = game.collisionManager;
// 		this.ready = false;
// 		this.model = null;
// 		this.obstacleColliders = [];
// 		this.concreteBlocks = [
// 			new concrete_blocks(game, { position: [-39, 2.3, -3], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 			new concrete_blocks(game, { position: [-36, 2.3, 3], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 			new concrete_blocks(game, { position: [-33, 2.3, -1], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 			new concrete_blocks(game, { position: [-29, 2.3, 3.9], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 			new concrete_blocks(game, { position: [-26, 2.3, 1], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 			new concrete_blocks(game, { position: [-20, 2.3, -4.9], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 			new concrete_blocks(game, { position: [-17, 2.3, 2.5], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 			new concrete_blocks(game, { position: [-13, 2.3, -3], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 			new concrete_blocks(game, { position: [-10, 2.3, 4], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 			new concrete_blocks(game, { position: [-6, 2.3, 2], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 			new concrete_blocks(game, { position: [-2.2, 2.3, -4], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
// 		];

// 		this.spinningBlades = [
// 			new spinning_blade(game, { position: [-26, 1.9, -3.5], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
// 			new spinning_blade(game, { position: [-2.2, 1.9, 1], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
// 			new spinning_blade(game, { position: [-39, 1.9, 0.5], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
// 			new spinning_blade(game, { position: [-21, 1.9, 2], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
// 		];

// 		this.laserBarriers = [
// 			new laser_barrier(game, { position: [-10, 4.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
// 			new laser_barrier(game, { position: [-32, 4.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' })
// 		];
// 		this.load();
// 	}

// 	load() {
// 		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/platform/`);
// 		loader.load(
// 			'scene.gltf',
// 			gltf => {
// 				gltf.scene.rotation.y = Math.PI / 2; // Rotate 180 degrees if needed
// 				gltf.scene.scale.set(0.05, 1, 0.2); // Adjust scale as needed
// 				gltf.scene.position.set(-21.2, 1.8, 0); // Adjust position as needed

// 				this.scene.add(gltf.scene);
// 				this.model = gltf.scene;
// 				this.ready = true;
// 			},
// 			xhr => this.loadingBar.update('platform', xhr.loaded, xhr.total),
// 			err => console.error(err)
// 		);
// 	}

// 	// Register all obstacles with the collision system using the collision manager
// 	registerObstaclesWithCollision() {
// 		if (!this.collisionManager) return;
		
// 		this.obstacleColliders = this.collisionManager.registerPlatformObstacles(this);
// 	}

// 	update(time, delta) {
// 		if (!this.ready) return;
// 		if (this.concreteBlocks) this.concreteBlocks.forEach(cb => cb.update(time, delta));
// 		if (this.spinningBlades) this.spinningBlades.forEach(sb => sb.update(time, delta));
// 		if (this.laserBarriers) this.laserBarriers.forEach(lb => lb.update(time, delta));
// 	}
// }

// export { platform };


import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { concrete_blocks } from './concrete_blocks.js';
import { spinning_blade } from './spinning_blade.js';
import { laser_barrier } from './laser_barrier.js';
import { createPlatformMaterial } from '../../shaders/platformShader.js';

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.collisionManager = game.collisionManager;
		this.ready = false;
		this.model = null;
		this.obstacleColliders = [];
		this.shaderMaterials = [];

		this.concreteBlocks = [
			new concrete_blocks(game, { position: [-39, 2.3, -3], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-36, 2.3, 3], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-33, 2.3, -1], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-29, 2.3, 3.9], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-26, 2.3, 1], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-20, 2.3, -4.9], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-17, 2.3, 2.5], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-13, 2.3, -3], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-10, 2.3, 4], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-6, 2.3, 2], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-2.2, 2.3, -4], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
		];

		this.spinningBlades = [
			new spinning_blade(game, { position: [-26, 1.9, -3.5], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
			new spinning_blade(game, { position: [-2.2, 1.9, 1], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
			new spinning_blade(game, { position: [-39, 1.9, 0.5], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
			new spinning_blade(game, { position: [-21, 1.9, 2], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
		];

		this.laserBarriers = [
			new laser_barrier(game, { position: [-10, 4.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
			new laser_barrier(game, { position: [-32, 4.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' })
		];

		// Finish line as broad as platform - using box for better collision detection
		const finishLineWidth = 15; // approximate platform width
		const finishLineHeight = 8;
		const finishLineDepth = 2; // Add depth for better collision detection
		const finishLineGeometry = new THREE.BoxGeometry(finishLineDepth, finishLineHeight, finishLineWidth);
		const finishLineMaterial = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			transparent: true,
			opacity: 0.4,
			side: THREE.DoubleSide
		});
		this.finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
		this.finishLine.position.set(-45, 4, 0);
		// No rotation needed for box geometry
		
		// Set up finish line for collision detection
		this.finishLine.userData = {
			type: 'finish_line',
			name: 'green_checkpoint'
		};
		
		this.scene.add(this.finishLine);

		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/platform/`);
		loader.load(
			'scene.gltf',
			gltf => {
				gltf.scene.rotation.y = Math.PI / 2;
				gltf.scene.scale.set(0.05, 1, 0.2);
				gltf.scene.position.set(-21.2, 1.8, 0);

				// Apply platform shader
				this._applyPlatformShader(gltf.scene);

				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
				console.log('Platform loaded with shader and ready');
			},
			xhr => this.loadingBar.update('platform', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	_applyPlatformShader(object) {
		object.traverse((child) => {
			if (child.isMesh) {
				// Create platform shader material
				const shaderMaterial = createPlatformMaterial({
					color: new THREE.Color(0.25, 0.25, 0.3), // Dark industrial color
					roughness: 0.9,
					metallic: 0.05,
					noiseScale: 0.08,
					wearIntensity: 0.5,
					grimeIntensity: 0.4,
					patternScale: 0.3,
					emissive: new THREE.Color(0.02, 0.02, 0.05),
					emissiveIntensity: 0.1
				});

				this.shaderMaterials.push(shaderMaterial);
				child.material = shaderMaterial;
			}
		});
	}

	// Register all obstacles with the collision system using the collision manager
	registerObstaclesWithCollision() {
		if (!this.collisionManager) return;
		
		this.obstacleColliders = this.collisionManager.registerPlatformObstacles(this);
		
		// Register finish line as a collider
		if (this.finishLine) {
			const finishLineCollider = this.collisionManager.add(this.finishLine, 'box');
			if (finishLineCollider) {
				this.obstacleColliders.push(finishLineCollider);
			}
		}
	}

	update(time, delta) {
		if (!this.ready) return;
		
		// Update platform shader materials
		this.shaderMaterials.forEach(material => {
			if (material.uniforms) {
				material.uniforms.uTime.value = time * 0.001;
			}
		});
		
		// Update obstacles
		if (this.concreteBlocks) this.concreteBlocks.forEach(cb => cb.update(time, delta));
		if (this.spinningBlades) this.spinningBlades.forEach(sb => sb.update(time, delta));
		if (this.laserBarriers) this.laserBarriers.forEach(lb => lb.update(time, delta));

		// Pulsating effect for finish line
		if (this.finishLine) {
			const opacity = 0.4 + 0.2 * Math.sin(time * 5);
			this.finishLine.material.opacity = opacity;
		}
	}

	dispose() {
		if (this.model && this.model.parent) this.model.parent.remove(this.model);
		
		// Dispose shader materials
		this.shaderMaterials.forEach(material => {
			if (material) material.dispose();
		});
		this.shaderMaterials = [];
		
		// Dispose obstacles
		if (this.concreteBlocks) this.concreteBlocks.forEach(cb => cb.dispose());
		if (this.spinningBlades) this.spinningBlades.forEach(sb => sb.dispose());
		if (this.laserBarriers) this.laserBarriers.forEach(lb => lb.dispose());
		
		this.model = null;
		this.ready = false;
	}
}

export { platform };
