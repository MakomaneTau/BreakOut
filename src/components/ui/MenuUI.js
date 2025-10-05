/**
 * MenuUI - Main menu system with animated backgrounds
 */
export class MenuUI {
  constructor(options = {}) {
    this.container = null;
    this.currentMenu = 'main';
    this.animationId = null;
    this.time = 0;
    this.particles = [];
    this.backgroundCanvas = null;
    this.backgroundCtx = null;
    
    // Configuration
    this.config = {
      enableAnimatedBackground: options.enableAnimatedBackground !== false,
      enableParticles: options.enableParticles !== false,
      particleCount: options.particleCount || 100,
      animationSpeed: options.animationSpeed || 1.0,
      theme: options.theme || 'futuristic' // 'futuristic', 'cyberpunk', 'minimal'
    };
    
    this.onStartGame = options.onStartGame || (() => {});
    this.onShowSettings = options.onShowSettings || (() => {});
    this.onQuit = options.onQuit || (() => {});
    
    this.createUI();
    this.startAnimations();
  }
  
  /**
   * Create the main menu UI
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'menu-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: 'Arial', sans-serif;
      overflow: hidden;
    `;
    
    // Animated background
    if (this.config.enableAnimatedBackground) {
      this.createAnimatedBackground();
    }
    
    // Particle system
    if (this.config.enableParticles) {
      this.createParticleSystem();
    }
    
    // Main menu content
    this.createMainMenu();
    
    // Add to document
    document.body.appendChild(this.container);
  }
  
  /**
   * Create animated background
   */
  createAnimatedBackground() {
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    this.backgroundCtx = this.backgroundCanvas.getContext('2d');
    this.container.appendChild(this.backgroundCanvas);
    
    this.resizeBackground();
    window.addEventListener('resize', () => this.resizeBackground());
  }
  
