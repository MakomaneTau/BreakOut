import * as THREE from "../../../public/libs/three137/three.module.js";

class Shape {
  intersects(other) {
    throw new Error("intersects() must be implemented");
  }
}

class BoxShape extends Shape {
  constructor(x, y, z, width, height, depth) {
    super();
    this.box = new THREE.Box3(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(x + width, y + height, z + depth)
    );
  }

  intersects(other) {
    if (other instanceof BoxShape) {
      return this.box.intersectsBox(other.box);
    } else if (other instanceof SphereShape) {
      return this.box.intersectsSphere(other.sphere);
    }
    return false;
  }
}

class SphereShape extends Shape {
  constructor(center, radius) {
    super();
    this.sphere = new THREE.Sphere(center, radius);
  }

  intersects(other) {
    if (other instanceof BoxShape) {
      return this.sphere.intersectsBox(other.box);
    } else if (other instanceof SphereShape) {
      return this.sphere.intersectsSphere(other.sphere);
    }
    return false;
  }
}

export {
  Shape,
  BoxShape,
  SphereShape
  
};
  