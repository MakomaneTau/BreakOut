import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';
import { Vector3 } from '../../public/libs/three137/three.module.js';
import { Prison } from './prison.js';
import { Eve } from './Eve.js';
import { stairs } from './stairs.js';
import { platform } from './course/platform.js';
import { CollisionManager } from './collision/CollisionManager.js';
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
        this.collisionManager = game.collisionManager || new CollisionManager();
        this.wallColliders = [];

        this.tmpPos = new Vector3();
        this.ready = false;

        // Unified structure containing prison, stairs, and platform
        this.structure = new Structure(game, {
            // You can change the overall position/rotation/scale here
            // position: new THREE.Vector3(0, 0, 0),
            //rotation: new THREE.Euler(Math.PI, -Math.PI / 100, Math.PI),
            // scale: new THREE.Vector3(1, 1, 1)
        });
        // Defer Eve creation until structure components likely loaded
        this.eve = null;
       // this.ocean = new ocean(game);
        this.wildIsland = new wild_island(game);

        this.load();
        
        // Schedule Eve load after structure assembly
        this._eveLoadCheck();
    }

    connectCharacterToHelicopter() {
        if (this.eve && this.structure && this.structure.platform && this.structure.platform.helicopter) {
            this.eve.setHelicopter(this.structure.platform.helicopter);
            console.log('🚁 Character connected to helicopter for escape sequence');
        } else {
            console.warn('Could not connect character to helicopter - components not ready');
        }
    }

    load() {
        // No longer loading the road model; just set the environment and mark ready.
        this.loadSkybox();
        // Load skybox for a big scene
        this.loadSkybox();
                
        // Register prison walls as colliders after everything loads
        this.registerPrisonWalls();
        
        // Register platform obstacles as colliders after everything loads
        this.registerPlatformObstacles();
        this.ready = true;
    }

    _eveLoadCheck(retries = 0) {
        const maxRetries = 20; // ~10s if interval 500ms
        const delay = 500;
        const platformReady = this.structure?.platform?.model;
        const prisonReady = this.structure?.prison?.model;
        const stairsReady = this.structure?.stairs?.model;
        if (!this.eve && (platformReady || prisonReady || stairsReady)) {
            // Instantiate Eve now
            this.eve = new Eve({
                assetsPath: this.assetsPath,
                loadingBar: this.loadingBar,
                scene: this.scene,
                collisionManager: this.collisionManager
            });
            // Connect to helicopter if appears later
            setTimeout(() => this.connectCharacterToHelicopter(), 1500);
            return;
        }
        if (!this.eve && retries < maxRetries) {
            setTimeout(() => this._eveLoadCheck(retries + 1), delay);
        }
    }

    registerPrisonWalls() {
        // Wait a bit for prison to load, then register walls
        setTimeout(() => {
            if (this.structure && this.structure.prison && this.structure.prison.model) {
                this.wallColliders = this.collisionManager.registerWallsFromModel(this.structure.prison.model);
            }
        }, 1000);
    }

    registerPlatformObstacles() {
        // Wait a bit for platform obstacles to load, then register them
        setTimeout(() => {
            if (this.structure && this.structure.platform) {
                this.structure.platform.registerObstaclesWithCollision();
            }
        }, 1500); // Slightly longer delay to ensure all obstacles are loaded
    }

 
    update(time, delta) {
        if (!this.ready) return;
        // Example animation
        //this.model.rotation.y += delta * 0.2;
        if (this.structure) this.structure.update(time, delta);
        if (this.ocean) this.ocean.update(time, delta);
        if (this.wildIsland) this.wildIsland.update(time, delta);

        if (this.eve) this.eve.update(time, delta);
    }

    get position() {
        if (this.model) this.model.getWorldPosition(this.tmpPos);
        return this.tmpPos;
    }

    // Get all wall colliders for external collision checking
    getWallColliders() {
        return this.wallColliders;
    }
}

export { World };
