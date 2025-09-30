// src/components/collision/Collider.js
import * as THREE from 'three';

export class Collider {
  constructor(mesh, type = 'box') {
    this.mesh = mesh;
    this.type = type;
    this.box = null;
    this.sphere = null;

    if (type === 'box') {
      this.box = new THREE.Box3().setFromObject(this.mesh);
    } else if (type === 'sphere') {
      this.sphere = new THREE.Sphere();
      new THREE.Box3().setFromObject(this.mesh).getBoundingSphere(this.sphere);
    } else {
      throw new Error(`Unsupported collider type: ${type}`);
    }
  }

  update() {
    if (this.box) this.box.setFromObject(this.mesh);
    if (this.sphere) new THREE.Box3().setFromObject(this.mesh).getBoundingSphere(this.sphere);
  }

  intersects(other) {
    this.update();
    other.update();

    if (this.box && other.box) return this.box.intersectsBox(other.box);
    if (this.sphere && other.sphere) return this.sphere.intersectsSphere(other.sphere);
    if (this.box && other.sphere) return other.sphere.intersectsBox(this.box);
    if (this.sphere && other.box) return this.sphere.intersectsBox(other.box);

    return false;
  }
}
