export class MainMenu {
  constructor({ onStart, onHelp } = {}) {
    this.onStart = onStart;
    this.onHelp = onHelp;
    this.root = null;
    this._onAnyKey = null;
  }

  show() {
    if (this.root) return; // already shown
    const overlay = document.createElement('div');
    overlay.id = 'main-menu-overlay';
    overlay.innerHTML = `
      <div class="menu-panel press-any-key">
        <h1 class="title">BreakOut</h1>
        <p class="prompt" style="margin:12px 0 6px;font-size:18px;letter-spacing:1px;opacity:.9;">Press Any Key to Start</p>
        <p class="hint" style="margin:4px 0 14px;font-size:12px;opacity:.55;">(Press H for Help)</p>
        <div class="footer">© ${new Date().getFullYear()} BreakOut</div>
      </div>`;
    document.body.appendChild(overlay);
    this.root = overlay;

    const triggerStart = () => {
      if (!this.root) return; // already triggered
      this.hide();
      this.onStart && this.onStart();
    };

    this._onAnyKey = (e) => {
      if (e.key && e.key.toLowerCase() === 'h') {
        // Show help without starting
        if (this.onHelp) this.onHelp();
        else alert('WASD to move, mouse to orbit. Press F to frame the scene.');
        return;
      }
      triggerStart();
    };
    window.addEventListener('keydown', this._onAnyKey);
    // Also allow mouse click/tap anywhere
    overlay.addEventListener('pointerdown', triggerStart, { once: true });
  }

  hide() {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
    if (this._onAnyKey) {
      window.removeEventListener('keydown', this._onAnyKey);
      this._onAnyKey = null;
    }
  }
}
