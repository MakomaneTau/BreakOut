import * as THREE from 'three';

export function createLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 5);

  return [ambient, dirLight];
}
