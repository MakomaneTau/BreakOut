import * as THREE from '../../../public/libs/three137/three.module.js';

/**
 * PhotoMode - Simple screenshot functionality
 */
export class PhotoMode {
  constructor(options = {}) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
  }
  
  /**
   * Take a screenshot of the entire screen
   */
  takeScreenshot() {
    // Render the scene once to ensure it's up to date
    this.renderer.render(this.scene, this.camera);
    
    // Capture screenshot using toDataURL (more reliable across browsers)
    const canvas = this.renderer.domElement;
    try {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `breakout-screenshot-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
      
      // Show success message
      this.showMessage('📸 Screenshot saved!');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      this.showMessage('❌ Screenshot failed');
    }
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
}
