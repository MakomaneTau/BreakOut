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
		this.ready = false;
		this.model = null;
		this.concreteBlocks = [
			new concrete_blocks(game, { position: [-39, 4.6, -3], scale: [6.5, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-36, 4.6, 3], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-33, 4.6, -1], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-29, 4.6, 3.9], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-26, 4.6, 1.5], scale: [9, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-20, 4.6, -4.9], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-17, 4.6, 0], scale: [12, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-13, 4.6, -3], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-10, 4.6, 4], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-6, 4.6, 0], scale: [12, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
			new concrete_blocks(game, { position: [-2.2, 4.6, -4], scale: [3, 1, 1], rotationY: Math.PI / 2, name: 'concrete_A' }),
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

				// Enable shadows on platform meshes
				gltf.scene.traverse(node => {
					if (node.isMesh) {
						node.receiveShadow = true;
						node.castShadow = true;
					}
				});

				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
			},
			xhr => this.loadingBar.update('platform', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	update(time, delta) {
		if (!this.ready) return;
		if (this.concreteBlocks) this.concreteBlocks.forEach(cb => cb.update(time, delta));
		if (this.spinningBlades) this.spinningBlades.forEach(sb => sb.update(time, delta));
		if (this.laserBarriers) this.laserBarriers.forEach(lb => lb.update(time, delta));
	}
}

export { platform };
