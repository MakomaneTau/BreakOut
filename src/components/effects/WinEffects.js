import * as THREE from '../../../public/libs/three137/three.module.js';

/**
 * WinEffects - Visual effects component for winning animations
 * Handles confetti particles and visual celebrations
 */
export class WinEffects {
  constructor(options = {}) {
    this.scene = options.scene;
    this.particles = null;
    this.isActive = false;
    this.duration = options.duration || 5.0; // 5 seconds default
    this.particleCount = options.particleCount || 50;
    this.colors = options.colors || [
      0xff6b6b, // Red
      0x4ecdc4, // Teal
      0x45b7d1, // Blue
      0x96ceb4, // Green
      0xffeaa7, // Yellow
      0xdda0dd, // Plum
      0xffb347, // Peach
      0x98d8c8  // Mint
    ];
  }

  /**
   * Trigger the winning effects at a specific position
   * @param {THREE.Vector3} position - Where to spawn the effects
   */
  trigger(position) {
    if (this.isActive) return;
    
    this.isActive = true;
    this.createParticles(position);
    
    // Auto-cleanup after duration
    setTimeout(() => {
      this.cleanup();
    }, this.duration * 1000);
  }

  /**
   * Create confetti particles
   * @param {THREE.Vector3} position - Spawn position
   */
  createParticles(position) {
    this.particles = new THREE.Group();
    
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.createParticle();
      
      // Random position around spawn point
      particle.position.set(
        (Math.random() - 0.5) * 10,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 10
      );
      
      // Random velocity
      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          Math.random() * 8 + 3,
          (Math.random() - 0.5) * 15
        ),
        gravity: -20,
        life: this.duration,
        maxLife: this.duration,
        rotationSpeed: (Math.random() - 0.5) * 10
      };
      
      this.particles.add(particle);
    }
    
    // Position particle system at spawn location
    this.particles.position.copy(position);
    this.scene.add(this.particles);
  }

  /**
   * Create a single particle
   * @returns {THREE.Mesh} The particle mesh
   */
  createParticle() {
    // Random shape - sphere, box, or cone
    const shapes = ['sphere', 'box', 'cone'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    
    let geometry;
    switch (shape) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.15, 8, 8);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.1, 0.3, 6);
        break;
    }
    
    // Random color
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    });
    
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Update particle effects
   * @param {number} delta - Time delta
   */
  update(delta) {
    if (!this.isActive || !this.particles) return;
    
    this.particles.traverse((child) => {
      if (child.userData && child.userData.velocity) {
        const data = child.userData;
        
        // Apply gravity and update position
        data.velocity.y += data.gravity * delta;
        child.position.addScaledVector(data.velocity, delta);
        
        // Add rotation
        child.rotation.x += data.rotationSpeed * delta;
        child.rotation.y += data.rotationSpeed * delta * 0.7;
        child.rotation.z += data.rotationSpeed * delta * 0.5;
        
        // Update life and fade
        data.life -= delta;
        const lifeRatio = Math.max(0, data.life / data.maxLife);
        
        // Fade out particles
        child.material.opacity = lifeRatio * 0.8;
        
        // Shrink particles slightly
        const scale = 0.5 + (lifeRatio * 0.5);
        child.scale.setScalar(scale);
      }
    });
  }

  /**
   * Clean up effects
   */
  cleanup() {
    if (this.particles && this.scene) {
      this.scene.remove(this.particles);
      this.particles.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      this.particles = null;
    }
    this.isActive = false;
  }

  /**
   * Check if effects are currently active
   * @returns {boolean}
   */
  isRunning() {
    return this.isActive;
  }
}
