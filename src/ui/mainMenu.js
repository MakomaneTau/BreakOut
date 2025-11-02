export class MainMenu {
  constructor({ onStart, onHelp } = {}) {
    this.onStart = onStart;
    this.onHelp = onHelp;
    this.root = null;
    this._onAnyKey = null;
    this._bgm = null; // background music element
    this._bgmNeedsUnlock = false; // autoplay blocked is likely
    this._bgmUnlocked = false; // user gesture unlocked audio

    // UI SFX
    this._audioCtx = null;
    this._uiGain = null;
  }

  show() {
    if (this.root) return; // already shown
    const overlay = document.createElement('div');
    overlay.id = 'main-menu-overlay';
    const year = new Date().getFullYear();
    overlay.innerHTML = `
      <style>
        #main-menu-overlay { 
          position:fixed; 
          inset:0; 
          display:grid; 
          place-items:center; 
          background-image: url('/public/icons/home_page_backeground.webp');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index:9999;
        }
        #main-menu-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(1200px 800px at 50% 40%, rgba(0,0,0,0.3), rgba(0,0,0,0.85));
          z-index: 1;
        }
        .menu-panel { 
          position: relative;
          z-index: 2;
          color:#fff; 
          text-align:center; 
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; 
        }
        .menu-panel .title { margin:0 0 8px; font-size:56px; letter-spacing:2px; text-shadow:0 4px 24px rgba(0,0,0,.8), 0 2px 8px rgba(0,0,0,.9); }
        .menu-panel .prompt { margin:12px 0 6px; font-size:18px; letter-spacing:1px; opacity:.9; }
        .menu-panel .hint { margin:4px 0 14px; font-size:12px; opacity:.55; }
        .level-select { display:flex; gap:10px; justify-content:center; margin:12px 0 18px; }
        .level-btn { padding:10px 14px; border-radius:10px; background:#1f2937; color:#e5e7eb; border:1px solid rgba(255,255,255,0.12); cursor:pointer; font-weight:600; transition:all .15s ease; }
        .level-btn:hover { transform:translateY(-1px); background:#243041; }
        .level-btn.active { background:#3b82f6; color:#fff; box-shadow:0 6px 18px rgba(59,130,246,.35); border-color:#60a5fa; }
        .footer { margin-top:24px; opacity:.35; font-size:12px; }
        .music-toggle { position:fixed; top:14px; right:14px; width:42px; height:42px; border-radius:10px; border:1px solid rgba(255,255,255,.18); background:rgba(0,0,0,.65); color:#fff; font-size:18px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s ease; box-shadow:0 4px 16px rgba(0,0,0,.5); z-index: 10; }
        .music-toggle:hover { transform:translateY(-1px); background:rgba(0,0,0,.8); }
      </style>
      <div class="menu-panel press-any-key">
        <h1 class="title">BreakOut</h1>
        <div class="level-select" role="group" aria-label="Select Level">
          <button class="level-btn active" data-level="1">Level 1</button>
          <button class="level-btn" data-level="2">Level 2</button>
          <button class="level-btn" data-level="3">Level 3</button>
          <button class="level-btn" data-level="4">Play Mode</button>
        </div>
        <p class="prompt">Press Any Key to Start</p>
        <p class="hint">(Press H for Help)</p>
        <div class="footer">© ${year} BreakOut</div>
      </div>`;
    document.body.appendChild(overlay);
    this.root = overlay;

    // Setup background music (attempt autoplay, fallback to user gesture)
    const ensureBGM = () => {
      // Reuse a single global audio instance so playback continues across menus
      if (window.__breakoutBGM instanceof Audio) {
        this._bgm = window.__breakoutBGM;
        // Apply persisted mute state to reused instance
        try { this._bgm.muted = this._isMusicMuted(); } catch {}
        return this._bgm;
      }
      if (!this._bgm) {
        const audio = new Audio('/public/assets/soundtrack/stay-focused-383207.mp3');
        audio.loop = true;
        audio.volume = 0.35;
        // Start with persisted mute state
        try { audio.muted = this._isMusicMuted(); } catch {}
        this._bgm = audio;
        window.__breakoutBGM = audio;
      }
      return this._bgm;
    };
    const tryPlayBGM = async () => {
      try {
        const audio = ensureBGM();
        if (audio.paused) await audio.play();
      } catch (_) {
        // Autoplay might be blocked; we will retry on first interaction
        this._bgmNeedsUnlock = true;
      }
    };
    tryPlayBGM();

    // Create music mute/unmute toggle button (top-right)
    const musicBtn = document.createElement('button');
    musicBtn.className = 'music-toggle';
    musicBtn.title = 'Toggle Music';
    // Initialize icon based on persisted state
    const setMusicIcon = () => {
      const muted = this._isMusicMuted();
      musicBtn.textContent = muted ? '🔇' : '🔊';
    };
    setMusicIcon();
    musicBtn.addEventListener('click', async () => {
      // Toggle persisted state
      const next = !this._isMusicMuted();
      this._setMusicMuted(next);
      setMusicIcon();
      // Ensure BGM exists and reflect state; attempt play if now unmuted
      const audio = ensureBGM();
      try {
        audio.muted = next;
        if (!next && audio.paused) {
          // If unmuting, try to play (may require prior unlock)
          await audio.play().catch(() => {});
        }
      } catch {}
    });
    overlay.appendChild(musicBtn);

    // level selection state
    let selectedLevel = 1;
    const buttons = overlay.querySelectorAll('.level-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        // play UI click
        this._playClick();
        const lvl = parseInt(e.currentTarget.getAttribute('data-level')) || 1;
        selectedLevel = lvl;
        buttons.forEach(b => b.classList.toggle('active', b === e.currentTarget));
        // Also use this user gesture to unlock and start BGM if needed
        if (this._bgmNeedsUnlock && !this._bgmUnlocked) {
          try {
            const audio = ensureBGM();
            await audio.play();
            this._bgmUnlocked = true;
            this._bgmNeedsUnlock = false;
            const hint = this.root?.querySelector('.hint');
            if (hint) hint.textContent = '(Music enabled) Press Any Key to Start';
          } catch {}
        }
      });
    });

    const triggerStart = (level) => {
      if (!this.root) return; // already triggered
      // Do NOT stop BGM here—let it continue into MenuUI so playback doesn't restart
      this.hide();
      this.onStart && this.onStart(level ?? selectedLevel);
    };

    this._onAnyKey = async (e) => {
      if (e.key && e.key.toLowerCase() === 'h') {
        // Show help without starting
        if (this.onHelp) this.onHelp();
        else alert('WASD to move, mouse to orbit. Press F to frame the scene.');
        return;
      }
      // If autoplay was blocked, first key press should unlock audio, not start game
      if (this._bgmNeedsUnlock && !this._bgmUnlocked) {
        try {
          const audio = ensureBGM();
          // If user has music muted, we can still attempt a muted play (often allowed by autoplay policies)
          if (this._isMusicMuted()) audio.muted = true;
          await audio.play();
          this._bgmUnlocked = true;
          this._bgmNeedsUnlock = false;
          // Optionally update hint to indicate music started
          const hint = this.root?.querySelector('.hint');
          if (hint) hint.textContent = '(Music enabled) Press Any Key to Start';
        } catch {}
        return; // do not start game on first gesture used to unlock audio
      }
      triggerStart(selectedLevel);
    };
    window.addEventListener('keydown', this._onAnyKey);
    // Also allow clicking the panel area to start with current selection
    overlay.addEventListener('pointerdown', async (e) => {
      // Don't start if clicking level selection buttons
      if (e.target && e.target.closest && e.target.closest('.level-btn')) return;
      // If autoplay was blocked, first pointer should unlock audio, not start game
      if (this._bgmNeedsUnlock && !this._bgmUnlocked) {
        try {
          const audio = ensureBGM();
          if (this._isMusicMuted()) audio.muted = true;
          await audio.play();
          this._bgmUnlocked = true;
          this._bgmNeedsUnlock = false;
          const hint = this.root?.querySelector('.hint');
          if (hint) hint.textContent = '(Music enabled) Press Any Key to Start';
        } catch {}
        return;
      }
      // panel tap also clicks
      this._playClick();
      triggerStart(selectedLevel);
    });
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
    // Do not stop global music here; MenuUI will decide when to stop
  }

  // --- simple UI click using Web Audio ---
  _ensureAudioCtx() {
    if (!this._audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this._audioCtx = new AC();
        this._uiGain = this._audioCtx.createGain();
        // reuse MenuUI defaults if available via localStorage keys
        const master = this._loadSetting('masterVolume', 80) / 100;
        const sfx = this._loadSetting('sfxVolume', 90) / 100;
        this._uiGain.gain.value = Math.max(0, Math.min(1, master * sfx));
        this._uiGain.connect(this._audioCtx.destination);
      }
    }
    return this._audioCtx;
  }

  _playClick() {
    try {
      const ctx = this._ensureAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      // update gain from settings each time
      const master = this._loadSetting('masterVolume', 80) / 100;
      const sfx = this._loadSetting('sfxVolume', 90) / 100;
      if (this._uiGain) this._uiGain.gain.value = Math.max(0, Math.min(1, master * sfx));

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.03);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.02, master * sfx), now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(this._uiGain);
      osc.start(now);
      osc.stop(now + 0.1);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch {} };
    } catch {}
  }

  _loadSetting(key, defVal) {
    try {
      const saved = localStorage.getItem(`breakout_${key}`);
      return saved ? JSON.parse(saved) : defVal;
    } catch { return defVal; }
  }

  // --- music mute state helpers ---
  _isMusicMuted() {
    try {
      return !!JSON.parse(localStorage.getItem('breakout_musicMuted') || 'false');
    } catch {
      return false;
    }
  }

  _setMusicMuted(muted) {
    try { localStorage.setItem('breakout_musicMuted', JSON.stringify(!!muted)); } catch {}
    try {
      const audio = (window.__breakoutBGM instanceof Audio) ? window.__breakoutBGM : this._bgm;
      if (audio) audio.muted = !!muted;
    } catch {}
  }
}
