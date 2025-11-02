import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';
import { Vector3 } from '../../public/libs/three137/three.module.js';
import { Prison } from './prison.js';
import { Eve } from './Eve.js';
import { stairs } from './stairs.js';
import { concrete_blocks } from './course/concrete_blocks.js';
import { Structure } from './structure.js';
import { ocean } from './location/ocean.js';
import { wild_island } from './location/wild_island.js';
import { platform as platform_two } from './course_two/platform.js';
import { platform as platform_three } from './course_three/platform.js';
import { platform as platform_four } from './course_four/platform.js';
import { CollisionManager } from './collision/CollisionManager.js';

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

    constructor(game, opts = {}) {
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
        this.scene = game.scene;
        this.level = Math.max(1, Math.min(4, parseInt(opts.level || game.level || 1)));
        // Collision system
        this.collisionManager = new CollisionManager(this.level);
        this.wallColliders = [];

        this.tmpPos = new Vector3();
    this.ready = false;

        // Unified structure containing prison, stairs, and platform
        // Pass level to structure so it can handle play mode differently
        this.structure = new Structure(game, {
            level: this.level
            // You can change the overall position/rotation/scale here
            // position: new THREE.Vector3(0, 0, 0),
            //rotation: new THREE.Euler(Math.PI, -Math.PI / 100, Math.PI),
            // scale: new THREE.Vector3(1, 1, 1)
        });
        // Defer Eve creation until structure components likely loaded
        this.eve = null;
        // Optional locations
        // this.ocean = new ocean(game);
        // Conditionally create additional courses based on level
        this.platform_two = this.level >= 2 && this.level < 4 ? new platform_two(game) : null;
        this.platform_three = this.level >= 3 && this.level < 4 ? new platform_three(game) : null;
        this.platform_four = this.level >= 4 ? new platform_four(game) : null;
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

    // Attempt obstacle registration until all are registered (levels 1-3)
    _registerObstaclesIfNeeded() {
        if (!this.collisionManager || this.level >= 4) return;
        this.collisionManager.registerObstaclesForLevel({
            structure: this.structure,
            platform_two: this.platform_two,
            platform_three: this.platform_three,
        });
    }

    update(time, delta) {
        if (!this.ready) return;
        
        // Update all world components
        if (this.structure) this.structure.update(time, delta);
        if (this.wildIsland) this.wildIsland.update(time, delta);
        if (this.level >= 2 && this.level < 4 && this.platform_two) this.platform_two.update(time, delta);
        if (this.level >= 3 && this.level < 4 && this.platform_three) this.platform_three.update(time, delta);
        if (this.level >= 4 && this.platform_four) this.platform_four.update(time, delta);

        // Register static obstacles as they become ready (retries until complete)
        this._registerObstaclesIfNeeded();

        // Sync dynamic obstacles every frame (flying cubes, spawned lasers) - skip for play mode
        if (this.collisionManager && this.collisionManager.syncDynamicObstacles && this.level < 4) {
            this.collisionManager.syncDynamicObstacles({
                structure: this.structure,
                platform_two: this.platform_two,
                platform_three: this.platform_three
            });
        }

        if (this.eve) this.eve.update(time, delta);
    }

    get position() {
        if (this.model) this.model.getWorldPosition(this.tmpPos);
        return this.tmpPos;
    }

    // Get all wall colliders for external collision checking
    getWallColliders() {
        return this.collisionManager ? this.collisionManager.getCollidersByType('wall') : [];
    }
}

export { World };
