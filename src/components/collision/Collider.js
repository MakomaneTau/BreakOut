import * as THREE from '../../../public/libs/three137/three.module.js';

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
    if (!other || !(other instanceof Collider)) {
      throw new Error('intersects() requires a Collider instance');
    }

    // Update bounding boxes to current mesh positions
    this.update();
    other.update();

    // Check if meshes still exist
    if (!this.mesh || !other.mesh) return false;

    // Box vs Box
    if (this.box && other.box) {
      return this.box.intersectsBox(other.box);
    }

    // Sphere vs Sphere
    if (this.sphere && other.sphere) {
      return this.sphere.intersectsSphere(other.sphere);
    }

    // Box vs Sphere
    if (this.box && other.sphere) {
      return other.sphere.intersectsBox(this.box);
    }

    // Sphere vs Box
    if (this.sphere && other.box) {
      return this.sphere.intersectsBox(other.box);
    }

    return false;
  }
}














// import * as THREE from '../../../public/libs/three137/three.module.js';

// export class Collider {
//   constructor(mesh, type = 'box') {
//     this.mesh = mesh;
//     this.type = type;
//     this.box = null;
//     this.sphere = null;

//     if (type === 'box') {
//       this.box = new THREE.Box3().setFromObject(this.mesh);
//     } else if (type === 'sphere') {
//       this.sphere = new THREE.Sphere();
//       new THREE.Box3().setFromObject(this.mesh).getBoundingSphere(this.sphere);
//     } else {
//       throw new Error(`Unsupported collider type: ${type}`);
//     }
//   }

//   update() {
//     if (this.box) this.box.setFromObject(this.mesh);
//     if (this.sphere) new THREE.Box3().setFromObject(this.mesh).getBoundingSphere(this.sphere);
//   }

//   intersects(other) {
//     if (!other || !(other instanceof Collider)) {
//       throw new Error('intersects() requires a Collider instance');
//     }

//     this.update();
//     other.update();

//     let result = false;
//     const thisMeshName = this.mesh?.name || 'unnamed';
//     const otherMeshName = other.mesh?.name || 'unnamed';
//     const otherType = other.mesh?.userData?.type || 'unknown';

//     // Box vs Box
//     if (this.box && other.box) {
//       result = this.box.intersectsBox(other.box);
//     }
//     // Sphere vs Sphere
//     else if (this.sphere && other.sphere) {
//       result = this.sphere.intersectsSphere(other.sphere);
//     }
//     // Box vs Sphere
//     else if (this.box && other.sphere) {
//       result = other.sphere.intersectsBox(this.box);
//     }
//     // Sphere vs Box
//     else if (this.sphere && other.box) {
//       result = this.sphere.intersectsBox(other.box);
//     }

//     // Debug for concrete blocks, lasers, and blades
//     if (otherType === 'concrete_block' || otherType === 'laser' || otherType === 'spinning_blade') {
//       let distance = 'N/A';
//       if (this.box && other.box) {
//         const dist = this.box.getCenter(new THREE.Vector3()).distanceTo(other.box.getCenter(new THREE.Vector3()));
//         distance = dist.toFixed(2);
//       }
//       console.log(`[DEBUG COLLIDER] ${otherType} check:`, {
//         intersects: result,
//         distance: distance,
//         meshName: otherMeshName,
//         meshType: other.mesh?.type || 'unknown',
//         position: other.mesh?.position,
//         userData: other.mesh?.userData
//       });
//     }

//     return result;
//   }
// }