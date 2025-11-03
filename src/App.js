import * as THREE from '../public/libs/three137/three.module.js';
import { RGBELoader } from '../public/libs/three137/RGBELoader.js';
import { LoadingBar } from '../public/libs/LoadingBar.js';
import { World } from './components/world.js';
import { DevControls } from './controls/devControls.js';
import { HealthUI } from './components/ui/HealthUI.js';
import { TimerUI } from './components/ui/TimerUI.js';
import { AmbientUI } from './components/ui/AmbientUI.js';
import { MenuUI } from './components/ui/MenuUI.js';
import { CollisionSystem } from './utils/CollisionSystem.js';
import { PauseUI } from './components/ui/PauseUI.js';
import { SettingsUI } from './components/ui/SettingsUI.js';
import { LoseComponent } from './components/ui/LoseComponent.js';
import { GameUI } from './components/ui/GameUI.js';
import { DayNightManager } from './components/DayNightManager.js';
import { InteractiveMap } from './components/ui/InteractiveMap.js';
import { PhotoMode } from './components/ui/PhotoMode.js';
import { Toast } from './components/ui/Toast.js';
import { CameraShake } from './utils/CameraShake.js';




import { PauseMenu } from './ui/pauseMenu.js';
import { QualityPresets, autoSelectQuality } from './core/perfConfig.js';
import { PerformanceManager } from './core/performance.js';

