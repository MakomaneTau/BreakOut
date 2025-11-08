
# Collision System Developer Guide

## Overview

This document provides a comprehensive guide to the collision detection and damage system that controls how character life/health decreases when colliding with obstacles. The system handles **concrete blocks**, **spinning blades**, **lasers**, and **flying cubes**.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Components](#core-components)
3. [Collision Detection Flow](#collision-detection-flow)
4. [Obstacle Types & Damage Values](#obstacle-types--damage-values)
5. [File Structure](#file-structure)
6. [How Each Obstacle Works](#how-each-obstacle-works)
7. [Registration Process](#registration-process)
8. [Damage Application Flow](#damage-application-flow)
9. [Health System Integration](#health-system-integration)
10. [Configuration](#configuration)

---

## System Architecture

The collision system uses a **three-layer architecture**:

1. **Collision Detection Layer** (`Collider.js`, `CollisionManager.js`)
   - Detects when bounding boxes/spheres intersect
   - Uses Three.js `Box3` and `Sphere` for geometric calculations

2. **Damage Processing Layer** (`Eve.js`, `PlayerHealth.js`)
   - Determines obstacle type from collision
   - Applies appropriate damage based on obstacle type
   - Manages health, lives, and invulnerability

3. **Configuration Layer** (`healthConfig.js`)
   - Centralized damage values and health settings
   - Easy tuning of game balance

---

## Core Components

### 1. Collider (`src/components/collision/Collider.js`)

**Purpose**: Wraps a Three.js mesh with collision detection capabilities.

**Key Features**:
- Supports **box** and **sphere** collision types
- Automatically updates bounding volumes when mesh moves
- Provides `intersects()` method for collision checking

**How It Works**:
```javascript
// Creates a bounding box from the mesh
this.box = new THREE.Box3().setFromObject(this.mesh);

// Updates bounding box when mesh moves
update() {
  if (this.box) this.box.setFromObject(this.mesh);
}

// Checks intersection with another collider
intersects(other) {
  this.update();
  other.update();
  return this.box.intersectsBox(other.box);
}
```

**File Location**: `BreakOut/src/components/collision/Collider.js`

---

### 2. CollisionManager (`src/components/collision/CollisionManager.js`)

**Purpose**: Central registry and manager for all colliders in the scene.

**Key Methods**:

#### `add(mesh, type = 'box')`
- Registers a new collider
- **Parameters**: 
  - `mesh`: Three.js mesh to create collider for
  - `type`: Collision shape type ('box' or 'sphere')
- **Returns**: New `Collider` instance
- **Usage**: Called when obstacles are loaded

#### `findCollisionFor(collider)`
- Finds the first collider that intersects with the given collider
- **Parameters**: `collider` - The collider to check (usually player)
- **Returns**: Intersecting collider or `null`
- **Usage**: Called every frame in `Eve.checkDamageCollisions()`

#### `registerPlatformObstacles(platform)`
- Automatically registers all obstacles from a platform
- **Parameters**: `platform` - Platform object containing `concreteBlocks`, `spinningBlades`, `laserBarriers`
- **Process**:
  1. Iterates through all obstacles
  2. Checks if obstacle is ready (model loaded)
  3. Creates collider for each obstacle
  4. Retries if obstacles aren't ready yet (500ms delay)
- **File Location**: `BreakOut/src/components/collision/CollisionManager.js` (lines 48-117)

#### `checkPlayerCollisions(playerCollider, player)`
- Legacy method for checking collisions (not currently used)
- Alternative damage application path
- **File Location**: `BreakOut/src/components/collision/CollisionManager.js` (lines 174-198)

**File Location**: `BreakOut/src/components/collision/CollisionManager.js`

---

### 3. Eve Character (`src/components/Eve.js`)

**Purpose**: Main character controller that handles collision damage.

**Key Methods**:

#### `checkDamageCollisions()`
- **Called**: Every frame in `update()` method
- **Process**:
  1. Updates player collider position
  2. Checks for collisions using `CollisionManager.findCollisionFor()`
  3. If collision found:
     - Checks if it's finish line (triggers win)
     - Otherwise calls `handleCollisionDamage()`
- **File Location**: `BreakOut/src/components/Eve.js` (lines 656-667)

#### `handleCollisionDamage(collision)`
- **Purpose**: Determines damage amount and type based on obstacle
- **Process**:
  1. Gets obstacle type from `mesh.userData.type` OR infers from mesh name
  2. Maps obstacle type to damage value and damage type
  3. Calls `this.takeDamage(damage, damageType)`
- **File Location**: `BreakOut/src/components/Eve.js` (lines 435-470)

#### `getObstacleTypeFromName(name)`
- **Purpose**: Fallback method to infer obstacle type from mesh name
- **Logic**:
  - Names containing "concrete" or "block" → `'concrete_block'`
  - Names containing "blade" or "spinning" → `'spinning_blade'`
  - Names containing "laser" → `'laser'`
- **File Location**: `BreakOut/src/components/Eve.js` (lines 472-483)

#### `checkCollisionAtPosition(testPosition)`
- **Purpose**: Tests if a position would cause a collision (used for movement)
- **Process**:
  1. Temporarily moves collider to test position
  2. Checks for collisions
  3. Restores original position
  4. Returns `true` if collision detected
- **File Location**: `BreakOut/src/components/Eve.js` (lines 354-374)

**File Location**: `BreakOut/src/components/Eve.js`

---

### 4. PlayerHealth (`src/components/player/PlayerHealth.js`)

**Purpose**: Manages player health, lives, damage application, and respawn logic.

**Key Methods**:

#### `takeDamage(amount, damageType)`
- **Purpose**: Applies damage to player
- **Process**:
  1. Checks invulnerability (if invulnerable, returns early)
  2. Reduces health by damage amount
  3. Updates statistics
  4. Triggers `onDamage` callback
  5. If health ≤ 0, calls `die()`
- **File Location**: `BreakOut/src/components/player/PlayerHealth.js` (lines 56-82)

#### `die()`
- **Purpose**: Handles player death
- **Process**:
  1. Sets health to 0
  2. Increments death count
  3. Decrements lives
  4. Triggers callbacks (`onDeath`, `onLifeLost`)
  5. If lives > 0: calls `respawn()`
  6. If lives ≤ 0: calls `gameOver()`
- **File Location**: `BreakOut/src/components/player/PlayerHealth.js` (lines 110-134)

#### `respawn()`
- **Purpose**: Respawns player at checkpoint
- **Process**:
  1. Restores health (100% by default)
  2. Sets invulnerability for 2 seconds
  3. Triggers `onRespawn` callback
- **File Location**: `BreakOut/src/components/player/PlayerHealth.js` (lines 139-165)

**File Location**: `BreakOut/src/components/player/PlayerHealth.js`

---

### 5. HealthConfig (`src/config/healthConfig.js`)

**Purpose**: Centralized configuration for all health and damage values.

**Key Constants**:

```javascript
OBSTACLE_DAMAGE: 20      // Damage from concrete blocks
TRAP_DAMAGE: 30          // Damage from spinning blades and lasers
ENEMY_DAMAGE: 15         // Damage from enemies (not currently used)
FALL_DAMAGE: 50          // Damage from falling (not currently used)

MAX_HEALTH: 100          // Maximum player health
MAX_LIVES: 3             // Maximum player lives

RESPAWN_INVULNERABILITY_DURATION: 2.0  // Seconds of invulnerability after respawn
```

**File Location**: `BreakOut/src/config/healthConfig.js`

---

## Collision Detection Flow

### Frame-by-Frame Process

1. **Eve.update()** is called every frame
   - Location: `BreakOut/src/components/Eve.js` (line 485)

2. **Eve.checkDamageCollisions()** is called
   - Location: `BreakOut/src/components/Eve.js` (line 493)

3. **Collider.update()** updates player's bounding box
   - Location: `BreakOut/src/components/collision/Collider.js` (line 20)

4. **CollisionManager.findCollisionFor()** checks all registered colliders
   - Location: `BreakOut/src/components/collision/CollisionManager.js` (line 23)
   - Iterates through all colliders
   - Uses `Collider.intersects()` to check each one

5. **If collision detected**:
   - `Eve.handleCollisionDamage()` is called
   - Obstacle type is determined
   - Damage is applied via `PlayerHealth.takeDamage()`

6. **If health reaches 0**:
   - `PlayerHealth.die()` is called
   - Lives are decremented
   - Player respawns or game over occurs

---

## Obstacle Types & Damage Values

### Concrete Blocks

- **Type Identifier**: `'concrete_block'`
- **Damage**: `20` (from `HealthConfig.OBSTACLE_DAMAGE`)
- **Damage Type**: `DamageType.OBSTACLE`
- **File**: `BreakOut/src/components/course/concrete_blocks.js`
- **Model Path**: `public/assets/models/obstacles/concrete_obstacle/scene.gltf`
- **Registration**: Registered via `CollisionManager.registerPlatformObstacles()`

### Spinning Blades

- **Type Identifier**: `'spinning_blade'`
- **Damage**: `30` (from `HealthConfig.TRAP_DAMAGE`)
- **Damage Type**: `DamageType.TRAP`
- **File**: `BreakOut/src/components/course/spinning_blade.js`
- **Model Path**: `public/assets/models/obstacles/spinning_blade_obstacle/scene.gltf`
- **Animation**: Rotates at `9 radians/second` (line 58 of spinning_blade.js)
- **Registration**: Registered via `CollisionManager.registerPlatformObstacles()`

### Laser Barriers

- **Type Identifier**: `'laser'` or `'laser_barrier'`
- **Damage**: `30` (from `HealthConfig.TRAP_DAMAGE`)
- **Damage Type**: `DamageType.TRAP`
- **File**: `BreakOut/src/components/course/laser_barrier.js`
- **Model Path**: `public/assets/models/obstacles/laser/scene.gltf`
- **Animation**: Moves up/down with sine wave: `position.y = baseY + sin(time * 0.005) * 2`
- **Registration**: Registered via `CollisionManager.registerPlatformObstacles()`

### Flying Cubes

- **Type Identifier**: Currently **NOT IMPLEMENTED** for collision damage
- **File**: `BreakOut/src/components/course_two/flying_cubes.js`
- **Class**: `FlyingCubesSpawner`
- **Behavior**: 
  - Spawns cubes that move from start to end position
  - Cubes are created with `THREE.BoxGeometry` and `THREE.MeshStandardMaterial`
  - Currently **NOT registered with collision system**
  - **Note**: To enable damage, cubes need to be registered with `CollisionManager` and have `userData.type` set

---

## File Structure

```
BreakOut/
├── src/
│   ├── components/
│   │   ├── collision/
│   │   │   ├── Collider.js              # Individual collider wrapper
│   │   │   ├── CollisionManager.js      # Central collision registry
│   │   │   └── shapes.js                 # Shape classes (not actively used)
│   │   ├── course/
│   │   │   ├── concrete_blocks.js       # Concrete block obstacle
│   │   │   ├── spinning_blade.js        # Spinning blade obstacle
│   │   │   ├── laser_barrier.js         # Laser barrier obstacle
│   │   │   └── platform.js              # Platform with obstacles
│   │   ├── course_two/
│   │   │   ├── flying_cubes.js          # Flying cubes spawner
│   │   │   └── platform.js              # Second platform
│   │   ├── player/
│   │   │   └── PlayerHealth.js           # Health/lives/damage system
│   │   └── Eve.js                        # Main character controller
│   ├── config/
│   │   └── healthConfig.js              # Damage values & health config
│   └── App.js                            # Main app (initializes systems)
└── public/
    └── assets/
        └── models/
            └── obstacles/
                ├── concrete_obstacle/
                ├── spinning_blade_obstacle/
                └── laser/
```

---

## How Each Obstacle Works

### Concrete Blocks

**Creation** (`concrete_blocks.js`):
```javascript
new concrete_blocks(game, {
  position: [-39, 2.3, -3],
  scale: [3, 1, 1],
  rotationY: Math.PI / 2,
  name: 'concrete_A'
})
```

**Features**:
- Uses static GLTF model caching (shared across instances)
- Supports custom shader materials
- Model is cloned for each instance

**Collision**:
- Registered when platform calls `registerObstaclesWithCollision()`
- Collider created with `'box'` type
- Type inferred from name containing "concrete" or "block"

---

### Spinning Blades

**Creation** (`spinning_blade.js`):
```javascript
new spinning_blade(game, {
  position: [-26, 1.9, -3.5],
  scale: [0.025, 0.025, 0.025],
  rotationY: Math.PI / 2,
  name: 'blade_A'
})
```

**Animation** (`spinning_blade.js`, line 58):
```javascript
this.model.rotation.y += delta * 9; // Spins at 9 rad/s
```

**Collision**:
- Collider updates automatically as blade rotates
- Type inferred from name containing "blade" or "spinning"

---

### Laser Barriers

**Creation** (`laser_barrier.js`):
```javascript
new laser_barrier(game, {
  position: [-10, 4.7, 0],
  scale: [4.5, 2, 2],
  rotationY: Math.PI / 2,
  name: 'laser_A'
})
```

**Animation** (`laser_barrier.js`, line 57):
```javascript
this.model.position.y = this._position.y + Math.sin(Date.now() * 0.005) * 2;
// Moves up/down with 2 unit amplitude
```

**Collision**:
- Collider updates automatically as barrier moves
- Type inferred from name containing "laser"

---

### Flying Cubes

**Creation** (`flying_cubes.js`):
```javascript
this.flyingCubesSpawner = new FlyingCubesSpawner(this.scene, {
  countMin: 1,
  countMax: 2,
  sizeMin: 1.5,
  sizeMax: 3.0,
  speedMin: 0.7 * 0.06,
  speedMax: 1.1 * 0.09,
  intervalMin: 1.5,
  intervalMax: 3.0,
  color: 0xff2222,
  maxActive: 10
});
```

**Behavior**:
- Spawns cubes at random intervals
- Each cube moves from `start` position to `end` position
- Cubes are removed when they reach target
- **Currently NOT registered for collision damage**

**To Enable Damage**:
1. Register each cube with `CollisionManager.add(cube, 'box')`
2. Set `cube.userData.type = 'flying_cube'` (or similar)
3. Add damage handling in `Eve.handleCollisionDamage()`

---

## Registration Process

### Platform Obstacles Registration

**Location**: `BreakOut/src/components/world.js` (line 111)

**Process**:
1. `World.registerPlatformObstacles()` is called after platform loads
2. Waits 1500ms for obstacles to be ready
3. Calls `platform.registerObstaclesWithCollision()`

**Platform Registration** (`platform.js`, line 203):
```javascript
registerObstaclesWithCollisions() {
  this.obstacleColliders = this.collisionManager.registerPlatformObstacles(this);
  
  // Also registers finish line
  if (this.finishLine) {
    const finishLineCollider = this.collisionManager.add(this.finishLine, 'box');
    this.obstacleColliders.push(finishLineCollider);
  }
}
```

**CollisionManager Registration** (`CollisionManager.js`, lines 48-117):
```javascript
registerPlatformObstacles(platform) {
  // Iterates through:
  // - platform.concreteBlocks
  // - platform.spinningBlades
  // - platform.laserBarriers
  
  // For each obstacle:
  if (obstacle.ready && obstacle.model) {
    const collider = this.add(obstacle.model, 'box');
    registeredColliders.push(collider);
  }
  
  // Retries if not all obstacles are ready
  if (registeredCount < expectedCount) {
    setTimeout(() => this.registerPlatformObstacles(platform), 500);
  }
}
```

### Player Collider Registration

**Location**: `BreakOut/src/components/Eve.js` (line 122)

**Process**:
```javascript
if (this.collisionManager) {
  this.collider = this.collisionManager.add(this.model, 'box');
}
```

- Player collider is created when Eve model loads
- Uses `'box'` type collision
- Automatically registered in `CollisionManager.colliders` array

---

## Damage Application Flow

### Step-by-Step Process

1. **Collision Detected**
   - `Eve.checkDamageCollisions()` finds intersection
   - Returns collider of obstacle

2. **Obstacle Type Determination**
   - `Eve.handleCollisionDamage()` is called
   - Gets type from `collision.mesh.userData.type`
   - **Fallback**: Uses `getObstacleTypeFromName(mesh.name)`

3. **Damage Calculation**
   - Maps obstacle type to damage value:
     - `'concrete_block'` → `HealthConfig.OBSTACLE_DAMAGE` (20)
     - `'spinning_blade'` → `HealthConfig.TRAP_DAMAGE` (30)
     - `'laser'` or `'laser_barrier'` → `HealthConfig.TRAP_DAMAGE` (30)

4. **Damage Application**
   - Calls `Eve.takeDamage(damage, damageType)`
   - Which calls `PlayerHealth.takeDamage(amount, damageType)`

5. **Health System Processing**
   - Checks invulnerability (if invulnerable, damage ignored)
   - Reduces `currentHealth` by damage amount
   - Updates statistics
   - Triggers `onDamage` callback (updates UI)

6. **Death Check**
   - If `currentHealth <= 0`:
     - Calls `PlayerHealth.die()`
     - Decrements lives
     - Triggers `onDeath` and `onLifeLost` callbacks
     - If lives > 0: respawns player
     - If lives ≤ 0: triggers game over

---

## Health System Integration

### Initialization

**Location**: `BreakOut/src/components/Eve.js` (lines 65-76)

```javascript
this.health = new PlayerHealth({
  maxHealth: HealthConfig.MAX_HEALTH,
  maxLives: HealthConfig.MAX_LIVES,
  permadeath: HealthConfig.PERMADEATH_MODE,
  initialPosition: { x: 0, y: 1, z: 0 },
  onDamage: this.onPlayerDamage.bind(this),
  onHeal: this.onPlayerHeal.bind(this),
  onDeath: this.onPlayerDeath.bind(this),
  onRespawn: this.onPlayerRespawn.bind(this),
  onGameOver: this.onPlayerGameOver.bind(this),
  onLifeLost: this.onPlayerLifeLost.bind(this),
});
```

### UI Integration

**Location**: `BreakOut/src/App.js` (lines 298-337)

The health UI is updated via callbacks:
- `onDamage`: Updates health bar and flashes damage indicator
- `onLifeLost`: Updates lives display
- `onGameOver`: Shows lose screen

---

## Configuration

### Changing Damage Values

**File**: `BreakOut/src/config/healthConfig.js`

```javascript
export const HealthConfig = {
  OBSTACLE_DAMAGE: 20,    // Change this for concrete blocks
  TRAP_DAMAGE: 30,        // Change this for blades/lasers
  MAX_HEALTH: 100,         // Change this for max health
  MAX_LIVES: 3,           // Change this for max lives
};
```

### Adding New Obstacle Types

1. **Add damage value** to `healthConfig.js`:
```javascript
NEW_OBSTACLE_DAMAGE: 25,
```

2. **Add damage type** to `DamageType` enum:
```javascript
export const DamageType = {
  // ... existing types
  NEW_OBSTACLE: 'new_obstacle',
};
```

3. **Update `Eve.handleCollisionDamage()`**:
```javascript
case 'new_obstacle':
  damage = HealthConfig.NEW_OBSTACLE_DAMAGE;
  damageType = DamageType.NEW_OBSTACLE;
  break;
```

4. **Set `userData.type`** when creating obstacle:
```javascript
obstacle.model.userData.type = 'new_obstacle';
```

### Enabling Flying Cubes Damage

**File**: `BreakOut/src/components/course_two/flying_cubes.js`

Modify `_createCube()` method:
```javascript
_createCube({ size, speed }) {
  // ... existing code ...
  
  // Add this:
  cube.userData.type = 'flying_cube';
  
  // Register with collision manager
  if (this.collisionManager) {
    this.collisionManager.add(cube, 'box');
  }
  
  return cube;
}
```

Then update `Eve.handleCollisionDamage()`:
```javascript
case 'flying_cube':
  damage = HealthConfig.TRAP_DAMAGE; // or create new damage value
  damageType = DamageType.TRAP;
  break;
```

---

## Key Design Decisions

### Why Two Collision Checking Methods?

1. **`Eve.checkDamageCollisions()`** (Primary):
   - Called every frame
   - Handles finish line special case
   - More control over damage application

2. **`CollisionManager.checkPlayerCollisions()`** (Legacy):
   - Alternative implementation
   - Currently not used in main flow
   - Kept for potential future use

### Why Name-Based Type Inference?

- Obstacles may not always have `userData.type` set
- Provides fallback mechanism
- Allows flexibility in obstacle naming
- Makes system more robust

### Why Retry Logic in Registration?

- Obstacles load asynchronously
- Some may not be ready when registration is called
- Retry ensures all obstacles are eventually registered
- Prevents missing collision detection

---

## Performance Considerations

1. **Collision Updates**: Colliders update bounding boxes every frame
   - For static obstacles, this could be optimized
   - Currently all colliders update regardless of movement

2. **Collision Checking**: Linear search through all colliders
   - O(n) complexity where n = number of obstacles
   - Could be optimized with spatial partitioning for large scenes

3. **Invulnerability**: Prevents damage spam
   - 2-second invulnerability after respawn
   - Prevents rapid death from same obstacle

---

## Troubleshooting

### Obstacles Not Causing Damage

1. **Check registration**: Ensure `registerObstaclesWithCollision()` is called
2. **Check obstacle ready state**: Obstacle must have `ready = true` and `model` set
3. **Check collider type**: Ensure `userData.type` is set or name contains type keywords
4. **Check player alive**: Damage only applies if `health.isAlive === true`

### Damage Not Applying

1. **Check invulnerability**: Player may be invulnerable after respawn
2. **Check collision detection**: Verify colliders are updating correctly
3. **Check damage values**: Ensure `HealthConfig` values are correct
4. **Check callbacks**: Verify `onDamage` callback is firing

### Collision Detection Not Working

1. **Check collider registration**: Verify colliders are in `CollisionManager.colliders` array
2. **Check bounding boxes**: Use Three.js inspector to verify bounding boxes
3. **Check update calls**: Ensure `collider.update()` is called before intersection checks
4. **Check mesh visibility**: Hidden meshes still have collision (by design)

---

## Summary

The collision system is a well-architected, modular system that:

- ✅ Detects collisions between player and obstacles using bounding box intersection
- ✅ Applies appropriate damage based on obstacle type
- ✅ Manages health, lives, and respawn logic
- ✅ Provides centralized configuration for easy tuning
- ✅ Handles multiple obstacle types (concrete, blades, lasers)
- ✅ Supports dynamic obstacles (spinning, moving)
- ⚠️ Flying cubes currently not integrated (requires additional implementation)

The system is designed for extensibility and maintainability, making it easy to add new obstacle types or modify damage values.

---

**Last Updated**: Based on codebase analysis
**Maintained By**: Development Team

