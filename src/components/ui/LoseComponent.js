/**
 * LoseComponent - Comprehensive game over UI component
 * Handles all loss conditions: time out, health depletion, lives exhausted
 */
export class LoseComponent {
  constructor(options = {}) {
    this.container = null;
    this.isVisible = false;
    this.animationDuration = options.animationDuration || 0.6;
    this.autoHideDelay = options.autoHideDelay || 0; // Disabled by default
    
    // Callbacks
    this.onClose = options.onClose || (() => {});
    this.onShow = options.onShow || (() => {});
    this.onRestart = options.onRestart || (() => {});
    this.onMainMenu = options.onMainMenu || (() => {});
    this.onQuit = options.onQuit || (() => {});
    
    // Loss type tracking
    this.lossType = null; // 'time', 'health', 'lives'
    this.lossStats = null;
    
    this.createUI();
  }

  /**
   * Create the lose component UI
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: all ${this.animationDuration}s ease-in-out;
      font-family: 'Arial', sans-serif;
    `;

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.style.cssText = `
      background: linear-gradient(135deg, #2c1810 0%, #8b0000 50%, #1a0000 100%);
      border-radius: 20px;
      padding: 50px;
      text-align: center;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
      transform: scale(0.7) rotateY(10deg);
      transition: transform ${this.animationDuration}s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 4px solid #ff4444;
      max-width: 600px;
      width: 90%;
      position: relative;
      overflow: hidden;
    `;

    // Add animated background effect
    const bgEffect = document.createElement('div');
    bgEffect.style.cssText = `
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 68, 68, 0.1) 0%, transparent 70%);
      animation: pulse 3s infinite;
      pointer-events: none;
    `;

    // Game Over title
    const title = document.createElement('h1');
    title.id = 'lose-title';
    title.textContent = 'GAME OVER';
    title.style.cssText = `
      color: #ff4444;
      font-size: 3.5em;
      margin: 0 0 20px 0;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 68, 68, 0.6);
      font-weight: bold;
      letter-spacing: 4px;
      animation: shake 0.5s ease-in-out infinite alternate;
      position: relative;
      z-index: 2;
    `;

    // Loss reason subtitle
    const subtitle = document.createElement('h2');
    subtitle.id = 'lose-subtitle';
    subtitle.style.cssText = `
      color: #ffaa88;
      font-size: 1.5em;
      margin: 0 0 30px 0;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
      font-weight: normal;
      letter-spacing: 1px;
      position: relative;
      z-index: 2;
    `;

    // Stats container
    const statsContainer = document.createElement('div');
    statsContainer.id = 'lose-stats';
    statsContainer.style.cssText = `
      display: flex;
      justify-content: space-around;
      margin: 40px 0;
      flex-wrap: wrap;
      gap: 25px;
      position: relative;
      z-index: 2;
    `;

    // Action buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 40px;
      position: relative;
      z-index: 2;
    `;

    // Restart button
    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'RESTART';
    restartBtn.style.cssText = `
      background: linear-gradient(45deg, #4CAF50, #45a049);
      color: white;
      border: none;
      padding: 18px 35px;
      font-size: 1.2em;
      border-radius: 30px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
      text-transform: uppercase;
      letter-spacing: 1px;
    `;

    // Main Menu button
    const mainMenuBtn = document.createElement('button');
    mainMenuBtn.textContent = 'MAIN MENU';
    mainMenuBtn.style.cssText = `
      background: linear-gradient(45deg, #2196F3, #1976D2);
      color: white;
      border: none;
      padding: 18px 35px;
      font-size: 1.2em;
      border-radius: 30px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
      text-transform: uppercase;
      letter-spacing: 1px;
    `;

    // Quit button
    const quitBtn = document.createElement('button');
    quitBtn.textContent = 'QUIT';
    quitBtn.style.cssText = `
      background: linear-gradient(45deg, #f44336, #d32f2f);
      color: white;
      border: none;
      padding: 18px 35px;
      font-size: 1.2em;
      border-radius: 30px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
      text-transform: uppercase;
      letter-spacing: 1px;
    `;

    // Button hover effects
    this.addButtonHoverEffects(restartBtn, '#66BB6A', '#4CAF50');
    this.addButtonHoverEffects(mainMenuBtn, '#42A5F5', '#2196F3');
    this.addButtonHoverEffects(quitBtn, '#EF5350', '#f44336');

    // Button click handlers
    restartBtn.addEventListener('click', () => {
      this.onRestart();
      this.hide();
    });

    mainMenuBtn.addEventListener('click', () => {
      this.onMainMenu();
      this.hide();
    });

    quitBtn.addEventListener('click', () => {
      this.onQuit();
      this.hide();
    });

    // Assemble popup
    buttonsContainer.appendChild(restartBtn);
    buttonsContainer.appendChild(mainMenuBtn);
    buttonsContainer.appendChild(quitBtn);

    popupContent.appendChild(bgEffect);
    popupContent.appendChild(title);
    popupContent.appendChild(subtitle);
    popupContent.appendChild(statsContainer);
    popupContent.appendChild(buttonsContainer);
    this.container.appendChild(popupContent);

    // Store references for animation
    this.popupContent = popupContent;
    this.title = title;
    this.subtitle = subtitle;
    this.statsContainer = statsContainer;

    // Add CSS animations
    this.addCSSAnimations();
  }

  /**
   * Add button hover effects
   */
  addButtonHoverEffects(button, hoverColor, originalColor) {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-3px) scale(1.05)';
      button.style.background = `linear-gradient(45deg, ${hoverColor}, ${originalColor})`;
      button.style.boxShadow = `0 8px 25px rgba(76, 175, 80, 0.6)`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0) scale(1)';
      button.style.background = `linear-gradient(45deg, ${originalColor}, ${originalColor})`;
      button.style.boxShadow = `0 6px 20px rgba(76, 175, 80, 0.4)`;
    });
  }

  /**
   * Add CSS animations
   */
  addCSSAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shake {
        0% { transform: translateX(0); }
        100% { transform: translateX(2px); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.1); }
      }
      
      @keyframes fadeInUp {
        0% { opacity: 0; transform: translateY(30px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideInLeft {
        0% { opacity: 0; transform: translateX(-50px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes slideInRight {
        0% { opacity: 0; transform: translateX(50px); }
        100% { opacity: 1; transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create a stat display element
   * @param {string} label - Stat label
   * @param {string} value - Stat value
   * @param {string} color - Color for the value
   * @param {string} animation - Animation class
   * @returns {HTMLElement}
   */
  createStat(label, value, color, animation = 'fadeInUp') {
    const statDiv = document.createElement('div');
    statDiv.style.cssText = `
      text-align: center;
      min-width: 120px;
      animation: ${animation} 0.6s ease-out forwards;
      animation-delay: 0.2s;
      opacity: 0;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: rgba(255, 255, 255, 0.7);
      font-size: 1em;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: bold;
    `;

    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    valueEl.style.cssText = `
      color: ${color};
      font-size: 1.8em;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
      font-family: 'Courier New', monospace;
    `;

    statDiv.appendChild(labelEl);
    statDiv.appendChild(valueEl);
    return statDiv;
  }

  /**
   * Show the lose component
   * @param {string} lossType - Type of loss: 'time', 'health', 'lives'
   * @param {Object} stats - Player stats to display
   */
  show(lossType = 'health', stats = {}) {
    if (this.isVisible) return;

    this.isVisible = true;
    this.lossType = lossType;
    this.lossStats = stats;
    
    document.body.appendChild(this.container);

    // Update content based on loss type
    this.updateContent(lossType, stats);

    // Trigger animation
    requestAnimationFrame(() => {
      this.container.style.opacity = '1';
      this.container.style.visibility = 'visible';
      this.popupContent.style.transform = 'scale(1) rotateY(0deg)';
    });

    // Auto-hide after delay (only if autoHideDelay > 0)
    if (this.autoHideDelay > 0) {
      setTimeout(() => {
        if (this.isVisible) {
          this.hide();
        }
      }, this.autoHideDelay);
    }

    // Callback
    this.onShow();
  }

  /**
   * Update content based on loss type
   * @param {string} lossType - Type of loss
   * @param {Object} stats - Player stats
   */
  updateContent(lossType, stats) {
    // Update subtitle based on loss type
    let subtitleText = '';
    let titleColor = '#ff4444';
    
    switch (lossType) {
      case 'time':
        subtitleText = 'Time has run out!';
        titleColor = '#ffaa00';
        break;
      case 'health':
        subtitleText = 'Your health has been depleted!';
        titleColor = '#ff4444';
        break;
      case 'lives':
        subtitleText = 'All lives have been lost!';
        titleColor = '#ff4444';
        break;
      default:
        subtitleText = 'Mission failed!';
        titleColor = '#ff4444';
    }
    
    this.subtitle.textContent = subtitleText;
    this.title.style.color = titleColor;
    this.title.style.textShadow = `3px 3px 6px rgba(0, 0, 0, 0.8), 0 0 20px ${titleColor}80`;

    // Clear existing stats
    this.statsContainer.innerHTML = '';

    // Add relevant stats based on loss type and available data
    const healthStat = this.createStat(
      'Health', 
      `${stats.health || 0}/${stats.maxHealth || 100}`, 
      '#ff6b6b',
      'slideInLeft'
    );
    
    const livesStat = this.createStat(
      'Lives', 
      `${stats.lives || 0}/${stats.maxLives || 3}`, 
      '#ff6b6b',
      'fadeInUp'
    );
    
    const timeStat = this.createStat(
      'Time', 
      stats.timeFormatted || '00:00', 
      '#ffaa00',
      'slideInRight'
    );

    // Add additional stats if available
    if (stats.deathCount !== undefined) {
      const deathStat = this.createStat(
        'Deaths', 
        stats.deathCount.toString(), 
        '#ff4444',
        'slideInLeft'
      );
      this.statsContainer.appendChild(deathStat);
    }

    this.statsContainer.appendChild(healthStat);
    this.statsContainer.appendChild(livesStat);
    this.statsContainer.appendChild(timeStat);

    // Add damage taken stat if available
    if (stats.totalDamageTaken !== undefined) {
      const damageStat = this.createStat(
        'Damage Taken', 
        Math.ceil(stats.totalDamageTaken).toString(), 
        '#ff8800',
        'slideInRight'
      );
      this.statsContainer.appendChild(damageStat);
    }
  }

  /**
   * Hide the lose component
   */
  hide() {
    if (!this.isVisible) return;

    // Animate out
    this.container.style.opacity = '0';
    this.popupContent.style.transform = 'scale(0.7) rotateY(-10deg)';

    setTimeout(() => {
      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.isVisible = false;
      this.onClose();
    }, this.animationDuration * 1000);
  }

  /**
   * Check if component is currently visible
   * @returns {boolean}
   */
  isCurrentlyVisible() {
    return this.isVisible;
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
