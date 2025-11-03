import { HealthConfig } from '../../config/healthConfig.js';

/**
 * HealthUI - Manages health bar and lives indicator display
 */
export class HealthUI {
  constructor(options = {}) {
    this.container = null;
    this.healthBar = null;
    this.healthBarFill = null;
    this.healthText = null;
    this.livesContainer = null;
    this.livesIcons = [];
    
    this.damageFlashTimer = 0;
    this.isFlashing = false;
    
    // Callback for restart button
    // Default no-op to avoid hard page reloads; App wires a proper handler.
    this.onRestart = options.onRestart || (() => {
      try { console.warn('HealthUI.onRestart not provided; ignoring restart click.'); } catch {}
    });
    
    this.createUI();
  }
  
  /**
   * Create the health UI elements
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'health-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 1000;
      font-family: Arial, sans-serif;
      user-select: none;
    `;
    
    // Create health bar container
    const healthBarContainer = document.createElement('div');
    healthBarContainer.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      padding: 10px 15px;
      margin-bottom: 10px;
      min-width: 250px;
    `;
    
    // Health label
    const healthLabel = document.createElement('div');
    healthLabel.textContent = 'HEALTH';
    healthLabel.style.cssText = `
      color: #ffffff;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 5px;
      letter-spacing: 1px;
    `;
    healthBarContainer.appendChild(healthLabel);
    
    // Health bar background
    this.healthBar = document.createElement('div');
    this.healthBar.style.cssText = `
      width: 100%;
      height: 25px;
      background: rgba(100, 100, 100, 0.5);
      border-radius: 5px;
      overflow: hidden;
      position: relative;
      box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
    `;
    
    // Health bar fill
    this.healthBarFill = document.createElement('div');
    this.healthBarFill.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, #4CAF50, #8BC34A);
      transition: width 0.3s ease, background 0.3s ease;
      border-radius: 5px;
      position: relative;
    `;
    this.healthBar.appendChild(this.healthBarFill);
    
    // Health text overlay
    this.healthText = document.createElement('div');
    this.healthText.textContent = '100 / 100';
    this.healthText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ffffff;
      font-size: 14px;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      pointer-events: none;
    `;
    this.healthBar.appendChild(this.healthText);
    
    healthBarContainer.appendChild(this.healthBar);
    this.container.appendChild(healthBarContainer);
    
    // Create lives container (HIDDEN - lives system disabled)
    this.livesContainer = document.createElement('div');
    this.livesContainer.style.cssText = `
      display: none; /* Lives system disabled */
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      padding: 10px 15px;
      align-items: center;
      gap: 10px;
    `;
    
    // Lives label
    const livesLabel = document.createElement('div');
    livesLabel.textContent = 'LIVES:';
    livesLabel.style.cssText = `
      color: #ffffff;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 1px;
    `;
    this.livesContainer.appendChild(livesLabel);
    
    // Lives icons container
    const livesIconsContainer = document.createElement('div');
    livesIconsContainer.style.cssText = `
      display: flex;
      gap: 5px;
    `;
    this.livesIconsContainer = livesIconsContainer;
    this.livesContainer.appendChild(livesIconsContainer);
    
    this.container.appendChild(this.livesContainer);
    
    // Add to document
    document.body.appendChild(this.container);
    
    // Inject CSS for pulse animation
    this.injectPulseStyles();
  }
  
  /**
   * Inject CSS styles for health bar pulse animation
   */
  injectPulseStyles() {
    if (document.getElementById('health-pulse-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'health-pulse-styles';
    style.textContent = `
      .health-pulse {
        animation: healthPulse 0.6s ease-out;
      }
      
