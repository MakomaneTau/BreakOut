import * as THREE from '../../public/libs/three137/three.module.js';
import { RGBELoader } from '../../public/libs/three137/RGBELoader.js';

/**
 * DayNightManager - Manages day/night cycle with smooth transitions
 * Handles lighting, environment maps, and skybox switching
 */
export class DayNightManager {
  constructor(scene, renderer, assetsPath) {
    this.scene = scene;
    this.renderer = renderer;
    this.assetsPath = assetsPath;
    
    // State
    this.isNight = false;
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.transitionDuration = 2.0; // seconds
    
    // Lighting references
    this.hemisphereLight = null;
    this.directionalLight = null;
    this.ambientLight = null;
    
    // Environment maps
    this.dayEnvMap = null;
    this.nightEnvMap = null;
    this.pmremGen = null;
    
    // Skybox
    this.skybox = null;
    this.daySkybox = null;
    this.nightSkybox = null;
    
    // Day/Night configurations
    this.config = {
      day: {
        hemisphere: {
          skyColor: 0xffffff,
          groundColor: 0x444444,
          intensity: 1.0
        },
        directional: {
          color: 0xffffff,
          intensity: 0.9,
          position: { x: 10, y: 18, z: 12 }
        },
        ambient: {
          color: 0x404040,
          intensity: 0.6
        }
      },
      night: {
        hemisphere: {
          skyColor: 0x001122,
          groundColor: 0x000000,
          intensity: 0.3
        },
        directional: {
          color: 0x4a90e2,
          intensity: 0.2,
          position: { x: -5, y: 8, z: -5 } // Moon-like position
        },
        ambient: {
          color: 0x111133,
          intensity: 0.3
        }
      }
    };
    
    this.initialize();
  }
  
  /**
   * Initialize lighting and load environment maps
   */
  async initialize() {
    // Store references to existing lights
    this.scene.traverse((obj) => {
      if (obj.isHemisphereLight) {
        this.hemisphereLight = obj;
      } else if (obj.isDirectionalLight && !obj.userData.isHelper) {
        this.directionalLight = obj;
      } else if (obj.isAmbientLight) {
        this.ambientLight = obj;
      }
    });
    
    // Create PMREM generator for environment maps
    this.pmremGen = new THREE.PMREMGenerator(this.renderer);
    this.pmremGen.compileEquirectangularShader();
    
    // Load day environment map
    await this.loadEnvironmentMap('hdr/venice_sunset_1k.hdr', true);
    
    // Try to load night environment map (fallback to modified day if not available)
    // You can replace this with a proper night HDR file
    await this.loadEnvironmentMap('hdr/field_sky.hdr', false).catch(() => {
      console.warn('Night HDR not found, will use modified day map');
      this.createNightEnvMapFallback();
    });
    
    // Store skybox reference - use current background or keep existing reference
    // This handles the case where world.js loads skybox asynchronously
    if (!this.daySkybox) {
      this.daySkybox = this.scene.background;
    }
    
    // If daySkybox is still null, update it periodically until world loads
    if (!this.daySkybox) {
      const checkSkybox = setInterval(() => {
        if (this.scene.background && !this.daySkybox) {
          this.daySkybox = this.scene.background;
          clearInterval(checkSkybox);
        }
      }, 100);
      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(checkSkybox), 5000);
    }
    
    // Create night skybox proactively
    this.createNightSkybox();
    
