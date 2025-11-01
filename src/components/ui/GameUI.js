/**
 * GameUI - Comprehensive in-game UI overlay with controls and information
 * Provides quick access to settings, pause, and other game functions
 */
export class GameUI {
  constructor(options = {}) {
    this.container = null;
    this.isVisible = true;
    
    // Callbacks
    this.onPause = options.onPause || (() => {});
    this.onSettings = options.onSettings || (() => {});
    this.onRestart = options.onRestart || (() => {});
    this.onMainMenu = options.onMainMenu || (() => {});
    this.onToggleFullscreen = options.onToggleFullscreen || (() => {});
    this.onToggleMute = options.onToggleMute || (() => {});
    this.onToggleDayNight = options.onToggleDayNight || (() => {});
    // Minimap providers
    // options.minimapData?: { getPlayerPosition:()=>({x,z}|null), getExtentsByFloor:()=>({1:[...],2:[...],3:[...]}) }
    this.minimapData = options.minimapData || null;
    
    // State
    this.isMuted = false;
    this.isFullscreen = false;
    this.isNight = false;
    // Minimap state
    this._mm = {
      container: null,
      bg: null,
      fg: null,
      bgCtx: null,
      fgCtx: null,
      width: 154,
      height: 154,
      padding: 6,
      worldBounds: null, // current selected floor bounds
      extentsHash: '',
      selectedFloor: 1,
      autoFloor: true
    };
    
    this.createUI();
    this.setupKeyboardShortcuts();
  }

  /**
   * Create the game UI elements
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'game-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 500;
      font-family: 'Arial', sans-serif;
    `;

    // Create bottom control panel
    this.createBottomPanel();
    
    // Create top-right control panel
    this.createTopRightPanel();
    
    // Create controls help panel (bottom-left)
    this.createControlsHelp();
    
    // Create minimap placeholder (top-left, below health)
    this.createMinimap();
    
    // Add to document
    document.body.appendChild(this.container);
  }

  /**
   * Create bottom control panel
   */
  createBottomPanel() {
    const bottomPanel = document.createElement('div');
    bottomPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 15px;
      pointer-events: auto;
      z-index: 600;
    `;

    // Pause button
    const pauseBtn = this.createControlButton('⏸️', 'PAUSE', '#ff6b6b', () => {
      this.onPause();
    });
    pauseBtn.title = 'Pause Game (ESC)';

    // Settings button
    const settingsBtn = this.createControlButton('⚙️', 'SETTINGS', '#4ecdc4', () => {
      this.onSettings();
    });
    settingsBtn.title = 'Game Settings';

    // Restart button
    const restartBtn = this.createControlButton('🔄', 'RESTART', '#ffe66d', () => {
      this.onRestart();
    });
    restartBtn.title = 'Restart Level';

    // Main Menu button
    const menuBtn = this.createControlButton('🏠', 'MENU', '#a8e6cf', () => {
      this.onMainMenu();
    });
    menuBtn.title = 'Return to Main Menu';

    bottomPanel.appendChild(pauseBtn);
    bottomPanel.appendChild(settingsBtn);
    bottomPanel.appendChild(restartBtn);
    bottomPanel.appendChild(menuBtn);

    this.container.appendChild(bottomPanel);
  }

  /**
   * Create top-right control panel
   */
  createTopRightPanel() {
    const topRightPanel = document.createElement('div');
    topRightPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: auto;
      z-index: 600;
    `;

    // Fullscreen toggle button
    const fullscreenBtn = this.createIconButton('⛶', () => {
      this.toggleFullscreen();
    });
    fullscreenBtn.title = 'Toggle Fullscreen (F11)';

    // Mute toggle button
    const muteBtn = this.createIconButton('🔊', () => {
      this.toggleMute();
    });
    muteBtn.title = 'Toggle Sound';
    this.muteButton = muteBtn; // Store reference for updates

    // Day/Night toggle button
    const dayNightBtn = this.createIconButton('☀️', () => {
      this.toggleDayNight();
    });
    dayNightBtn.title = 'Toggle Day/Night (N)';
    this.dayNightButton = dayNightBtn; // Store reference for updates

    // FPS counter (optional)
    const fpsBtn = this.createIconButton('📊', () => {
      this.toggleFPSDisplay();
    });
    fpsBtn.title = 'Toggle FPS Display';

    topRightPanel.appendChild(fullscreenBtn);
    topRightPanel.appendChild(muteBtn);
    topRightPanel.appendChild(dayNightBtn);
    topRightPanel.appendChild(fpsBtn);

    this.container.appendChild(topRightPanel);
  }

