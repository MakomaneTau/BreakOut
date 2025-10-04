import * as THREE from '../public/libs/three137/three.module.js';
import { RGBELoader } from '../public/libs/three137/RGBELoader.js';
import { LoadingBar } from '../public/libs/LoadingBar.js';
import { World } from './components/world.js';
import { DevControls } from './controls/devControls.js';
import { CollisionManager } from './components/collision/CollisionManager.js';
import { HealthUI } from './components/ui/HealthUI.js';
import { CameraUI } from './components/ui/CameraUI.js';
import { TimerUI } from './components/ui/TimerUI.js';
import { AmbientUI } from './components/ui/AmbientUI.js';





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
      
        this.collisionManager = new CollisionManager();

        const container = document.createElement('div');
        document.body.appendChild(container);

        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;
        this.clock = new THREE.Clock();
        this.assetsPath = '/assets/';

        // Initialize Health UI
        this.healthUI = new HealthUI();
        
        // Initialize Camera UI
        this.cameraUI = new CameraUI({
            onCameraToggle: (isFirstPerson) => {
                this.devControls.setCameraMode(isFirstPerson);
            }
        });
        
        // Initialize Timer UI
        this.timerUI = new TimerUI({
            initialTime: 210, // 3:30 in seconds
            onTimeUp: () => {
                console.log('Time\'s up!');
                // You can add game over logic here if needed
            }
        });

        // Initialize Ambient UI
        this.ambientUI = new AmbientUI({
            enableBorders: true,
            enableCornerDecorations: true,
            enableParticles: true,
            enableAnimatedBackground: true,
            particleCount: 30,
            particleSpeed: 0.3,
            borderOpacity: 0.15,
            decorationOpacity: 0.4
        });

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
        const playerCube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    );
  
 
        this.renderer.setAnimationLoop(this.render.bind(this));

        // Setup health UI updates
        this.setupHealthUI();
    }

    setupHealthUI() {
        // Wait for world to be ready
        const checkWorldReady = setInterval(() => {
            if (this.world?.ready && this.world.eve?.health) {
                clearInterval(checkWorldReady);
                
                const playerHealth = this.world.eve.health;
                
                // Initial UI update
                this.healthUI.updateHealth(playerHealth.currentHealth, playerHealth.maxHealth);
                this.healthUI.updateLives(playerHealth.currentLives, playerHealth.maxLives);
                
                // Hook into health events
                const originalOnDamage = playerHealth.onDamage;
                playerHealth.onDamage = (damage, health, maxHealth, damageType) => {
                    if (originalOnDamage) originalOnDamage(damage, health, maxHealth, damageType);
                    this.healthUI.updateHealth(health, maxHealth);
                    this.healthUI.flashDamage();
                };
                
                const originalOnHeal = playerHealth.onHeal;
                playerHealth.onHeal = (amount, health, maxHealth) => {
                    if (originalOnHeal) originalOnHeal(amount, health, maxHealth);
                    this.healthUI.updateHealth(health, maxHealth);
                };
                
                const originalOnLifeLost = playerHealth.onLifeLost;
                playerHealth.onLifeLost = (lives, maxLives) => {
                    if (originalOnLifeLost) originalOnLifeLost(lives, maxLives);
                    this.healthUI.updateLives(lives, maxLives);
                };
                
                const originalOnGameOver = playerHealth.onGameOver;
                playerHealth.onGameOver = (stats) => {
                    if (originalOnGameOver) originalOnGameOver(stats);
                    this.healthUI.showGameOver(stats);
                };
            }
        }, 100);
    }

    render() {
        const dt = this.clock.getDelta();
        const t = this.clock.getElapsedTime();

        if (this.world?.ready) {
            this.world.update(t, dt);
            
            // Update health UI
            if (this.healthUI) {
                this.healthUI.update(dt);
            }
            
            // Update timer UI
            if (this.timerUI) {
                this.timerUI.update(dt);
            }
            
            // Update ambient UI
            if (this.ambientUI) {
                this.ambientUI.update(dt);
            }

            // Set target object for camera controls
            const eve = this.world.eve;
            if (eve && eve.model) {
                this.devControls.setTargetObject(eve.model);
                
                // Only use third-person camera following if not in first-person mode
                if (!this.devControls.isFirstPerson) {
                    // Third-person camera following code (existing code)
                    const distance = 6.0;         
                    const heightOffset = 7.0;     
                    const angleInRadians = Math.PI / 4; 
                    const lookAtHeight = 1.0;     

                    const forward = new THREE.Vector3(0, 0, 1)
                        .applyQuaternion(eve.model.quaternion)
                        .setY(0)
                        .normalize();

                    const targetPos = new THREE.Vector3().copy(eve.model.position);
                    targetPos.addScaledVector(forward, -distance * Math.cos(angleInRadians));
                    targetPos.y += heightOffset * Math.sin(angleInRadians);

                    const smooth = 0.1;
                    this.camera.position.lerp(targetPos, smooth);

                    const lookAt = new THREE.Vector3().copy(eve.model.position);
                    lookAt.addScaledVector(forward, 10);
                    lookAt.y += lookAtHeight;
                    this.camera.lookAt(lookAt);
                } else {
                    // First-person: camera follows character's rotation but faces forward
                    this.camera.position.copy(eve.model.position);
                    this.camera.position.y += 1.6; // Eye height
                    
                    // Copy character's rotation but flip it 180 degrees to face forward
                    const cameraQuaternion = eve.model.quaternion.clone();
                    const flipRotation = new THREE.Quaternion();
                    flipRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); // 180 degrees around Y
                    cameraQuaternion.multiply(flipRotation);
                    this.camera.quaternion.copy(cameraQuaternion);
                }
            }
        }

        // Update dev controls
        if (this.devControls.enabled) {
            this.devControls.update(dt);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

export { App };
