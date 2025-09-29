import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';
import { Vector3 } from '../../public/libs/three137/three.module.js';
import { Prison } from './prison.js';
import { stairs } from './stairs.js';
import { platform } from './course/platform.js';

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
    constructor(game){
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
        this.scene = game.scene;

        this.tmpPos = new Vector3();
        this.ready = false;

        this.prison = new Prison(game);
        this.stairs = new stairs(game);
        this.platform = new platform(game);
        this.load();
    }

    load(){
        const loader = new GLTFLoader().setPath(`${this.assetsPath}models/road/`);

        loader.load(
            'scene.gltf',
            gltf => {
                // Adjust model size here
                gltf.scene.scale.set(0.5, 0.5, 0.5); // Example: scale to half size
                gltf.scene.position.set(-5, -5, -5); // Example: position at origin
                this.scene.add(gltf.scene);
                this.model = gltf.scene;
                this.ready = true;
                // Load skybox for a big scene
                this.loadSkybox();
            },
            xhr => this.loadingBar.update('world', xhr.loaded, xhr.total),
            err => console.error(err)
        );
    }

    update(time, delta){
        if (!this.ready) return;
        // Example animation
        //this.model.rotation.y += delta * 0.2;
        if (this.prison) this.prison.update(time, delta);
        if (this.stairs) this.stairs.update(time, delta);
        if (this.platform) this.platform.update(time, delta);
    }

    get position(){
        if (this.model) this.model.getWorldPosition(this.tmpPos);
        return this.tmpPos;
    }
}

export { World };
