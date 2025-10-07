// Adaptive performance manager: monitors frame time & adjusts renderer pixel ratio within bounds.

export class PerformanceManager {
  constructor(renderer, preset) {
    this.renderer = renderer;
    this.preset = preset; // object from QualityPresets
    this.samples = [];
    this.sampleSize = 60; // 1 second at 60fps
    this.lastAdjust = 0;
    this.adjustInterval = 1.5; // seconds between adaptation attempts
    this.targetFrameTime = 1 / 60; // ~16.7ms
    this.minPixelRatio = 0.7; // floor
    this.overlay = this._createOverlay();
    this._fps = 0;
    this._accumTime = 0;
    this._accumFrames = 0;
    this.applyPreset();
  }

  applyPreset() {
    const maxPR = this.preset.maxPixelRatio;
    const current = Math.min(window.devicePixelRatio, maxPR);
    this.renderer.setPixelRatio(current);
  }

  setPreset(preset) {
    this.preset = preset;
    this.applyPreset();
  }

  _createOverlay() {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:8px;top:8px;padding:4px 8px;font:12px monospace;background:rgba(0,0,0,0.45);color:#0f0;z-index:9999;pointer-events:none;border-radius:4px;';
    el.textContent = 'Perf';
    document.body.appendChild(el);
    return el;
  }

  update(dt, elapsed) {
    this.samples.push(dt);
    if (this.samples.length > this.sampleSize) this.samples.shift();

    this._accumTime += dt;
    this._accumFrames += 1;
    if (this._accumTime >= 0.5) { // update FPS twice a second
      this._fps = (this._accumFrames / this._accumTime);
      this._accumTime = 0; this._accumFrames = 0;
    }

    if (elapsed - this.lastAdjust > this.adjustInterval && this.samples.length === this.sampleSize) {
      const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length; // seconds
      const currentPR = this.renderer.getPixelRatio();
      const desiredMax = this.preset.maxPixelRatio;
      let newPR = currentPR;
      if (avg > this.targetFrameTime * 1.25) {
        // Too slow: drop resolution a bit
        newPR = Math.max(this.minPixelRatio, currentPR * 0.9);
      } else if (avg < this.targetFrameTime * 0.9 && currentPR < desiredMax) {
        // Plenty of headroom: raise resolution a bit
        newPR = Math.min(desiredMax, currentPR * 1.05);
      }
      if (Math.abs(newPR - currentPR) > 0.02) {
        this.renderer.setPixelRatio(newPR);
      }
      this.lastAdjust = elapsed;
    }
    if (this.overlay) {
      this.overlay.textContent = `${this.preset.label} ${this._fps.toFixed(0)}fps PR:${this.renderer.getPixelRatio().toFixed(2)}`;
    }
  }
}
