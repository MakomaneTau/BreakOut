import * as THREE from 'three';

export function createCube() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
  const cube = new THREE.Mesh(geometry, material);

  cube.tick = (delta) => {
    // cube.rotation.x += delta;
    // cube.rotation.y += delta;
  };

  return cube;
}
