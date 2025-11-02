/**
 * Toast - Notification system for game events
 * Displays temporary messages at the top of the screen
 */
export class Toast {
  constructor() {
    this.container = null;
    this.queue = [];
    this.isShowing = false;
    this.createContainer();
  }

  /**
   * Create the toast container
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {Object} options - Toast options
   * @param {string} options.type - Type: 'info', 'warning', 'success', 'error'
   * @param {number} options.duration - Duration in milliseconds (default: 3000)
   * @param {string} options.icon - Icon emoji (optional)
   */
  show(message, options = {}) {
    const {
      type = 'info',
      duration = 3000,
      icon = null
    } = options;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Get icon based on type if not provided
    let displayIcon = icon;
    if (!displayIcon) {
      switch (type) {
        case 'success':
          displayIcon = '✓';
          break;
        case 'warning':
          displayIcon = '⚠';
          break;
        case 'error':
          displayIcon = '✕';
          break;
        case 'info':
        default:
          displayIcon = 'ℹ';
          break;
      }
    }

    // Get color based on type
    let bgColor, borderColor, textColor;
    switch (type) {
      case 'success':
        bgColor = 'rgba(76, 175, 80, 0.95)';
        borderColor = 'rgba(56, 142, 60, 1)';
        textColor = '#ffffff';
        break;
      case 'warning':
        bgColor = 'rgba(255, 193, 7, 0.95)';
        borderColor = 'rgba(230, 162, 0, 1)';
        textColor = '#000000';
        break;
      case 'error':
        bgColor = 'rgba(244, 67, 54, 0.95)';
        borderColor = 'rgba(198, 40, 40, 1)';
        textColor = '#ffffff';
        break;
      case 'info':
      default:
        bgColor = 'rgba(33, 150, 243, 0.95)';
        borderColor = 'rgba(13, 71, 161, 1)';
        textColor = '#ffffff';
        break;
    }

    toast.style.cssText = `
      background: ${bgColor};
      border: 2px solid ${borderColor};
      border-radius: 8px;
      padding: 12px 20px;
      color: ${textColor};
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 250px;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      animation: toastSlideIn 0.3s ease-out;
      pointer-events: auto;
      user-select: none;
    `;

    // Add icon if provided
    if (displayIcon) {
      const iconSpan = document.createElement('span');
      iconSpan.textContent = displayIcon;
      iconSpan.style.cssText = `
        font-size: 18px;
        flex-shrink: 0;
      `;
      toast.appendChild(iconSpan);
    }

    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    messageSpan.style.cssText = `
      flex: 1;
      text-align: center;
    `;
    toast.appendChild(messageSpan);

    // Add to container
    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    // Remove after duration
    setTimeout(() => {
      this.remove(toast);
    }, duration);
  }

  /**
   * Remove a toast element
   */
  remove(toast) {
    if (!toast || !toast.parentNode) return;

    toast.style.animation = 'toastSlideOut 0.3s ease-in';
    toast.style.opacity = '0';
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Add CSS animations
   */
  static injectStyles() {
    if (document.getElementById('toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toastSlideIn {
        from {
          transform: translateY(-100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes toastSlideOut {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(-100px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Inject styles when module loads
Toast.injectStyles();

