/**
 * CameraUI - Manages camera mode switching UI
 */
export class CameraUI {
  constructor(options = {}) {
    this.container = null;
    this.cameraButton = null;
    this.isFirstPerson = false;
    this.onCameraToggle = options.onCameraToggle || (() => {});
    
    this.createUI();
  }
  
  /**
   * Create the camera UI elements
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'camera-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      font-family: Arial, sans-serif;
      user-select: none;
    `;
    
    // Create camera control container
    const cameraContainer = document.createElement('div');
    cameraContainer.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      padding: 10px 15px;
      min-width: 200px;
    `;
    
    // Camera label
    const cameraLabel = document.createElement('div');
    cameraLabel.textContent = 'CAMERA';
    cameraLabel.style.cssText = `
      color: #ffffff;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
      letter-spacing: 1px;
    `;
    cameraContainer.appendChild(cameraLabel);
    
    // Camera mode button
    this.cameraButton = document.createElement('button');
    this.cameraButton.textContent = 'THIRD-PERSON';
    this.cameraButton.style.cssText = `
      width: 100%;
      padding: 12px 20px;
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    `;
    
    // Button hover effects
    this.cameraButton.onmouseover = () => {
      this.cameraButton.style.background = 'linear-gradient(135deg, #66BB6A, #4CAF50)';
      this.cameraButton.style.transform = 'translateY(-2px)';
      this.cameraButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
    };
    
    this.cameraButton.onmouseout = () => {
      this.cameraButton.style.background = this.isFirstPerson 
        ? 'linear-gradient(135deg, #2196F3, #1976D2)'
        : 'linear-gradient(135deg, #4CAF50, #45a049)';
      this.cameraButton.style.transform = 'translateY(0)';
      this.cameraButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    };
    
    // Button click handler
    this.cameraButton.onclick = (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      this.toggleCamera();
    };
    
    cameraContainer.appendChild(this.cameraButton);
    this.container.appendChild(cameraContainer);
    
    // Add to document
    document.body.appendChild(this.container);
  }
  
  /**
   * Toggle camera mode
   */
  toggleCamera() {
    this.isFirstPerson = !this.isFirstPerson;
    this.updateButton();
    this.onCameraToggle(this.isFirstPerson);
  }
  
  /**
   * Update button appearance based on current mode
   */
  updateButton() {
    if (this.isFirstPerson) {
      this.cameraButton.textContent = 'FIRST-PERSON';
      this.cameraButton.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
    } else {
      this.cameraButton.textContent = 'THIRD-PERSON';
      this.cameraButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    }
  }
  
  /**
   * Set camera mode programmatically
   * @param {boolean} isFirstPerson - Whether to set first-person mode
   */
  setCameraMode(isFirstPerson) {
    this.isFirstPerson = isFirstPerson;
    this.updateButton();
  }
  
  /**
   * Get current camera mode
   * @returns {boolean} - True if first-person, false if third-person
   */
  getCameraMode() {
    return this.isFirstPerson;
  }
  
  /**
   * Remove the UI
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
