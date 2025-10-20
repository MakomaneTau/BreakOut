/**
 * GameUI - Comprehensive in-game UI overlay with controls and information
 * Provides quick access to settings, pause, and other game functions
 */
export class GameUI {
  constructor(options = {}) {
    this.container = null;
    this.isVisible = true;
    
    // Callbacks
    this.onPause = options.onPause || (() => {});
    this.onSettings = options.onSettings || (() => {});
    this.onRestart = options.onRestart || (() => {});
    this.onMainMenu = options.onMainMenu || (() => {});
    this.onToggleFullscreen = options.onToggleFullscreen || (() => {});
    this.onToggleMute = options.onToggleMute || (() => {});
    
    // State
    this.isMuted = false;
    this.isFullscreen = false;
    
    this.createUI();
    this.setupKeyboardShortcuts();
  }

  /**
   * Create the game UI elements
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'game-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 500;
      font-family: 'Arial', sans-serif;
    `;

    // Create bottom control panel
    this.createBottomPanel();
    
    // Create top-right control panel
    this.createTopRightPanel();
    
    // Create controls help panel (bottom-left)
    this.createControlsHelp();
    
    // Create minimap placeholder (top-left, below health)
    this.createMinimap();
    
    // Add to document
    document.body.appendChild(this.container);
  }

  /**
   * Create bottom control panel
   */
  createBottomPanel() {
    const bottomPanel = document.createElement('div');
    bottomPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 15px;
      pointer-events: auto;
      z-index: 600;
    `;

    // Pause button
    const pauseBtn = this.createControlButton('⏸️', 'PAUSE', '#ff6b6b', () => {
      this.onPause();
    });
    pauseBtn.title = 'Pause Game (ESC)';

    // Settings button
    const settingsBtn = this.createControlButton('⚙️', 'SETTINGS', '#4ecdc4', () => {
      this.onSettings();
    });
    settingsBtn.title = 'Game Settings';

    // Restart button
    const restartBtn = this.createControlButton('🔄', 'RESTART', '#ffe66d', () => {
      this.onRestart();
    });
    restartBtn.title = 'Restart Level';

    // Main Menu button
    const menuBtn = this.createControlButton('🏠', 'MENU', '#a8e6cf', () => {
      this.onMainMenu();
    });
    menuBtn.title = 'Return to Main Menu';

    bottomPanel.appendChild(pauseBtn);
    bottomPanel.appendChild(settingsBtn);
    bottomPanel.appendChild(restartBtn);
    bottomPanel.appendChild(menuBtn);

    this.container.appendChild(bottomPanel);
  }

  /**
   * Create top-right control panel
   */
  createTopRightPanel() {
    const topRightPanel = document.createElement('div');
    topRightPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: auto;
      z-index: 600;
    `;

    // Fullscreen toggle button
    const fullscreenBtn = this.createIconButton('⛶', () => {
      this.toggleFullscreen();
    });
    fullscreenBtn.title = 'Toggle Fullscreen (F11)';

    // Mute toggle button
    const muteBtn = this.createIconButton('🔊', () => {
      this.toggleMute();
    });
    muteBtn.title = 'Toggle Sound';
    this.muteButton = muteBtn; // Store reference for updates

    // FPS counter (optional)
    const fpsBtn = this.createIconButton('📊', () => {
      this.toggleFPSDisplay();
    });
    fpsBtn.title = 'Toggle FPS Display';

    topRightPanel.appendChild(fullscreenBtn);
    topRightPanel.appendChild(muteBtn);
    topRightPanel.appendChild(fpsBtn);

    this.container.appendChild(topRightPanel);
  }

