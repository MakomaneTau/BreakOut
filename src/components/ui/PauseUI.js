/**
 * PauseUI - Pause menu overlay
 */
export class PauseUI {
  constructor(options = {}) {
    this.container = null;
    this.isVisible = false;
    this.animationId = null;
    this.time = 0;
    // UI audio
    this._audioCtx = null;
    this._uiGain = null;
    
    this.onResume = options.onResume || (() => {});
    this.onShowSettings = options.onShowSettings || (() => {});
    this.onMainMenu = options.onMainMenu || (() => {});
    this.onRestart = options.onRestart || (() => {});
    
    this.createUI();
  }
  
  /**
   * Create the pause UI
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'pause-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: none;
      justify-content: center;
      align-items: center;
      font-family: 'Arial', sans-serif;
      backdrop-filter: blur(5px);
    `;
    
    // Pause content
    const pauseContent = document.createElement('div');
    pauseContent.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      animation: pauseSlideIn 0.3s ease-out;
    `;
    
    // Pause title
    const title = document.createElement('h2');
    title.textContent = 'PAUSED';
    title.style.cssText = `
      font-size: 48px;
      color: #ffffff;
      margin: 0 0 30px 0;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
      letter-spacing: 4px;
    `;
    pauseContent.appendChild(title);
    
    // Menu buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
      min-width: 200px;
    `;
    
    // Resume button
    const resumeButton = this.createPauseButton('RESUME', () => {
      this.hide();
      this.onResume();
    });
    buttonContainer.appendChild(resumeButton);
    
    // Settings button
    const settingsButton = this.createPauseButton('SETTINGS', () => {
      this.onShowSettings();
    });
    buttonContainer.appendChild(settingsButton);
    
    // Restart button
    const restartButton = this.createPauseButton('RESTART', () => {
      this.hide();
      this.onRestart();
    });
    buttonContainer.appendChild(restartButton);
    
    // Main Menu button
    const mainMenuButton = this.createPauseButton('MAIN MENU', () => {
      this.hide();
      this.onMainMenu();
    });
    buttonContainer.appendChild(mainMenuButton);
    
    pauseContent.appendChild(buttonContainer);
    this.container.appendChild(pauseContent);
    
    // Add to document
    document.body.appendChild(this.container);
    
    // Keyboard listener for ESC key
    this.setupKeyboardListener();

    // Unlock web audio on first gesture over the overlay
    const unlockAudioCtx = async () => {
      try {
        const ctx = this._ensureAudioCtx();
        if (ctx && ctx.state === 'suspended') await ctx.resume();
      } catch {}
    };
    this.container.addEventListener('pointerdown', unlockAudioCtx, { once: false });
  }
  
  /**
   * Create a pause menu button
   */
  createPauseButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      padding: 12px 25px;
      background: linear-gradient(135deg, #2196F3, #1976D2);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    `;
    
    // Button hover effects
    button.onmouseover = () => {
      button.style.background = 'linear-gradient(135deg, #42A5F5, #2196F3)';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
    };
    
    button.onmouseout = () => {
      button.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    };
    
    button.onclick = (e) => {
      // play UI click for every pause menu button
      this._playClick();
      onClick?.(e);
    };
    
    return button;
  }

  // --- simple UI click using Web Audio ---
  _ensureAudioCtx() {
    if (!this._audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this._audioCtx = new AC();
        this._uiGain = this._audioCtx.createGain();
        const master = this._loadSetting('masterVolume', 80) / 100;
        const sfx = this._loadSetting('sfxVolume', 90) / 100;
        this._uiGain.gain.value = Math.max(0, Math.min(1, master * sfx));
        this._uiGain.connect(this._audioCtx.destination);
      }
    }
    return this._audioCtx;
  }

  _playClick() {
    try {
      const ctx = this._ensureAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const master = this._loadSetting('masterVolume', 80) / 100;
      const sfx = this._loadSetting('sfxVolume', 90) / 100;
      if (this._uiGain) this._uiGain.gain.value = Math.max(0, Math.min(1, master * sfx));

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.03);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.02, master * sfx), now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(this._uiGain);
      osc.start(now);
      osc.stop(now + 0.1);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch {} };
    } catch {}
  }

  _loadSetting(key, defVal) {
    try {
      const saved = localStorage.getItem(`breakout_${key}`);
      return saved ? JSON.parse(saved) : defVal;
    } catch { return defVal; }
  }
  
  /**
   * Setup keyboard listener
   */
  setupKeyboardListener() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.isVisible) {
          this.hide();
          this.onResume();
        }
      }
    });
  }
  
  /**
   * Show the pause menu
   */
  show() {
    this.container.style.display = 'flex';
    this.isVisible = true;
    
    // Add entrance animation
    const content = this.container.querySelector('div');
    content.style.animation = 'pauseSlideIn 0.3s ease-out';
  }
  
  /**
   * Hide the pause menu
   */
  hide() {
    this.container.style.display = 'none';
    this.isVisible = false;
  }
  
  /**
   * Toggle pause menu
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
      this.onResume();
    } else {
      this.show();
    }
  }
  
  /**
   * Check if pause menu is visible
   */
  isPaused() {
    return this.isVisible;
  }
  
  /**
   * Remove the pause UI
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pauseSlideIn {
    0% {
      opacity: 0;
      transform: scale(0.8) translateY(-20px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;
document.head.appendChild(style);
