import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';
import { Vector3 } from '../../public/libs/three137/three.module.js';
import { concrete_blocks } from './course/concrete_blocks.js';
import { Structure } from './structure.js';
import { ocean } from './location/ocean.js';
import { wild_island } from './location/wild_island.js';

class World {
    loadSkybox() {
        this.scene.background = new THREE.CubeTextureLoader()
            .setPath(`${this.assetsPath}models/plane/paintedsky/`)
            .load([
                'px.jpg',
                'nx.jpg',
                'py.jpg',
                'ny.jpg',
                'pz.jpg',
                'nz.jpg'
            ]);
    }

    constructor(game) {
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
        this.scene = game.scene;

        this.tmpPos = new Vector3();
        this.ready = false;

        // Unified structure containing prison, stairs, and platform
        this.structure = new Structure(game, {
            // You can change the overall position/rotation/scale here
            // position: new THREE.Vector3(0, 0, 0),
            //rotation: new THREE.Euler(Math.PI, -Math.PI / 100, Math.PI),
            // scale: new THREE.Vector3(1, 1, 1)
        });
        this.ocean = new ocean(game);
        this.wildIsland = new wild_island(game);

        this.load();
    }

    load() {
        // No longer loading the road model; just set the environment and mark ready.
        this.loadSkybox();
        this.ready = true;
    }

    update(time, delta) {
        if (!this.ready) return;
        // Example animation
        //this.model.rotation.y += delta * 0.2;
        if (this.structure) this.structure.update(time, delta);
        if (this.ocean) this.ocean.update(time, delta);
        if (this.wildIsland) this.wildIsland.update(time, delta);

    }

    get position() {
        if (this.model) this.model.getWorldPosition(this.tmpPos);
        return this.tmpPos;
    }
}

export { World };
