# Collision Box Height Issue - Fix Documentation

## Problem

The player's collision detection was not working when running through obstacles, but worked when jumping. The root cause was that the player's bounding box had **zero height** (Y min and max were the same value), making it a flat plane that didn't overlap with obstacles positioned above ground level.

### Symptoms
- ✅ Collisions work when **jumping** onto obstacles
- ❌ Collisions **don't work** when **running** through obstacles
- Player bounding box shows: `playerBoxMin: Y=4.00, playerBoxMax: Y=4.00` (zero height)
- Obstacle starts at: `Y=4.10`, creating a 0.10 unit gap

## Root Cause

The player's collider was created directly from the model:
```javascript
this.collider = this.collisionManager.add(this.model, 'box');
```

When `Collider` calculates the bounding box using `THREE.Box3().setFromObject(this.model)`, it was producing a flat bounding box with no height. This happens when:
- The model's child meshes are all positioned at the same Y coordinate
- The model hierarchy doesn't properly represent the character's vertical extent
- The bounding box calculation doesn't account for the character's actual height

## Solution

Create a **custom invisible collision mesh** with proper dimensions instead of using the model's bounding box directly.

### Implementation

**1. Create Custom Collision Mesh** (`Eve.js`, in `load()` method):

```javascript
// Calculate model's bounding box
const modelBox = new THREE.Box3().setFromObject(this.model);
const modelSize = modelBox.getSize(new THREE.Vector3());

// Determine collision box height
let colliderHeight = modelSize.y;
if (colliderHeight < 0.1) {
  // Model bounding box is flat, use reasonable character height
  colliderHeight = 1.8; // Approximate character height
}

// Create invisible collision box
const colliderWidth = Math.max(modelSize.x, 0.5);
const colliderDepth = Math.max(modelSize.z, 0.5);
const colliderGeometry = new THREE.BoxGeometry(colliderWidth, colliderHeight, colliderDepth);
const colliderMaterial = new THREE.MeshBasicMaterial({ visible: false });
this.colliderMesh = new THREE.Mesh(colliderGeometry, colliderMaterial);

// Position at model's position, but adjust Y to center the box
this.colliderMesh.position.copy(this.model.position);
this.colliderMesh.position.y = this.model.position.y + (colliderHeight / 2);
this.colliderMesh.rotation.copy(this.model.rotation);

// Add to scene (invisible, just for collision)
this.scene.add(this.colliderMesh);

// Create collider from the helper mesh (not the model)
this.collider = this.collisionManager.add(this.colliderMesh, 'box');
```

**2. Update Collider Mesh Position** (in `update()` method):

The collider mesh must be updated to match the player's position in **all movement scenarios**:

- **Jumping/Falling**: After vertical movement
- **Running**: After horizontal movement
- **Rolling**: After roll movement
- **On Stairs**: After vertical movement on stairs
- **Idle**: Even when standing still

```javascript
// CRITICAL: Update colliderMesh position to match model position
if (this.colliderMesh) {
  this.colliderMesh.position.x = this.model.position.x;
  this.colliderMesh.position.y = this.model.position.y + (this.colliderMesh.geometry.parameters.height / 2);
  this.colliderMesh.position.z = this.model.position.z;
  this.colliderMesh.rotation.copy(this.model.rotation);
}

// Then update the collider's bounding box
if (this.collider && typeof this.collider.update === 'function') {
  this.collider.update();
}
```

**3. Fix `checkCollisionAtPosition()`**:

When testing collision positions, account for the collider mesh height offset:

```javascript
const testColliderPos = testPosition.clone();
if (this.colliderMesh) {
  // Adjust Y position to account for collider mesh center offset
  testColliderPos.y = testPosition.y + (this.colliderMesh.geometry.parameters.height / 2);
}
this.collider.mesh.position.copy(testColliderPos);
```

## Key Points

1. **Collider mesh is invisible** - `visible: false` material, only used for collision detection
2. **Height offset** - Collider mesh Y position = model Y position + (height / 2) to center the box
3. **Must update position** - Collider mesh position must be updated in ALL movement scenarios
4. **Update order matters** - Update `colliderMesh.position` BEFORE calling `collider.update()`

## Testing

After implementing this fix:
- ✅ Running through obstacles should trigger collisions
- ✅ Jumping onto obstacles should trigger collisions
- ✅ Jumping OVER obstacles (when high enough) should NOT trigger collisions
- ✅ Player bounding box should have proper height (e.g., Y: 4.00 to 5.80)

## Files Modified

- `Winning/BreakOut/src/components/Eve.js`
  - `load()` method: Create custom collision mesh
  - `update()` method: Update collider mesh position in all movement scenarios
  - `checkCollisionAtPosition()`: Account for height offset

## For Other Levels/Branches

If you encounter the same issue in other levels (4-6) or branches:

1. **Check if collider is created from model directly**: Look for `this.collider = this.collisionManager.add(this.model, 'box')`
2. **Check bounding box height**: Log `collider.box.min.y` and `collider.box.max.y` - if they're the same, the box is flat
3. **Apply the same fix**: Create a custom `colliderMesh` with proper height and update its position everywhere the player moves

