/**
 * Health and Lives System Configuration
 * Centralized constants for easy tuning
 */

export const HealthConfig = {
  // Health settings
  MAX_HEALTH: 100,
  DEFAULT_HEALTH: 100,
  
  // Lives settings
  MAX_LIVES: 3,
  DEFAULT_LIVES: 3,
  PERMADEATH_LIVES: 1,
  
  // Damage values
  OBSTACLE_DAMAGE: 20,
  TRAP_DAMAGE: 30,
  ENEMY_DAMAGE: 15,
  FALL_DAMAGE: 50,
  
  // Healing
  SMALL_HEAL: 25,
  MEDIUM_HEAL: 50,
  FULL_HEAL: 100,
  
  // Respawn settings
  RESPAWN_INVULNERABILITY_DURATION: 2.0, // seconds
  RESPAWN_HEALTH_PERCENTAGE: 1.0, // 100% health on respawn
  DAMAGE_COOLDOWN_DURATION: 0.5, // seconds - prevent rapid damage from same source
  
  // UI settings
  DAMAGE_FLASH_DURATION: 0.3, // seconds
  LOW_HEALTH_THRESHOLD: 30, // percentage
  CRITICAL_HEALTH_THRESHOLD: 15, // percentage
  
  // Game modes
  PERMADEATH_MODE: false, // Toggle for permadeath
  CHECKPOINTS_ENABLED: true, // Toggle for checkpoint system
};

/**
 * Damage types enum for different sources of damage
 */
export const DamageType = {
  OBSTACLE: 'obstacle',
  TRAP: 'trap',
  ENEMY: 'enemy',
  FALL: 'fall',
  ENVIRONMENTAL: 'environmental',
};
