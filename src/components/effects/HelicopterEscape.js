import * as THREE from '../../../public/libs/three137/three.module.js';

/**
 * HelicopterEscape - Handles the automatic escape sequence
 * Character jumps onto helicopter and flies away when reaching finish line
 */
export class HelicopterEscape {
  constructor(options = {}) {
    this.scene = options.scene;
    this.character = options.character;
    this.helicopter = options.helicopter;
    this.isActive = false;
    this.timer = 0;
    this.duration = options.duration || 8.0; // Total escape sequence duration
    
    // Animation phases
    this.phase = 'idle'; // 'idle', 'approach', 'jump', 'landing', 'takeoff', 'flight', 'complete'
    this.phaseTimer = 0;
    
    // Store original positions
    this.originalCharacterPosition = new THREE.Vector3();
    this.originalHelicopterPosition = new THREE.Vector3();
    this.originalHelicopterRotation = new THREE.Euler();
    
    // Animation targets
    this.characterTargetPosition = new THREE.Vector3();
    this.helicopterTargetPosition = new THREE.Vector3();
    this.helicopterTargetRotation = new THREE.Euler();
    
    // Animation curves
    this.jumpCurve = new THREE.CatmullRomCurve3();
    this.flightPath = new THREE.CatmullRomCurve3();
    
    // Character state during escape
    this.characterOnHelicopter = false;
    this.characterOffset = new THREE.Vector3(0, 0.5, 0); // Offset from helicopter center
    
    // Helicopter flight settings
    this.flightHeight = 15;
    this.flightDistance = 50;
    this.takeoffSpeed = 2.0;
    this.flightSpeed = 8.0;
  }

  /**
   * Trigger the complete escape sequence
   */
  trigger() {
    if (this.isActive) return;
    
    // Check if helicopter is available
    if (!this.helicopter || !this.helicopter.model) {
      console.error('❌ Cannot start helicopter escape - helicopter not available!');
      console.error('Helicopter:', this.helicopter);
      return;
    }
    
    console.log('🚁 HELICOPTER ESCAPE SEQUENCE STARTED! 🚁');
    console.log('Character position:', this.character?.model?.position);
    console.log('Helicopter position:', this.helicopter?.model?.position);
    
    this.isActive = true;
    this.timer = 0;
    this.phase = 'approach';
    this.phaseTimer = 0;
    
    // Store original positions
    if (this.character && this.character.model) {
      this.originalCharacterPosition.copy(this.character.model.position);
    }
    if (this.helicopter && this.helicopter.model) {
      this.originalHelicopterPosition.copy(this.helicopter.model.position);
      this.originalHelicopterRotation.copy(this.helicopter.model.rotation);
      
      // Disable helicopter hover animation during escape sequence
      if (this.helicopter.setEscapeMode) {
        this.helicopter.setEscapeMode(true);
      }
    }
    
    // Set up animation targets
    this.setupAnimationTargets();
    
    // Verify setup was successful
    if (!this.jumpCurve || this.jumpCurve.points.length === 0) {
      console.error('❌ Failed to setup animation targets - aborting escape sequence');
      this.isActive = false;
      return;
    }
    
    // Disable character controls
    this.disableCharacterControls();
  }

