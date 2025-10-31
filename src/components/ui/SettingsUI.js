/**
 * SettingsUI - Advanced settings menu
 */
export class SettingsUI {
  constructor(options = {}) {
    this.container = null;
    this.settings = {};
    this.onClose = options.onClose || (() => {});
    this.onSettingChange = options.onSettingChange || (() => {});
    
    this.loadSettings();
    this.createUI();
  }
  
  /**
   * Load settings from localStorage
   */
  loadSettings() {
    this.settings = {
      // Graphics settings
      particles: this.getSetting('particles', true),
      ambientEffects: this.getSetting('ambientEffects', true),
      quality: this.getSetting('quality', 2),
      shadows: this.getSetting('shadows', true),
      antiAliasing: this.getSetting('antiAliasing', true),
      
      // Audio settings
      masterVolume: this.getSetting('masterVolume', 80),
      sfxVolume: this.getSetting('sfxVolume', 90),
      musicVolume: this.getSetting('musicVolume', 70),
      muteAudio: this.getSetting('muteAudio', false),
      
      // Controls settings
      mouseSensitivity: this.getSetting('mouseSensitivity', 1.0),
      invertY: this.getSetting('invertY', false),
      smoothCamera: this.getSetting('smoothCamera', true),
      
      // Game settings
      showFPS: this.getSetting('showFPS', false),
      showDebugInfo: this.getSetting('showDebugInfo', false),
      autoSave: this.getSetting('autoSave', true)
    };
  }
  
  /**
   * Get setting value
   */
  getSetting(key, defaultValue) {
    const saved = localStorage.getItem(`breakout_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  }
  
  /**
   * Save setting value
   */
  saveSetting(key, value) {
    this.settings[key] = value;
    localStorage.setItem(`breakout_${key}`, JSON.stringify(value));
    this.onSettingChange(key, value);
  }
  
  /**
   * Create the settings UI
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'settings-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10001;
      display: none;
      justify-content: center;
      align-items: center;
      font-family: 'Arial', sans-serif;
      overflow-y: auto;
    `;
    
    // Settings content
    const settingsContent = document.createElement('div');
    settingsContent.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 30px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'SETTINGS';
    title.style.cssText = `
      font-size: 32px;
      color: #ffffff;
      margin: 0;
      text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
      letter-spacing: 3px;
    `;
    header.appendChild(title);
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    closeButton.onmouseover = () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
    };
    closeButton.onmouseout = () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
    };
    closeButton.onclick = () => {
      this.hide();
      this.onClose();
    };
    header.appendChild(closeButton);
    
    settingsContent.appendChild(header);
    
    // Settings sections
    const sections = [
      {
        title: 'GRAPHICS',
        settings: [
          { name: 'Particle Effects', key: 'particles', type: 'toggle' },
          { name: 'Ambient Effects', key: 'ambientEffects', type: 'toggle' },
          { name: 'Shadows', key: 'shadows', type: 'toggle' },
          { name: 'Anti-Aliasing', key: 'antiAliasing', type: 'toggle' },
          { name: 'Quality Level', key: 'quality', type: 'slider', min: 1, max: 3, step: 1 }
        ]
      },
      {
        title: 'AUDIO',
        settings: [
          { name: 'Master Volume', key: 'masterVolume', type: 'slider', min: 0, max: 100 },
          { name: 'SFX Volume', key: 'sfxVolume', type: 'slider', min: 0, max: 100 },
          { name: 'Music Volume', key: 'musicVolume', type: 'slider', min: 0, max: 100 },
          { name: 'Mute Audio', key: 'muteAudio', type: 'toggle' }
        ]
      },
      {
        title: 'CONTROLS',
        settings: [
          { name: 'Mouse Sensitivity', key: 'mouseSensitivity', type: 'slider', min: 0.1, max: 2, step: 0.1 },
          { name: 'Invert Y-Axis', key: 'invertY', type: 'toggle' },
          { name: 'Smooth Camera', key: 'smoothCamera', type: 'toggle' }
        ]
      },
      {
        title: 'GAME',
        settings: [
          { name: 'Show FPS', key: 'showFPS', type: 'toggle' },
          { name: 'Show Debug Info', key: 'showDebugInfo', type: 'toggle' },
          { name: 'Auto Save', key: 'autoSave', type: 'toggle' }
        ]
      }
    ];
    
