import * as THREE from '../../public/libs/three137/three.module.js';

class Helicopter {
    constructor(game, options = {}) {
        this.assetsPath = game.assetsPath;
        this.scene = game.scene;
        this.ready = false;
        this.model = null;
        
        // Default position at finish line
        this.position = options.position || new THREE.Vector3(-45, 8, 0);
        this.scale = options.scale || new THREE.Vector3(1, 1, 1);
        this.rotation = options.rotation || new THREE.Euler(0, 0, 0);
        
        this.rotorSpeed = 0.15;
        this.hoverAmplitude = 0.3;
        this.hoverSpeed = 1.5;
        this.baseY = this.position.y;
        
        // Enhanced rotor effects
        this.rotorBlur = true;
        this.blurOpacity = 0.3;
        this.rotorWash = true;
        this.washIntensity = 0.8;
        
        // Animation state
        this.animationTime = 0;
        this.rotorPhase = 0;
        
        this.createHelicopter();
    }

    createHelicopter() {
        // Create helicopter group
        this.model = new THREE.Group();
        
        // Create realistic materials
        this.createMaterials();
        
        // Main fuselage (more realistic shape)
        this.createFuselage();
        
        // Cockpit with better proportions
        this.createCockpit();
        
        // Engine housing
        this.createEngineHousing();
        
        // Main rotor system
        this.createMainRotor();
        
        // Tail boom and fin
        this.createTailBoom();
        
        // Tail rotor
        this.createTailRotor();
        
        // Landing gear
        this.createLandingGear();
        
        // Windows and details
        this.createDetails();
        
        // Set position, scale, and rotation
        this.model.position.copy(this.position);
        this.model.scale.copy(this.scale);
        this.model.rotation.copy(this.rotation);
        
        // Add to scene
        this.scene.add(this.model);
        
        // Add lighting effects
        this.createLightingEffects();
        
        this.ready = true;
        
        console.log('Realistic helicopter created and positioned at finish line');
    }

