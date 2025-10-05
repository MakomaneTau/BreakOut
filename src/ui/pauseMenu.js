export class PauseMenu {
  constructor({ onResume, onRestart, onMainMenu } = {}) {
    this.onResume = onResume;
    this.onRestart = onRestart;
    this.onMainMenu = onMainMenu;
    this.root = null;
  }

  show() {
    if (this.root) return;
    const overlay = document.createElement('div');
    overlay.id = 'pause-menu-overlay';
    overlay.innerHTML = `
      <div class="menu-panel">
        <h2 class="title">Paused</h2>
        <div class="buttons">
          <button id="btn-resume" class="btn primary">Resume</button>
          <button id="btn-restart" class="btn">Restart</button>
          <button id="btn-mainmenu" class="btn">Main Menu</button>
        </div>
        <div class="footer">Press Esc to toggle</div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.root = overlay;

    overlay.querySelector('#btn-resume')?.addEventListener('click', () => {
      this.hide();
      this.onResume && this.onResume();
    });
    overlay.querySelector('#btn-restart')?.addEventListener('click', () => {
      this.onRestart && this.onRestart();
    });
    overlay.querySelector('#btn-mainmenu')?.addEventListener('click', () => {
      this.onMainMenu && this.onMainMenu();
    });
  }

  hide() {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
  }
}