  /**
   * Create controls help panel
   */
  createControlsHelp() {
    const helpPanel = document.createElement('div');
    helpPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      padding: 15px;
      color: #ffffff;
      font-size: 12px;
      line-height: 1.4;
      pointer-events: auto;
      z-index: 600;
      max-width: 200px;
      backdrop-filter: blur(5px);
    `;

    helpPanel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #4ecdc4;">CONTROLS</div>
      <div><strong>WASD</strong> - Move</div>
      <div><strong>Q/E</strong> - Rotate</div>
      <div><strong>SPACE</strong> - Jump</div>
      <div><strong>SHIFT</strong> - Roll</div>
      <div><strong>ESC</strong> - Pause</div>
      <div><strong>F</strong> - Reframe</div>
    `;

    // Add toggle functionality
    helpPanel.addEventListener('click', () => {
      this.toggleHelpPanel();
    });
    helpPanel.title = 'Click to toggle controls help';

    this.helpPanel = helpPanel;
    this.container.appendChild(helpPanel);
  }

  /**
   * Create minimap placeholder
   */
  createMinimap() {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: fixed;
      top: 180px;
      left: 20px;
      width: 170px;
      height: 190px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      pointer-events: auto;
      z-index: 600;
      color: #ffffff;
      font-size: 12px;
      backdrop-filter: blur(5px);
      box-sizing: border-box;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;

    // Header with floor buttons
    const header = document.createElement('div');
    header.style.cssText = `display:flex; align-items:center; justify-content:space-between;`;
    const title = document.createElement('div');
    title.textContent = 'MINIMAP';
    title.style.cssText = 'font-weight:bold; letter-spacing:0.5px; opacity:0.9;';
    const floors = document.createElement('div');
    floors.style.cssText = 'display:flex; gap:6px;';
    const makeFloorBtn = (n)=>{
      const b = document.createElement('button');
      b.textContent = n;
      b.style.cssText = `width:26px;height:22px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font-weight:700;`;
      b.addEventListener('click',()=>{ this._mm.selectedFloor=n; this._mm.autoFloor=false; this._drawMinimapBackground(true); });
      b.title = `Show floor ${n}`;
      return b;
    };
    floors.appendChild(makeFloorBtn(1));
    floors.appendChild(makeFloorBtn(2));
    floors.appendChild(makeFloorBtn(3));
    header.appendChild(title);
    header.appendChild(floors);

    // Canvas stack
    const canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'position:relative;width:154px;height:154px;align-self:center;';
    const bg = document.createElement('canvas');
    bg.width = 154; bg.height = 154; bg.style.cssText='position:absolute;left:0;top:0;';
    const fg = document.createElement('canvas');
    fg.width = 154; fg.height = 154; fg.style.cssText='position:absolute;left:0;top:0;';
    canvasWrap.appendChild(bg); canvasWrap.appendChild(fg);

    wrap.appendChild(header);
    wrap.appendChild(canvasWrap);
    wrap.title = 'Minimap - Track your progress across floors';
    this.container.appendChild(wrap);

    this._mm.container = wrap;
    this._mm.bg = bg; this._mm.fg = fg;
    this._mm.bgCtx = bg.getContext('2d');
    this._mm.fgCtx = fg.getContext('2d');

    this._drawMinimapBackground(true);
  }

