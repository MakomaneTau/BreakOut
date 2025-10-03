import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { concrete_blocks } from './concrete_blocks.js';
import { spinning_blade } from './spinning_blade.js';
import { laser_barrier } from './laser_barrier.js';

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.collisionManager = game.collisionManager;
		this.ready = false;
		this.model = null;
		this.obstacleColliders = [];
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
		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/platform/`);
		loader.load(
			'scene.gltf',
			gltf => {
				gltf.scene.rotation.y = Math.PI / 2; // Rotate 180 degrees if needed
				gltf.scene.scale.set(0.05, 1, 0.2); // Adjust scale as needed
				gltf.scene.position.set(-21.2, 1.8, 0); // Adjust position as needed

				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
			},
			xhr => this.loadingBar.update('platform', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	// Register all obstacles with the collision system
	registerObstaclesWithCollision() {
		if (!this.collisionManager) return;

		console.log('Starting obstacle registration...');
		console.log(`Concrete blocks: ${this.concreteBlocks ? this.concreteBlocks.length : 0}`);
		console.log(`Spinning blades: ${this.spinningBlades ? this.spinningBlades.length : 0}`);
		console.log(`Laser barriers: ${this.laserBarriers ? this.laserBarriers.length : 0}`);

		let registeredCount = 0;

		// Register concrete blocks
		if (this.concreteBlocks) {
			this.concreteBlocks.forEach((block, index) => {
				console.log(`Concrete block ${index}: ready=${block.ready}, hasModel=${!!block.model}, name=${block._name}`);
				if (block.ready && block.model) {
					const collider = block.registerCollider(this.collisionManager);
					if (collider) {
						this.obstacleColliders.push(collider);
						registeredCount++;
						console.log(`Registered concrete block collider: ${block._name}`);
					}
				} else {
					console.log(`Concrete block ${block._name} not ready yet`);
				}
			});
		}

		// Register spinning blades
		if (this.spinningBlades) {
			this.spinningBlades.forEach(blade => {
				if (blade.ready && blade.model) {
					const collider = blade.registerCollider(this.collisionManager);
					if (collider) {
						this.obstacleColliders.push(collider);
						registeredCount++;
						console.log(`Registered spinning blade collider: ${blade._name}`);
					}
				} else {
					console.log(`Spinning blade ${blade._name} not ready yet`);
				}
			});
		}

		// Register laser barriers
		if (this.laserBarriers) {
			this.laserBarriers.forEach(barrier => {
				if (barrier.ready && barrier.model) {
					const collider = barrier.registerCollider(this.collisionManager);
					if (collider) {
						this.obstacleColliders.push(collider);
						registeredCount++;
						console.log(`Registered laser barrier collider: ${barrier._name}`);
					}
				} else {
					console.log(`Laser barrier ${barrier._name} not ready yet`);
				}
			});
		}

		console.log(`Total obstacle colliders registered: ${registeredCount}`);
		
		// If not all obstacles are ready, try again later
		if (registeredCount < this.getExpectedObstacleCount()) {
			console.log('Some obstacles not ready yet, retrying in 500ms...');
			setTimeout(() => {
				this.registerObstaclesWithCollision();
			}, 500);
		}
	}

	// Get expected number of obstacles
	getExpectedObstacleCount() {
		let expected = 0;
		if (this.concreteBlocks) expected += this.concreteBlocks.length;
		if (this.spinningBlades) expected += this.spinningBlades.length;
		if (this.laserBarriers) expected += this.laserBarriers.length;
		return expected;
	}

	update(time, delta) {
		if (!this.ready) return;
		if (this.concreteBlocks) this.concreteBlocks.forEach(cb => cb.update(time, delta));
		if (this.spinningBlades) this.spinningBlades.forEach(sb => sb.update(time, delta));
		if (this.laserBarriers) this.laserBarriers.forEach(lb => lb.update(time, delta));
	}
}

export { platform };
