import * as THREE from 'three';

export function createTorus() {
  const geometry = new THREE.TorusGeometry(0.7, 0.2, 16, 100);
  const material = new THREE.MeshStandardMaterial({ color: 0xFF00FF });
  const torus = new THREE.Mesh(geometry, material);

  torus.tick = (delta) => {
    torus.rotation.x += delta;
    torus.rotation.y += delta;
  };

  return torus;
}