  /**
   * Set up animation targets and curves
   */
  setupAnimationTargets() {
    if (!this.character || !this.helicopter) return;
    
    const charPos = this.character.model.position;
    const heliPos = this.helicopter.model.position;
    
    // Character jump target (slightly in front of helicopter)
    this.characterTargetPosition.set(
      heliPos.x - 2,
      heliPos.y + 1,
      heliPos.z
    );
    
    // Helicopter takeoff target
    this.helicopterTargetPosition.set(
      heliPos.x,
      heliPos.y + this.flightHeight,
      heliPos.z
    );
    
    // Flight path points - more dynamic and interesting
    const flightPoints = [
      this.helicopterTargetPosition.clone(),
      new THREE.Vector3(heliPos.x + 15, heliPos.y + this.flightHeight + 2, heliPos.z + 5),
      new THREE.Vector3(heliPos.x + 30, heliPos.y + this.flightHeight + 5, heliPos.z + 15),
      new THREE.Vector3(heliPos.x + 45, heliPos.y + this.flightHeight + 8, heliPos.z + 25),
      new THREE.Vector3(heliPos.x + this.flightDistance, heliPos.y + this.flightHeight + 12, heliPos.z + 35)
    ];
    
    this.flightPath = new THREE.CatmullRomCurve3(flightPoints);
    
    // Jump curve - more realistic arc
    const midPoint = new THREE.Vector3(
      (charPos.x + this.characterTargetPosition.x) / 2,
      Math.max(charPos.y, this.characterTargetPosition.y) + 4, // Higher arc
      (charPos.z + this.characterTargetPosition.z) / 2
    );
    
    const jumpPoints = [
      charPos.clone(),
      new THREE.Vector3(
        charPos.x + (midPoint.x - charPos.x) * 0.3,
        charPos.y + 2,
        charPos.z + (midPoint.z - charPos.z) * 0.3
      ),
      midPoint,
      new THREE.Vector3(
        this.characterTargetPosition.x + (midPoint.x - this.characterTargetPosition.x) * 0.3,
        this.characterTargetPosition.y + 1,
        this.characterTargetPosition.z + (midPoint.z - this.characterTargetPosition.z) * 0.3
      ),
      this.characterTargetPosition.clone()
    ];
    
    this.jumpCurve = new THREE.CatmullRomCurve3(jumpPoints);
  }

  /**
   * Disable character controls during escape
   */
  disableCharacterControls() {
    if (this.character) {
      // Store original control state
      this.originalRunSpeed = this.character.runSpeed;
      this.originalJumpSpeed = this.character.jumpSpeed;
      this.originalGravity = this.character.gravity;
      
      // Disable movement
      this.character.runSpeed = 0;
      this.character.jumpSpeed = 0;
      this.character.velocityY = 0;
      this.character.gravity = 0; // Disable gravity so character doesn't fall
      
      // Disable input handling
      this.character.controlsDisabled = true;
      
      console.log('Character controls disabled for helicopter escape');
    }
  }

  /**
   * Re-enable character controls (for cleanup)
   */
  enableCharacterControls() {
    if (this.character) {
      this.character.runSpeed = this.originalRunSpeed;
      this.character.jumpSpeed = this.originalJumpSpeed;
      this.character.gravity = this.originalGravity;
      this.character.controlsDisabled = false;
      
      console.log('Character controls re-enabled');
    }
  }

  /**
   * Update the escape sequence
   * @param {number} delta - Time delta
   */
  update(delta) {
    if (!this.isActive) return;
    
    this.timer += delta;
    this.phaseTimer += delta;
    
    switch (this.phase) {
      case 'approach':
        this.updateApproachPhase(delta);
        break;
      case 'jump':
        this.updateJumpPhase(delta);
        break;
      case 'landing':
        this.updateLandingPhase(delta);
        break;
      case 'takeoff':
        this.updateTakeoffPhase(delta);
        break;
      case 'flight':
        this.updateFlightPhase(delta);
        break;
      case 'complete':
        this.updateCompletePhase(delta);
        break;
    }
    
    // Ensure character stays on helicopter during takeoff and flight phases
    if (this.characterOnHelicopter && (this.phase === 'takeoff' || this.phase === 'flight')) {
      this.keepCharacterOnHelicopter();
    }
  }

  /**
   * Keep character properly positioned on helicopter
   */
  keepCharacterOnHelicopter() {
    if (this.character && this.character.model && this.helicopter && this.helicopter.model) {
      const heliPos = this.helicopter.model.position;
      const heliRot = this.helicopter.model.rotation;
      
      // Create a matrix to transform the offset by helicopter's rotation
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationFromEuler(heliRot);
      
      // Apply rotation to the offset vector
      const rotatedOffset = this.characterOffset.clone().applyMatrix4(rotationMatrix);
      
      // Set character position relative to helicopter
      this.character.model.position.set(
        heliPos.x + rotatedOffset.x,
        heliPos.y + rotatedOffset.y,
        heliPos.z + rotatedOffset.z
      );
      
      // Match helicopter rotation (character faces same direction as helicopter)
      this.character.model.rotation.copy(heliRot);
    }
  }

