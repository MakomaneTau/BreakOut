import * as THREE from '../public/libs/three137/three.module.js';
import { RGBELoader } from '../public/libs/three137/RGBELoader.js';
import { LoadingBar } from '../public/libs/LoadingBar.js';
import { World } from './components/world.js';
import { DevControls } from './controls/devControls.js';
import { PauseMenu } from './ui/pauseMenu.js';
import { QualityPresets, autoSelectQuality } from './core/perfConfig.js';
import { PerformanceManager } from './core/performance.js';

class App {
    initWASDControls() {
        this.move = { forward: false, backward: false, left: false, right: false };
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW': this.move.forward = true; break;
                case 'KeyS': this.move.backward = true; break;
                case 'KeyA': this.move.left = true; break;
                case 'KeyD': this.move.right = true; break;
            }
        });
        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': this.move.forward = false; break;
                case 'KeyS': this.move.backward = false; break;
                case 'KeyA': this.move.left = false; break;
                case 'KeyD': this.move.right = false; break;
            }
        });
    }
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;
        this.clock = new THREE.Clock();
        this.assetsPath = '/public/assets/';

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            70, window.innerWidth / window.innerHeight, 0.01, 100
        );
        this.camera.position.set(0, 2, 6);

        // Scene + lights
        this.scene = new THREE.Scene();
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        this.scene.add(hemiLight);
        
        // Main shadow-casting directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(25, 40, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(2048, 2048);
        const d = 80;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

    // Keep a reference and a movable target so the light follows the camera
    this.dirLight = dirLight;
    this._dirLightTarget = new THREE.Object3D();
    this.scene.add(this._dirLightTarget);
    this.dirLight.target = this._dirLightTarget;

    // Quality / performance preset
    const qs = new URLSearchParams(window.location.search);
    const presetName = qs.get('quality') || autoSelectQuality();
    this.qualityPresetName = ['low','medium','high'].includes(presetName) ? presetName : 'medium';
    this.qualityPreset = QualityPresets[this.qualityPresetName];

    // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.SRGBColorSpace ? THREE.SRGBColorSpace : THREE.sRGBEncoding;
    this.renderer.localClippingEnabled = true;
        // Enable shadow mapping
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Performance Manager (adaptive pixel ratio)
    this.perf = new PerformanceManager(this.renderer, this.qualityPreset);

        // Dev controls for moving around the scene
        this.devControls = new DevControls(this.camera, this.renderer.domElement);

        // Pause state
        this.paused = false;
        this.pauseMenu = new PauseMenu({
            onResume: () => this.setPaused(false),
            onRestart: () => window.location.reload(),
            onMainMenu: () => {
                // Tear down and signal to show main menu
                this.destroy();
                window.dispatchEvent(new CustomEvent('show-main-menu'));
            }
        });

        // Keyboard shortcuts
        this._onKeyDown = (e) => {
            if (e.code === 'KeyF') {
                this.devControls.frameObject(this.scene, 1.3);
            } else if (e.code === 'KeyP') {
                // Cycle quality preset on demand
                const order = ['low','medium','high'];
                let idx = order.indexOf(this.qualityPresetName);
                idx = (idx + 1) % order.length;
                this.qualityPresetName = order[idx];
                this.qualityPreset = QualityPresets[this.qualityPresetName];
                this.perf.setPreset(this.qualityPreset);
            } else if (e.code === 'Escape') {
                this.setPaused(!this.paused);
            }
        };
        window.addEventListener('keydown', this._onKeyDown);


        this.setEnvironment();
        this.load();

        this._onResize = this.resize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setEnvironment() {
        const loader = new RGBELoader().setPath(this.assetsPath);
        const pmremGen = new THREE.PMREMGenerator(this.renderer);
        pmremGen.compileEquirectangularShader();

        loader.load('hdr/venice_sunset_1k.hdr', texture => {
            const envMap = pmremGen.fromEquirectangular(texture).texture;
            pmremGen.dispose();
            this.scene.environment = envMap;
        });
    }

    load() {
        this.loading = true;
        this.loadingBar.visible = true;

        this.world = new World(this);

        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    render() {
    const dt = this.clock.getDelta();
    const t = this.clock.getElapsedTime();

        if (this.world?.ready && !this.paused) {
            this.world.update(t, dt);
            this.loading = false;
            this.loadingBar.visible = false;
            // One-time framing of the scene once assets are ready
            if (!this._framedOnce && !this.devControls?.restoredFromStorage) {
                // Frame the entire scene to ensure all independent models are included
                this.devControls.frameObject(this.scene, 1.3);
                this._framedOnce = true;
            }
        }

        // Update dev controls (WASD + Orbit)
        this.devControls.update(dt);
        // Adaptive performance update (after scene update, before render)
        this.perf.update(dt, t);
        // Make the shadow-casting light follow the camera so its shadow frustum
        // always covers the current gameplay area
        if (this.dirLight && this._dirLightTarget) {
            const cp = this.camera.position;
            // Center the target on the camera; offset the light to the side/up
            this._dirLightTarget.position.set(cp.x, cp.y, cp.z);
            this.dirLight.position.set(cp.x + 25, cp.y + 40, cp.z + 20);
            this.dirLight.target.updateMatrixWorld();
        }

        this.renderer.render(this.scene, this.camera);
    }

    setPaused(flag) {
        this.paused = !!flag;
        if (this.paused) {
            this.pauseMenu.show();
        } else {
            this.pauseMenu.hide();
        }
    }

    destroy() {
        try {
            // Stop render loop
            this.renderer.setAnimationLoop(null);
        } catch {}
        // Remove listeners
        if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
        if (this._onResize) window.removeEventListener('resize', this._onResize);

        // Dispose controls
        if (this.devControls && typeof this.devControls.dispose === 'function') {
            try { this.devControls.dispose(); } catch {}
        }

        // Basic cleanup of scene resources (best-effort)
        try {
            this.scene.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose?.();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
                    else obj.material.dispose?.();
                }
            });
        } catch {}

        // Remove canvas & overlay
        try {
            const canvas = this.renderer.domElement;
            canvas?.parentNode?.removeChild(canvas);
            if (this.perf?.overlay) this.perf.overlay.remove();
        } catch {}

        // Hide any overlays owned by App
        this.pauseMenu?.hide();
    }
}

export { App };
