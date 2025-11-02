import * as THREE from '../../public/libs/three137/three.module.js';

/**
 * CollisionSystem
 * - Scene-wide lightweight collision helper using bounding boxes
 * - Finds collidable objects by userData.type (laser, concrete_block, flying_cube, spinning_blade, ...)
 * - Resolves player penetration by restoring previous position and applying a small pushback
 */
export class CollisionSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = Object.assign({
            collidableTypes: new Set(['laser', 'concrete_block', 'flying_cube', 'spinning_blade']),
            rescanInterval: 500, // ms
            pushback: 0.12 // meters to nudge back on collision
        }, options);

        this._colliders = [];
        this._lastScan = 0;
        this._boxA = new THREE.Box3();
        this._boxB = new THREE.Box3();
        this._tmp = new THREE.Vector3();
    }

    /**
     * Returns cached list of collidable meshes, rescanning occasionally.
     */
    getColliders() {
        const now = performance.now();
        if (now - this._lastScan > this.options.rescanInterval || this._colliders.length === 0) {
            this._colliders = [];
            this.scene.traverse((obj) => {
                if (!obj || !obj.isMesh) return;
                const t = obj.userData?.type;
                if (t && this.options.collidableTypes.has(t)) {
                    this._colliders.push(obj);
                }
            });
            this._lastScan = now;
        }
        return this._colliders;
    }

    /**
     * Test if the given object (player) intersects any collider.
     * Excludes the object's own descendants.
     */
    intersectsAny(playerObject) {
        if (!playerObject) return false;
        this._boxA.setFromObject(playerObject);
        const colliders = this.getColliders();
        for (const col of colliders) {
            if (!col.visible) continue;
            // Ignore if collider is part of the player hierarchy
            if (this._isDescendantOf(col, playerObject)) continue;
            this._boxB.setFromObject(col);
            if (this._boxA.intersectsBox(this._boxB)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Resolve collision for playerObject by reverting to previousPosition and nudging back slightly.
     * previousPosition must be a Vector3 representing the player's position before movement.
     */
    resolve(playerObject, previousPosition) {
        if (!playerObject || !previousPosition) return false;
        if (!this.intersectsAny(playerObject)) return false;

        // Collision detected: revert and push back slightly opposite to attempted movement
        const cur = playerObject.position;
        this._tmp.copy(cur).sub(previousPosition);
        playerObject.position.copy(previousPosition);

        if (this._tmp.lengthSq() > 1e-6) {
            this._tmp.normalize().multiplyScalar(this.options.pushback);
            playerObject.position.addScaledVector(this._tmp, -1);
        }
        return true;
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
