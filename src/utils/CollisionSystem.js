import * as THREE from '../../public/libs/three137/three.module.js';

/**
 * CollisionSystem (utils)
 * - Scans the scene for meshes with userData.type in a configured Set
 * - Detects AABB intersections against the player object
 * - Resolves penetration by restoring previous position and applying a small pushback
 */
export class CollisionSystem {
	constructor(scene, options = {}) {
		this.scene = scene;
		this.options = Object.assign({
			collidableTypes: new Set(['flying_cube', 'laser', 'concrete_block', 'spinning_blade']),
			rescanInterval: 200, // ms - a bit faster to catch spawns
			pushback: 0.12
		}, options);

		// Auto-scanned colliders and manual registrations
		this._colliders = [];
		this._manualColliderMap = new Map(); // uuid -> Mesh
		this._lastScan = 0;
		this._boxA = new THREE.Box3();
		this._boxB = new THREE.Box3();
		this._tmp = new THREE.Vector3();
	}

	/** Get collider type from an object by checking its ancestors as well. */
	_getTypeFromHierarchy(obj) {
		let o = obj;
		while (o) {
			const t = o.userData && o.userData.type;
			if (t) return t;
			o = o.parent;
		}
		return null;
	}

	getColliders() {
		const now = performance.now();
		if (now - this._lastScan > this.options.rescanInterval || this._colliders.length === 0) {
			this._colliders = [];
			this.scene.traverse((obj) => {
				if (!obj) return;
				if (obj.isMesh) {
					const t = this._getTypeFromHierarchy(obj);
					if (t && this.options.collidableTypes.has(t)) {
						this._colliders.push(obj);
					}
				}
			});
			this._lastScan = now;
		}
		// Merge manual registrations (dedupe by uuid)
		if (this._manualColliderMap.size === 0) return this._colliders;
		const out = this._colliders.slice();
		const seen = new Set(out.map(o => o.uuid));
		for (const [uuid, mesh] of this._manualColliderMap) {
			if (mesh && !seen.has(uuid)) out.push(mesh);
		}
		return out;
	}

	/**
	 * Manually add an obstacle (mesh or Object3D with meshes as children).
	 * Optionally force a collider type which is applied to meshes lacking a type.
	 */
	addObstacle(object3D, type = null) {
		if (!object3D) return 0;
		let count = 0;
		const addMesh = (mesh) => {
			if (!mesh || !mesh.isMesh) return;
			if (type && !mesh.userData?.type) mesh.userData.type = type;
			const t = mesh.userData?.type;
			if (t && this.options.collidableTypes.has(t)) {
				this._manualColliderMap.set(mesh.uuid, mesh);
				count++;
			}
		};
		if (object3D.isMesh) {
			addMesh(object3D);
		} else if (object3D.traverse) {
			object3D.traverse(o => addMesh(o));
		}
		return count;
	}

	/** Remove an obstacle previously added. Accepts mesh or parent object. */
	removeObstacle(object3D) {
		if (!object3D) return 0;
		let count = 0;
		const del = (mesh) => {
			if (!mesh || !mesh.isMesh) return;
			if (this._manualColliderMap.delete(mesh.uuid)) count++;
		};
		if (object3D.isMesh) {
			del(object3D);
		} else if (object3D.traverse) {
			object3D.traverse(o => del(o));
		}
		return count;
	}

	/** Clear all manually registered obstacles. */
	clearManualObstacles() {
		this._manualColliderMap.clear();
	}

	intersectsAny(playerObject) {
		return !!this.getFirstIntersection(playerObject);
	}

	/** Return all colliders intersecting with the player (array of {object, center}). */
	getAllIntersections(playerObject) {
		if (!playerObject) return [];
		const hits = [];
		this._boxA.setFromObject(playerObject);
		const colliders = this.getColliders();
		for (const col of colliders) {
			if (!col.visible) continue;
			if (this._isDescendantOf(col, playerObject)) continue;
			this._boxB.setFromObject(col);
			if (this._boxA.intersectsBox(this._boxB)) {
				const center = new THREE.Vector3();
				this._boxB.getCenter(center);
				hits.push({ object: col, center });
			}
		}
		return hits;
	}

	/**
	 * Return details of the first collider intersecting with the player, else null.
	 */
	getFirstIntersection(playerObject) {
		const hits = this.getAllIntersections(playerObject);
		return hits.length ? hits[0] : null;
	}

	resolve(playerObject, previousPosition) {
		if (!playerObject || !previousPosition) return false;
		if (!this.intersectsAny(playerObject)) return false;

		const cur = playerObject.position;
		this._tmp.copy(cur).sub(previousPosition);
		playerObject.position.copy(previousPosition);
		if (this._tmp.lengthSq() > 1e-6) {
			this._tmp.normalize().multiplyScalar(this.options.pushback);
			playerObject.position.addScaledVector(this._tmp, -1);
		}
		return true;
	}

	/**
	 * Robust separation: repeatedly separate player from the first collider by the
	 * smallest horizontal axis overlap (x or z). Avoids tunneling when pushing hard.
	 */
	resolvePenetration(playerObject, maxIters = 3) {
		let iter = 0;
		let moved = false;
		while (iter++ < maxIters) {
			const hit = this.getFirstIntersection(playerObject);
			if (!hit) break;
			this._boxA.setFromObject(playerObject);
			this._boxB.setFromObject(hit.object);
			const centerA = new THREE.Vector3();
			const centerB = new THREE.Vector3();
			this._boxA.getCenter(centerA);
			this._boxB.getCenter(centerB);
			const halfA = new THREE.Vector3().subVectors(this._boxA.max, this._boxA.min).multiplyScalar(0.5);
			const halfB = new THREE.Vector3().subVectors(this._boxB.max, this._boxB.min).multiplyScalar(0.5);
			const delta = new THREE.Vector3().subVectors(centerA, centerB);
			const overlap = new THREE.Vector3(
				(halfA.x + halfB.x) - Math.abs(delta.x),
				(halfA.y + halfB.y) - Math.abs(delta.y),
				(halfA.z + halfB.z) - Math.abs(delta.z)
			);
			if (overlap.x <= 0 || overlap.z <= 0) break; // No horizontal overlap
			// Resolve along the smallest horizontal overlap axis
			const eps = 0.001;
			if (overlap.x < overlap.z) {
				const dirX = Math.sign(delta.x) || 1; // move away from collider center
				playerObject.position.x += dirX * (overlap.x + eps);
			} else {
				const dirZ = Math.sign(delta.z) || 1;
				playerObject.position.z += dirZ * (overlap.z + eps);
			}
			moved = true;
		}
		return moved;
	}

	/**
	 * Continuous resolution for a single movement step: if the moved player intersects,
	 * revert to previousPosition, then separate horizontally using resolvePenetration.
	 */
	resolveContinuous(playerObject, previousPosition) {
		if (!playerObject || !previousPosition) return false;
		if (!this.intersectsAny(playerObject)) return false;
		playerObject.position.copy(previousPosition);
		return this.resolvePenetration(playerObject, 3);
	}

	_isDescendantOf(obj, parent) {
		let o = obj;
		while (o) {
			if (o === parent) return true;
			o = o.parent;
		}
		return false;
	}
}