    // Set initial state to day
    this.setDayMode(false); // false = no transition
  }
  
  /**
   * Load environment map from HDR file
   */
  loadEnvironmentMap(hdrPath, isDay) {
    return new Promise((resolve, reject) => {
      const loader = new RGBELoader().setPath(this.assetsPath);
      loader.load(
        hdrPath,
        (texture) => {
          const envMap = this.pmremGen.fromEquirectangular(texture).texture;
          if (isDay) {
            this.dayEnvMap = envMap;
          } else {
            this.nightEnvMap = envMap;
          }
          resolve(envMap);
        },
        undefined,
        (error) => {
          console.error(`Error loading HDR: ${hdrPath}`, error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Create a fallback night environment map by modifying day map
   */
  createNightEnvMapFallback() {
    // For now, just use a darker version of day map
    // In production, you'd want a proper night HDR
    if (this.dayEnvMap) {
      this.nightEnvMap = this.dayEnvMap; // Placeholder - ideally use a night HDR
    }
  }
  
  /**
   * Set day mode
   */
  setDayMode(smoothTransition = true) {
    if (this.isNight === false && !smoothTransition) return;
    
    const targetConfig = this.config.day;
    const wasNight = this.isNight; // Store current state before changing
    this.isNight = false;
    
    if (smoothTransition) {
      this.startTransition(targetConfig, wasNight);
    } else {
      this.applyLighting(targetConfig);
      if (this.dayEnvMap) {
        this.scene.environment = this.dayEnvMap;
      }
      if (this.daySkybox) {
        this.scene.background = this.daySkybox;
      }
    }
  }
  
  /**
   * Set night mode
   */
  setNightMode(smoothTransition = true) {
    if (this.isNight === true && !smoothTransition) return;
    
    const targetConfig = this.config.night;
    const wasNight = this.isNight; // Store current state before changing
    this.isNight = true;
    
    if (smoothTransition) {
      this.startTransition(targetConfig, wasNight);
    } else {
      this.applyLighting(targetConfig);
      if (this.nightEnvMap) {
        this.scene.environment = this.nightEnvMap;
      } else if (this.dayEnvMap) {
        // Fallback: use day map with lower intensity
        this.scene.environment = this.dayEnvMap;
        this.scene.environmentIntensity = 0.3;
      }
      
      // Switch to night skybox
      if (!this.nightSkybox) {
        this.createNightSkybox();
      }
      if (this.nightSkybox) {
        this.scene.background = this.nightSkybox;
      }
    }
  }
  
  /**
   * Create a starry night skybox
   */
  createNightSkybox() {
    const size = 1024; // Texture size
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Create dark blue gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#000428');   // Very dark blue at top
    gradient.addColorStop(0.5, '#001122'); // Dark blue in middle
    gradient.addColorStop(1, '#000000');   // Pure black at bottom
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add stars
    const starCount = 1500;
    ctx.fillStyle = '#ffffff';
    
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 1.5 + 0.5;
      const brightness = Math.random();
      
      // Create twinkling effect with opacity
      ctx.globalAlpha = brightness * 0.8 + 0.2;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add some brighter stars
      if (brightness > 0.7) {
        ctx.globalAlpha = brightness;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.globalAlpha = 1.0;
    
    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    // Create cube texture - use the same starfield for all faces
    // For a more realistic look, you could create different faces, but this works well
    this.nightSkybox = new THREE.CubeTexture([
      texture, // right (px)
      texture, // left (nx)
      texture, // top (py)
      texture, // bottom (ny)
      texture, // front (pz)
      texture  // back (nz)
    ]);
    
    this.nightSkybox.colorSpace = THREE.SRGBColorSpace;
    this.nightSkybox.needsUpdate = true;
    
    console.log('Starry night skybox created');
  }
  
  /**
   * Toggle between day and night
   */
  toggle(smoothTransition = true) {
    if (this.isNight) {
      this.setDayMode(smoothTransition);
    } else {
      this.setNightMode(smoothTransition);
    }
    return this.isNight;
  }
  
  /**
   * Start smooth transition
   */
  startTransition(targetConfig, wasNight = null) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.transitionProgress = 0;
    const startTime = performance.now();
    
    // Store starting values - use wasNight if provided, otherwise infer from target
    // wasNight represents the state BEFORE the transition started (passed from setDayMode/setNightMode)
    // If not provided, infer: if transitioning TO night, we're coming FROM day, and vice versa
    const startingWasNight = wasNight !== null 
      ? wasNight 
      : (targetConfig === this.config.night ? false : true); // If target is night, start was day (false), else start was night (true)
    const startConfig = startingWasNight ? this.config.night : this.config.day;
    
    // Switch skybox immediately at the start of transition
    // This ensures it changes right away, then lighting transitions smoothly
    if (this.isNight) {
      // Transitioning to night - switch to black starry skybox
      if (!this.nightSkybox) {
        this.createNightSkybox();
      }
      if (this.nightSkybox) {
        this.scene.background = this.nightSkybox;
        console.log('🌙 Switching to night skybox');
      } else {
        console.warn('Night skybox not available');
      }
    } else {
      // Transitioning to day
      // Update daySkybox reference if it's null (in case world loaded after initialization)
      if (!this.daySkybox && this.scene.background) {
        this.daySkybox = this.scene.background;
      }
      if (this.daySkybox) {
        this.scene.background = this.daySkybox;
        console.log('☀️ Switching to day skybox');
      } else {
        console.warn('Day skybox not available');
      }
    }
    
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
      
      // Interpolate between start and target
      const t = this.easeInOutQuad(this.transitionProgress);
      
      // Interpolate lighting
      if (this.hemisphereLight) {
        const skyStart = new THREE.Color(startConfig.hemisphere.skyColor);
        const skyEnd = new THREE.Color(targetConfig.hemisphere.skyColor);
        const groundStart = new THREE.Color(startConfig.hemisphere.groundColor);
        const groundEnd = new THREE.Color(targetConfig.hemisphere.groundColor);
        
        this.hemisphereLight.color.copy(skyStart.lerp(skyEnd, t));
        this.hemisphereLight.groundColor.copy(groundStart.lerp(groundEnd, t));
        this.hemisphereLight.intensity = THREE.MathUtils.lerp(
          startConfig.hemisphere.intensity,
          targetConfig.hemisphere.intensity,
          t
        );
      }
      
      if (this.directionalLight) {
        const colorStart = new THREE.Color(startConfig.directional.color);
        const colorEnd = new THREE.Color(targetConfig.directional.color);
        
        this.directionalLight.color.copy(colorStart.lerp(colorEnd, t));
        this.directionalLight.intensity = THREE.MathUtils.lerp(
          startConfig.directional.intensity,
          targetConfig.directional.intensity,
          t
        );
        
        // Interpolate position
        const posStart = startConfig.directional.position;
        const posEnd = targetConfig.directional.position;
        this.directionalLight.position.lerpVectors(
          new THREE.Vector3(posStart.x, posStart.y, posStart.z),
          new THREE.Vector3(posEnd.x, posEnd.y, posEnd.z),
          t
        );
      }
      
      if (this.ambientLight) {
        const colorStart = new THREE.Color(startConfig.ambient.color);
        const colorEnd = new THREE.Color(targetConfig.ambient.color);
        
        this.ambientLight.color.copy(colorStart.lerp(colorEnd, t));
        this.ambientLight.intensity = THREE.MathUtils.lerp(
          startConfig.ambient.intensity,
          targetConfig.ambient.intensity,
          t
        );
      }
      
      // Switch environment map at midpoint
      if (this.transitionProgress >= 0.5 && this.transitionProgress < 0.51) {
        if (this.isNight && this.nightEnvMap) {
          this.scene.environment = this.nightEnvMap;
          this.scene.environmentIntensity = 1.0;
        } else if (this.dayEnvMap) {
          this.scene.environment = this.dayEnvMap;
          this.scene.environmentIntensity = 1.0;
        }
      }
      
      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        // Ensure final state is correct
        this.applyLighting(targetConfig);
        
        // Ensure skybox is set correctly at end of transition (in case midpoint was missed)
        if (this.isNight) {
          if (!this.nightSkybox) {
            this.createNightSkybox();
          }
          if (this.nightSkybox) {
            this.scene.background = this.nightSkybox;
          }
        } else if (this.daySkybox) {
          this.scene.background = this.daySkybox;
        }
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Apply lighting configuration directly (no transition)
   */
  applyLighting(config) {
    if (this.hemisphereLight) {
      this.hemisphereLight.color.setHex(config.hemisphere.skyColor);
      this.hemisphereLight.groundColor.setHex(config.hemisphere.groundColor);
      this.hemisphereLight.intensity = config.hemisphere.intensity;
    }
    
    if (this.directionalLight) {
      this.directionalLight.color.setHex(config.directional.color);
      this.directionalLight.intensity = config.directional.intensity;
      this.directionalLight.position.set(
        config.directional.position.x,
        config.directional.position.y,
        config.directional.position.z
      );
    }
    
    if (this.ambientLight) {
      this.ambientLight.color.setHex(config.ambient.color);
      this.ambientLight.intensity = config.ambient.intensity;
    }
  }
  
  /**
   * Easing function for smooth transitions
   */
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  /**
   * Update (for per-frame updates if needed)
   */
  update(delta) {
    // Can be used for animated day/night cycles in the future
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    if (this.pmremGen) {
      this.pmremGen.dispose();
    }
  }
}

