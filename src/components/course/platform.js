import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { concrete_blocks } from './concrete_blocks.js';
import { spinning_blade } from './spinning_blade.js';
import { laser_barrier } from './laser_barrier.js';
import { createPlatformMaterial } from '../../shaders/platformShader.js';
import { Helicopter } from '../helicopter.js';

class platform {
	constructor(game, opts = {}) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.shaderMaterials = []; // Store shader materials for time updates
		this.level = opts.level || game.level || 1;
		this.helicopter = null; // Helicopter at finish line (will be created after platform loads)
		this.game = game; // Store game reference for helicopter creation
		
		// Play mode (level 4) has no obstacles - skip creating them
		if (this.level < 4) {
			this.concreteBlocks = [
				new concrete_blocks(game, { position: [-39, 4.6, -3], scale: [6.5, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
				new concrete_blocks(game, { position: [-36, 4.6, 3], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
				new concrete_blocks(game, { position: [-33, 4.6, -1], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
				new concrete_blocks(game, { position: [-29, 4.6, 3.9], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
				new concrete_blocks(game, { position: [-26, 4.6, 1.5], scale: [9, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
				new concrete_blocks(game, { position: [-20, 4.6, -4.9], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
				new concrete_blocks(game, { position: [-17, 4.6, 0], scale: [12, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
				new concrete_blocks(game, { position: [-13, 4.6, -3], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
				new concrete_blocks(game, { position: [-10, 4.6, 4], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
				new concrete_blocks(game, { position: [-6, 4.6, 0], scale: [12, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
				new concrete_blocks(game, { position: [-2.2, 4.6, -4], scale: [3, 1, 0.25], rotationY: Math.PI / 2, name: 'concrete_A' }),
			];

			this.spinningBlades = [
				new spinning_blade(game, { position: [-26, 4.2, -3.5], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
				new spinning_blade(game, { position: [-2.2, 4.2, 1], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
				new spinning_blade(game, { position: [-39, 4.2, 0.5], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
				new spinning_blade(game, { position: [-21, 4.2, 2], scale: [0.025, 0.025, 0.025], rotationY: Math.PI / 2, name: 'blade_A' }),
			];

			this.laserBarriers = [
				new laser_barrier(game, { position: [-10, 8.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' }),
				new laser_barrier(game, { position: [-32, 8.7, 0], scale: [4.5, 2, 2], rotationY: Math.PI / 2, name: 'laser_A' })
			];
			
			// Helicopter will be created after platform loads to calculate its actual dimensions
		} else {
			// Play mode - no obstacles
			this.concreteBlocks = [];
			this.spinningBlades = [];
			this.laserBarriers = [];
		}
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

				// Enable shadows on platform meshes and apply shader
				const platformMaterial = createPlatformMaterial({
					color: new THREE.Color(0.3, 0.3, 0.35),
					noiseScale: 0.1,
					wearIntensity: 0.4,
					grimeIntensity: 0.3,
					patternScale: 0.5
				});

				// Store material reference once for time updates
				if (platformMaterial) {
					this.shaderMaterials.push(platformMaterial);
				}

				gltf.scene.traverse(node => {
					if (node.isMesh) {
						node.receiveShadow = true;
						node.castShadow = true;
						// Apply shader material to platform meshes
						if (platformMaterial) {
							node.material = platformMaterial;
						}
					}
				});

				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
				
				// Calculate platform dimensions and place helicopter at the end
				this.positionHelicopterAtEnd();
			},
			xhr => this.loadingBar.update('platform', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}
	
	positionHelicopterAtEnd() {
		if (!this.model || this.level !== 1) return; // Only create helicopter for level 1
		
		// Calculate bounding box of the platform to get actual dimensions
		const box = new THREE.Box3().setFromObject(this.model);
		const platformMinX = box.min.x;
		const platformMaxX = box.max.x;
		const platformCenterX = (platformMinX + platformMaxX) / 2;
		
		// Player starts around x=3 (based on resetToStartPosition)
		const playerStartX = 3;
		
		// Determine which end is closer to player start (that's the start of the platform)
		const distanceToMin = Math.abs(platformMinX - playerStartX);
		const distanceToMax = Math.abs(platformMaxX - playerStartX);
		
		// The end is the one farther from the player start
		const platformEndX = distanceToMin > distanceToMax ? platformMinX : platformMaxX;
		
		// Only create helicopter if it doesn't exist yet (one helicopter per platform)
		if (!this.helicopter) {
			this.helicopter = new Helicopter(this.game, {
				position: new THREE.Vector3(platformEndX, 8, 0),
				scale: new THREE.Vector3(1, 1, 1),
				rotation: new THREE.Euler(0, Math.PI / 2, 0)
			});
			console.log(`🚁 Level 1: Helicopter positioned at end of platform (X: ${platformEndX.toFixed(2)}, platform extends from ${platformMinX.toFixed(2)} to ${platformMaxX.toFixed(2)})`);
		}
	}

	update(time, delta) {
		if (!this.ready) return;
		// Update shader time uniforms
		this.shaderMaterials.forEach(mat => {
			if (mat.uniforms && mat.uniforms.uTime) {
				mat.uniforms.uTime.value = time;
			}
		});
		// Only update obstacles if they exist (not in play mode)
		if (this.concreteBlocks && this.concreteBlocks.length > 0) {
			this.concreteBlocks.forEach(cb => cb.update(time, delta));
		}
		if (this.spinningBlades && this.spinningBlades.length > 0) {
			this.spinningBlades.forEach(sb => sb.update(time, delta));
		}
		if (this.laserBarriers && this.laserBarriers.length > 0) {
			this.laserBarriers.forEach(lb => lb.update(time, delta));
		}
		// Update helicopter animation
		if (this.helicopter && this.helicopter.ready) {
			this.helicopter.update(time, delta);
		}
	}
}

export { platform };
