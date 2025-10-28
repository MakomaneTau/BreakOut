import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';

const LASER_BARRIER_ROT_Y = Math.PI / 2;

class laser_barrier {
	constructor(game, opts = {}) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;

		const {
			position = [-21.2, 1.8, 0],
			rotationY = LASER_BARRIER_ROT_Y,
			scale = [1, 1, 1],
			name = 'laser_barrier'
		} = opts;

		// Normalize transforms
		this._position = Array.isArray(position) ? new THREE.Vector3(...position) : position.clone?.() ?? new THREE.Vector3(position.x, position.y, position.z);
		this._scale = Array.isArray(scale) ? new THREE.Vector3(...scale) : scale.clone?.() ?? new THREE.Vector3(scale.x, scale.y, scale.z);
		this._rotationY = rotationY;
		this._name = name;

		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/obstacles/laser/`);
		loader.load(
			'scene.gltf',
			gltf => {
				const obj = gltf.scene;
				obj.name = this._name;
				obj.rotation.y = this._rotationY;
				obj.scale.copy(this._scale);
				obj.position.copy(this._position);

				this.scene.add(obj);
				this.model = obj;
				this.ready = true;
			},
			xhr => this.loadingBar.update('laser_barrier', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	update(time, delta) {
		if (!this.ready) return;
		// Optional: animate or update platform model here
		this.model.position.x = this._position.x + Math.sin(Date.now() * 0.005) * 1; // Sway left and right from original x
	}
}

export { laser_barrier };

// Spawner: load a single laser GLTF and spawn moving clones similar to FlyingCubesSpawner
export class LaserBarrierSpawner {
	constructor(scene, options = {}) {
		this.scene = scene;
		this.options = Object.assign({
			countMin: 2,
			countMax: 5,
			sizeMin: 0.6,
			sizeMax: 1.4,
			scale: [1,1,1],
			speedMin: 0.02,
			speedMax: 0.12,
			start: [-180, 4.7, -3.5],
			end: [-95, 7.7, -3.5],
			intervalMin: 0.8,
			intervalMax: 2.2,
			maxActive: 40,
			initialSpawn: true,
			debug: false
		}, options);

		this.template = null; // loaded gltf.scene
		this.barriers = [];
		this.timer = 0;
		this.nextInterval = this._rand(this.options.intervalMin, this.options.intervalMax);
		this._loader = new GLTFLoader().setPath(`${(this.options.assetsPath||'') }models/obstacles/laser/`);
		this._loadTemplate();
	}

	_loadTemplate() {
		// Allow overriding path via options.assetsPath
		const pathPrefix = this.options.assetsPath ? this.options.assetsPath : '';
		const loader = new GLTFLoader().setPath(`${pathPrefix}models/obstacles/laser/`);
		loader.load('scene.gltf', gltf => {
			this.template = gltf.scene;
			// Ensure template meshes have shadows configured
			this.template.traverse(obj => {
				if (obj.isMesh) {
					obj.castShadow = true;
					obj.receiveShadow = true;
				}
			});
			if (this.options.initialSpawn) this.spawnBarriers();
		}, xhr => {
			if (this.options.debug) console.log('Laser template load', xhr.loaded, xhr.total);
		}, err => console.error(err));
	}

	spawnBarriers(count) {
		if (!this.template) {
			// template not ready yet; schedule a small retry
			setTimeout(() => this.spawnBarriers(count), 200);
			return;
		}

		const n = typeof count === 'number' ? count : Math.floor(this._rand(this.options.countMin, this.options.countMax + 1));
		const newItems = [];
		// Calculate spacing for z axis
		const zStart = this.options.zStart !== undefined ? this.options.zStart : -8;
		const zEnd = this.options.zEnd !== undefined ? this.options.zEnd : 8;
		const zStep = n > 1 ? (zEnd - zStart) / (n - 1) : 0;
		const yFixed = this.options.start[1];
		for (let i = 0; i < n; i++) {
			if (this.barriers.length >= this.options.maxActive) break;
			// deep-ish clone of template
			const clone = this.template.clone(true);
			// Use fixed scale from options
			const baseScale = Array.isArray(this.options.scale) ? new THREE.Vector3(...this.options.scale) : (this.options.scale.clone?.() ?? new THREE.Vector3(1,1,1));
			clone.scale.copy(baseScale);

			// Evenly spaced z, fixed y
			const z = n > 1 ? zStart + i * zStep : 0;
			clone.position.set(this.options.start[0], yFixed, z);

			// Set rotation only on root object
			clone.rotation.y = LASER_BARRIER_ROT_Y;
			clone.traverse(obj => {
				if (obj.isMesh) {
					obj.castShadow = true;
					obj.receiveShadow = true;
				}
			});

			// compute target and velocity
			const target = new THREE.Vector3(this.options.end[0], this.options.end[1], z);
			const direction = new THREE.Vector3().subVectors(target, clone.position).normalize();
			const speed = this._rand(this.options.speedMin, this.options.speedMax);
			clone.userData = clone.userData || {};
			clone.userData.velocity = direction.multiplyScalar(speed);
			clone.userData.target = target;

			this.scene.add(clone);
			this.barriers.push(clone);
			newItems.push(clone);
			if (this.options.debug) console.log('Spawned laser barrier', clone.position.toArray(), 'speed', speed);
		}
		return newItems;
	}

	update(delta) {
		// delta expected in seconds
		this.timer += delta;
		if (this.timer >= this.nextInterval) {
			this.spawnBarriers();
			this.timer = 0;
			this.nextInterval = this._rand(this.options.intervalMin, this.options.intervalMax);
		}

		// Move barriers and remove those at target
		this.barriers = this.barriers.filter(item => {
			const toTarget = new THREE.Vector3().subVectors(item.userData.target, item.position);
			if (toTarget.length() > item.userData.velocity.length()) {
				item.position.add(item.userData.velocity);
				return true;
			} else {
				// reached
				item.position.copy(item.userData.target);
				this.scene.remove(item);
				return false;
			}
		});
	}

	dispose() {
		// remove active barriers
		this.barriers.forEach(b => { try { this.scene.remove(b); } catch {} });
		this.barriers = [];
		this.template = null;
	}

	_rand(min, max) { return Math.random() * (max - min) + min; }
}
