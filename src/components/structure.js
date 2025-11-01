import * as THREE from '../../public/libs/three137/three.module.js';
import { Prison } from './prison.js';
import { stairs } from './stairs.js';
import { platform } from './course/platform.js';

class Structure {
    constructor(game, opts = {}) {
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
        this.scene = game.scene;
        this.level = opts.level || game.level || 1;

        // Root group representing the whole structure
        this.model = new THREE.Group();
        this.model.name = 'StructureGroup';
        this.scene.add(this.model);

        // Initial transform (can be changed later)
        if (opts.position) this.model.position.copy(opts.position);
        if (opts.rotation) this.model.rotation.set(opts.rotation.x, opts.rotation.y, opts.rotation.z);
        if (opts.scale) this.model.scale.copy(opts.scale);

        // Child components
        this.prison = new Prison(game);
        this.stairs = new stairs(game);
        // Pass level to platform so it can skip obstacles in play mode
        this.platform = new platform(game, { level: this.level });
    }

    // Convenience accessors to move the entire structure
    get position() { return this.model.position; }
    set position(v) { this.model.position.copy(v); }

    update(time, delta) {
        // Adopt children when their models are ready so transforms apply to all
        const adopt = (comp) => {
            if (comp?.model && comp.model.parent !== this.model) {
                this.model.add(comp.model);
            }
        };

        adopt(this.prison);
        adopt(this.stairs);
        adopt(this.platform);

        // Forward updates to children
        this.prison?.update(time, delta);
        this.stairs?.update(time, delta);
        this.platform?.update(time, delta);
    }
}

export { Structure };
