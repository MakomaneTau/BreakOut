/**
 * WinSound - Audio effects component for winning animations
 * Handles victory sounds and audio celebrations
 */
export class WinSound {
  constructor(options = {}) {
    this.volume = options.volume || 0.3;
    this.enabled = options.enabled !== false;
    this.audioContext = null;
    this.isPlaying = false;
  }

  /**
   * Initialize audio context (required for browser autoplay policies)
   */
  init() {
    if (!this.enabled) return;
    
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.log('Audio not available:', error);
      this.enabled = false;
    }
  }

  /**
   * Play winning sound effect
   */
  play() {
    if (!this.enabled || this.isPlaying) return;
    
    this.isPlaying = true;
    
    try {
      if (!this.audioContext) {
        this.init();
      }
      
      if (this.audioContext) {
        this.playVictoryMelody();
      }
    } catch (error) {
      console.log('Failed to play sound:', error);
    }
  }

  /**
   * Play a triumphant victory melody
   */
  playVictoryMelody() {
    // Victory chord progression: C major ascending
    const frequencies = [
      [261.63, 329.63, 392.00], // C-E-G (C major)
      [293.66, 369.99, 440.00], // D-F#-A (D major)
      [329.63, 415.30, 493.88], // E-G#-B (E major)
      [523.25, 659.25, 783.99]  // C-E-G (C major octave)
    ];
    
    frequencies.forEach((chord, index) => {
      setTimeout(() => {
        this.playChord(chord, 0.8); // Play each chord for 0.8 seconds
      }, index * 400); // 400ms between chords
    });
    
    // Reset playing state after melody completes
    setTimeout(() => {
      this.isPlaying = false;
    }, frequencies.length * 400 + 800);
  }

  /**
   * Play a chord (multiple notes simultaneously)
   * @param {number[]} frequencies - Array of frequencies to play
   * @param {number} duration - How long to play the chord
   */
  playChord(frequencies, duration) {
    frequencies.forEach(freq => {
      this.playTone(freq, duration, this.volume * 0.3); // Lower volume for chords
    });
  }

  /**
   * Play a single tone
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {number} volume - Volume (0-1)
   */
  playTone(frequency, duration, volume = this.volume) {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Envelope: quick attack, gradual decay
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Play a simple victory fanfare
   */
  playFanfare() {
    if (!this.enabled || this.isPlaying) return;
    
    this.isPlaying = true;
    
    try {
      if (!this.audioContext) {
        this.init();
      }
      
      if (this.audioContext) {
        // Simple ascending scale
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
        
        notes.forEach((note, index) => {
          setTimeout(() => {
            this.playTone(note, 0.3, this.volume * 0.5);
          }, index * 150);
        });
        
        setTimeout(() => {
          this.isPlaying = false;
        }, notes.length * 150 + 300);
      }
    } catch (error) {
      console.log('Failed to play fanfare:', error);
    }
  }

  /**
   * Set volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable or disable sound
   * @param {boolean} enabled - Whether sound is enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled && this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Check if currently playing
   * @returns {boolean}
   */
  isCurrentlyPlaying() {
    return this.isPlaying;
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isPlaying = false;
  }
}
