import * as THREE from '../public/libs/three137/three.module.js';
import { RGBELoader } from '../public/libs/three137/RGBELoader.js';
import { LoadingBar } from '../public/libs/LoadingBar.js';
import { World } from './components/world.js';
import { DevControls } from './controls/devControls.js';

class App {
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
        container.appendChild(this.renderer.domElement);

        // Dev controls for moving around the scene - completely disable keyboard
        this.devControls = new DevControls(this.camera, this.renderer.domElement);
        this.devControls.enableKeys = false;
        this.devControls.enablePan = false;  // Disable panning completely
        this.devControls.keys = {
            LEFT: null,
            UP: null,
            RIGHT: null,
            BOTTOM: null
        };
        
        // Disable keyboard events on the controls
        this.devControls.keyboard = {
            enabled: false
        };

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

            // follow Eve: place camera behind and above character
            const eve = this.world.eve;
            if (eve && eve.model) {
                // camera position parameters
                const distance = 6.0;         
                const heightOffset = 7.0;     
                const angleInRadians = Math.PI / 4; 
                const lookAtHeight = 1.0;     

                // get character's forward direction
                const forward = new THREE.Vector3(0, 0, 1)
                    .applyQuaternion(eve.model.quaternion)
                    .setY(0)
                    .normalize();

                // calculate camera position
                const targetPos = new THREE.Vector3().copy(eve.model.position);
                
                // Position camera behind character
                targetPos.addScaledVector(forward, -distance * Math.cos(angleInRadians));
                targetPos.y += heightOffset * Math.sin(angleInRadians);

                // smooth camera movement
                const smooth = 0.1;
                this.camera.position.lerp(targetPos, smooth);

                // Look in the direction the character is facing
                const lookAt = new THREE.Vector3().copy(eve.model.position);
                lookAt.addScaledVector(forward, 10);
                lookAt.y += lookAtHeight;
                this.camera.lookAt(lookAt);
            }
        }

        // Only update orbital rotation, not keyboard controls
        if (this.devControls.enabled) {
            this.devControls.update(dt);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

export { App };
