import * as THREE from '../../../public/libs/three137/three.module.js';
import { WinEffects } from './WinEffects.js';
import { WinSound } from './WinSound.js';
import { MissionPopup } from '../ui/MissionPopup.js';
import { HelicopterEscape } from './HelicopterEscape.js';

/**
 * WinAnimation - Main component that orchestrates winning animations
 * Combines visual effects, audio, and character animations
 */
export class WinAnimation {
  constructor(options = {}) {
    this.scene = options.scene;
    this.character = options.character; // Reference to character with animation system
    this.helicopter = options.helicopter; // Reference to helicopter for escape sequence
    this.isActive = false;
    this.duration = options.duration || 4.0; // Total animation duration
    this.timer = 0;
    
    // Animation phases
    this.phase = 'idle'; // 'idle', 'initial_jump', 'celebration', 'helicopter_escape', 'ending'
    this.phaseTimer = 0;
    
    // Store original character state
    this.originalPosition = new THREE.Vector3();
    this.originalRotation = new THREE.Quaternion();
    
    // Initialize sub-components
    this.effects = new WinEffects({
      scene: this.scene,
      duration: this.duration,
      particleCount: options.particleCount || 60,
      colors: options.colors
    });
    
    this.sound = new WinSound({
      volume: options.volume || 0.3,
      enabled: options.soundEnabled !== false
    });

    this.missionPopup = new MissionPopup({
      animationDuration: 0.6,
      autoHideDelay: 0, // Disabled - user must close manually
      onShow: () => console.log('Mission popup shown'),
      onClose: () => console.log('Mission popup closed')
    });
    
    // Initialize helicopter escape sequence
    this.helicopterEscape = new HelicopterEscape({
      scene: this.scene,
      character: this.character,
      helicopter: this.helicopter,
      duration: 8.0
    });
    
    // Animation settings - shorter celebration before helicopter escape
    this.jumpSequence = [
      { time: 0.0, action: 'jump' },
      { time: 0.8, action: 'idle' },
      { time: 1.0, action: 'jump' },
      { time: 1.8, action: 'idle' }
    ];
    
    this.currentJumpIndex = 0;
    this.lastJumpTime = 0;
  }

  /**
   * Trigger the complete winning animation sequence
   * @param {THREE.Vector3} position - Where to center the effects
   */
  trigger(position) {
    if (this.isActive) return;
    
    console.log('🎉 WINNING ANIMATION SEQUENCE STARTED! 🎉');
    
    this.isActive = true;
    this.timer = 0;
    this.phase = 'initial_jump';
    this.phaseTimer = 0;
    this.currentJumpIndex = 0;
    this.lastJumpTime = 0;
    
    // Store original character state
    if (this.character && this.character.model) {
      this.originalPosition.copy(this.character.model.position);
      this.originalRotation.copy(this.character.model.quaternion);
    }
    
    // Start effects immediately
    this.effects.trigger(position);
    
    // Play sound
    this.sound.play();
    
    // Mission popup will be shown after helicopter escape sequence completes
    
    // Start initial jump
    this.playCharacterAction('jump', 0.2);
  }

  /**
   * Update the animation sequence
   * @param {number} delta - Time delta
   */
  update(delta) {
    if (!this.isActive) return;
    
    this.timer += delta;
    this.phaseTimer += delta;
    
    // Update effects
    this.effects.update(delta);
    
    // Handle animation phases
    this.updateAnimationPhases(delta);
    
    // Check if animation is complete
    if (this.timer >= this.duration) {
      this.endAnimation();
    }
  }

