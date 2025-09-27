import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createRoad() {
  const loader = new GLTFLoader();

  // We return a promise because loading is async
  return new Promise((resolve, reject) => {
    loader.load(
      '/models/road/scene.gltf', // make sure it's in public/models/
      (gltf) => {
        const road = gltf.scene;
        road.scale.set(1, 1, 1);  // adjust if needed
        road.position.set(0, 0, 0);
        resolve(road);
      },
      undefined,
      (error) => {
        console.error('Error loading road:', error);
        reject(error);
      }
    );
  });
}