  /**
   * Create particle system
   */
  createParticleSystem() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        color: this.getRandomParticleColor()
      });
    }
  }
  
  /**
   * Create main menu content
   */
  createMainMenu() {
    const menuContent = document.createElement('div');
    menuContent.style.cssText = `
      position: relative;
      z-index: 10;
      text-align: center;
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    
    // Game title
    const title = document.createElement('h1');
    title.textContent = 'BREAKOUT';
    title.style.cssText = `
      font-size: 72px;
      color: #ffffff;
      margin: 0 0 20px 0;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
      letter-spacing: 8px;
      animation: titleGlow 3s ease-in-out infinite;
    `;
    menuContent.appendChild(title);
    
    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Escape the Prison';
    subtitle.style.cssText = `
      font-size: 18px;
      color: #cccccc;
      margin: 0 0 40px 0;
      letter-spacing: 2px;
      opacity: 0.8;
    `;
    menuContent.appendChild(subtitle);
    
    // Menu buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
      min-width: 250px;
    `;
    
    // Start Game button
    const startButton = this.createMenuButton('START GAME', () => {
      this.onStartGame();
      this.hide();
    });
    buttonContainer.appendChild(startButton);
    
    // Settings button
    const settingsButton = this.createMenuButton('SETTINGS', () => {
      this.showSettings();
    });
    buttonContainer.appendChild(settingsButton);
    
    // Quit button
    const quitButton = this.createMenuButton('QUIT', () => {
      this.onQuit();
    });
    buttonContainer.appendChild(quitButton);
    
    menuContent.appendChild(buttonContainer);
    this.container.appendChild(menuContent);
  }
  
  /**
   * Create a menu button
   */
  createMenuButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      padding: 15px 30px;
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 2px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    `;
    
    // Button hover effects
    button.onmouseover = () => {
      button.style.background = 'linear-gradient(135deg, #66BB6A, #4CAF50)';
      button.style.transform = 'translateY(-3px)';
      button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
    };
    
    button.onmouseout = () => {
      button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    };
    
    button.onclick = onClick;
    
    return button;
  }
  
  /**
   * Show settings menu
   */
  showSettings() {
    // Remove existing menu content
    const existingContent = this.container.querySelector('div:last-child');
    if (existingContent) {
      existingContent.remove();
    }
    
    const settingsContent = document.createElement('div');
    settingsContent.style.cssText = `
      position: relative;
      z-index: 10;
      text-align: center;
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      max-width: 500px;
    `;
    
    // Settings title
    const title = document.createElement('h2');
    title.textContent = 'SETTINGS';
    title.style.cssText = `
      font-size: 36px;
      color: #ffffff;
      margin: 0 0 30px 0;
      text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
      letter-spacing: 4px;
    `;
    settingsContent.appendChild(title);
    
    // Settings controls
    const settingsContainer = document.createElement('div');
    settingsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
      text-align: left;
    `;
    
    // Graphics settings
    const graphicsGroup = this.createSettingGroup('GRAPHICS', [
      { name: 'Particles', key: 'particles', type: 'toggle', default: true },
      { name: 'Ambient Effects', key: 'ambient', type: 'toggle', default: true },
      { name: 'Quality', key: 'quality', type: 'slider', min: 1, max: 3, default: 2 }
    ]);
    settingsContainer.appendChild(graphicsGroup);
    
    // Audio settings
    const audioGroup = this.createSettingGroup('AUDIO', [
      { name: 'Master Volume', key: 'masterVolume', type: 'slider', min: 0, max: 100, default: 80 },
      { name: 'SFX Volume', key: 'sfxVolume', type: 'slider', min: 0, max: 100, default: 90 },
      { name: 'Music Volume', key: 'musicVolume', type: 'slider', min: 0, max: 100, default: 70 }
    ]);
    settingsContainer.appendChild(audioGroup);
    
    // Controls settings
    const controlsGroup = this.createSettingGroup('CONTROLS', [
      { name: 'Mouse Sensitivity', key: 'mouseSensitivity', type: 'slider', min: 0.1, max: 2, default: 1, step: 0.1 },
      { name: 'Invert Y-Axis', key: 'invertY', type: 'toggle', default: false }
    ]);
    settingsContainer.appendChild(controlsGroup);
    
    settingsContent.appendChild(settingsContainer);
    
    // Back button
    const backButton = this.createMenuButton('BACK', () => {
      this.showMainMenu();
    });
    backButton.style.marginTop = '30px';
    settingsContent.appendChild(backButton);
    
    this.container.appendChild(settingsContent);
  }
  
  /**
   * Create a setting group
   */
  createSettingGroup(title, settings) {
    const group = document.createElement('div');
    group.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 20px;
    `;
    
    const groupTitle = document.createElement('h3');
    groupTitle.textContent = title;
    groupTitle.style.cssText = `
      color: #ffffff;
      margin: 0 0 15px 0;
      font-size: 18px;
      letter-spacing: 2px;
    `;
    group.appendChild(groupTitle);
    
    settings.forEach(setting => {
      const settingDiv = document.createElement('div');
      settingDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        color: #cccccc;
      `;
      
      const label = document.createElement('span');
      label.textContent = setting.name;
      label.style.fontSize = '14px';
      settingDiv.appendChild(label);
      
      if (setting.type === 'toggle') {
        const toggle = this.createToggle(setting.key, setting.default);
        settingDiv.appendChild(toggle);
      } else if (setting.type === 'slider') {
        const slider = this.createSlider(setting.key, setting.min, setting.max, setting.default, setting.step);
        settingDiv.appendChild(slider);
      }
      
      group.appendChild(settingDiv);
    });
    
    return group;
  }
  
  /**
   * Create a toggle switch
   */
  createToggle(key, defaultValue) {
    const toggle = document.createElement('div');
    toggle.style.cssText = `
      position: relative;
      width: 50px;
      height: 25px;
      background: ${defaultValue ? '#4CAF50' : '#666'};
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    const slider = document.createElement('div');
    slider.style.cssText = `
      position: absolute;
      top: 2px;
      left: ${defaultValue ? '27px' : '2px'};
      width: 21px;
      height: 21px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s ease;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    `;
    toggle.appendChild(slider);
    
    toggle.onclick = () => {
      const isOn = toggle.style.background === 'rgb(76, 175, 80)';
      toggle.style.background = isOn ? '#666' : '#4CAF50';
      slider.style.left = isOn ? '2px' : '27px';
      this.saveSetting(key, !isOn);
    };
    
    return toggle;
  }
  
  /**
   * Create a slider
   */
  createSlider(key, min, max, defaultValue, step = 1) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 150px;
    `;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = defaultValue;
    slider.step = step;
    slider.style.cssText = `
      flex: 1;
      height: 5px;
      background: #333;
      outline: none;
      border-radius: 5px;
    `;
    
    const value = document.createElement('span');
    value.textContent = defaultValue;
    value.style.cssText = `
      color: #ffffff;
      font-size: 12px;
      min-width: 30px;
      text-align: right;
    `;
    
    slider.oninput = () => {
      value.textContent = slider.value;
      this.saveSetting(key, parseFloat(slider.value));
    };
    
    container.appendChild(slider);
    container.appendChild(value);
    
    return container;
  }
  
  /**
   * Show main menu
   */
  showMainMenu() {
    // Remove existing menu content
    const existingContent = this.container.querySelector('div:last-child');
    if (existingContent) {
      existingContent.remove();
    }
    
    this.createMainMenu();
  }
  
  /**
   * Save setting to localStorage
   */
  saveSetting(key, value) {
    localStorage.setItem(`breakout_${key}`, JSON.stringify(value));
  }
  
  /**
   * Load setting from localStorage
   */
  loadSetting(key, defaultValue) {
    const saved = localStorage.getItem(`breakout_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
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
   * Resize background canvas
   */
  resizeBackground() {
    if (this.backgroundCanvas) {
      this.backgroundCanvas.width = window.innerWidth;
      this.backgroundCanvas.height = window.innerHeight;
    }
  }
  
  /**
   * Update animated background
   */
  updateBackground() {
    if (!this.backgroundCtx) return;
    
    this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
    
    // Draw animated gradient
    const gradient = this.backgroundCtx.createRadialGradient(
      window.innerWidth / 2 + Math.sin(this.time * 0.5) * 100,
      window.innerHeight / 2 + Math.cos(this.time * 0.3) * 100,
      0,
      window.innerWidth / 2,
      window.innerHeight / 2,
      Math.max(window.innerWidth, window.innerHeight)
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(255, 0, 255, 0.02)');
    
    this.backgroundCtx.fillStyle = gradient;
    this.backgroundCtx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
    
    // Draw particles
    this.particles.forEach(particle => {
      particle.x += particle.vx * this.config.animationSpeed;
      particle.y += particle.vy * this.config.animationSpeed;
      
      // Wrap around screen
      if (particle.x < 0) particle.x = this.backgroundCanvas.width;
      if (particle.x > this.backgroundCanvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.backgroundCanvas.height;
      if (particle.y > this.backgroundCanvas.height) particle.y = 0;
      
      this.backgroundCtx.beginPath();
      this.backgroundCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.backgroundCtx.fillStyle = particle.color + particle.opacity + ')';
      this.backgroundCtx.fill();
    });
  }
  
  /**
   * Start animations
   */
  startAnimations() {
    const animate = () => {
      this.time += 0.016;
      this.updateBackground();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }
  
  /**
   * Show the menu
   */
  show() {
    this.container.style.display = 'flex';
  }
  
  /**
   * Hide the menu
   */
  hide() {
    this.container.style.display = 'none';
  }
  
  /**
   * Remove the menu
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
  @keyframes titleGlow {
    0%, 100% { 
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
      transform: scale(1);
    }
    50% { 
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
      transform: scale(1.02);
    }
  }
  
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 15px;
    height: 15px;
    background: #4CAF50;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 15px;
    height: 15px;
    background: #4CAF50;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }
`;
document.head.appendChild(style);
