export class MainMenu {
  constructor({ onStart, onHelp } = {}) {
    this.onStart = onStart;
    this.onHelp = onHelp;
    this.root = null;
  }

  show() {
    if (this.root) return; // already shown
    const overlay = document.createElement('div');
    overlay.id = 'main-menu-overlay';
    overlay.innerHTML = `
      <div class="menu-panel">
        <h1 class="title">BreakOut</h1>
        <div class="buttons">
          <button id="btn-start" class="btn primary">Start</button>
          <button id="btn-help" class="btn">Help</button>
        </div>
        <div class="footer">© ${new Date().getFullYear()} BreakOut</div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.root = overlay;

    overlay.querySelector('#btn-start')?.addEventListener('click', () => {
      this.hide();
      this.onStart && this.onStart();
    });
    overlay.querySelector('#btn-help')?.addEventListener('click', () => {
      this.onHelp && this.onHelp();
      alert('WASD to move, mouse to orbit. Press F to frame the scene.');
    });
  }

  hide() {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
  }
}