  /**
   * Approach phase - character moves toward helicopter
   */
  updateApproachPhase(delta) {
    const duration = 1.0; // 1 second to approach
    const progress = Math.min(this.phaseTimer / duration, 1);
    
    if (this.character && this.character.model) {
      // Move character toward helicopter
      const charPos = this.character.model.position;
      const targetPos = this.characterTargetPosition;
      
      charPos.lerp(targetPos, progress * delta * 3);
      
      // Face the helicopter
      const direction = new THREE.Vector3()
        .subVectors(targetPos, charPos)
        .normalize();
      const angle = Math.atan2(direction.x, direction.z);
      this.character.model.rotation.y = angle;
    }
    
    if (progress >= 1) {
      this.phase = 'jump';
      this.phaseTimer = 0;
      console.log('Phase: Jump');
    }
  }

  /**
   * Jump phase - character jumps onto helicopter
   */
  updateJumpPhase(delta) {
    if (!this.helicopter || !this.helicopter.model || !this.jumpCurve || this.jumpCurve.points.length === 0) {
      console.error('❌ Cannot update jump phase - helicopter or jump curve missing');
      this.phase = 'complete';
      return;
    }
    
    const duration = 1.5; // 1.5 seconds for jump
    const progress = Math.min(this.phaseTimer / duration, 1);
    
    if (this.character && this.character.model) {
      // Follow jump curve
      const position = this.jumpCurve.getPoint(progress);
      this.character.model.position.copy(position);
      
      // Add jump animation
      this.character.playAction('jump', 0.1);
      
      // Rotate character during jump
      this.character.model.rotation.y += delta * 2;
    }
    
    if (progress >= 1) {
      this.phase = 'landing';
      this.phaseTimer = 0;
      this.characterOnHelicopter = true;
      console.log('Phase: Landing');
    }
  }

  /**
   * Landing phase - character lands on helicopter
   */
  updateLandingPhase(delta) {
    const duration = 0.5; // 0.5 seconds to settle
    const progress = Math.min(this.phaseTimer / duration, 1);
    
    if (this.character && this.character.model && this.helicopter && this.helicopter.model) {
      // Position character on helicopter
      const heliPos = this.helicopter.model.position;
      this.character.model.position.set(
        heliPos.x + this.characterOffset.x,
        heliPos.y + this.characterOffset.y,
        heliPos.z + this.characterOffset.z
      );
      
      // Character faces forward
      this.character.model.rotation.y = this.helicopter.model.rotation.y;
      
      // Play landing animation
      this.character.playAction('idle', 0.1);
    }
    
    if (progress >= 1) {
      this.phase = 'takeoff';
      this.phaseTimer = 0;
      console.log('Phase: Takeoff');
    }
  }

  /**
   * Takeoff phase - helicopter takes off and starts flying with character
   */
  updateTakeoffPhase(delta) {
    const duration = 3.0; // 3 seconds to takeoff and start flying
    const progress = Math.min(this.phaseTimer / duration, 1);
    
    if (this.helicopter && this.helicopter.model) {
      // Helicopter rises and starts moving forward
      const startPos = this.originalHelicopterPosition;
      const targetPos = this.helicopterTargetPosition;
      
      // Rise up first (first half of takeoff)
      if (progress < 0.5) {
        const riseProgress = progress * 2; // 0 to 1 in first half
        this.helicopter.model.position.y = startPos.y + (targetPos.y - startPos.y) * riseProgress;
        this.helicopter.model.position.x = startPos.x;
        this.helicopter.model.position.z = startPos.z;
      } else {
        // Start flying forward (second half of takeoff)
        const flyProgress = (progress - 0.5) * 2; // 0 to 1 in second half
        this.helicopter.model.position.y = targetPos.y;
        
        // Move forward while rising
        const forwardDistance = 15; // Distance to fly forward
        this.helicopter.model.position.x = startPos.x + forwardDistance * flyProgress;
        this.helicopter.model.position.z = startPos.z + 5 * flyProgress; // Slight curve
        
        // Rotate to face forward direction
        const forwardAngle = Math.atan2(forwardDistance * flyProgress, 5 * flyProgress + 0.1);
        this.helicopter.model.rotation.y = forwardAngle;
      }
      
      // Slight forward tilt during takeoff
      this.helicopter.model.rotation.x = Math.sin(progress * Math.PI) * 0.15;
      
      // Keep character on helicopter (use the helper method for proper rotation)
      if (this.character && this.character.model && this.helicopter && this.helicopter.model) {
        this.keepCharacterOnHelicopter();
      }
    }
    
    if (progress >= 1) {
      this.phase = 'flight';
      this.phaseTimer = 0;
      console.log('Phase: Flight - Helicopter is now flying!');
      
      // Increase rotor speed to indicate flight
      if (this.helicopter) {
        this.helicopter.rotorSpeed = 0.3; // Faster rotor speed for flight
        console.log('Rotor speed increased for flight mode');
      }
    }
  }