  /**
   * Update animation phases
   * @param {number} delta - Time delta
   */
  updateAnimationPhases(delta) {
    switch (this.phase) {
      case 'initial_jump':
        // Wait for initial jump to complete, then move to celebration
        if (this.phaseTimer >= 0.8) {
          this.phase = 'celebration';
          this.phaseTimer = 0;
        }
        break;
        
      case 'celebration':
        this.updateJumpSequence(delta);
        this.updateCharacterRotation(delta);
        
        // After celebration, start helicopter escape
        if (this.phaseTimer >= 2.0) {
          this.phase = 'helicopter_escape';
          this.phaseTimer = 0;
          this.helicopterEscape.trigger();
        }
        break;
        
      case 'helicopter_escape':
        // Update helicopter escape sequence
        this.helicopterEscape.update(delta);
        
        // When escape is complete, show mission popup after 5 seconds
        if (!this.helicopterEscape.isRunning()) {
          this.phase = 'ending';
          this.phaseTimer = 0;
          
          // Show mission popup after 5 seconds delay
          setTimeout(() => {
            this.missionPopup.show({
              health: this.character?.health?.currentHealth || 100,
              maxHealth: this.character?.health?.maxHealth || 100,
              lives: this.character?.health?.currentLives || 3,
              time: '03:45' // This could be passed from the game
            });
          }, 5000);
        }
        break;
        
      case 'ending':
        // Fade back to normal
        if (this.phaseTimer >= 0.5) {
          this.playCharacterAction('idle', 0.3);
        }
        break;
    }
  }

  /**
   * Update the jump sequence during celebration
   * @param {number} delta - Time delta
   */
  updateJumpSequence(delta) {
    if (this.currentJumpIndex < this.jumpSequence.length) {
      const nextJump = this.jumpSequence[this.currentJumpIndex];
      
      if (this.timer >= nextJump.time && this.timer - this.lastJumpTime >= 0.1) {
        this.playCharacterAction(nextJump.action, 0.1);
        this.currentJumpIndex++;
        this.lastJumpTime = this.timer;
      }
    }
  }

  /**
   * Update character rotation during celebration
   * @param {number} delta - Time delta
   */
  updateCharacterRotation(delta) {
    if (this.character && this.character.model) {
      // Gentle swaying motion
      const swayAmount = Math.sin(this.timer * 3) * 0.05;
      const rotationAmount = Math.sin(this.timer * 4) * 0.08;
      
      this.character.model.rotation.y += rotationAmount * delta;
      this.character.model.rotation.x += swayAmount * delta;
    }
  }

  /**
   * Play a character action if the character supports it
   * @param {string} action - Action name
   * @param {number} fadeDuration - Fade duration
   */
  playCharacterAction(action, fadeDuration = 0.2) {
    if (this.character && this.character.playAction) {
      this.character.playAction(action, fadeDuration);
    }
  }

  /**
   * End the animation sequence
   */
  endAnimation() {
    console.log('🎉 WINNING ANIMATION SEQUENCE COMPLETE! 🎉');
    
    this.phase = 'ending';
    this.phaseTimer = 0;
    
    // Ensure character returns to idle
    this.playCharacterAction('idle', 0.5);
    
    // Clean up after a brief delay
    setTimeout(() => {
      this.cleanup();
    }, 1000);
  }

  /**
   * Check if animation is currently active
   * @returns {boolean}
   */
  isRunning() {
    return this.isActive;
  }

  /**
   * Get current animation progress (0-1)
   * @returns {number}
   */
  getProgress() {
    return Math.min(1, this.timer / this.duration);
  }

  /**
   * Stop the animation early
   */
  stop() {
    if (this.isActive) {
      this.endAnimation();
    }
  }

  /**
   * Clean up all resources
   */
  cleanup() {
    this.isActive = false;
    this.timer = 0;
    this.phase = 'idle';
    this.phaseTimer = 0;
    this.currentJumpIndex = 0;
    this.lastJumpTime = 0;
    
    // Clean up sub-components
    this.effects.cleanup();
    this.sound.dispose();
    this.missionPopup.dispose();
    
    // Restore original character state if needed
    if (this.character && this.character.model) {
      // Don't force position restoration as character might have moved
      // Just ensure we're in idle state
      this.playCharacterAction('idle', 0.3);
    }
  }

  /**
   * Configure animation settings
   * @param {Object} options - Configuration options
   */
  configure(options) {
    if (options.duration) this.duration = options.duration;
    if (options.particleCount) this.effects.particleCount = options.particleCount;
    if (options.volume !== undefined) this.sound.setVolume(options.volume);
    if (options.soundEnabled !== undefined) this.sound.setEnabled(options.soundEnabled);
    if (options.colors) this.effects.colors = options.colors;
  }
}
