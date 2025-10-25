import { HealthConfig, DamageType } from '../../config/healthConfig.js';

/**
 * PlayerHealth - Manages player health, lives, damage, and respawn logic
 * This class is modular and integrates easily with existing player systems
 */
export class PlayerHealth {
  constructor(options = {}) {
    // Configuration
    this.maxHealth = options.maxHealth || HealthConfig.MAX_HEALTH;
    this.maxLives = options.permadeath ? HealthConfig.PERMADEATH_LIVES : (options.maxLives || HealthConfig.MAX_LIVES);
    this.permadeathMode = options.permadeath || HealthConfig.PERMADEATH_MODE;
    this.checkpointsEnabled = this.permadeathMode ? false : (options.checkpointsEnabled ?? HealthConfig.CHECKPOINTS_ENABLED);

    // Current state
    this.currentHealth = this.maxHealth;
    this.currentLives = this.maxLives;
    this.isAlive = true;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;

    // Checkpoint system
    this.lastCheckpoint = options.initialPosition || { x: 0, y: 1, z: 0 };

    // Optional: callback to find a safe respawn position
    this.findSafeRespawnPosition = options.findSafeRespawnPosition || null;

    // Callbacks
    this.onDamage = options.onDamage || null;
    this.onHeal = options.onHeal || null;
    this.onDeath = options.onDeath || null;
    this.onRespawn = options.onRespawn || null;
    this.onGameOver = options.onGameOver || null;
    this.onLifeLost = options.onLifeLost || null;

    // Statistics
    this.stats = {
      totalDamageTaken: 0,
      totalHealing: 0,
      deathCount: 0,
      damageByType: {},
    };

    // Initialize damage tracking
    Object.values(DamageType).forEach(type => {
      this.stats.damageByType[type] = 0;
    });
  }
  
  /**
   * Apply damage to the player
   * @param {number} amount - Amount of damage to apply
   * @param {string} damageType - Type of damage (from DamageType enum)
   * @returns {boolean} - Returns true if player is still alive
   */
  takeDamage(amount, damageType = DamageType.ENVIRONMENTAL) {
    // Check invulnerability
    if (this.isInvulnerable || !this.isAlive) {
      return this.isAlive;
    }
    
    // Apply damage
    const actualDamage = Math.min(amount, this.currentHealth);
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    
    // Update statistics
    this.stats.totalDamageTaken += actualDamage;
    this.stats.damageByType[damageType] = (this.stats.damageByType[damageType] || 0) + actualDamage;
    
    // Trigger damage callback
    if (this.onDamage) {
      this.onDamage(actualDamage, this.currentHealth, this.maxHealth, damageType);
    }
    
    // Check if health depleted
    if (this.currentHealth <= 0) {
      this.die();
      return false;
    }
    
    return true;
  }
  
  /**
   * Heal the player
   * @param {number} amount - Amount of health to restore
   * @returns {number} - Actual amount healed
   */
  heal(amount) {
    if (!this.isAlive) return 0;
    
    const beforeHealth = this.currentHealth;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    const actualHeal = this.currentHealth - beforeHealth;
    
    // Update statistics
    this.stats.totalHealing += actualHeal;
    
    // Trigger heal callback
    if (this.onHeal && actualHeal > 0) {
      this.onHeal(actualHeal, this.currentHealth, this.maxHealth);
    }
    
    return actualHeal;
  }
  
  /**
   * Handle player death
   */
  die() {
    this.currentHealth = 0;
    this.stats.deathCount++;
    
    // Trigger death callback
    if (this.onDeath) {
      this.onDeath(this.currentLives);
    }
    
    // Lose a life
    this.currentLives--;
    
    // Trigger life lost callback
    if (this.onLifeLost) {
      this.onLifeLost(this.currentLives, this.maxLives);
    }
    
    // Check for game over
    if (this.currentLives <= 0) {
      this.gameOver();
    } else {
      // Respawn if lives remain
      this.respawn();
    }
  }
  
  /**
   * Respawn the player at a safe position near the last checkpoint
   */
  respawn() {
    // Restore health
    this.currentHealth = Math.floor(this.maxHealth * HealthConfig.RESPAWN_HEALTH_PERCENTAGE);
    this.isAlive = true;

    // Find a safe respawn position (above ground, away from obstacles)
    let respawnPosition = this.lastCheckpoint;
    if (typeof this.findSafeRespawnPosition === 'function') {
      const safePos = this.findSafeRespawnPosition(this.lastCheckpoint);
      if (safePos) respawnPosition = safePos;
    } else {
      // Default: offset above checkpoint
      respawnPosition = {
        x: this.lastCheckpoint.x,
        y: this.lastCheckpoint.y + 2,
        z: this.lastCheckpoint.z
      };
    }

    // Grant temporary invulnerability
    this.setInvulnerable(HealthConfig.RESPAWN_INVULNERABILITY_DURATION);

    // Trigger respawn callback
    if (this.onRespawn) {
      this.onRespawn(respawnPosition, this.currentHealth, this.currentLives);
    }
  }
  
  /**
   * Handle game over
   */
  gameOver() {
    this.isAlive = false;
    this.currentLives = 0;
    
    // Trigger game over callback
    if (this.onGameOver) {
      this.onGameOver(this.stats);
    }
  }
  
  /**
   * Set a checkpoint for respawning
   * @param {Object} position - {x, y, z} position for checkpoint
   */
  setCheckpoint(position) {
    if (!this.checkpointsEnabled) return;
    
    this.lastCheckpoint = { ...position };
  }
  
  /**
   * Set temporary invulnerability
   * @param {number} duration - Duration in seconds
   */
  setInvulnerable(duration) {
    this.isInvulnerable = true;
    this.invulnerabilityTimer = duration;
  }
  
  /**
   * Update invulnerability timer
   * @param {number} delta - Time elapsed since last frame
   */
  update(delta) {
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= delta;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
      }
    }
  }
  
  /**
   * Reset the health system (for new game)
   */
  reset() {
    this.currentHealth = this.maxHealth;
    this.currentLives = this.maxLives;
    this.isAlive = true;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    
    // Reset statistics
    this.stats.totalDamageTaken = 0;
    this.stats.totalHealing = 0;
    this.stats.deathCount = 0;
    Object.values(DamageType).forEach(type => {
      this.stats.damageByType[type] = 0;
    });
  }
  
  /**
   * Getters for health state
   */
  getHealthPercentage() {
    return (this.currentHealth / this.maxHealth) * 100;
  }
  
  isLowHealth() {
    return this.getHealthPercentage() <= HealthConfig.LOW_HEALTH_THRESHOLD;
  }
  
  isCriticalHealth() {
    return this.getHealthPercentage() <= HealthConfig.CRITICAL_HEALTH_THRESHOLD;
  }
  
  getState() {
    return {
      health: this.currentHealth,
      maxHealth: this.maxHealth,
      healthPercentage: this.getHealthPercentage(),
      lives: this.currentLives,
      maxLives: this.maxLives,
      isAlive: this.isAlive,
      isInvulnerable: this.isInvulnerable,
      isLowHealth: this.isLowHealth(),
      isCriticalHealth: this.isCriticalHealth(),
    };
  }
}