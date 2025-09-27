import * as THREE from 'three';

class Loop {
  constructor(camera, scene, renderer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;

    this.updatables = [];
    this.clock = new THREE.Clock();
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      const delta = this.clock.getDelta();
      for (const obj of this.updatables) {
        obj.tick(delta);
      }
      this.renderer.render(this.scene, this.camera);
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }
}

export function createLoop(camera, scene, renderer) {
  return new Loop(camera, scene, renderer);
}