  /**
   * Flight phase - helicopter flies away with dynamic movement
   */
  updateFlightPhase(delta) {
    const duration = 5.0; // 5 seconds of flight
    const progress = Math.min(this.phaseTimer / duration, 1);
    
    if (this.helicopter && this.helicopter.model) {
      // Follow flight path
      const position = this.flightPath.getPoint(progress);
      this.helicopter.model.position.copy(position);
      
      // Get tangent for rotation
      const tangent = this.flightPath.getTangent(progress);
      const angle = Math.atan2(tangent.x, tangent.z);
      this.helicopter.model.rotation.y = angle;
      
      // Dynamic banking during turns
      const bankAngle = Math.sin(progress * Math.PI * 3) * 0.3;
      this.helicopter.model.rotation.z = bankAngle;
      
      // Slight pitch variation for realism
      const pitchAngle = Math.sin(progress * Math.PI * 2) * 0.1;
      this.helicopter.model.rotation.x = pitchAngle;
      
      // Add slight vertical oscillation for helicopter-like movement
      const verticalOscillation = Math.sin(this.phaseTimer * 2) * 0.2;
      this.helicopter.model.position.y += verticalOscillation * delta;
      
      // Keep character on helicopter
      if (this.character && this.character.model) {
        const heliPos = this.helicopter.model.position;
        this.character.model.position.set(
          heliPos.x + this.characterOffset.x,
          heliPos.y + this.characterOffset.y,
          heliPos.z + this.characterOffset.z
        );
        this.character.model.rotation.y = this.helicopter.model.rotation.y;
      }
    }
    
    if (progress >= 1) {
      this.phase = 'complete';
      this.phaseTimer = 0;
      console.log('Phase: Complete - Helicopter has flown away!');
    }
  }

  /**
   * Complete phase - sequence finished
   */
  updateCompletePhase(delta) {
    // Fade out or hide characters
    if (this.character && this.character.model) {
      this.character.model.visible = false;
    }
    if (this.helicopter && this.helicopter.model) {
      this.helicopter.model.visible = false;
    }
    
    // Clean up after a short delay
    setTimeout(() => {
      this.cleanup();
    }, 1000);
  }

  /**
   * Check if the escape sequence is running
   */
  isRunning() {
    return this.isActive;
  }

  /**
   * Clean up the escape sequence
   */
  cleanup() {
    this.isActive = false;
    this.phase = 'idle';
    this.timer = 0;
    this.phaseTimer = 0;
    this.characterOnHelicopter = false;
    
    // Re-enable character controls
    this.enableCharacterControls();
    
    // Reset helicopter state
    if (this.helicopter) {
      this.helicopter.rotorSpeed = 0.15; // Reset to normal speed
      
      // Re-enable hover animation
      if (this.helicopter.setEscapeMode) {
        this.helicopter.setEscapeMode(false);
      }
    }
    
    // Reset visibility
    if (this.character && this.character.model) {
      this.character.model.visible = true;
    }
    if (this.helicopter && this.helicopter.model) {
      this.helicopter.model.visible = true;
    }
    
    console.log('🚁 Helicopter escape sequence completed!');
  }
}
