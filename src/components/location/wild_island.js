import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';

class wild_island {
    constructor(game, opts = {}) {
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
        this.scene = game.scene;
        this.ready = false;
        this.model = null;

        // Allow overrides for placement
        this.position = opts.position || new THREE.Vector3(72.5, -67.5, -0);
        this.rotationZ = opts.rotationZ ?? Math.PI/2 ;
        this.rotationY = opts.rotationY ?? (Math.PI * 1.5);
        this.rotationX = opts.rotationX ?? (Math.PI / 2);

    this.scale = opts.scale || new THREE.Vector3(4, 4, 4);

    // Stacking controls: create the illusion of thicker Y by duplicating layers downwards
    this.stackLayers = Math.max(1, opts.stackLayers || 1); // number of copies including the original
    this.stackStepY = opts.stackStepY ?? -0.5; // delta Y per layer (negative goes downward)
    this.stackScaleStep = opts.stackScaleStep || 0; // optional per-layer scale increment
    this.stackMaterialDarken = opts.stackMaterialDarken || 0; // darken factor per layer (0 = none)

        this.load();
    }

    load() {
        const loader = new GLTFLoader().setPath(`${this.assetsPath}models/wild_land/`);
        loader.load(
            'scene.gltf',
            gltf => {
                // Basic transforms; tweak as needed
                gltf.scene.position.copy(this.position);
                gltf.scene.rotation.y = this.rotationY;
                gltf.scene.rotation.z = this.rotationZ;
                gltf.scene.rotation.x = this.rotationX;
                gltf.scene.scale.copy(this.scale);

                // Optionally build vertical stack for thickness
                const root = new THREE.Group();
                root.name = 'wild_island_stack';

                // Helper to clone a layer
                const makeLayer = (idx) => {
                    const layer = gltf.scene.clone(true);
                    // Deep clone materials to avoid shared changes when darkening
                    layer.traverse(obj => {
                        if (!obj.isMesh) return;
                        if (obj.material) {
                            if (Array.isArray(obj.material)) {
                                obj.material = obj.material.map(m => m && m.clone ? m.clone() : m);
                            } else {
                                obj.material = obj.material.clone();
                            }
                            if (this.stackMaterialDarken) {
                                const f = Math.max(0, 1 - this.stackMaterialDarken * idx);
                                const applyDarken = (mat) => {
                                    if (mat.color) mat.color.multiplyScalar(f);
                                    if (mat.emissive) mat.emissive.multiplyScalar(f);
                                };
                                if (Array.isArray(obj.material)) obj.material.forEach(applyDarken);
                                else applyDarken(obj.material);
                            }
                        }
                    });
                    // Position and scale per layer
                    layer.position.copy(this.position);
                    layer.position.y += this.stackStepY * idx;
                    const s = this.scale.clone().addScalar(this.stackScaleStep * idx);
                    layer.scale.copy(s);
                    layer.rotation.set(this.rotationX, this.rotationY, this.rotationZ);
                    return layer;
                };

                for (let i = 0; i < this.stackLayers; i++) {
                    root.add(makeLayer(i));
                }

                this.scene.add(root);
                this.model = root;
                this.ready = true;
            },
            xhr => this.loadingBar.update('wild_island', xhr.loaded, xhr.total),
            err => console.error(err)
        );
    }

    update(time, delta) {
        if (!this.ready) return;
        // Add subtle ambient motion if you like (e.g., sway trees slightly)
        // Example (disabled by default):
        // this.model.rotation.y += delta * 0.02;
    }
}

export { wild_island };
