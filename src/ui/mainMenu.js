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
    const year = new Date().getFullYear();
    overlay.innerHTML = `
      <style>
        #main-menu-overlay { position:fixed; inset:0; display:grid; place-items:center; background:radial-gradient(1200px 800px at 50% 40%, rgba(255,255,255,0.06), rgba(0,0,0,0.92)); z-index:9999; }
        .menu-panel { color:#fff; text-align:center; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
        .menu-panel .title { margin:0 0 8px; font-size:56px; letter-spacing:2px; text-shadow:0 4px 24px rgba(0,0,0,.45); }
        .menu-panel .prompt { margin:12px 0 6px; font-size:18px; letter-spacing:1px; opacity:.9; }
        .menu-panel .hint { margin:4px 0 14px; font-size:12px; opacity:.55; }
        .level-select { display:flex; gap:10px; justify-content:center; margin:12px 0 18px; }
        .level-btn { padding:10px 14px; border-radius:10px; background:#1f2937; color:#e5e7eb; border:1px solid rgba(255,255,255,0.12); cursor:pointer; font-weight:600; transition:all .15s ease; }
        .level-btn:hover { transform:translateY(-1px); background:#243041; }
        .level-btn.active { background:#3b82f6; color:#fff; box-shadow:0 6px 18px rgba(59,130,246,.35); border-color:#60a5fa; }
        .footer { margin-top:24px; opacity:.35; font-size:12px; }
      </style>
      <div class="menu-panel press-any-key">
        <h1 class="title">BreakOut</h1>
        <div class="level-select" role="group" aria-label="Select Level">
          <button class="level-btn active" data-level="1">Level 1</button>
          <button class="level-btn" data-level="2">Level 2</button>
          <button class="level-btn" data-level="3">Level 3</button>
        </div>
        <p class="prompt">Press Any Key to Start</p>
        <p class="hint">(Press H for Help)</p>
        <div class="footer">© ${year} BreakOut</div>
      </div>`;
    document.body.appendChild(overlay);
    this.root = overlay;

    // level selection state
    let selectedLevel = 1;
    const buttons = overlay.querySelectorAll('.level-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lvl = parseInt(e.currentTarget.getAttribute('data-level')) || 1;
        selectedLevel = lvl;
        buttons.forEach(b => b.classList.toggle('active', b === e.currentTarget));
      });
    });

    const triggerStart = (level) => {
      if (!this.root) return; // already triggered
      this.hide();
      this.onStart && this.onStart(level ?? selectedLevel);
    };

    this._onAnyKey = (e) => {
      if (e.key && e.key.toLowerCase() === 'h') {
        // Show help without starting
        if (this.onHelp) this.onHelp();
        else alert('WASD to move, mouse to orbit. Press F to frame the scene.');
        return;
      }
      triggerStart(selectedLevel);
    };
    window.addEventListener('keydown', this._onAnyKey);
    // Also allow clicking the panel area to start with current selection
    overlay.addEventListener('pointerdown', (e) => {
      // Don't start if clicking level selection buttons
      if (e.target && e.target.closest && e.target.closest('.level-btn')) return;
      triggerStart(selectedLevel);
    }, { once: true });
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