    createMaterials() {
        // Main body material - PBR military green with realistic properties
        this.bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5016,
            metalness: 0.1,
            roughness: 0.7,
            envMapIntensity: 1.0
        });
        
        // Cockpit glass material with realistic refraction
        this.glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.15,
            metalness: 0.0,
            roughness: 0.1,
            transmission: 0.9,
            thickness: 0.5,
            ior: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        
        // Anodized aluminum material for metal parts
        this.metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b8b8b,
            metalness: 0.8,
            roughness: 0.3,
            envMapIntensity: 1.2
        });
        
        // Carbon fiber rotor blade material
        this.rotorMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.0,
            roughness: 0.4,
            normalScale: new THREE.Vector2(0.5, 0.5)
        });
        
        // Landing gear material - painted steel
        this.skidMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c2c2c,
            metalness: 0.2,
            roughness: 0.6
        });
        
        // Engine material - heat-treated steel
        this.engineMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            metalness: 0.9,
            roughness: 0.2,
            envMapIntensity: 1.5
        });
        
        // Interior material
        this.interiorMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.1,
            roughness: 0.8
        });
        
        // Warning stripe material
        this.warningMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.0,
            roughness: 0.9,
            emissive: 0x220000
        });
    }

    createFuselage() {
        // Main body - more streamlined shape with custom geometry
        const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.4, 2.2, 16);
        const body = new THREE.Mesh(bodyGeometry, this.bodyMaterial);
        body.rotation.z = Math.PI / 2;
        body.position.set(0, 0, 0);
        this.model.add(body);
        
        // Nose section - more pointed with better aerodynamics
        const noseGeometry = new THREE.ConeGeometry(0.15, 0.8, 12);
        const nose = new THREE.Mesh(noseGeometry, this.bodyMaterial);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(1.2, 0, 0);
        this.model.add(nose);
        
        // Nose tip - radar dome
        const tipGeometry = new THREE.SphereGeometry(0.08, 8, 6);
        const tip = new THREE.Mesh(tipGeometry, this.metalMaterial);
        tip.position.set(1.6, 0, 0);
        this.model.add(tip);
        
        // Engine compartment - more detailed
        const engineGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 12);
        const engine = new THREE.Mesh(engineGeometry, this.engineMaterial);
        engine.rotation.z = Math.PI / 2;
        engine.position.set(-0.8, 0.3, 0);
        this.model.add(engine);
        
        // Engine exhaust
        const exhaustGeometry = new THREE.CylinderGeometry(0.08, 0.12, 0.4, 8);
        const exhaust = new THREE.Mesh(exhaustGeometry, this.engineMaterial);
        exhaust.rotation.z = Math.PI / 2;
        exhaust.position.set(-1.2, 0.2, 0);
        this.model.add(exhaust);
        
        // Fuselage panels and details
        this.createFuselagePanels();
        
        // Side doors
        this.createSideDoors();
    }
    
    createFuselagePanels() {
        // Panel lines using thin boxes
        const panelGeometry = new THREE.BoxGeometry(0.001, 0.3, 1.5);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.0,
            roughness: 0.9
        });
        
        // Vertical panel lines
        for (let i = 0; i < 3; i++) {
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(0.4 + i * 0.3, 0, 0);
            panel.rotation.z = Math.PI / 2;
            this.model.add(panel);
        }
        
        // Horizontal panel lines
        const horizontalPanelGeometry = new THREE.BoxGeometry(2.0, 0.001, 0.2);
        for (let i = 0; i < 2; i++) {
            const panel = new THREE.Mesh(horizontalPanelGeometry, panelMaterial);
            panel.position.set(0, -0.2 + i * 0.4, 0);
            this.model.add(panel);
        }
    }
    
    createSideDoors() {
        // Left door
        const doorGeometry = new THREE.BoxGeometry(0.02, 0.6, 0.8);
        const door = new THREE.Mesh(doorGeometry, this.bodyMaterial);
        door.position.set(0.4, 0.1, 0.5);
        door.rotation.y = Math.PI / 6;
        this.model.add(door);
        
        // Right door
        const rightDoor = new THREE.Mesh(doorGeometry, this.bodyMaterial);
        rightDoor.position.set(0.4, 0.1, -0.5);
        rightDoor.rotation.y = -Math.PI / 6;
        this.model.add(rightDoor);
        
        // Door handles
        const handleGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 6);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.2
        });
        
        for (let side of [-1, 1]) {
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.position.set(0.35, 0.1, side * 0.5);
            handle.rotation.z = Math.PI / 2;
            this.model.add(handle);
        }
    }

    createCockpit() {
        // Main cockpit bubble - more realistic shape
        const cockpitGeometry = new THREE.SphereGeometry(0.35, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpit = new THREE.Mesh(cockpitGeometry, this.glassMaterial);
        cockpit.position.set(0.3, 0.4, 0);
        this.model.add(cockpit);
        
        // Cockpit frame - more detailed
        const frameGeometry = new THREE.TorusGeometry(0.4, 0.03, 12, 24, Math.PI / 2);
        const frame = new THREE.Mesh(frameGeometry, this.metalMaterial);
        frame.position.set(0.3, 0.4, 0);
        frame.rotation.x = Math.PI / 2;
        this.model.add(frame);
        
        // Windshield with frame
        const windshieldGeometry = new THREE.PlaneGeometry(0.6, 0.3);
        const windshield = new THREE.Mesh(windshieldGeometry, this.glassMaterial);
        windshield.position.set(0.5, 0.5, 0);
        windshield.rotation.y = Math.PI / 2;
        this.model.add(windshield);
        
        // Windshield frame
        const windshieldFrameGeometry = new THREE.BoxGeometry(0.65, 0.35, 0.02);
        const windshieldFrame = new THREE.Mesh(windshieldFrameGeometry, this.metalMaterial);
        windshieldFrame.position.set(0.5, 0.5, 0);
        this.model.add(windshieldFrame);
        
        // Side windows
        for (let side of [-1, 1]) {
            const sideWindowGeometry = new THREE.PlaneGeometry(0.4, 0.25);
            const sideWindow = new THREE.Mesh(sideWindowGeometry, this.glassMaterial);
            sideWindow.position.set(0.1, 0.3, side * 0.4);
            sideWindow.rotation.y = side * Math.PI / 2;
            this.model.add(sideWindow);
        }
        
        // Interior details
        this.createCockpitInterior();
        
        // Pilot seats
        this.createPilotSeats();
    }
    
    createCockpitInterior() {
        // Instrument panel
        const panelGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.1);
        const panel = new THREE.Mesh(panelGeometry, this.interiorMaterial);
        panel.position.set(0.2, 0.2, 0);
        this.model.add(panel);
        
        // Control stick
        const stickGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6);
        const stick = new THREE.Mesh(stickGeometry, this.metalMaterial);
        stick.position.set(0.1, 0.1, 0);
        stick.rotation.z = Math.PI / 4;
        this.model.add(stick);
        
        // Collective lever
        const collectiveGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6);
        const collective = new THREE.Mesh(collectiveGeometry, this.metalMaterial);
        collective.position.set(0.3, 0.1, 0.2);
        collective.rotation.x = Math.PI / 2;
        this.model.add(collective);
    }
    
    createPilotSeats() {
        // Left seat
        const seatGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.2);
        const leftSeat = new THREE.Mesh(seatGeometry, this.interiorMaterial);
        leftSeat.position.set(0.1, 0.05, 0.15);
        this.model.add(leftSeat);
        
        // Right seat
        const rightSeat = new THREE.Mesh(seatGeometry, this.interiorMaterial);
        rightSeat.position.set(0.1, 0.05, -0.15);
        this.model.add(rightSeat);
        
        // Seat backs
        const backGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.05);
        for (let side of [-1, 1]) {
            const seatBack = new THREE.Mesh(backGeometry, this.interiorMaterial);
            seatBack.position.set(0.1, 0.2, side * 0.15);
            this.model.add(seatBack);
        }
    }

    createEngineHousing() {
        // Engine housing on top
        const housingGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
        const housing = new THREE.Mesh(housingGeometry, this.metalMaterial);
        housing.position.set(-0.2, 0.8, 0);
        this.model.add(housing);
        
        // Engine vents
        for (let i = 0; i < 4; i++) {
            const ventGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6);
            const vent = new THREE.Mesh(ventGeometry, this.metalMaterial);
            const angle = (i / 4) * Math.PI * 2;
            vent.position.set(
                -0.2 + Math.cos(angle) * 0.12,
                0.9,
                Math.sin(angle) * 0.12
            );
            vent.rotation.z = Math.PI / 2;
            this.model.add(vent);
        }
    }

    createMainRotor() {
        // Main rotor hub - more detailed
        const hubGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 12);
        const hub = new THREE.Mesh(hubGeometry, this.metalMaterial);
        hub.position.set(0, 1.1, 0);
        this.model.add(hub);
        
        // Rotor shaft with mounting details
        const shaftGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 12);
        const shaft = new THREE.Mesh(shaftGeometry, this.metalMaterial);
        shaft.position.set(0, 1.3, 0);
        this.model.add(shaft);
        
        // Rotor mounting plate
        const plateGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12);
        const plate = new THREE.Mesh(plateGeometry, this.metalMaterial);
        plate.position.set(0, 1.15, 0);
        this.model.add(plate);
        
        // Rotor blades group
        this.mainRotor = new THREE.Group();
        this.mainRotor.position.set(0, 1.1, 0);
        this.model.add(this.mainRotor);
        
        // Create 4 rotor blades with more realistic shape
        for (let i = 0; i < 4; i++) {
            const blade = this.createRotorBlade();
            const angle = (i / 4) * Math.PI * 2;
            blade.position.set(
                Math.cos(angle) * 0.1,
                0,
                Math.sin(angle) * 0.1
            );
            blade.rotation.y = angle;
            this.mainRotor.add(blade);
        }
        
        // Rotor disc for blur effect with better material
        if (this.rotorBlur) {
            const discGeometry = new THREE.CircleGeometry(2.2, 64);
            const discMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: this.blurOpacity,
                side: THREE.DoubleSide,
                alphaTest: 0.1
            });
            this.rotorDisc = new THREE.Mesh(discGeometry, discMaterial);
            this.rotorDisc.position.set(0, 1.1, 0);
            this.rotorDisc.rotation.x = Math.PI / 2;
            this.mainRotor.add(this.rotorDisc);
        }
        
        // Rotor wash effect
        if (this.rotorWash) {
            this.createRotorWash();
        }
    }
    
    createRotorWash() {
        // Create rotor wash particles/effect
        const washGeometry = new THREE.CylinderGeometry(2.0, 2.5, 0.1, 32);
        const washMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        this.rotorWashMesh = new THREE.Mesh(washGeometry, washMaterial);
        this.rotorWashMesh.position.set(0, 0.5, 0);
        this.model.add(this.rotorWashMesh);
    }

    createRotorBlade() {
        const bladeGroup = new THREE.Group();
        
        // Main blade - more realistic airfoil shape with taper
        const bladeGeometry = new THREE.BoxGeometry(0.15, 0.02, 2.2);
        const blade = new THREE.Mesh(bladeGeometry, this.rotorMaterial);
        blade.position.set(0, 0, 1.1);
        bladeGroup.add(blade);
        
        // Blade root - thicker section
        const rootGeometry = new THREE.BoxGeometry(0.2, 0.03, 0.3);
        const root = new THREE.Mesh(rootGeometry, this.rotorMaterial);
        root.position.set(0, 0, 0.15);
        bladeGroup.add(root);
        
        // Blade tip - swept back design
        const tipGeometry = new THREE.ConeGeometry(0.08, 0.3, 8);
        const tip = new THREE.Mesh(tipGeometry, this.rotorMaterial);
        tip.position.set(0, 0, 2.35);
        tip.rotation.x = Math.PI / 2;
        bladeGroup.add(tip);
        
        // Blade balance weight
        const weightGeometry = new THREE.SphereGeometry(0.02, 6, 4);
        const weight = new THREE.Mesh(weightGeometry, this.metalMaterial);
        weight.position.set(0, 0, 0.1);
        bladeGroup.add(weight);
        
        // Blade leading edge strip
        const stripGeometry = new THREE.BoxGeometry(0.01, 0.01, 2.0);
        const strip = new THREE.Mesh(stripGeometry, this.metalMaterial);
        strip.position.set(0.08, 0, 1.1);
        bladeGroup.add(strip);
        
        return bladeGroup;
    }

    createTailBoom() {
        // Main tail boom - more detailed
        const boomGeometry = new THREE.CylinderGeometry(0.06, 0.08, 2.8, 12);
        const boom = new THREE.Mesh(boomGeometry, this.bodyMaterial);
        boom.position.set(-1.3, 0, 0);
        boom.rotation.z = Math.PI / 2;
        this.model.add(boom);
        
        // Vertical fin - more aerodynamic shape
        const finGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.3);
        const fin = new THREE.Mesh(finGeometry, this.bodyMaterial);
        fin.position.set(-2.6, 0.2, 0);
        this.model.add(fin);
        
        // Fin leading edge
        const finEdgeGeometry = new THREE.ConeGeometry(0.05, 0.8, 8);
        const finEdge = new THREE.Mesh(finEdgeGeometry, this.bodyMaterial);
        finEdge.position.set(-2.65, 0.2, 0);
        finEdge.rotation.z = Math.PI / 2;
        this.model.add(finEdge);
        
        // Horizontal stabilizer - more realistic
        const stabilizerGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.2);
        const stabilizer = new THREE.Mesh(stabilizerGeometry, this.bodyMaterial);
        stabilizer.position.set(-2.2, 0.1, 0);
        this.model.add(stabilizer);
        
        // Stabilizer leading edge
        const stabEdgeGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8);
        const stabEdge = new THREE.Mesh(stabEdgeGeometry, this.bodyMaterial);
        stabEdge.position.set(-2.2, 0.125, 0);
        stabEdge.rotation.z = Math.PI / 2;
        this.model.add(stabEdge);
        
        // Tail boom supports
        for (let i = 0; i < 3; i++) {
            const supportGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6);
            const support = new THREE.Mesh(supportGeometry, this.metalMaterial);
            support.position.set(-1.3 - i * 0.5, 0.1, 0);
            support.rotation.z = Math.PI / 2;
            this.model.add(support);
        }
        
        // Warning stripes on tail
        this.createTailWarningStripes();
    }
    
    createTailWarningStripes() {
        // Red and white warning stripes
        for (let i = 0; i < 4; i++) {
            const stripeGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.3);
            const stripe = new THREE.Mesh(stripeGeometry, i % 2 === 0 ? this.warningMaterial : this.bodyMaterial);
            stripe.position.set(-2.6, 0.1 + i * 0.1, 0);
            this.model.add(stripe);
        }
    }

    createTailRotor() {
        // Tail rotor housing
        const housingGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
        const housing = new THREE.Mesh(housingGeometry, this.metalMaterial);
        housing.position.set(-2.7, 0.3, 0);
        housing.rotation.z = Math.PI / 2;
        this.model.add(housing);
        
        // Tail rotor group
        this.tailRotor = new THREE.Group();
        this.tailRotor.position.set(-2.7, 0.3, 0);
        this.model.add(this.tailRotor);
        
        // Create 2 tail rotor blades
        for (let i = 0; i < 2; i++) {
            const bladeGeometry = new THREE.BoxGeometry(0.08, 0.01, 0.6);
            const blade = new THREE.Mesh(bladeGeometry, this.rotorMaterial);
            const angle = (i / 2) * Math.PI;
            blade.position.set(
                Math.cos(angle) * 0.3,
                0,
                Math.sin(angle) * 0.3
            );
            blade.rotation.y = angle;
            this.tailRotor.add(blade);
        }
    }

    createLandingGear() {
        // Main landing skids - more detailed
        const skidGeometry = new THREE.CylinderGeometry(0.025, 0.025, 1.8, 12);
        
        // Left skid
        const leftSkid = new THREE.Mesh(skidGeometry, this.skidMaterial);
        leftSkid.position.set(0.2, -0.9, 0.7);
        leftSkid.rotation.z = Math.PI / 2;
        this.model.add(leftSkid);
        
        // Right skid
        const rightSkid = new THREE.Mesh(skidGeometry, this.skidMaterial);
        rightSkid.position.set(0.2, -0.9, -0.7);
        rightSkid.rotation.z = Math.PI / 2;
        this.model.add(rightSkid);
        
        // Skid supports - more realistic
        for (let side of [-1, 1]) {
            const supportGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
            const support = new THREE.Mesh(supportGeometry, this.skidMaterial);
            support.position.set(-0.3, -0.6, side * 0.7);
            support.rotation.z = Math.PI / 4;
            this.model.add(support);
            
            // Additional diagonal support
            const diagSupportGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6);
            const diagSupport = new THREE.Mesh(diagSupportGeometry, this.skidMaterial);
            diagSupport.position.set(0.1, -0.7, side * 0.7);
            diagSupport.rotation.z = -Math.PI / 6;
            this.model.add(diagSupport);
        }
        
        // Skid tips
        for (let side of [-1, 1]) {
            const tipGeometry = new THREE.SphereGeometry(0.03, 8, 6);
            const tip = new THREE.Mesh(tipGeometry, this.skidMaterial);
            tip.position.set(1.1, -0.9, side * 0.7);
            this.model.add(tip);
        }
        
        // Tail skid - more detailed
        const tailSkidGeometry = new THREE.SphereGeometry(0.05, 8, 6);
        const tailSkid = new THREE.Mesh(tailSkidGeometry, this.skidMaterial);
        tailSkid.position.set(-2.8, -0.8, 0);
        this.model.add(tailSkid);
        
        // Tail skid support
        const tailSupportGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6);
        const tailSupport = new THREE.Mesh(tailSupportGeometry, this.skidMaterial);
        tailSupport.position.set(-2.6, -0.65, 0);
        tailSupport.rotation.z = Math.PI / 4;
        this.model.add(tailSupport);
    }

    createDetails() {
        // Main antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.4, 6);
        const antenna = new THREE.Mesh(antennaGeometry, this.metalMaterial);
        antenna.position.set(0.5, 0.8, 0);
        this.model.add(antenna);
        
        // Antenna base
        const antennaBaseGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 8);
        const antennaBase = new THREE.Mesh(antennaBaseGeometry, this.metalMaterial);
        antennaBase.position.set(0.5, 0.6, 0);
        this.model.add(antennaBase);
        
        // Search light with housing
        const lightHousingGeometry = new THREE.SphereGeometry(0.1, 12, 8);
        const lightHousing = new THREE.Mesh(lightHousingGeometry, this.metalMaterial);
        lightHousing.position.set(1.0, 0.2, 0);
        this.model.add(lightHousing);
        
        // Light lens
        const lightLensGeometry = new THREE.SphereGeometry(0.08, 12, 8);
        const lightLens = new THREE.Mesh(lightLensGeometry, new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            emissive: 0x222222
        }));
        lightLens.position.set(1.0, 0.2, 0);
        this.model.add(lightLens);
        
        // Navigation lights
        this.createNavigationLights();
        
        // Rivets and fasteners
        this.createRivets();
        
        // Fuel cap
        this.createFuelCap();
        
        // Emergency equipment
        this.createEmergencyEquipment();
    }
    
    createNavigationLights() {
        // Red navigation light (left)
        const redLightGeometry = new THREE.SphereGeometry(0.03, 8, 6);
        const redLight = new THREE.Mesh(redLightGeometry, new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0x220000,
            transparent: true,
            opacity: 0.9
        }));
        redLight.position.set(0.3, 0.5, 0.4);
        this.model.add(redLight);
        
        // Green navigation light (right)
        const greenLightGeometry = new THREE.SphereGeometry(0.03, 8, 6);
        const greenLight = new THREE.Mesh(greenLightGeometry, new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x002200,
            transparent: true,
            opacity: 0.9
        }));
        greenLight.position.set(0.3, 0.5, -0.4);
        this.model.add(greenLight);
        
        // White strobe light (top)
        const strobeGeometry = new THREE.SphereGeometry(0.025, 8, 6);
        const strobe = new THREE.Mesh(strobeGeometry, new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x444444,
            transparent: true,
            opacity: 0.9
        }));
        strobe.position.set(0, 1.0, 0);
        this.model.add(strobe);
    }
    
    createRivets() {
        const rivetGeometry = new THREE.SphereGeometry(0.005, 6, 4);
        const rivetMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.8,
            roughness: 0.2
        });
        
        // Add rivets along panel lines
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 3; j++) {
                const rivet = new THREE.Mesh(rivetGeometry, rivetMaterial);
                rivet.position.set(0.4 + j * 0.3, -0.1 + i * 0.1, 0.2);
                this.model.add(rivet);
            }
        }
    }
    
    createFuelCap() {
        const capGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8);
        const cap = new THREE.Mesh(capGeometry, this.metalMaterial);
        cap.position.set(-0.5, 0.1, 0.3);
        this.model.add(cap);
        
        // Fuel cap handle
        const handleGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.05, 6);
        const handle = new THREE.Mesh(handleGeometry, this.metalMaterial);
        handle.position.set(-0.5, 0.12, 0.3);
        handle.rotation.z = Math.PI / 2;
        this.model.add(handle);
    }
    
    createEmergencyEquipment() {
        // Emergency floatation device
        const floatGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
        const float = new THREE.Mesh(floatGeometry, new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            metalness: 0.0,
            roughness: 0.8
        }));
        float.position.set(-0.2, -0.3, 0);
        this.model.add(float);
        
        // Emergency beacon
        const beaconGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
        const beacon = new THREE.Mesh(beaconGeometry, new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0x220000
        }));
        beacon.position.set(0.8, 0.3, 0);
        this.model.add(beacon);
    }
    
    createLightingEffects() {
        // Search light
        const searchLight = new THREE.SpotLight(0xffffff, 2, 10, Math.PI / 6, 0.3, 1);
        searchLight.position.set(1.0, 0.2, 0);
        searchLight.target.position.set(1.0, 0.2, -2);
        searchLight.castShadow = true;
        searchLight.shadow.mapSize.width = 1024;
        searchLight.shadow.mapSize.height = 1024;
        this.model.add(searchLight);
        this.model.add(searchLight.target);
        
        // Landing light
        const landingLight = new THREE.SpotLight(0xffffff, 1, 5, Math.PI / 4, 0.5, 1);
        landingLight.position.set(0, -0.5, 0);
        landingLight.target.position.set(0, -2, 0);
        landingLight.castShadow = true;
        this.model.add(landingLight);
        this.model.add(landingLight.target);
        
        // Navigation lights
        const redLight = new THREE.PointLight(0xff0000, 0.5, 2);
        redLight.position.set(0.3, 0.5, 0.4);
        this.model.add(redLight);
        
        const greenLight = new THREE.PointLight(0x00ff00, 0.5, 2);
        greenLight.position.set(0.3, 0.5, -0.4);
        this.model.add(greenLight);
        
        const whiteStrobe = new THREE.PointLight(0xffffff, 1, 3);
        whiteStrobe.position.set(0, 1.0, 0);
        this.model.add(whiteStrobe);
        
        // Store lights for animation
        this.lights = {
            searchLight,
            landingLight,
            redLight,
            greenLight,
            whiteStrobe
        };
    }

    update(time, delta) {
        if (!this.ready || !this.model) return;
        
        // Update animation time
        this.animationTime += delta;
        
        // Rotate main rotor with realistic dynamics
        if (this.mainRotor) {
            this.mainRotor.rotation.y += this.rotorSpeed * delta;
            
            // Add slight blade flex simulation
            this.mainRotor.children.forEach((child, index) => {
                if (child.type === 'Group') { // Rotor blade
                    const flexAmount = Math.sin(time * 10 + index) * 0.02;
                    child.rotation.x = flexAmount;
                }
            });
        }
        
        // Rotate tail rotor (faster and more realistic)
        if (this.tailRotor) {
            this.tailRotor.rotation.x += this.rotorSpeed * delta * 4.5;
        }
        
        // Enhanced hovering animation with more realistic movement
        const hoverOffset = Math.sin(time * this.hoverSpeed) * this.hoverAmplitude;
        const swayOffset = Math.sin(time * this.hoverSpeed * 0.7) * 0.1;
        const pitchOffset = Math.sin(time * this.hoverSpeed * 0.5) * 0.02;
        const rollOffset = Math.sin(time * this.hoverSpeed * 0.3) * 0.01;
        
        this.model.position.y = this.baseY + hoverOffset;
        this.model.position.x += Math.sin(time * 0.5) * 0.02;
        this.model.position.z += swayOffset;
        
        // More realistic attitude changes
        this.model.rotation.z = Math.sin(time * this.hoverSpeed * 0.3) * 0.05 + rollOffset;
        this.model.rotation.x = pitchOffset;
        
        // Rotor disc opacity animation for blur effect
        if (this.rotorDisc) {
            this.rotorDisc.material.opacity = this.blurOpacity + Math.sin(time * 20) * 0.1;
        }
        
        // Rotor wash animation
        if (this.rotorWashMesh) {
            this.rotorWashMesh.material.opacity = 0.1 + Math.sin(time * 15) * 0.05;
            this.rotorWashMesh.rotation.y += delta * 0.5;
        }
        
        // Navigation lights blinking
        this.updateNavigationLights(time);
        
        // Update lighting effects
        this.updateLightingEffects(time);
        
        // Engine vibration effect
        this.updateEngineVibration(time, delta);
    }
    
    updateNavigationLights(time) {
        // Find navigation lights and make them blink
        this.model.traverse((child) => {
            if (child.material && child.material.emissive) {
                if (child.material.color.getHex() === 0xff0000 || 
                    child.material.color.getHex() === 0x00ff00) {
                    // Red and green nav lights - steady
                    child.material.emissive.setHex(child.material.color.getHex() * 0.1);
                } else if (child.material.color.getHex() === 0xffffff) {
                    // White strobe light - blinking
                    const blink = Math.sin(time * 8) > 0 ? 1 : 0;
                    child.material.emissive.setHex(0x444444 * blink);
                }
            }
        });
    }
    
    updateEngineVibration(time, delta) {
        // Add subtle engine vibration to the entire helicopter
        const vibrationIntensity = 0.001;
        const vibrationX = Math.sin(time * 50) * vibrationIntensity;
        const vibrationY = Math.sin(time * 47) * vibrationIntensity;
        const vibrationZ = Math.sin(time * 53) * vibrationIntensity;
        
        this.model.position.x += vibrationX;
        this.model.position.y += vibrationY;
        this.model.position.z += vibrationZ;
    }
    
    updateLightingEffects(time) {
        if (!this.lights) return;
        
        // Strobe light blinking
        const strobeIntensity = Math.sin(time * 8) > 0 ? 1 : 0;
        this.lights.whiteStrobe.intensity = strobeIntensity;
        
        // Search light slight movement
        if (this.lights.searchLight && this.lights.searchLight.target) {
            this.lights.searchLight.target.position.x = 1.0 + Math.sin(time * 0.5) * 0.1;
            this.lights.searchLight.target.position.z = -2 + Math.cos(time * 0.3) * 0.2;
        }
        
        // Landing light intensity variation
        if (this.lights.landingLight) {
            this.lights.landingLight.intensity = 1 + Math.sin(time * 2) * 0.2;
        }
    }

    dispose() {
        if (this.model && this.model.parent) {
            this.model.parent.remove(this.model);
        }
        this.model = null;
        this.ready = false;
    }
}

export { Helicopter };