    sections.forEach(section => {
      const sectionElement = this.createSettingsSection(section.title, section.settings);
      settingsContent.appendChild(sectionElement);
    });
    
    // Action buttons
    const actionButtons = document.createElement('div');
    actionButtons.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    const resetButton = this.createActionButton('RESET TO DEFAULTS', () => {
      this.resetToDefaults();
    });
    actionButtons.appendChild(resetButton);
    
    const applyButton = this.createActionButton('APPLY', () => {
      this.hide();
    });
    actionButtons.appendChild(applyButton);
    
    settingsContent.appendChild(actionButtons);
    this.container.appendChild(settingsContent);
    
    // Add to document
    document.body.appendChild(this.container);
  }
  
  /**
   * Create a settings section
   */
  createSettingsSection(title, settings) {
    const section = document.createElement('div');
    section.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 20px;
    `;
    
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = title;
    sectionTitle.style.cssText = `
      color: #ffffff;
      margin: 0 0 20px 0;
      font-size: 18px;
      letter-spacing: 2px;
    `;
    section.appendChild(sectionTitle);
    
    settings.forEach(setting => {
      const settingRow = document.createElement('div');
      settingRow.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        color: #cccccc;
      `;
      
      const label = document.createElement('span');
      label.textContent = setting.name;
      label.style.fontSize = '14px';
      settingRow.appendChild(label);
      
      if (setting.type === 'toggle') {
        const toggle = this.createToggle(setting.key, this.settings[setting.key]);
        settingRow.appendChild(toggle);
      } else if (setting.type === 'slider') {
        const slider = this.createSlider(
          setting.key, 
          setting.min, 
          setting.max, 
          this.settings[setting.key], 
          setting.step
        );
        settingRow.appendChild(slider);
      }
      
      section.appendChild(settingRow);
    });
    
    return section;
  }
  
  /**
   * Create a toggle switch
   */
  createToggle(key, value) {
    const toggle = document.createElement('div');
    toggle.style.cssText = `
      position: relative;
      width: 50px;
      height: 25px;
      background: ${value ? '#4CAF50' : '#666'};
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    const slider = document.createElement('div');
    slider.style.cssText = `
      position: absolute;
      top: 2px;
      left: ${value ? '27px' : '2px'};
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
  createSlider(key, min, max, value, step = 1) {
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
    slider.value = value;
    slider.step = step;
    slider.style.cssText = `
      flex: 1;
      height: 5px;
      background: #333;
      outline: none;
      border-radius: 5px;
    `;
    
    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = value;
    valueDisplay.style.cssText = `
      color: #ffffff;
      font-size: 12px;
      min-width: 30px;
      text-align: right;
    `;
    
    slider.oninput = () => {
      valueDisplay.textContent = slider.value;
      this.saveSetting(key, parseFloat(slider.value));
    };
    
    container.appendChild(slider);
    container.appendChild(valueDisplay);
    
    return container;
  }
  
  /**
   * Create an action button
   */
  createActionButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      padding: 10px 20px;
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
    `;
    
    button.onmouseover = () => {
      button.style.background = 'linear-gradient(135deg, #66BB6A, #4CAF50)';
      button.style.transform = 'translateY(-2px)';
    };
    
    button.onmouseout = () => {
      button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
      button.style.transform = 'translateY(0)';
    };
    
    button.onclick = onClick;
    
    return button;
  }
  
  /**
   * Reset settings to defaults
   */
  resetToDefaults() {
    const defaults = {
      particles: true,
      ambientEffects: true,
      quality: 2,
      shadows: true,
      antiAliasing: true,
      masterVolume: 80,
      sfxVolume: 90,
      musicVolume: 70,
      muteAudio: false,
      mouseSensitivity: 1.0,
      invertY: false,
      smoothCamera: true,
      showFPS: false,
      showDebugInfo: false,
      autoSave: true
    };
    
    Object.keys(defaults).forEach(key => {
      this.saveSetting(key, defaults[key]);
    });
    
    // Reload the UI
    this.hide();
    setTimeout(() => {
      this.show();
    }, 100);
  }
  
  /**
   * Show the settings UI
   */
  show() {
    this.container.style.display = 'flex';
  }
  
  /**
   * Hide the settings UI
   */
  hide() {
    this.container.style.display = 'none';
  }
  
  /**
   * Get a setting value
   */
  getSettingValue(key) {
    return this.settings[key];
  }
  
  /**
   * Remove the settings UI
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
