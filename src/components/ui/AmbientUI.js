/**
 * AmbientUI - Manages atmospheric UI elements for visual polish
 */
export class AmbientUI {
  constructor(options = {}) {
    this.container = null;
    this.particleCanvas = null;
    this.particleCtx = null;
    this.particles = [];
    this.animationId = null;
    this.time = 0;
    
    // Configuration
    this.config = {
      enableBorders: options.enableBorders !== false,
      enableCornerDecorations: options.enableCornerDecorations !== false,
      enableParticles: options.enableParticles !== false,
      enableAnimatedBackground: options.enableAnimatedBackground !== false,
      particleCount: options.particleCount || 50,
      particleSpeed: options.particleSpeed || 0.5,
      borderOpacity: options.borderOpacity || 0.1,
      decorationOpacity: options.decorationOpacity || 0.3
    };
    
    this.createUI();
    if (this.config.enableParticles) {
      this.initParticles();
    }
  }
  
  /**
   * Create the ambient UI elements
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'ambient-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    `;
    
    // Screen borders
    if (this.config.enableBorders) {
      this.createScreenBorders();
    }
    
    // Corner decorations
    if (this.config.enableCornerDecorations) {
      this.createCornerDecorations();
    }
    
    // Animated background
    if (this.config.enableAnimatedBackground) {
      this.createAnimatedBackground();
    }
    
    // Particle system
    if (this.config.enableParticles) {
      this.createParticleSystem();
    }
    
    // Add to document
    document.body.appendChild(this.container);
  }
  
  /**
   * Create subtle screen borders
   */
  createScreenBorders() {
    const borderContainer = document.createElement('div');
    borderContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
    
    // Top border
    const topBorder = document.createElement('div');
    topBorder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, ${this.config.borderOpacity}), transparent);
      animation: borderPulse 3s ease-in-out infinite;
    `;
    
    // Bottom border
    const bottomBorder = document.createElement('div');
    bottomBorder.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, ${this.config.borderOpacity}), transparent);
      animation: borderPulse 3s ease-in-out infinite 1.5s;
    `;
    
    // Left border
    const leftBorder = document.createElement('div');
    leftBorder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 2px;
      height: 100%;
      background: linear-gradient(180deg, transparent, rgba(255, 255, 255, ${this.config.borderOpacity}), transparent);
      animation: borderPulse 3s ease-in-out infinite 0.75s;
    `;
    
    // Right border
    const rightBorder = document.createElement('div');
    rightBorder.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 2px;
      height: 100%;
      background: linear-gradient(180deg, transparent, rgba(255, 255, 255, ${this.config.borderOpacity}), transparent);
      animation: borderPulse 3s ease-in-out infinite 2.25s;
    `;
    
    borderContainer.appendChild(topBorder);
    borderContainer.appendChild(bottomBorder);
    borderContainer.appendChild(leftBorder);
    borderContainer.appendChild(rightBorder);
    this.container.appendChild(borderContainer);
  }
  
  /**
   * Create corner decorations
   */
  createCornerDecorations() {
    const decorationContainer = document.createElement('div');
    decorationContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
    
    // Top-left corner
    const topLeft = this.createCornerDecoration('top-left');
    decorationContainer.appendChild(topLeft);
    
    // Top-right corner
    const topRight = this.createCornerDecoration('top-right');
    decorationContainer.appendChild(topRight);
    
    // Bottom-left corner
    const bottomLeft = this.createCornerDecoration('bottom-left');
    decorationContainer.appendChild(bottomLeft);
    
    // Bottom-right corner
    const bottomRight = this.createCornerDecoration('bottom-right');
    decorationContainer.appendChild(bottomRight);
    
    this.container.appendChild(decorationContainer);
  }
  
  /**
   * Create individual corner decoration
   */
  createCornerDecoration(position) {
    const corner = document.createElement('div');
    corner.style.cssText = `
      position: absolute;
      width: 60px;
      height: 60px;
      opacity: ${this.config.decorationOpacity};
      animation: cornerGlow 4s ease-in-out infinite;
    `;
    
    switch (position) {
      case 'top-left':
        corner.style.top = '20px';
        corner.style.left = '20px';
        corner.style.borderTop = '3px solid rgba(255, 255, 255, 0.6)';
        corner.style.borderLeft = '3px solid rgba(255, 255, 255, 0.6)';
        corner.style.borderTopLeftRadius = '10px';
        break;
      case 'top-right':
        corner.style.top = '20px';
        corner.style.right = '20px';
        corner.style.borderTop = '3px solid rgba(255, 255, 255, 0.6)';
        corner.style.borderRight = '3px solid rgba(255, 255, 255, 0.6)';
        corner.style.borderTopRightRadius = '10px';
        break;
      case 'bottom-left':
        corner.style.bottom = '20px';
        corner.style.left = '20px';
        corner.style.borderBottom = '3px solid rgba(255, 255, 255, 0.6)';
        corner.style.borderLeft = '3px solid rgba(255, 255, 255, 0.6)';
        corner.style.borderBottomLeftRadius = '10px';
        break;
      case 'bottom-right':
        corner.style.bottom = '20px';
        corner.style.right = '20px';
        corner.style.borderBottom = '3px solid rgba(255, 255, 255, 0.6)';
        corner.style.borderRight = '3px solid rgba(255, 255, 255, 0.6)';
        corner.style.borderBottomRightRadius = '10px';
        break;
    }
    
    return corner;
  }
  
  /**
   * Create animated background
   */
  createAnimatedBackground() {
    const backgroundContainer = document.createElement('div');
    backgroundContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    `;
    
    // Animated gradient background
    const animatedBg = document.createElement('div');
    animatedBg.style.cssText = `
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(
        circle at 30% 20%, 
        rgba(255, 255, 255, 0.02) 0%, 
        transparent 50%
      ),
      radial-gradient(
        circle at 70% 80%, 
        rgba(0, 255, 255, 0.02) 0%, 
        transparent 50%
      ),
      radial-gradient(
        circle at 50% 50%, 
        rgba(255, 0, 255, 0.01) 0%, 
        transparent 70%
      );
      animation: backgroundFloat 20s ease-in-out infinite;
    `;
    
    backgroundContainer.appendChild(animatedBg);
    this.container.appendChild(backgroundContainer);
  }
  
  /**
   * Create particle system
   */
  createParticleSystem() {
    this.particleCanvas = document.createElement('canvas');
    this.particleCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
    this.particleCtx = this.particleCanvas.getContext('2d');
    
    this.container.appendChild(this.particleCanvas);
    
    // Resize canvas to match screen
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  /**
   * Initialize particle system
   */
  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * this.config.particleSpeed,
        vy: (Math.random() - 0.5) * this.config.particleSpeed,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: this.getRandomParticleColor()
      });
    }
  }
  
  /**
   * Get random particle color
   */
  getRandomParticleColor() {
    const colors = [
      'rgba(255, 255, 255, ',
      'rgba(0, 255, 255, ',
      'rgba(255, 0, 255, ',
      'rgba(255, 255, 0, ',
      'rgba(0, 255, 0, '
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Resize particle canvas
   */
  resizeCanvas() {
    if (this.particleCanvas) {
      this.particleCanvas.width = window.innerWidth;
      this.particleCanvas.height = window.innerHeight;
    }
  }
  
  /**
   * Update particles
   */
  updateParticles() {
    if (!this.particleCtx) return;
    
    this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
    
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around screen
      if (particle.x < 0) particle.x = this.particleCanvas.width;
      if (particle.x > this.particleCanvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.particleCanvas.height;
      if (particle.y > this.particleCanvas.height) particle.y = 0;
      
      // Draw particle
      this.particleCtx.beginPath();
      this.particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.particleCtx.fillStyle = particle.color + particle.opacity + ')';
      this.particleCtx.fill();
    });
  }
  
  /**
   * Update ambient UI
   */
  update(delta) {
    this.time += delta;
    
    if (this.config.enableParticles) {
      this.updateParticles();
    }
  }
  
  /**
   * Toggle specific effects
   */
  toggleBorders(enable) {
    this.config.enableBorders = enable;
    // Recreate UI if needed
  }
  
  toggleParticles(enable) {
    this.config.enableParticles = enable;
    if (enable && this.particles.length === 0) {
      this.initParticles();
    }
  }
  
  /**
   * Remove the UI
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes borderPulse {
    0%, 100% { opacity: 0.1; }
    50% { opacity: 0.3; }
  }
  
  @keyframes cornerGlow {
    0%, 100% { 
      opacity: 0.3;
      transform: scale(1);
    }
    50% { 
      opacity: 0.6;
      transform: scale(1.05);
    }
  }
  
  @keyframes backgroundFloat {
    0%, 100% { 
      transform: translate(0, 0) rotate(0deg);
    }
    33% { 
      transform: translate(-20px, -10px) rotate(1deg);
    }
    66% { 
      transform: translate(10px, -20px) rotate(-1deg);
    }
  }
`;
document.head.appendChild(style);
