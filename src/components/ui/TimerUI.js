/**
 * TimerUI - Manages countdown timer display
 */
export class TimerUI {
  constructor(options = {}) {
    this.container = null;
    this.timerDisplay = null;
    this.initialTime = options.initialTime !== undefined ? options.initialTime : 180; // 3:00 in seconds (3 * 60)
    this.currentTime = this.initialTime;
    this.isRunning = true;
    this.onTimeUp = options.onTimeUp || (() => {});
    
    this.createUI();
    this.startTimer();
  }
  
  /**
   * Create the timer UI elements
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'timer-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      font-family: 'Courier New', monospace;
      user-select: none;
    `;
    
    // Create timer container
    const timerContainer = document.createElement('div');
    timerContainer.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 15px;
      padding: 15px 25px;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    `;
    
    // Timer label
    const timerLabel = document.createElement('div');
    timerLabel.textContent = 'TIME';
    timerLabel.style.cssText = `
      color: #ffffff;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 8px;
      letter-spacing: 2px;
      opacity: 0.8;
    `;
    timerContainer.appendChild(timerLabel);
    
    // Timer display
    this.timerDisplay = document.createElement('div');
    this.timerDisplay.textContent = this.formatTime(this.currentTime);
    this.timerDisplay.style.cssText = `
      color: #ffffff;
      font-size: 32px;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
      letter-spacing: 2px;
    `;
    timerContainer.appendChild(this.timerDisplay);
    
    this.container.appendChild(timerContainer);
    
    // Add to document
    document.body.appendChild(this.container);
  }
  
  /**
   * Format time in MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time string
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Start the countdown timer
   */
  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.isRunning && this.currentTime > 0) {
        this.currentTime--;
        this.updateDisplay();
        
        // Check if time is up
        if (this.currentTime <= 0) {
          this.onTimeUp();
          this.stopTimer();
        }
      }
    }, 1000);
  }
  
  /**
   * Stop the timer
   */
  stopTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
  
  /**
   * Pause the timer
   */
  pauseTimer() {
    this.isRunning = false;
  }
  
  /**
   * Resume the timer
   */
  resumeTimer() {
    this.isRunning = true;
  }
  
  /**
   * Reset the timer to initial time
   */
  resetTimer() {
    this.currentTime = this.initialTime;
    this.isRunning = true;
    this.updateDisplay();
  }
  
  /**
   * Update the timer display
   */
  updateDisplay() {
    this.timerDisplay.textContent = this.formatTime(this.currentTime);
    
    // Change color based on remaining time
    if (this.currentTime <= 30) {
      // Last 30 seconds - red
      this.timerDisplay.style.color = '#ff4444';
      this.timerDisplay.style.textShadow = '0 0 15px rgba(255, 68, 68, 0.6)';
    } else if (this.currentTime <= 60) {
      // Last minute - orange
      this.timerDisplay.style.color = '#ffaa00';
      this.timerDisplay.style.textShadow = '0 0 12px rgba(255, 170, 0, 0.5)';
    } else {
      // Normal time - white
      this.timerDisplay.style.color = '#ffffff';
      this.timerDisplay.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
    }
  }
  
  /**
   * Get current time in seconds
   * @returns {number} - Current time in seconds
   */
  getCurrentTime() {
    return this.currentTime;
  }
  
  /**
   * Get current time formatted as MM:SS
   * @returns {string} - Formatted time string
   */
  getFormattedTime() {
    return this.formatTime(this.currentTime);
  }
  
  /**
   * Update timer (call in game loop)
   * @param {number} delta - Time since last frame
   */
  update(delta) {
    // Timer updates are handled by setInterval, but this method is here
    // in case you want to add any frame-based updates later
  }
  
  /**
   * Remove the UI
   */
  destroy() {
    this.stopTimer();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