  /**
   * Create controls help panel
   */
  createControlsHelp() {
    const helpPanel = document.createElement('div');
    helpPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      padding: 15px;
      color: #ffffff;
      font-size: 12px;
      line-height: 1.4;
      pointer-events: auto;
      z-index: 600;
      max-width: 200px;
      backdrop-filter: blur(5px);
    `;

    helpPanel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #4ecdc4;">CONTROLS</div>
      <div><strong>WASD</strong> - Move</div>
      <div><strong>Q/E</strong> - Rotate</div>
      <div><strong>SPACE</strong> - Jump</div>
      <div><strong>SHIFT</strong> - Roll</div>
      <div><strong>ESC</strong> - Pause</div>
      <div><strong>F</strong> - Reframe</div>
    `;

    // Add toggle functionality
    helpPanel.addEventListener('click', () => {
      this.toggleHelpPanel();
    });
    helpPanel.title = 'Click to toggle controls help';

    this.helpPanel = helpPanel;
    this.container.appendChild(helpPanel);
  }

  /**
   * Create minimap placeholder
   */
  createMinimap() {
    const minimap = document.createElement('div');
    minimap.style.cssText = `
      position: fixed;
      top: 180px;
      left: 20px;
      width: 150px;
      height: 150px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      pointer-events: auto;
      z-index: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 12px;
      backdrop-filter: blur(5px);
    `;

    minimap.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 5px;">🗺️</div>
        <div style="font-weight: bold;">MINIMAP</div>
        <div style="font-size: 10px; opacity: 0.7;">Coming Soon</div>
      </div>
    `;

    minimap.title = 'Minimap - Track your progress';
    this.minimap = minimap;
    this.container.appendChild(minimap);
  }

  /**
   * Create a control button with icon and text
   */
  createControlButton(icon, text, color, onClick) {
    const button = document.createElement('button');
    button.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid ${color}40;
      border-radius: 12px;
      padding: 12px 16px;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      min-width: 80px;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 0.5px;
    `;

    button.innerHTML = `
      <div style="font-size: 20px;">${icon}</div>
      <div>${text}</div>
    `;

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = `${color}20`;
      button.style.borderColor = `${color}80`;
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = `0 8px 20px ${color}40`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(0, 0, 0, 0.8)';
      button.style.borderColor = `${color}40`;
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });

    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * Create an icon-only button
   */
  createIconButton(icon, onClick) {
    const button = document.createElement('button');
    button.style.cssText = `
      width: 40px;
      height: 40px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    button.innerHTML = icon;

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 255, 255, 0.2)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.6)';
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(0, 0, 0, 0.8)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when game UI is visible
      if (!this.isVisible) return;

      switch (e.code) {
        case 'F11':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'KeyM':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggleMute();
          }
          break;
        case 'KeyH':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggleHelpPanel();
          }
          break;
      }
    });
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    this.onToggleFullscreen(this.isFullscreen);
    
    // Update button icon
    const fullscreenBtn = this.container.querySelector('[title*="Fullscreen"]');
    if (fullscreenBtn) {
      fullscreenBtn.innerHTML = this.isFullscreen ? '⛶' : '⛶';
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.onToggleMute(this.isMuted);
    
    // Update button icon
    if (this.muteButton) {
      this.muteButton.innerHTML = this.isMuted ? '🔇' : '🔊';
      this.muteButton.style.color = this.isMuted ? '#ff6b6b' : '#ffffff';
    }
  }

  /**
   * Toggle help panel visibility
   */
  toggleHelpPanel() {
    if (this.helpPanel) {
      const isVisible = this.helpPanel.style.display !== 'none';
      this.helpPanel.style.display = isVisible ? 'none' : 'block';
    }
  }

  /**
   * Toggle FPS display (placeholder for future implementation)
   */
  toggleFPSDisplay() {
    console.log('FPS display toggle - feature coming soon');
  }

  /**
   * Show the game UI
   */
  show() {
    this.isVisible = true;
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  /**
   * Hide the game UI
   */
  hide() {
    this.isVisible = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Update UI elements (called from game loop)
   */
  update(delta) {
    // Update any animated elements here
    // For example, minimap updates, FPS counter, etc.
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.isVisible = false;
  }
}
