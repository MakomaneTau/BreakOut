import * as THREE from "three";
import { BoxShape, SphereShape } from "./shapes.js";

export function runCollisionTest() {
  const box1 = new BoxShape(0, 0, 0, 2, 2, 2);
  const box2 = new BoxShape(1, 1, 1, 2, 2, 2);
  const sphere = new SphereShape(new THREE.Vector3(5, 5, 5), 1);

  console.log("Box1 vs Box2:", box1.intersects(box2)); // true
  console.log("Box1 vs Sphere:", box1.intersects(sphere)); // false
  console.log("Sphere vs Box2:", sphere.intersects(box2)); // false
}
