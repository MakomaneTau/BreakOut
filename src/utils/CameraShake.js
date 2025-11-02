import * as THREE from '../../public/libs/three137/three.module.js';

/**
 * CameraShake - Adds screen shake effects to camera for impact feedback
 */
export class CameraShake {
  constructor(camera) {
    this.camera = camera;
    this.originalPosition = new THREE.Vector3();
    this.shakeIntensity = 0;
    this.shakeDecay = 5.0; // How quickly shake diminishes
    this.isShaking = false;
    
    // Store original position
    this.originalPosition.copy(camera.position);
  }

  /**
   * Trigger a camera shake
   * @param {number} intensity - Shake intensity (0-1), defaults to 0.3
   * @param {number} duration - Duration in seconds, defaults to 0.3
   */
  shake(intensity = 0.3, duration = 0.3) {
    this.shakeIntensity = Math.min(1.0, intensity);
    this.isShaking = true;
    
    // Clear shake after duration
    setTimeout(() => {
      this.isShaking = false;
    }, duration * 1000);
  }

  /**
   * Update camera shake (call in game loop)
   * @param {number} delta - Time delta in seconds
   */
  update(delta) {
    if (!this.isShaking && this.shakeIntensity <= 0) {
      return;
    }

    if (this.shakeIntensity > 0) {
      // Generate random shake offset
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 0.5;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 0.5;
      const offsetZ = (Math.random() - 0.5) * this.shakeIntensity * 0.3;

      // Apply shake to camera position relative to original
      if (this.camera.position) {
        this.camera.position.x = this.originalPosition.x + offsetX;
        this.camera.position.y = this.originalPosition.y + offsetY;
        this.camera.position.z = this.originalPosition.z + offsetZ;
      }

      // Decay shake intensity
      this.shakeIntensity -= this.shakeDecay * delta;
      if (this.shakeIntensity < 0) {
        this.shakeIntensity = 0;
        // Restore original position
        if (this.camera.position) {
          this.camera.position.copy(this.originalPosition);
        }
      }
    }
  }

  /**
   * Update the original position (call when camera position changes)
   */
  updateOriginalPosition() {
    if (this.camera.position) {
      this.originalPosition.copy(this.camera.position);
    }
  }

  /**
   * Reset camera to original position immediately
   */
  reset() {
    this.shakeIntensity = 0;
    this.isShaking = false;
    if (this.camera.position) {
      this.camera.position.copy(this.originalPosition);
    }
  }
}