  /**
   * Create a control button with icon and text
   */
  createControlButton(icon, text, color, onClick) {
    const button = document.createElement('button');
    button.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid ${color}40;
      border-radius: 12px;
      padding: 12px 16px;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      min-width: 80px;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 0.5px;
    `;

    button.innerHTML = `
      <div style="font-size: 20px;">${icon}</div>
      <div>${text}</div>
    `;

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = `${color}20`;
      button.style.borderColor = `${color}80`;
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = `0 8px 20px ${color}40`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(0, 0, 0, 0.8)';
      button.style.borderColor = `${color}40`;
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });

    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * Create an icon-only button
   */
  createIconButton(icon, onClick) {
    const button = document.createElement('button');
    button.style.cssText = `
      width: 40px;
      height: 40px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    button.innerHTML = icon;

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 255, 255, 0.2)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.6)';
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(0, 0, 0, 0.8)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when game UI is visible
      if (!this.isVisible) return;

      switch (e.code) {
        case 'F11':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'KeyM':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggleMute();
          }
          break;
        case 'KeyH':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggleHelpPanel();
          }
          break;
        case 'KeyN':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.toggleDayNight();
          }
          break;
        // Removed Ctrl+R restart shortcut to avoid accidental level resets
      }
    });
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    this.onToggleFullscreen(this.isFullscreen);
    
    // Update button icon
    const fullscreenBtn = this.container.querySelector('[title*="Fullscreen"]');
    if (fullscreenBtn) {
      fullscreenBtn.innerHTML = this.isFullscreen ? '⛶' : '⛶';
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.onToggleMute(this.isMuted);
    
    // Update button icon
    if (this.muteButton) {
      this.muteButton.innerHTML = this.isMuted ? '🔇' : '🔊';
      this.muteButton.style.color = this.isMuted ? '#ff6b6b' : '#ffffff';
    }
  }

  /**
   * Toggle help panel visibility
   */
  toggleHelpPanel() {
    if (this.helpPanel) {
      const isVisible = this.helpPanel.style.display !== 'none';
      this.helpPanel.style.display = isVisible ? 'none' : 'block';
    }
  }

  /**
   * Toggle day/night mode
   */
  toggleDayNight() {
    // Call the callback - let the manager handle the actual toggle
    // The callback will update us via setDayNightState
    this.onToggleDayNight();
  }

  /**
   * Update day/night button state (called from external system)
   */
  setDayNightState(isNight) {
    this.isNight = isNight;
    if (this.dayNightButton) {
      this.dayNightButton.innerHTML = isNight ? '🌙' : '☀️';
      this.dayNightButton.title = isNight ? 'Switch to Day (N)' : 'Switch to Night (N)';
    }
  }

  /**
   * Toggle FPS display (placeholder for future implementation)
   */
  toggleFPSDisplay() {
    console.log('FPS display toggle - feature coming soon');
  }

  /**
   * Show the game UI
   */
  show() {
    this.isVisible = true;
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  /**
   * Hide the game UI
   */
  hide() {
    this.isVisible = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Update UI elements (called from game loop)
   */
  update(delta) {
    // Auto-select floor based on player position if enabled
    if (this._mm.autoFloor) this._autoSelectFloor();
    // Redraw background if extents/floor changed; always redraw player pointer
    this._drawMinimapBackground();
    this._drawPlayerPointer();
  }

  // ===== Minimap helpers =====
  _getExtentsByFloor() {
    return (this.minimapData && typeof this.minimapData.getExtentsByFloor === 'function')
      ? (this.minimapData.getExtentsByFloor() || {})
      : {};
  }

  _normalizeFloorData(floorData) {
    if (!floorData) return { platforms: [], blocks: [] };
    if (Array.isArray(floorData)) return { platforms: floorData, blocks: [] };
    const platforms = Array.isArray(floorData.platforms) ? floorData.platforms : [];
    const blocks = Array.isArray(floorData.blocks) ? floorData.blocks : [];
    return { platforms, blocks };
  }

  _computeWorldBounds(extents) {
    if (!extents || !extents.length) return null;
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for (const e of extents) { if (!e) continue; minX=Math.min(minX,e.minX); maxX=Math.max(maxX,e.maxX); minZ=Math.min(minZ,e.minZ); maxZ=Math.max(maxZ,e.maxZ);}    
    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minZ) || !isFinite(maxZ)) return null;
    const mx = (maxX-minX)*0.05 || 1; const mz=(maxZ-minZ)*0.05 || 1;
    return {minX:minX-mx,maxX:maxX+mx,minZ:minZ-mz,maxZ:maxZ+mz};
  }

  _worldToCanvas(x,z) {
    const mm=this._mm; if(!mm.worldBounds) return null;
    const {minX,maxX,minZ,maxZ}=mm.worldBounds; const w=mm.width,h=mm.height,p=mm.padding;
    const sx=(w-p*2)/(maxX-minX||1), sz=(h-p*2)/(maxZ-minZ||1);
    return { u: p + (x-minX)*sx, v: p + (z-minZ)*sz };
  }

  _autoSelectFloor() {
    const floors = this._getExtentsByFloor();
    const p = this.minimapData?.getPlayerPosition?.();
    if (!p) return;
    for (const floorKey of Object.keys(floors)) {
      const fd = this._normalizeFloorData(floors[floorKey]);
      const all = [...fd.platforms, ...fd.blocks];
      const bounds = this._computeWorldBounds(all);
      if (!bounds) continue;
      if (p.x >= bounds.minX && p.x <= bounds.maxX && p.z >= bounds.minZ && p.z <= bounds.maxZ) {
        const n = parseInt(floorKey);
        if (this._mm.selectedFloor !== n) {
          this._mm.selectedFloor = n;
          this._drawMinimapBackground(true);
        }
        return;
      }
    }
  }

  _drawMinimapBackground(force=false) {
    const mm=this._mm; if(!mm.bgCtx) return;
    const floors = this._getExtentsByFloor();
    const fd = this._normalizeFloorData(floors[mm.selectedFloor] || []);
    const hash = JSON.stringify({f:mm.selectedFloor,e:fd});
    if (!force && hash === mm.extentsHash && mm.worldBounds) return;
    mm.extentsHash = hash;
    mm.worldBounds = this._computeWorldBounds([...(fd.platforms||[]), ...(fd.blocks||[])]);

    const ctx = mm.bgCtx; ctx.clearRect(0,0,mm.width,mm.height);
    // Background
    ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(0,0,mm.width,mm.height);
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.strokeRect(1,1,mm.width-2,mm.height-2);
    // Platforms
    if (mm.worldBounds) {
      ctx.lineWidth=1.5;
      // Draw platforms
      ctx.fillStyle='rgba(78,205,196,0.35)'; ctx.strokeStyle='rgba(78,205,196,0.9)';
      for (const e of fd.platforms) {
        const p1=this._worldToCanvas(e.minX,e.minZ); const p2=this._worldToCanvas(e.maxX,e.maxZ); if(!p1||!p2) continue;
        const x=Math.min(p1.u,p2.u), y=Math.min(p1.v,p2.v), w=Math.abs(p2.u-p1.u), h=Math.abs(p2.v-p1.v);
        ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h);
      }
      // Draw concrete blocks
      ctx.fillStyle='rgba(236,236,236,0.55)'; ctx.strokeStyle='rgba(255,255,255,0.9)';
      for (const e of fd.blocks) {
        const p1=this._worldToCanvas(e.minX,e.minZ); const p2=this._worldToCanvas(e.maxX,e.maxZ); if(!p1||!p2) continue;
        const x=Math.min(p1.u,p2.u), y=Math.min(p1.v,p2.v), w=Math.abs(p2.u-p1.u), h=Math.abs(p2.v-p1.v);
        ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h);
      }
    } else {
      ctx.fillStyle='#fff'; ctx.font='bold 11px Arial'; ctx.textAlign='center';
      ctx.fillText('No floor data', mm.width/2, mm.height/2);
    }
  }

  _drawPlayerPointer() {
    const mm=this._mm; if(!mm.fgCtx || !mm.worldBounds) return;
    const ctx=mm.fgCtx; ctx.clearRect(0,0,mm.width,mm.height);
    const p=this.minimapData?.getPlayerPosition?.(); if(!p) return;
    const uv=this._worldToCanvas(p.x,p.z); if(!uv) return;
    ctx.fillStyle='rgba(255,107,107,0.95)'; ctx.strokeStyle='#fff'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(uv.u,uv.v,4,0,Math.PI*2); ctx.fill(); ctx.stroke();
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
