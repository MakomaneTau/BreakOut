import * as THREE from '../../../public/libs/three137/three.module.js';
import { OrbitControls } from '../../../public/libs/three137/OrbitControls.js';

/**
 * PhotoMode - Pause game and enable free camera movement for screenshots
 * Supports filters and effects
 */
export class PhotoMode {
  constructor(options = {}) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.onPause = options.onPause || (() => {});
    this.onResume = options.onResume || (() => {});
    
    this.container = null;
    this.isActive = false;
    this.photoControls = null;
    
    // Store original camera state
    this.originalCameraPosition = new THREE.Vector3();
    this.originalCameraRotation = new THREE.Euler();
    this.originalControls = null;
    
    // Post-processing effects
    this.effects = {
      saturation: 1.0,
      contrast: 1.0,
      brightness: 1.0,
      sepia: 0.0,
      vignette: 0.0,
      blur: 0.0
    };
    
    // Screenshot canvas
    this.screenshotCanvas = document.createElement('canvas');
    this.setupKeyboardShortcuts();
  }
  
  setupKeyboardShortcuts() {
    this.keyHandler = (e) => {
      if (!this.isActive) return;
      
      if (e.code === 'KeyP' && e.ctrlKey) {
        // Ctrl+P to toggle photo mode
        this.toggle();
        e.preventDefault();
      } else if (e.code === 'KeyS' && e.ctrlKey) {
        // Ctrl+S to save screenshot
        this.captureScreenshot();
        e.preventDefault();
      }
    };
  }
  
  /**
   * Activate photo mode
   */
  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    
    // Store original camera state
    this.originalCameraPosition.copy(this.camera.position);
    this.originalCameraRotation.copy(this.camera.rotation);
    
    // Pause the game
    if (this.onPause) this.onPause();
    
    // Create photo controls (OrbitControls for free camera movement)
    this.photoControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.photoControls.enableDamping = true;
    this.photoControls.dampingFactor = 0.05;
    this.photoControls.enableZoom = true;
    this.photoControls.enablePan = true;
    this.photoControls.enableRotate = true;
    this.photoControls.minDistance = 0.1;
    this.photoControls.maxDistance = 10000;
    
    // Create UI
    this.createUI();
    
    // Start update loop for controls
    this.startUpdateLoop();
    
    // Add keyboard listener
    document.addEventListener('keydown', this.keyHandler);
  }
  
  /**
   * Deactivate photo mode
   */
  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Restore original camera (optional - user might want to keep position)
    // this.camera.position.copy(this.originalCameraPosition);
    // this.camera.rotation.copy(this.originalCameraRotation);
    
    // Dispose photo controls
    if (this.photoControls) {
      this.photoControls.dispose();
      this.photoControls = null;
    }
    
    // Remove UI
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    
    // Stop update loop
    this.stopUpdateLoop();
    
    // Remove keyboard listener
    document.removeEventListener('keydown', this.keyHandler);
    
    // Resume game
    if (this.onResume) this.onResume();
  }
  
  /**
   * Toggle photo mode
   */
  toggle() {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }
  
  /**
   * Create photo mode UI
   */
  createUI() {
    this.container = document.createElement('div');
    this.container.id = 'photo-mode-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      padding: 20px;
      z-index: 3000;
      font-family: Arial, sans-serif;
      color: white;
      min-width: 300px;
      max-height: 90vh;
      overflow-y: auto;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);
    `;
    
    const title = document.createElement('h3');
    title.textContent = '📷 PHOTO MODE';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      letter-spacing: 1px;
    `;
    header.appendChild(title);
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 5px;
      width: 30px;
      height: 30px;
      cursor: pointer;
      font-size: 18px;
    `;
    closeBtn.onclick = () => this.deactivate();
    header.appendChild(closeBtn);
    
    this.container.appendChild(header);
    
    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      margin-bottom: 20px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
      font-size: 12px;
      line-height: 1.6;
    `;
    instructions.innerHTML = `
      <strong>Controls:</strong><br>
      • Mouse: Orbit camera<br>
      • Scroll: Zoom<br>
      • Ctrl+S: Save screenshot<br>
      • Ctrl+P: Exit photo mode
    `;
    this.container.appendChild(instructions);
    
    // Screenshot button
    const screenshotBtn = document.createElement('button');
    screenshotBtn.textContent = '📸 CAPTURE SCREENSHOT';
    screenshotBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      margin-bottom: 20px;
      transition: all 0.3s;
    `;
    screenshotBtn.onmouseover = () => {
      screenshotBtn.style.transform = 'translateY(-2px)';
      screenshotBtn.style.boxShadow = '0 6px 12px rgba(76, 175, 80, 0.4)';
    };
    screenshotBtn.onmouseout = () => {
      screenshotBtn.style.transform = 'translateY(0)';
      screenshotBtn.style.boxShadow = 'none';
    };
    screenshotBtn.onclick = () => this.captureScreenshot();
    this.container.appendChild(screenshotBtn);
    
    // Effects section
    const effectsTitle = document.createElement('div');
    effectsTitle.textContent = 'FILTERS & EFFECTS';
    effectsTitle.style.cssText = `
      font-weight: bold;
      margin-bottom: 15px;
      font-size: 14px;
      letter-spacing: 1px;
    `;
    this.container.appendChild(effectsTitle);
    
    // Effect controls
    const effects = [
      { key: 'saturation', label: 'Saturation', min: 0, max: 2, step: 0.1, default: 1.0 },
      { key: 'contrast', label: 'Contrast', min: 0, max: 2, step: 0.1, default: 1.0 },
      { key: 'brightness', label: 'Brightness', min: 0, max: 2, step: 0.1, default: 1.0 },
      { key: 'sepia', label: 'Sepia', min: 0, max: 1, step: 0.1, default: 0.0 },
      { key: 'vignette', label: 'Vignette', min: 0, max: 1, step: 0.1, default: 0.0 },
      { key: 'blur', label: 'Blur', min: 0, max: 10, step: 0.5, default: 0.0 }
    ];
    
    effects.forEach(effect => {
      const controlDiv = document.createElement('div');
      controlDiv.style.cssText = `
        margin-bottom: 15px;
      `;
      
      const label = document.createElement('label');
      label.textContent = effect.label;
      label.style.cssText = `
        display: block;
        margin-bottom: 5px;
        font-size: 12px;
      `;
      controlDiv.appendChild(label);
      
      const sliderContainer = document.createElement('div');
      sliderContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
      `;
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = effect.min;
      slider.max = effect.max;
      slider.step = effect.step;
      slider.value = this.effects[effect.key];
      slider.style.cssText = `
        flex: 1;
      `;
      
      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = parseFloat(slider.value).toFixed(1);
      valueDisplay.style.cssText = `
        min-width: 40px;
        text-align: right;
        font-size: 12px;
      `;
      
      slider.addEventListener('input', (e) => {
        this.effects[effect.key] = parseFloat(e.target.value);
        valueDisplay.textContent = parseFloat(e.target.value).toFixed(1);
        this.applyEffects();
      });
      
      sliderContainer.appendChild(slider);
      sliderContainer.appendChild(valueDisplay);
      
      controlDiv.appendChild(sliderContainer);
      this.container.appendChild(controlDiv);
    });
    
    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'RESET EFFECTS';
    resetBtn.style.cssText = `
      width: 100%;
      padding: 10px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 5px;
      cursor: pointer;
      margin-top: 10px;
      font-size: 12px;
    `;
    resetBtn.onclick = () => {
      effects.forEach(effect => {
        this.effects[effect.key] = effect.default;
        const slider = this.container.querySelector(`input[type="range"]`);
        if (slider) slider.value = effect.default;
      });
      this.applyEffects();
      // Refresh UI (simplified - in real implementation, update all sliders)
      this.createUI();
    };
    this.container.appendChild(resetBtn);
    
    document.body.appendChild(this.container);
  }
  
  /**
   * Apply post-processing effects to the renderer
   * Note: This is a simplified version - full implementation would use THREE.js post-processing
   */
  applyEffects() {
    // In a full implementation, you'd use THREE.EffectComposer with passes
    // For now, we'll apply effects when capturing screenshots
    // The renderer's tone mapping can be adjusted for some effects
    
    // You can adjust renderer settings here if needed
    // this.renderer.toneMappingExposure = this.effects.brightness;
  }
  
  /**
   * Capture a screenshot with current effects
   */
  captureScreenshot() {
    const width = this.renderer.domElement.width;
    const height = this.renderer.domElement.height;
    
    // Render the scene once to ensure it's up to date
    this.renderer.render(this.scene, this.camera);
    
    // Create canvas for screenshot
    this.screenshotCanvas.width = width;
    this.screenshotCanvas.height = height;
    const ctx = this.screenshotCanvas.getContext('2d');
    
    // Draw the rendered scene
    ctx.drawImage(this.renderer.domElement, 0, 0, width, height);
    
    // Apply post-processing effects
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Brightness
      r *= this.effects.brightness;
      g *= this.effects.brightness;
      b *= this.effects.brightness;
      
      // Contrast
      const factor = (259 * (this.effects.contrast * 255 + 255)) / (255 * (259 - this.effects.contrast * 255));
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;
      
      // Saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * this.effects.saturation;
      g = gray + (g - gray) * this.effects.saturation;
      b = gray + (b - gray) * this.effects.saturation;
      
      // Sepia
      if (this.effects.sepia > 0) {
        const tr = 0.393 * r + 0.769 * g + 0.189 * b;
        const tg = 0.349 * r + 0.686 * g + 0.168 * b;
        const tb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = r * (1 - this.effects.sepia) + tr * this.effects.sepia;
        g = g * (1 - this.effects.sepia) + tg * this.effects.sepia;
        b = b * (1 - this.effects.sepia) + tb * this.effects.sepia;
      }
      
      // Clamp values
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Apply vignette (simplified - draw gradient overlay)
    if (this.effects.vignette > 0) {
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${this.effects.vignette})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Convert to blob and download
    this.screenshotCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `breakout-screenshot-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      // Show success message
      this.showMessage('📸 Screenshot saved!');
    }, 'image/png');
  }
  
  /**
   * Show a temporary message
   */
  showMessage(text) {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px 40px;
      border-radius: 10px;
      z-index: 4000;
      font-size: 18px;
      pointer-events: none;
    `;
    document.body.appendChild(msg);
    
    setTimeout(() => {
      if (msg.parentNode) {
        msg.parentNode.removeChild(msg);
      }
    }, 2000);
  }
  
  /**
   * Update loop for photo controls
   */
  startUpdateLoop() {
    this.updateLoop = () => {
      if (this.isActive && this.photoControls) {
        this.photoControls.update();
        requestAnimationFrame(this.updateLoop);
      }
    };
    this.updateLoop();
  }
  
  stopUpdateLoop() {
    // The loop will stop itself when isActive is false
  }
}

