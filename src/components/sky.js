import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createSky() {
  const loader = new GLTFLoader();

  // We return a promise because loading is async
  return new Promise((resolve, reject) => {
    loader.load(
      '/models/sky/scene.gltf', // make sure the GLTF model is in public/models/sky/
      (gltf) => {
        const sky = gltf.scene;
        // Traverse the model to configure materials for skybox use
        sky.traverse((child) => {
          if (child.isMesh) {
            // Make sure materials render from the inside
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.side = THREE.BackSide;
                });
              } else {
                child.material.side = THREE.BackSide;
              }
            }
          }
        });
        resolve(sky);
      },
      undefined,
      (error) => {
        console.error('Error loading sky model:', error);
        reject(error);
      }
    );
  });
}
