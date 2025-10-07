import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';

class ocean {
    constructor(game) {
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
        this.scene = game.scene;
        this.ready = false;
        this.model = null;
        this.mixer = null; // plays GLTF clips if available
        this._scrollMats = []; // [{ mat, baseMapOffset, baseNormalOffset }]
    this._uvSpeedPrimary = 0.01; // m/s for base map (slower)
    this._uvSpeedNormal = 0.02; // m/s for normal map (slower)
    this._uvOscAmp = 0.02; // additional oscillation amplitude for UVs
    this._uvOscFreq = 0.2; // Hz for UV oscillation (slower)

        // World-space gentle drift: back-and-forth (X) and sideways (Z)
        this._basePos = new THREE.Vector3(0, 0, 0);
    this._oscAmpX = 2.0; // units
    this._oscAmpZ = 1.5; // units
    this._oscFreqX = 0.05; // Hz (slower)
    this._oscFreqZ = 0.04; // Hz (slower)
        this._oscPhaseZ = Math.PI / 3; // phase offset for variety

        this.load();
    }

    load() {
        const loader = new GLTFLoader().setPath(`${this.assetsPath}models/ocean/`);
        loader.load(
            'scene.gltf',
            gltf => {
                gltf.scene.scale.set(100, 100, 100);
                gltf.scene.position.set(0, -20, 0);

                this.scene.add(gltf.scene);
                this.model = gltf.scene;
                // Remember base position for later oscillation
                this._basePos.copy(this.model.position);
                
                // If GLTF has animation clips, set up a mixer and play them
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(gltf.scene);
                    gltf.animations.forEach(clip => this.mixer.clipAction(clip).play());
                } else {
                    // No clips: collect materials with textures to scroll UVs
                    const mats = new Set();
                    gltf.scene.traverse(obj => {
                        if (!obj.isMesh) return;
                        const material = obj.material;
                        if (Array.isArray(material)) {
                            material.forEach(m => m && mats.add(m));
                        } else if (material) {
                            mats.add(material);
                        }
                    });

                    mats.forEach(mat => {
                        // Prefer scrolling the normal map if present for nicer specular motion
                        const map = mat.map || null;
                        const nmap = mat.normalMap || null;
                        let hasAny = false;
                        if (map) {
                            map.wrapS = map.wrapT = THREE.RepeatWrapping;
                            // Normalize transforms so all tiles look consistent
                            map.center.set(0.5, 0.5);
                            map.rotation = 0;
                            map.repeat.set(2, 2);
                            map.offset.set(0, 0);
                            map.needsUpdate = true;
                            hasAny = true;
                        }
                        if (nmap) {
                            nmap.wrapS = nmap.wrapT = THREE.RepeatWrapping;
                            // Match normal map transform to base map
                            nmap.center.set(0.5, 0.5);
                            nmap.rotation = 0;
                            nmap.repeat.set(2, 2);
                            nmap.offset.set(0, 0);
                            nmap.needsUpdate = true;
                            hasAny = true;
                        }
                        if (hasAny) {
                            this._scrollMats.push({
                                mat,
                                // Start all tiles from a common origin to avoid patchwork seams
                                baseMapOffset: map ? map.offset.clone() : null,
                                baseNormalOffset: nmap ? nmap.offset.clone() : null
                            });
                        }
                    });
                }
                this.ready = true;
            },
            xhr => this.loadingBar.update('ocean', xhr.loaded, xhr.total),
            err => console.error(err)
        );
    }

    update(time, delta) {
        if (!this.ready) return;
        // 1) Animate GLTF clips if present
        if (this.mixer) {
            // 'delta' here is in seconds from THREE.Clock.getDelta()
            this.mixer.update(delta);
        }

        // 2) Fallback: scroll UVs on water materials to fake wave motion
        // Convert into time-based offsets with a subtle oscillation so it looks
        // like it moves back-and-forth as well as continuously drifting.
        if (this._scrollMats.length) {
            const t = time; // seconds
            const osc = this._uvOscAmp * Math.sin(2 * Math.PI * this._uvOscFreq * t);
            for (const entry of this._scrollMats) {
                const { mat, baseMapOffset, baseNormalOffset } = entry;
                if (mat.map && baseMapOffset) {
                    const u = baseMapOffset.x + t * this._uvSpeedPrimary + osc;
                    const v = baseMapOffset.y - t * this._uvSpeedPrimary * 0.5 + osc * 0.5;
                    mat.map.offset.set(u % 1, v % 1);
                }
                if (mat.normalMap && baseNormalOffset) {
                    const uN = baseNormalOffset.x + t * this._uvSpeedNormal + osc * 1.2;
                    const vN = baseNormalOffset.y + t * this._uvSpeedNormal * 0.35 - osc * 0.3;
                    mat.normalMap.offset.set(uN % 1, vN % 1);
                }
            }
        }

        // 3) World-space gentle motion: X (back-forth) and Z (sideways)
        if (this.model) {
            const t = time; // seconds
            const x = this._basePos.x + Math.sin(2 * Math.PI * this._oscFreqX * t) * this._oscAmpX;
            const z = this._basePos.z + Math.cos(2 * Math.PI * this._oscFreqZ * t + this._oscPhaseZ) * this._oscAmpZ;
            this.model.position.x = x;
            this.model.position.z = z;
        }
    }
}

export { ocean };
