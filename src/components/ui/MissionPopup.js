/**
 * MissionPopup - UI component for mission accomplished popup
 * Shows when player completes the objective
 */
export class MissionPopup {
  constructor(options = {}) {
    this.container = null;
    this.isVisible = false;
    this.animationDuration = options.animationDuration || 0.5;
    this.autoHideDelay = options.autoHideDelay || 0; // Disabled by default
    
    // Callbacks
    this.onClose = options.onClose || (() => {});
    this.onShow = options.onShow || (() => {});
    
    this.createUI();
  }

  /**
   * Create the mission popup UI
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
      background: rgba(0, 0, 0, 0.8);
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      transform: scale(0.8);
      transition: transform ${this.animationDuration}s ease-out;
      border: 3px solid #00ff88;
      max-width: 500px;
      width: 90%;
    `;

    // Mission accomplished title
    const title = document.createElement('h1');
    title.textContent = 'MISSION ACCOMPLISHED!';
    title.style.cssText = `
      color: #00ff88;
      font-size: 2.5em;
      margin: 0 0 20px 0;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      font-weight: bold;
      letter-spacing: 2px;
    `;

    // Success message
    const message = document.createElement('p');
    message.textContent = 'Congratulations! You have successfully reached the checkpoint.';
    message.style.cssText = `
      color: white;
      font-size: 1.2em;
      margin: 0 0 30px 0;
      line-height: 1.5;
    `;

    // Stats container
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
      flex-wrap: wrap;
      gap: 20px;
    `;

    // Health stat
    const healthStat = this.createStat('Health', '100%', '#00ff88');
    const timeStat = this.createStat('Time', '03:45', '#ffd700');
    const livesStat = this.createStat('Lives', '3', '#ff6b6b');

    statsContainer.appendChild(healthStat);
    statsContainer.appendChild(timeStat);
    statsContainer.appendChild(livesStat);

    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue';
    continueBtn.style.cssText = `
      background: linear-gradient(45deg, #00ff88, #00cc66);
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 1.1em;
      border-radius: 25px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
    `;

    // Button hover effects
    continueBtn.addEventListener('mouseenter', () => {
      continueBtn.style.transform = 'translateY(-2px)';
      continueBtn.style.boxShadow = '0 8px 20px rgba(0, 255, 136, 0.5)';
    });

    continueBtn.addEventListener('mouseleave', () => {
      continueBtn.style.transform = 'translateY(0)';
      continueBtn.style.boxShadow = '0 5px 15px rgba(0, 255, 136, 0.3)';
    });

    continueBtn.addEventListener('click', () => {
      this.hide();
    });

    // Assemble popup
    popupContent.appendChild(title);
    popupContent.appendChild(message);
    popupContent.appendChild(statsContainer);
    popupContent.appendChild(continueBtn);
    this.container.appendChild(popupContent);

    // Store references for animation
    this.popupContent = popupContent;
  }

  /**
   * Create a stat display element
   * @param {string} label - Stat label
   * @param {string} value - Stat value
   * @param {string} color - Color for the value
   * @returns {HTMLElement}
   */
  createStat(label, value, color) {
    const statDiv = document.createElement('div');
    statDiv.style.cssText = `
      text-align: center;
      min-width: 100px;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9em;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;

    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    valueEl.style.cssText = `
      color: ${color};
      font-size: 1.5em;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    `;

    statDiv.appendChild(labelEl);
    statDiv.appendChild(valueEl);
    return statDiv;
  }

  /**
   * Show the mission popup
   * @param {Object} stats - Player stats to display
   */
  show(stats = {}) {
    if (this.isVisible) return;

    this.isVisible = true;
    document.body.appendChild(this.container);

    // Trigger animation
    requestAnimationFrame(() => {
      this.container.style.opacity = '1';
      this.container.style.visibility = 'visible';
      this.popupContent.style.transform = 'scale(1)';
    });

    // Update stats if provided
    this.updateStats(stats);

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
   * Hide the mission popup
   */
  hide() {
    if (!this.isVisible) return;

    // Animate out
    this.container.style.opacity = '0';
    this.popupContent.style.transform = 'scale(0.8)';

    setTimeout(() => {
      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.isVisible = false;
      this.onClose();
    }, this.animationDuration * 1000);
  }

  /**
   * Update player stats in the popup
   * @param {Object} stats - Player stats
   */
  updateStats(stats) {
    // This would be called with actual player stats
    // For now, we'll keep the default values
    console.log('Updating mission stats:', stats);
  }

  /**
   * Check if popup is currently visible
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