const LEVEL_START_TIMES = {
    1: 180,
    2: 150,
    3: 120,
    4: null // Play mode has no timer
};

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
    constructor(opts = {}) {
        this.level = Math.max(1, Math.min(4, parseInt(opts.level) || 1));

        const container = document.createElement('div');
        document.body.appendChild(container);

        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;
        this.clock = new THREE.Clock();
        this.assetsPath = '/public/assets/';

        // Initialize Health UI
        this.healthUI = new HealthUI({
            onRestart: () => {
                this.showMainMenu();
            }
        });

        // Initialize Timer UI (skip for play mode)
        const initialTime = LEVEL_START_TIMES[this.level] ?? LEVEL_START_TIMES[1];
        
        if (initialTime !== null && this.level < 4) {
            this.timerUI = new TimerUI({
                initialTime,
                onTimeUp: () => {
                    console.log('Time\'s up!');
                    this.handleTimeUp();
                }
            });
        } else {
            // Play mode has no timer
            this.timerUI = null;
        }

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

        // Initialize Menu UI (show on startup)
        this.menuUI = new MenuUI({
            enableAnimatedBackground: true,
            enableParticles: true,
            particleCount: 80,
            animationSpeed: 0.8,
            onStartGame: () => {
                this.startGame();
            },
            onShowSettings: () => {
                this.settingsUI.show();
            },
            onQuit: () => {
                this.quitToMainMenu();
            }
        });

        // Initialize Pause UI
        this.pauseUI = new PauseUI({
            onResume: () => {
                this.resumeGame();
            },
            onShowSettings: () => {
                this.settingsUI.show();
            },
            onMainMenu: () => {
                this.showMainMenu();
            },
            onRestart: () => {
                this.showMainMenu();
            }
        });

        // Initialize Settings UI
        this.settingsUI = new SettingsUI({
            onClose: () => {
                // Settings closed, return to previous state
            },
            onSettingChange: (key, value) => {
                this.applySetting(key, value);
            }
        });

        // Initialize Lose Component
        this.loseComponent = new LoseComponent({
            onRestart: () => {
                this.showMainMenu();
            },
            onMainMenu: () => {
                this.showMainMenu();
            },
            onQuit: () => {
                this.quitToMainMenu();
            }
        });

        // Initialize Toast notification system
        this.toast = new Toast();

        // Initialize Game UI
        // Provide minimap data providers so UI can render platforms per floor and player pointer
        const minimapData = {
            getPlayerPosition: () => {
                const pos = this.world?.eve?.model?.position;
                return pos ? { x: pos.x, z: pos.z } : null;
            },
            getExtentsByFloor: () => {
                const floors = { 1: { platforms: [], blocks: [] }, 2: { platforms: [], blocks: [] }, 3: { platforms: [], blocks: [] } };
                const pushPlatform = (key, model) => {
                    if (!model) return;
                    try {
                        const box = new THREE.Box3().setFromObject(model);
                        if (isFinite(box.min.x) && isFinite(box.max.x)) {
                            (floors[key].platforms).push({
                                minX: box.min.x, maxX: box.max.x,
                                minZ: box.min.z, maxZ: box.max.z,
                            });
                        }
                    } catch {}
                };
                const pushBlocks = (key, arr) => {
                    if (!Array.isArray(arr)) return;
                    for (const b of arr) {
                        const m = b?.model;
                        if (!m) continue;
                        try {
                            const box = new THREE.Box3().setFromObject(m);
                            if (isFinite(box.min.x) && isFinite(box.max.x)) {
                                (floors[key].blocks).push({
                                    minX: box.min.x, maxX: box.max.x,
                                    minZ: box.min.z, maxZ: box.max.z,
                                });
                            }
                        } catch {}
                    }
                };
                // Floor 1 (base structure platform)
                pushPlatform(1, this.world?.structure?.platform?.model);
                pushBlocks(1, this.world?.structure?.platform?.concreteBlocks);
                // Floor 2
                pushPlatform(2, this.world?.platform_two?.model);
                // Floor 3
                pushPlatform(3, this.world?.platform_three?.model);
                pushBlocks(3, this.world?.platform_three?.concreteBlocks);
                return floors;
            },
            // Dynamic/static objects (obstacles, finish line, helicopter), per floor
            getObjectsByFloor: (floor) => {
                const out = [];
                const pushObj = (type, objOrModel) => {
                    const obj = objOrModel?.model || objOrModel;
                    if (!obj) return;
                    try {
                        const box = new THREE.Box3().setFromObject(obj);
                        if ([box.min.x, box.max.x, box.min.z, box.max.z].every(isFinite)) {
                            out.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z, type });
                        }
                    } catch {}
                };

                if (floor === 1) {
                    const plat = this.world?.structure?.platform;
                    // Lasers
                    if (Array.isArray(plat?.laserBarriers)) {
                        for (const lb of plat.laserBarriers) pushObj('laser', lb?.model);
                    }
                    if (Array.isArray(plat?.laserCubes)) {
                        for (const cube of plat.laserCubes) pushObj('laser', cube);
                    }
                    // Flying cubes
                    const cubes = plat?.flyingCubesSpawner?.cubes;
                    if (Array.isArray(cubes)) {
                        for (const c of cubes) pushObj('flying_cube', c);
                    }
                    // Finish line and helicopter
                    pushObj('finish_line', plat?.finishLine?.model);
                    pushObj('helicopter', plat?.helicopter?.model);
                } else if (floor === 2) {
                    const plat2 = this.world?.platform_two;
                    if (Array.isArray(plat2?.laserBarriers)) {
                        for (const lb of plat2.laserBarriers) pushObj('laser', lb?.model);
                    }
                    if (Array.isArray(plat2?.laserCubes)) {
                        for (const cube of plat2.laserCubes) pushObj('laser', cube);
                    }
                    const cubes2 = plat2?.flyingCubesSpawner?.cubes;
                    if (Array.isArray(cubes2)) {
                        for (const c of cubes2) pushObj('flying_cube', c);
                    }
                    pushObj('finish_line', plat2?.finishLine?.model);
                    pushObj('helicopter', plat2?.helicopter?.model);
                } else if (floor === 3) {
                    const plat3 = this.world?.platform_three;
                    const cubes3 = plat3?.flyingCubesSpawner?.cubes;
                    if (Array.isArray(cubes3)) {
                        for (const c of cubes3) pushObj('flying_cube', c);
                    }
                    // Laser barrier spawner may include both clone models and invisible cubes
                    const barriers = plat3?.laserBarrierSpawner?.barriers;
                    if (Array.isArray(barriers)) {
                        for (const b of barriers) pushObj('laser', b);
                    }
                    pushObj('finish_line', plat3?.finishLine?.model);
                    pushObj('helicopter', plat3?.helicopter?.model);
                }
                return out;
            }
        };

        this.gameUI = new GameUI({
            onPause: () => {
                this.pauseGame();
            },
            onSettings: () => {
                this.settingsUI.show();
            },
            onRestart: () => {
                this.showMainMenu();
            },
            onMainMenu: () => {
                this.showMainMenu();
            },
            onToggleFullscreen: (isFullscreen) => {
                this.toggleFullscreen(isFullscreen);
            },
            onToggleMute: (isMuted) => {
                this.toggleMute(isMuted);
            },
            onToggleDayNight: () => {
                this.toggleDayNight();
            },
            onShowMap: () => {
                this.showInteractiveMap();
            },
            onTogglePhotoMode: () => {
                this.togglePhotoMode();
            },
            minimapData
        });
        
        // Interactive Map will be lazy-loaded on first open
        this.interactiveMap = null;

        // Start with main menu visible
        this.isGameStarted = true; // Auto-start the game to show the scene
        this.isGamePaused = false;

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            70, window.innerWidth / window.innerHeight, 0.01, 100
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Initialize Camera Shake system
        this.cameraShake = new CameraShake(this.camera);

        // Scene + lights
        this.scene = new THREE.Scene();
    // Global collision system (used by all levels and player)
    this.collisionSystem = new CollisionSystem(this.scene, { pushback: 0.25 });
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        this.scene.add(hemiLight);

        // Add directional light for better visibility
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 18, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.03;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
        this.scene.add(dirLight);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Quality / performance preset
        const qs = new URLSearchParams(window.location.search);
        const presetName = qs.get('quality') || autoSelectQuality();
        this.qualityPresetName = ['low', 'medium', 'high'].includes(presetName) ? presetName : 'medium';
        this.qualityPreset = QualityPresets[this.qualityPresetName];

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    // Enable soft shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.localClippingEnabled = true;
        container.appendChild(this.renderer.domElement);

        // Performance Manager (adaptive pixel ratio)
        this.perf = new PerformanceManager(this.renderer, this.qualityPreset);

        // Dev controls for moving around the scene
        this.devControls = new DevControls(this.camera, this.renderer.domElement);
        
        // Photo Mode will be lazy-loaded on first toggle
        this.photoMode = null;

        // Pause state
        this.paused = false;
        this.pauseMenu = new PauseMenu({
            onResume: () => this.setPaused(false),
            onRestart: () => {
                this.setPaused(false);
                this.showMainMenu();
            },
            onMainMenu: () => {
                this.quitToMainMenu();
            }
        });

        // Keyboard shortcuts
        this._onKeyDown = (e) => {
            if (e.code === 'KeyF') {
                this.devControls.frameObject(this.scene, 1.3);
            } else if (e.code === 'KeyP') {
                if (e.ctrlKey || e.metaKey) {
                    // Ctrl+P for screenshot
                    if (this.photoMode) {
                        this.photoMode.takeScreenshot();
                    }
                    e.preventDefault();
                } else {
                    // Just P to cycle quality preset
                    const order = ['low', 'medium', 'high'];
                    let idx = order.indexOf(this.qualityPresetName);
                    idx = (idx + 1) % order.length;
                    this.qualityPresetName = order[idx];
                    this.qualityPreset = QualityPresets[this.qualityPresetName];
                    this.perf.setPreset(this.qualityPreset);
                }
            } else if (e.code === 'Escape') {
                this.setPaused(!this.paused);
            }
        };
        window.addEventListener('keydown', this._onKeyDown);


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

    // Initialize Day/Night Manager (after scene is set up)
    this.dayNightManager = null;
    this.initializeDayNightManager();

        this._onResize = this.resize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    /**
     * Initialize Day/Night Manager
     */
    initializeDayNightManager() {
        // Wait a bit for lights to be added to scene
        setTimeout(() => {
            import('./components/DayNightManager.js').then(({ DayNightManager }) => {
                this.dayNightManager = new DayNightManager(
                    this.scene,
                    this.renderer,
                    this.assetsPath
                );
            }).catch((err) => console.error('Failed to load DayNightManager', err));
        }, 100);
    }

    /**
     * Toggle day/night mode
     */
    toggleDayNight() {
        if (!this.dayNightManager) {
            console.warn('DayNightManager not initialized yet');
            return;
        }
        
        // Toggle the manager and get the new state
        const isNight = this.dayNightManager.toggle(true);
        
        // Update UI button state to match manager
        if (this.gameUI) {
            this.gameUI.setDayNightState(isNight);
        }
        
        // Show toast notification
        if (this.toast) {
            const mode = isNight ? 'Night' : 'Day';
            const icon = isNight ? '🌙' : '☀️';
            this.toast.show(`Switched to ${mode} Mode`, {
                type: 'info',
                icon: icon,
                duration: 2500
            });
        }
    }
    
    /**
     * Show interactive map
     */
    showInteractiveMap() {
        if (this.interactiveMap) {
            this.interactiveMap.show();
            return;
        }
        // Lazy-load InteractiveMap on first use
        this.showBusy('Loading map...');
        import('./components/ui/InteractiveMap.js')
            .then(({ InteractiveMap }) => {
                this.interactiveMap = new InteractiveMap({
                    scene: this.scene,
                    camera: this.camera,
                    getPlayerPosition: () => {
                        const pos = this.world?.eve?.model?.position;
                        return pos ? { x: pos.x, z: pos.z } : null;
                    },
                    getExtentsByFloor: () => {
                        // Reuse logic provided earlier via minimapData
                        const floors = { 1: { platforms: [], blocks: [] }, 2: { platforms: [], blocks: [] }, 3: { platforms: [], blocks: [] } };
                        const pushPlatform = (key, model) => {
                            if (!model) return;
                            try {
                                const box = new THREE.Box3().setFromObject(model);
                                if (isFinite(box.min.x) && isFinite(box.max.x)) {
                                    (floors[key].platforms).push({
                                        minX: box.min.x, maxX: box.max.x,
                                        minZ: box.min.z, maxZ: box.max.z,
                                    });
                                }
                            } catch {}
                        };
                        const pushBlocks = (key, arr) => {
                            if (!Array.isArray(arr)) return;
                            for (const b of arr) {
                                const m = b?.model;
                                if (!m) continue;
                                try {
                                    const box = new THREE.Box3().setFromObject(m);
                                    if (isFinite(box.min.x) && isFinite(box.max.x)) {
                                        (floors[key].blocks).push({
                                            minX: box.min.x, maxX: box.max.x,
                                            minZ: box.min.z, maxZ: box.max.z,
                                        });
                                    }
                                } catch {}
                            }
                        };
                        pushPlatform(1, this.world?.structure?.platform?.model);
                        pushBlocks(1, this.world?.structure?.platform?.concreteBlocks);
                        pushPlatform(2, this.world?.platform_two?.model);
                        pushPlatform(3, this.world?.platform_three?.model);
                        pushBlocks(3, this.world?.platform_three?.concreteBlocks);
                        return floors;
                    },
                    onClose: () => {}
                });
                this.interactiveMap.show();
            })
            .catch(err => console.error('Failed to load InteractiveMap', err))
            .finally(() => this.hideBusy());
    }
    
    /**
     * Take a screenshot
     */
    togglePhotoMode() {
        if (this.photoMode) {
            this.photoMode.takeScreenshot();
        }
        // Lazy-load PhotoMode on first use
        this.showBusy('Loading photo mode...');
        import('./components/ui/PhotoMode.js')
            .then(({ PhotoMode }) => {
                this.photoMode = new PhotoMode({
                    scene: this.scene,
                    camera: this.camera,
                    renderer: this.renderer,
                    onPause: () => this.pauseGame(),
                    onResume: () => this.resumeGame(),
                });
                this.photoMode.toggle();
            })
            .catch(err => console.error('Failed to load PhotoMode', err))
            .finally(() => this.hideBusy());
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setEnvironment() {
        // Environment map will be managed by DayNightManager
        // This method is kept for backward compatibility but DayNightManager
        // will handle environment map loading
        const loader = new RGBELoader().setPath(this.assetsPath);
        const pmremGen = new THREE.PMREMGenerator(this.renderer);
        pmremGen.compileEquirectangularShader();

        loader.load('hdr/venice_sunset_1k.hdr', texture => {
            const envMap = pmremGen.fromEquirectangular(texture).texture;
            pmremGen.dispose();
            // DayNightManager will set this, but set initial state here
            if (!this.dayNightManager) {
                this.scene.environment = envMap;
            }
        });
    }

    load() {
        this.loading = true;
        this.loadingBar.visible = true;

    this.world = new World(this, { level: this.level });


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
                this.healthUI.updateHealth(playerHealth.currentHealth, playerHealth.maxHealth, true);
                // Lives system disabled - using health only
                // this.healthUI.updateLives(playerHealth.currentLives, playerHealth.maxLives);

                // Hook into health events
                const originalOnDamage = playerHealth.onDamage;
                playerHealth.onDamage = (damage, health, maxHealth, damageType) => {
                    if (originalOnDamage) originalOnDamage(damage, health, maxHealth, damageType);
                    this.healthUI.updateHealth(health, maxHealth, true); // Enable pulse on damage
                    this.healthUI.flashDamage();
                };

                const originalOnHeal = playerHealth.onHeal;
                playerHealth.onHeal = (amount, health, maxHealth) => {
                    if (originalOnHeal) originalOnHeal(amount, health, maxHealth);
                    this.healthUI.updateHealth(health, maxHealth, false); // No pulse on heal
                };

                // Lives system disabled - no need to track life lost
                // const originalOnLifeLost = playerHealth.onLifeLost;
                // playerHealth.onLifeLost = (lives, maxLives) => {
                //     if (originalOnLifeLost) originalOnLifeLost(lives, maxLives);
                //     this.healthUI.updateLives(lives, maxLives);
                // };

                // Respawn disabled - with permadeath mode, player goes straight to game over
                // const originalOnRespawn = playerHealth.onRespawn;
                // playerHealth.onRespawn = (checkpoint, health, lives) => {
                //     if (originalOnRespawn) originalOnRespawn(checkpoint, health, lives);
                //     // Update UI with restored health after respawn
                //     this.healthUI.updateHealth(health, playerHealth.maxHealth);
                //     this.healthUI.updateLives(lives, playerHealth.maxLives);
                // };

                const originalOnGameOver = playerHealth.onGameOver;
                playerHealth.onGameOver = (stats) => {
                    if (originalOnGameOver) originalOnGameOver(stats);
                    this.handleGameOver('health', stats);
                };
            }
        }, 100);
    }

    /**
     * Start the game
     */
    startGame() {
        this.isGameStarted = true;
        this.menuUI.hide();
        this.gameUI.show(); // Show game UI during gameplay

        // Ensure timer starts fresh for each new session
        if (this.timerUI) {
            this.timerUI.resetTimer();
            this.timerUI.resumeTimer();
        }

        // Resume any paused animations
        if (this.world?.ready) {
            // Game logic continues
        }
    }

    /**
     * Resume the game
     */
    resumeGame() {
        this.isGamePaused = false;
        // Resume game logic
    }

    /**
     * Pause the game
     */
    pauseGame() {
        this.isGamePaused = true;
        this.pauseUI.show();
    }

    /**
     * Quit the current game session and return to the level selection screen
     */
    quitToMainMenu() {
        if (this._isQuitting) {
            return;
        }

        this._isQuitting = true;

        try { this.pauseMenu?.hide?.(); } catch { }
        try { this.pauseUI?.hide?.(); } catch { }
        try { this.gameUI?.hide?.(); } catch { }
        try { this.menuUI?.hide?.(); } catch { }
        try { this.loseComponent?.hide?.(); } catch { }

        window.dispatchEvent(new CustomEvent('show-main-menu'));
    }

    /**
     * Show main menu
     */
    showMainMenu() {
        this.isGameStarted = false;
        this.isGamePaused = false;
        // Reset and pause timer while in main menu
        if (this.timerUI) {
            this.timerUI.resetTimer();
            this.timerUI.pauseTimer();
        }
        this.menuUI.show();
        this.gameUI.hide(); // Hide game UI when in main menu
    }

    /**
     * Restart the game
     */
    restartGame() {
        // Reset game state
        this.isGameStarted = true;
        this.isGamePaused = false;

        // Hide lose component if visible
        if (this.loseComponent && this.loseComponent.isCurrentlyVisible()) {
            this.loseComponent.hide();
        }

        // Hide pause UI if visible
        if (this.pauseUI && this.pauseUI.isVisible) {
            this.pauseUI.hide();
        }

        // Hide old pause menu if visible
        if (this.pauseMenu) {
            this.pauseMenu.hide();
        }

        // Show game UI
        this.gameUI.show();

        // Reset health, timer, etc.
        if (this.healthUI) {
            this.healthUI.updateHealth(100, 100);
            // Lives system disabled - using health only
            // this.healthUI.updateLives(1, 1);
        }

        // Reset and resume timer
        if (this.timerUI) {
            this.timerUI.resetTimer();
            this.timerUI.resumeTimer();
        }

        // Reset player health system FIRST (important - prevents game over callbacks)
        if (this.world?.eve?.health) {
            this.world.eve.health.reset();
            console.log('Health system reset - Player is alive again');
            // Grant brief invulnerability after restart to avoid immediate obstacle damage
            try { this.world.eve.health.setInvulnerable(1.5); } catch {}
        }

        // Reset win animation and helicopter escape states
        if (this.world?.eve) {
            // Stop and cleanup win animation if it's running
            if (this.world.eve.winAnimation) {
                if (this.world.eve.winAnimation.isRunning()) {
                    this.world.eve.winAnimation.stop();
                }
                
                // Hide mission popup if visible
                if (this.world.eve.winAnimation.missionPopup) {
                    this.world.eve.winAnimation.missionPopup.hide();
                }
                
                // Force cleanup to ensure everything is reset
                if (this.world.eve.winAnimation.forceCleanup) {
                    this.world.eve.winAnimation.forceCleanup();
                } else {
                    this.world.eve.winAnimation.cleanup();
                }
                
                // Cleanup helicopter escape sequence
                if (this.world.eve.winAnimation.helicopterEscape) {
                    this.world.eve.winAnimation.helicopterEscape.cleanup();
                }
            }
            
            // Reset win trigger flag
            this.world.eve.winTriggered = false;
            
            // Re-enable character controls (may have been disabled during win sequence)
            this.world.eve.controlsDisabled = false;
            
            // Restore movement properties that may have been modified during win sequence
            if (this.world.eve.runSpeed === 0) {
                this.world.eve.runSpeed = 5; // Default run speed
            }
            if (this.world.eve.jumpSpeed === 0) {
                this.world.eve.jumpSpeed = 12; // Default jump speed
            }
            if (this.world.eve.gravity === 0) {
                this.world.eve.gravity = 30; // Default gravity
            }
            
            // Immediately re-enable player (will be refined by resetToStartPosition)
            this.world.eve.ready = true;
            
            // Use proper reset method that includes ground detection
            if (typeof this.world.eve.resetToStartPosition === 'function') {
                this.world.eve.resetToStartPosition();
            } else {
                // Fallback to manual reset if method doesn't exist
                this.world.eve.model.position.set(3, 1, 0);
                this.world.eve.velocityY = 0;
            }
            
            // Ensure player controls are definitely enabled after all resets
            setTimeout(() => {
                if (this.world?.eve) {
                    this.world.eve.ready = true;
                    this.world.eve.controlsDisabled = false;
                    
                    // Double-check movement properties are restored
                    if (this.world.eve.runSpeed === 0) this.world.eve.runSpeed = 5;
                    if (this.world.eve.jumpSpeed === 0) this.world.eve.jumpSpeed = 12;
                    if (this.world.eve.gravity === 0) this.world.eve.gravity = 30;
                    
                    console.log('✅ Player controls fully restored after restart');
                }
            }, 200);
        }

        // Reset obstacles for Level 2
        if (this.level >= 2 && this.world?.platform_two) {
            if (this.world.platform_two.flyingCubesSpawner?.reset) {
                this.world.platform_two.flyingCubesSpawner.reset();
            }
        }

        // Reset obstacles for Level 3
        if (this.level >= 3 && this.world?.platform_three) {
            if (this.world.platform_three.flyingCubesSpawner?.reset) {
                this.world.platform_three.flyingCubesSpawner.reset();
            }
            if (this.world.platform_three.laserBarrierSpawner?.reset) {
                this.world.platform_three.laserBarrierSpawner.reset();
            }
        }
    }

    /**
     * Apply setting changes
     */
    applySetting(key, value) {
        switch (key) {
            case 'particles':
                if (this.ambientUI) {
                    this.ambientUI.toggleParticles(value);
                }
                break;
            case 'ambientEffects':
                if (this.ambientUI) {
                    this.ambientUI.toggleBorders(value);
                }
                break;
            case 'masterVolume':
                // Apply volume to audio context
                break;
            case 'mouseSensitivity':
                if (this.devControls) {
                    this.devControls.mouseSensitivity = value;
                }
                break;
            // Add more setting applications as needed
        }
    }

    /**
     * Handle time up event
     */
    handleTimeUp() {
        if (!this.isGameStarted || this.isGamePaused) return;

        console.log('Time has run out - showing lose screen');

        // Disable player controls but keep world animating
        if (this.world?.eve) {
            this.world.eve.ready = false;
        }

        // Stop the timer
        if (this.timerUI) {
            this.timerUI.pauseTimer();
        }

        // Get current stats
        const stats = this.getCurrentGameStats();
        stats.timeFormatted = '00:00';

        // Show lose component
        this.loseComponent.show('time', stats);
    }

    /**
     * Handle game over from health/lives
     */
    handleGameOver(lossType, stats) {
        if (!this.isGameStarted || this.isGamePaused) return;

        console.log(`Game over due to ${lossType} - showing lose screen`);

        // Disable player controls but keep world animating
        if (this.world?.eve) {
            this.world.eve.ready = false;
        }

        // Stop the timer
        if (this.timerUI) {
            this.timerUI.pauseTimer();
        }

        // Get current stats and merge with provided stats
        const currentStats = this.getCurrentGameStats();
        const finalStats = { ...currentStats, ...stats };

        // Show lose component
        this.loseComponent.show(lossType, finalStats);
    }

    /**
     * Get current game statistics
     */
    getCurrentGameStats() {
        const stats = {
            health: 0,
            maxHealth: 100,
            timeFormatted: '00:00'
        };

        // Get health from player (lives system disabled)
        if (this.world?.eve?.health) {
            stats.health = this.world.eve.health.currentHealth;
            stats.maxHealth = this.world.eve.health.maxHealth;
        }

        // Get current time from timer
        if (this.timerUI) {
            stats.timeFormatted = this.timerUI.getFormattedTime();
        }

        return stats;
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen(isFullscreen) {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
            // Enter fullscreen
            if (this.renderer.domElement.requestFullscreen) {
                this.renderer.domElement.requestFullscreen();
            } else if (this.renderer.domElement.webkitRequestFullscreen) {
                this.renderer.domElement.webkitRequestFullscreen();
            } else if (this.renderer.domElement.mozRequestFullScreen) {
                this.renderer.domElement.mozRequestFullScreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
        }
    }

    /**
     * Toggle mute state
     */
    toggleMute(isMuted) {
        // This would integrate with your audio system
        // For now, just log the state change
        console.log(`Audio ${isMuted ? 'muted' : 'unmuted'}`);

        // You can integrate this with your audio context or sound effects
        // Example: if (this.audioContext) { this.audioContext.suspend(); }
    }

    // --- Lazy-load busy overlay helpers ---
    _ensureBusyOverlay() {
        if (this._busyOverlay) return;
        const overlay = document.createElement('div');
        overlay.id = 'lazy-busy-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', inset: '0', display: 'none',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)', color: '#fff',
            zIndex: 9999, fontFamily: 'sans-serif',
        });
        const box = document.createElement('div');
        Object.assign(box.style, {
            padding: '10px 16px', borderRadius: '8px',
            background: 'rgba(20,20,20,0.85)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
        });
        this._busyText = document.createElement('div');
        this._busyText.textContent = 'Loading...';
        box.appendChild(this._busyText);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        this._busyOverlay = overlay;
        this._busyCount = 0;
    }

    showBusy(message = 'Loading...') {
        this._ensureBusyOverlay();
        this._busyCount = (this._busyCount || 0) + 1;
        if (this._busyText) this._busyText.textContent = message;
        this._busyOverlay.style.display = 'flex';
    }

    hideBusy() {
        if (!this._busyOverlay) return;
        this._busyCount = Math.max(0, (this._busyCount || 0) - 1);
        if (this._busyCount === 0) {
            this._busyOverlay.style.display = 'none';
        }
    }

    render() {
        const dt = this.clock.getDelta();
        const t = this.clock.getElapsedTime();

        // Always update dev controls and performance
        this.devControls.update(dt);
        this.perf.update(dt, t);

        // Only update game logic if game is started and not paused
        if (this.isGameStarted && !this.isGamePaused && this.world?.ready) {
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

            // Update game UI
            if (this.gameUI) {
                this.gameUI.update(dt);
            }

            // Update day/night manager
            if (this.dayNightManager) {
                this.dayNightManager.update(dt);
            }

            // Update camera shake
            if (this.cameraShake) {
                // Update original position before shake applies (so shake doesn't interfere with camera following)
                if (this.world?.eve?.model) {
                    this.cameraShake.updateOriginalPosition();
                }
                this.cameraShake.update(dt);
            }

            // Set target object for camera controls
            const eve = this.world.eve;
            if (eve && eve.model) this.devControls.setTargetObject(eve.model);
            //starts here
            
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

                     let smooth = 0.1;
                     if (distance > 5) {
                        smooth = 0.3;   // camera catches up faster
                        } else if (distance > 2) {
                             smooth = 0.2;
                        }
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

            //ends here
        }

        // Always render the scene
        this.renderer.render(this.scene, this.camera);
    }

    // Add keyboard listener for pause menu
    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.isGameStarted && !this.isGamePaused) {
                    this.pauseGame();
                } else if (this.isGamePaused) {
                    this.resumeGame();
                    this.pauseUI.hide();
                }
            }
        });
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
        if (this._isDestroyed) {
            return;
        }
        this._isDestroyed = true;

        try {
            // Stop render loop
            this.renderer.setAnimationLoop(null);
        } catch { }
        // Remove listeners
        if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
        if (this._onResize) window.removeEventListener('resize', this._onResize);

        // Dispose controls
        if (this.devControls && typeof this.devControls.dispose === 'function') {
            try { this.devControls.dispose(); } catch { }
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
        } catch { }

        // Remove canvas & overlay
        try {
            const canvas = this.renderer.domElement;
            canvas?.parentNode?.removeChild(canvas);
            if (this.perf?.overlay) this.perf.overlay.remove();
        } catch { }

        // Hide any overlays owned by App
        try { this.pauseMenu?.hide?.(); } catch { }

        // Tear down UI components
        try { this.pauseUI?.destroy?.(); } catch { }
        try { this.menuUI?.destroy?.(); } catch { }
        try { this.settingsUI?.destroy?.(); } catch { }
        try { this.ambientUI?.destroy?.(); } catch { }
        try { this.timerUI?.destroy?.(); } catch { }
        try { this.healthUI?.destroy?.(); } catch { }
        try { this.gameUI?.dispose?.(); } catch { }
        try { this.loseComponent?.dispose?.(); } catch { }
        
        // Dispose day/night manager
        try { this.dayNightManager?.dispose?.(); } catch { }

        this.pauseUI = null;
        this.menuUI = null;
        this.settingsUI = null;
        this.ambientUI = null;
        this.timerUI = null;
        this.healthUI = null;
        this.gameUI = null;
        this.loseComponent = null;
        this.pauseMenu = null;
    }
}

export { App };
