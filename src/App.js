import * as THREE from '../public/libs/three137/three.module.js';
import { RGBELoader } from '../public/libs/three137/RGBELoader.js';
import { LoadingBar } from '../public/libs/LoadingBar.js';
import { World } from './components/world.js';
import { DevControls } from './controls/devControls.js';

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
        this.assetsPath = '/assets/';

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            70, window.innerWidth / window.innerHeight, 0.01, 100
        );
        this.camera.position.set(0, 2, 6);

        // Scene + lights
        this.scene = new THREE.Scene();
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        this.scene.add(hemiLight);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        // Enable local clipping so we can clip geometry (e.g., half blades)
        this.renderer.localClippingEnabled = true;
        container.appendChild(this.renderer.domElement);

        // Dev controls for moving around the scene
        this.devControls = new DevControls(this.camera, this.renderer.domElement);
        // Quick key to reframe the whole scene at any time
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyF') {
                this.devControls.frameObject(this.scene, 1.3);
            }
        });

        // Toggle doors with "E"
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') {
                if (this.world?.prison?.doors) {
                    this.world.prison.doors.forEach((door) => {
                        if (door.userData.isOpen) {
                            door.rotation.y = door.userData.closedRotationY;
                            door.userData.isOpen = false;
                        } else {
                            door.rotation.y = door.userData.closedRotationY + Math.PI / 2; // open
                            door.userData.isOpen = true;
                        }
                    });
                }
            }
        });



        this.setEnvironment();
        this.load();

        window.addEventListener('resize', this.resize.bind(this));
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

        if (this.world?.ready) {
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
        this.renderer.render(this.scene, this.camera);
    }
}

export { App };
