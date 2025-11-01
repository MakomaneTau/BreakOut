import * as THREE from '../../../public/libs/three137/three.module.js';

/**
 * InteractiveMap - Full-screen interactive map with fog of war, checkpoints, and objectives
 */
export class InteractiveMap {
  constructor(options = {}) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.getPlayerPosition = options.getPlayerPosition || (() => null);
    this.getExtentsByFloor = options.getExtentsByFloor || (() => ({}));
    this.onClose = options.onClose || (() => {});
    
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.isVisible = false;
    
    // Map settings
    this.width = 800;
    this.height = 800;
    this.padding = 40;
    this.fogRadius = 30; // Reveal radius around player
    this.revealRate = 0.5; // How fast fog clears (0-1)
    
    // Fog of war data - stores revealed areas as alpha values (0 = hidden, 1 = revealed)
    this.fogOfWar = null;
    this.fogOfWarCtx = null;
    
    // World bounds
    this.worldBounds = { minX: -50, maxX: 10, minZ: -10, maxZ: 10 };
    this.selectedFloor = 1;
    
    // Checkpoints and objectives
    this.checkpoints = [];
    this.objectives = [];
    
    // Camera position for map view
    this.mapZoom = 1.0;
    this.mapPanX = 0;
    this.mapPanZ = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    this.setupKeyboardShortcuts();
  }
  
  setupKeyboardShortcuts() {
    this.keyHandler = (e) => {
      if (!this.isVisible) return;
      
      if (e.code === 'KeyM' || e.code === 'Escape') {
        this.hide();
        e.preventDefault();
      } else if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') {
        const floor = parseInt(e.code.replace('Digit', ''));
        this.selectFloor(floor);
        e.preventDefault();
      } else if (e.code === 'Equal' || e.code === 'Minus') {
        const zoomDelta = e.code === 'Equal' ? 0.1 : -0.1;
        this.zoom(zoomDelta);
        e.preventDefault();
      }
    };
  }
  
  /**
   * Show the interactive map
   */
  show() {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.createUI();
    
    // Initialize fog of war if needed
    if (!this.fogOfWar) {
      this.initializeFogOfWar();
    }
    
    // Update world bounds from extents
    this.updateWorldBounds();
    
    // Start update loop
    this.startUpdateLoop();
    
    // Add keyboard listener
    document.addEventListener('keydown', this.keyHandler);
  }
  
  /**
   * Hide the interactive map
   */
  hide() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    
    // Stop update loop
    this.stopUpdateLoop();
    
    // Remove keyboard listener
    document.removeEventListener('keydown', this.keyHandler);
    
    if (this.onClose) this.onClose();
  }
  
  /**
   * Initialize fog of war canvas
   */
  initializeFogOfWar() {
    this.fogOfWar = document.createElement('canvas');
    this.fogOfWar.width = this.width;
    this.fogOfWar.height = this.height;
    this.fogOfWarCtx = this.fogOfWar.getContext('2d');
    
    // Initialize with black (completely hidden)
    this.fogOfWarCtx.fillStyle = 'rgba(0, 0, 0, 255)';
    this.fogOfWarCtx.fillRect(0, 0, this.width, this.height);
  }
  
  /**
   * Update world bounds from level extents
   */
  updateWorldBounds() {
    const extents = this.getExtentsByFloor();
    const floorData = extents[this.selectedFloor];
    
    if (floorData && floorData.platforms && floorData.platforms.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      
      floorData.platforms.forEach(p => {
        minX = Math.min(minX, p.minX);
        maxX = Math.max(maxX, p.maxX);
        minZ = Math.min(minZ, p.minZ);
        maxZ = Math.max(maxZ, p.maxZ);
      });
      
      // Add padding
      const padding = 5;
      this.worldBounds = {
        minX: minX - padding,
        maxX: maxX + padding,
        minZ: minZ - padding,
        maxZ: maxZ + padding
      };
    }
  }
  
  /**
   * Create the map UI
   */
  createUI() {
    this.container = document.createElement('div');
    this.container.id = 'interactive-map-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 2000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      color: white;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      width: 100%;
      max-width: ${this.width + 80}px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.8);
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'MAP';
    title.style.cssText = `
      margin: 0;
      font-size: 24px;
      letter-spacing: 3px;
    `;
    header.appendChild(title);
    
    // Floor selector
    const floorSelector = document.createElement('div');
    floorSelector.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;
    
    for (let i = 1; i <= 3; i++) {
      const btn = document.createElement('button');
      btn.textContent = `FLOOR ${i}`;
      btn.style.cssText = `
        padding: 8px 16px;
        background: ${this.selectedFloor === i ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)'};
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        cursor: pointer;
        font-weight: ${this.selectedFloor === i ? 'bold' : 'normal'};
        transition: all 0.2s;
      `;
      btn.onclick = () => this.selectFloor(i);
      floorSelector.appendChild(btn);
    }
    header.appendChild(floorSelector);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      padding: 10px 20px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
    `;
    closeBtn.onclick = () => this.hide();
    header.appendChild(closeBtn);
    
    this.container.appendChild(header);
    
    // Map canvas container
    const mapContainer = document.createElement('div');
    mapContainer.style.cssText = `
      position: relative;
      width: ${this.width}px;
      height: ${this.height}px;
      background: #1a1a2e;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      overflow: hidden;
      cursor: move;
    `;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.cssText = `
      display: block;
      image-rendering: pixelated;
    `;
    this.ctx = this.canvas.getContext('2d');
    
    // Add mouse controls for pan/zoom
    this.setupMapControls(mapContainer);
    
    mapContainer.appendChild(this.canvas);
    this.container.appendChild(mapContainer);
    
    // Legend
    const legend = document.createElement('div');
    legend.style.cssText = `
      width: 100%;
      max-width: ${this.width + 80}px;
      padding: 15px;
      display: flex;
      justify-content: center;
      gap: 30px;
      background: rgba(0, 0, 0, 0.8);
      border-top: 2px solid rgba(255, 255, 255, 0.3);
    `;
    
    const legendItems = [
      { color: '#4CAF50', label: 'Player' },
      { color: '#2196F3', label: 'Checkpoint' },
      { color: '#FF9800', label: 'Objective' },
      { color: '#666666', label: 'Explored' },
      { color: '#000000', label: 'Unexplored' }
    ];
    
    legendItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      const colorBox = document.createElement('div');
      colorBox.style.cssText = `
        width: 20px;
        height: 20px;
        background: ${item.color};
        border: 1px solid rgba(255, 255, 255, 0.3);
      `;
      itemDiv.appendChild(colorBox);
      
      const label = document.createElement('span');
      label.textContent = item.label;
      label.style.cssText = `font-size: 14px;`;
      itemDiv.appendChild(label);
      legend.appendChild(itemDiv);
    });
    
    this.container.appendChild(legend);
    
    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      margin-top: 10px;
      font-size: 12px;
      opacity: 0.7;
      text-align: center;
    `;
    instructions.textContent = 'Press M or ESC to close | Mouse drag to pan | +/- to zoom | 1/2/3 to switch floors';
    this.container.appendChild(instructions);
    
    document.body.appendChild(this.container);
  }
  
  /**
   * Setup mouse controls for panning and zooming
   */
  setupMapControls(mapContainer) {
    mapContainer.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
    
    mapContainer.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = (e.clientX - this.lastMouseX) * 0.01 / this.mapZoom;
        const dy = (e.clientY - this.lastMouseY) * 0.01 / this.mapZoom;
        
        this.mapPanX -= dx;
        this.mapPanZ -= dy;
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        
        this.render();
      }
    });
    
    mapContainer.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    
    mapContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = -e.deltaY * 0.001;
      this.zoom(zoomDelta);
    });
  }
  
  /**
   * Zoom the map
   */
  zoom(delta) {
    this.mapZoom = Math.max(0.5, Math.min(3.0, this.mapZoom + delta));
    this.render();
  }
  
  /**
   * Select a floor
   */
  selectFloor(floor) {
    this.selectedFloor = floor;
    this.updateWorldBounds();
    this.render();
    
    // Update floor buttons
    if (this.container) {
      const buttons = this.container.querySelectorAll('button');
      buttons.forEach((btn, idx) => {
        if (btn.textContent.startsWith('FLOOR')) {
          const btnFloor = idx + 1;
          btn.style.background = this.selectedFloor === btnFloor ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)';
          btn.style.fontWeight = this.selectedFloor === btnFloor ? 'bold' : 'normal';
        }
      });
    }
  }
  
  /**
   * Add a checkpoint
   */
  addCheckpoint(position, label = 'Checkpoint') {
    this.checkpoints.push({ position, label });
    this.render();
  }
  
  /**
   * Add an objective
   */
  addObjective(position, label = 'Objective') {
    this.objectives.push({ position, label });
    this.render();
  }
  
  /**
   * Reveal area around player position (fog of war)
   */
  revealArea(worldX, worldZ, radius = this.fogRadius) {
    if (!this.fogOfWar || !this.fogOfWarCtx) return;
    
    const bounds = this.worldBounds;
    const scaleX = this.width / (bounds.maxX - bounds.minX);
    const scaleZ = this.height / (bounds.maxZ - bounds.minZ);
    
    const mapX = (worldX - bounds.minX) * scaleX;
    const mapZ = (worldZ - bounds.minZ) * scaleZ;
    
    // Create gradient for smooth reveal
    const gradient = this.fogOfWarCtx.createRadialGradient(
      mapX, mapZ, 0,
      mapX, mapZ, radius * Math.min(scaleX, scaleZ)
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Fully revealed at center
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)'); // Partially revealed
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)'); // Hidden at edge
    
    this.fogOfWarCtx.globalCompositeOperation = 'destination-out';
    this.fogOfWarCtx.fillStyle = gradient;
    this.fogOfWarCtx.beginPath();
    this.fogOfWarCtx.arc(mapX, mapZ, radius * Math.min(scaleX, scaleZ), 0, Math.PI * 2);
    this.fogOfWarCtx.fill();
    this.fogOfWarCtx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * Render the map
   */
  render() {
    if (!this.ctx || !this.canvas) return;
    
    const bounds = this.worldBounds;
    const extents = this.getExtentsByFloor();
    const floorData = extents[this.selectedFloor] || { platforms: [], blocks: [] };
    
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Calculate scale and offset with zoom and pan
    const scaleX = (this.width / (bounds.maxX - bounds.minX)) * this.mapZoom;
    const scaleZ = (this.height / (bounds.maxZ - bounds.minZ)) * this.mapZoom;
    const offsetX = this.mapPanX * this.width;
    const offsetZ = this.mapPanZ * this.height;
    
    const worldToMap = (x, z) => {
      return {
        x: (x - bounds.minX) * scaleX + offsetX,
        z: (z - bounds.minZ) * scaleZ + offsetZ
      };
    };
    
    // Draw platforms (gray for structure)
    this.ctx.fillStyle = '#444466';
    floorData.platforms.forEach(platform => {
      const min = worldToMap(platform.minX, platform.minZ);
      const max = worldToMap(platform.maxX, platform.maxZ);
      this.ctx.fillRect(min.x, min.z, max.x - min.x, max.z - min.z);
    });
    
    // Draw obstacles (red for danger)
    this.ctx.fillStyle = '#ff4444';
    floorData.blocks.forEach(block => {
      const min = worldToMap(block.minX, block.minZ);
      const max = worldToMap(block.maxX, block.maxZ);
      this.ctx.fillRect(min.x, min.z, max.x - min.x, max.z - min.z);
    });
    
    // Draw checkpoints
    this.ctx.fillStyle = '#2196F3';
    this.checkpoints.forEach(cp => {
      const pos = worldToMap(cp.position.x, cp.position.z);
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.z, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(cp.label, pos.x + 10, pos.z);
      this.ctx.fillStyle = '#2196F3';
    });
    
    // Draw objectives
    this.ctx.fillStyle = '#FF9800';
    this.objectives.forEach(obj => {
      const pos = worldToMap(obj.position.x, obj.position.z);
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.z, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(obj.label, pos.x + 10, pos.z);
      this.ctx.fillStyle = '#FF9800';
    });
    
    // Draw player position
    const playerPos = this.getPlayerPosition();
    if (playerPos) {
      const pos = worldToMap(playerPos.x, playerPos.z);
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.z, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw direction indicator
      this.ctx.strokeStyle = '#4CAF50';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.z);
      this.ctx.lineTo(pos.x, pos.z - 15);
      this.ctx.stroke();
    }
    
    // Apply fog of war overlay
    if (this.fogOfWar) {
      this.ctx.globalAlpha = 0.8;
      this.ctx.drawImage(this.fogOfWar, 0, 0, this.width, this.height);
      this.ctx.globalAlpha = 1.0;
    }
  }
  
  /**
   * Update loop - reveals fog of war as player moves
   */
  startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      if (!this.isVisible) return;
      
      const playerPos = this.getPlayerPosition();
      if (playerPos) {
        this.revealArea(playerPos.x, playerPos.z);
      }
      
      this.render();
    }, 100); // Update every 100ms
  }
  
  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

