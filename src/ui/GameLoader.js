export class GameLoader {
  constructor({ onReady } = {}) {
    this.onReady = onReady;
    this.root = null;
    this.progressFill = null;
    this.statusText = null;
    this.visible = false;
  }

  show() {
    if (this.root) return;
    const overlay = document.createElement('div');
    overlay.id = 'game-loader-overlay';
    overlay.innerHTML = `
      <div class="loader-panel">
        <h2 class="loader-title">Loading World</h2>
        <div class="progress-bar"><div class="fill" style="width:0%"></div></div>
        <div class="status">Initializing...</div>
        <div class="tips">Tip: Use WASD + mouse. Press F to frame the scene.</div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.root = overlay;
    this.progressFill = overlay.querySelector('.progress-bar .fill');
    this.statusText = overlay.querySelector('.status');
    this.visible = true;
  }

  hide() {
    if (!this.root) return;
    this.root.classList.add('fade-out');
    setTimeout(() => {
      this.root?.remove();
      this.root = null;
      this.visible = false;
    }, 350);
  }

  updateProgress(pct, label) {
    if (!this.root) return;
    const clamped = Math.min(100, Math.max(0, pct));
    if (this.progressFill) this.progressFill.style.width = clamped + '%';
    if (this.statusText && label) this.statusText.textContent = label;
  }
}