      @keyframes healthPulse {
        0% {
          transform: scaleX(1);
          filter: brightness(1);
        }
        25% {
          transform: scaleX(1.05);
          filter: brightness(1.5);
        }
        50% {
          transform: scaleX(0.98);
          filter: brightness(1.3);
        }
        75% {
          transform: scaleX(1.02);
          filter: brightness(1.2);
        }
        100% {
          transform: scaleX(1);
          filter: brightness(1);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Update health bar display
   * @param {number} current - Current health
   * @param {number} max - Maximum health
   * @param {boolean} pulseOnChange - Whether to pulse if health changed
   */
  updateHealth(current, max, pulseOnChange = false) {
    const percentage = (current / max) * 100;
    const previousPercentage = parseFloat(this.healthBarFill.style.width) || 100;
    const healthChanged = Math.abs(previousPercentage - percentage) > 0.1;
    
    this.healthBarFill.style.width = `${percentage}%`;
    this.healthText.textContent = `${Math.ceil(current)} / ${max}`;
    
    // Update color based on health percentage
    if (percentage <= HealthConfig.CRITICAL_HEALTH_THRESHOLD) {
      this.healthBarFill.style.background = 'linear-gradient(to right, #F44336, #E53935)';
    } else if (percentage <= HealthConfig.LOW_HEALTH_THRESHOLD) {
      this.healthBarFill.style.background = 'linear-gradient(to right, #FF9800, #FFC107)';
    } else {
      this.healthBarFill.style.background = 'linear-gradient(to right, #4CAF50, #8BC34A)';
    }
    
    // Pulse animation on damage
    if (pulseOnChange && healthChanged && percentage < previousPercentage) {
      this.pulseHealthBar();
    }
  }
  
  /**
   * Pulse health bar animation for damage feedback
   */
  pulseHealthBar() {
    // Remove existing pulse class if any
    this.healthBarFill.classList.remove('health-pulse');
    
    // Force reflow
    void this.healthBarFill.offsetWidth;
    
    // Add pulse animation
    this.healthBarFill.classList.add('health-pulse');
    
    // Remove after animation completes
    setTimeout(() => {
      this.healthBarFill.classList.remove('health-pulse');
    }, 600);
  }
  
  /**
   * Update lives display
   * @param {number} current - Current lives
   * @param {number} max - Maximum lives
   */
  updateLives(current, max) {
    // Clear existing icons
    this.livesIconsContainer.innerHTML = '';
    this.livesIcons = [];
    
    // Create life icons
    for (let i = 0; i < max; i++) {
      const lifeIcon = document.createElement('div');
      lifeIcon.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${i < current ? '#4CAF50' : 'rgba(100, 100, 100, 0.5)'};
        border: 2px solid ${i < current ? '#66BB6A' : 'rgba(150, 150, 150, 0.5)'};
        transition: all 0.3s ease;
      `;
      this.livesIconsContainer.appendChild(lifeIcon);
      this.livesIcons.push(lifeIcon);
    }
  }
  
  /**
   * Flash effect when taking damage
   */
  flashDamage() {
    this.isFlashing = true;
    this.damageFlashTimer = HealthConfig.DAMAGE_FLASH_DURATION;
    this.container.style.filter = 'brightness(1.5)';
  }
  
  /**
   * Update UI (call in game loop)
   * @param {number} delta - Time since last frame
   */
  update(delta) {
    if (this.isFlashing) {
      this.damageFlashTimer -= delta;
      if (this.damageFlashTimer <= 0) {
        this.isFlashing = false;
        this.container.style.filter = 'none';
      }
    }
  }
  
  /**
   * Show game over screen
   */
  showGameOver(stats) {
    const gameOverDiv = document.createElement('div');
    gameOverDiv.id = 'game-over-screen';
    gameOverDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: #ffffff;
      font-family: Arial, sans-serif;
    `;
    
    const title = document.createElement('h1');
    title.textContent = 'GAME OVER';
    title.style.cssText = `
      font-size: 72px;
      color: #F44336;
      margin-bottom: 30px;
      text-shadow: 0 0 20px rgba(244, 67, 54, 0.5);
      animation: pulse 1.5s infinite;
    `;
    
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      padding: 30px;
      margin-bottom: 30px;
    `;
    
    statsContainer.innerHTML = `
      <p style="font-size: 20px; margin: 10px 0;">Total Damage Taken: ${Math.ceil(stats.totalDamageTaken)}</p>
      <p style="font-size: 20px; margin: 10px 0;">Total Healing: ${Math.ceil(stats.totalHealing)}</p>
    `;
    
    const restartButton = document.createElement('button');
    restartButton.textContent = 'RESTART';
    restartButton.style.cssText = `
      font-size: 24px;
      padding: 15px 40px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    restartButton.onmouseover = () => {
      restartButton.style.background = '#66BB6A';
      restartButton.style.transform = 'scale(1.1)';
    };
    restartButton.onmouseout = () => {
      restartButton.style.background = '#4CAF50';
      restartButton.style.transform = 'scale(1)';
    };
    restartButton.onclick = () => {
      // Remove the game over screen
      const gameOverScreen = document.getElementById('game-over-screen');
      if (gameOverScreen) {
        gameOverScreen.remove();
      }
      // Call the restart callback
      this.onRestart();
    };
    
    // Add CSS animation for pulse effect
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
    
    gameOverDiv.appendChild(title);
    gameOverDiv.appendChild(statsContainer);
    gameOverDiv.appendChild(restartButton);
    document.body.appendChild(gameOverDiv);
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
