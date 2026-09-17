// ==========================================================
// DRONE PILOT — MODULAR 3D DRONE (ENTERPRISE MATRICE SPEC)
// Hierarchical Component Architecture:
// Frame, Motors, Propellers (with Orange Tips), Battery,
// Flight Controller, RTK GNSS, Cameras, Landing Gear.
// ==========================================================

import * as THREE from "three";
import { DroneDefinition, TelemetryState } from "@/lib/simulation/types";

interface PropellerAssembly {
  bladeGroup: THREE.Group;
  blurMesh: THREE.Mesh;
  blurMaterial: THREE.MeshBasicMaterial;
  bladeMaterial: THREE.MeshStandardMaterial;
  direction: 1 | -1;
  motorIndex: number;
}

export class ModularDrone {
  public group = new THREE.Group();
  public groundShadowMesh!: THREE.Mesh;
  public def: DroneDefinition;
  private propellers: PropellerAssembly[] = [];
  private armGroups: THREE.Group[] = [];
  private armOriginalAngles: number[] = [];
  private propGroups: THREE.Group[] = [];

  // Active 3-axis stabilized camera gimbal
  private gimbalGroup: THREE.Group | null = null;
  private gimbalRollArm: THREE.Group | null = null;
  private cameraPod: THREE.Group | null = null;

  // Battery gauge LEDs
  private batteryLeds: THREE.Mesh[] = [];
  private ledBatteryGreenMat!: THREE.MeshBasicMaterial;
  private ledBatteryAmberMat!: THREE.MeshBasicMaterial;
  private ledBatteryRedMat!: THREE.MeshBasicMaterial;
  private ledBatteryOffMat!: THREE.MeshStandardMaterial;

  // Anti-collision strobe
  private tailStrobeMesh: THREE.Mesh | null = null;
  private strobeMaterial!: THREE.MeshBasicMaterial;
  private strobeTimer = 0;

  // Smoothing & visual attitude state
  private visualPos = new THREE.Vector3();
  private visualPitch = 0;
  private visualRoll = 0;
  private visualYaw = 0;
  private isInitialized = false;

  public isDamaged = false;
  private smokeParticles: THREE.Points | null = null;
  private smokePositions!: Float32Array;
  private sparkParticles: THREE.Points | null = null;
  private sparkPositions!: Float32Array;
  private nameTagSprite: THREE.Sprite | null = null;
  private pilotName = "PILOT";

  constructor(definition: DroneDefinition, pilotName = "PILOT") {
    this.def = definition;
    this.pilotName = pilotName;
    this.buildDrone();
    this.updateNameTag();
  }

  public setPilotName(name: string) {
    this.pilotName = name.toUpperCase();
    this.updateNameTag();
  }

  public setNameTagVisible(visible: boolean) {
    if (this.nameTagSprite) {
      this.nameTagSprite.visible = visible;
    }
  }

  private updateNameTag() {
    if (this.nameTagSprite) {
      this.group.remove(this.nameTagSprite);
      this.nameTagSprite.material.dispose();
      this.nameTagSprite = null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dark high-contrast rounded badge background
    ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
    ctx.beginPath();
    ctx.roundRect(12, 16, 488, 96, 28);
    ctx.fill();

    // Vibrant aerospace orange neon border
    ctx.strokeStyle = "#FF5500";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Glowing pilot beacon indicator (left)
    ctx.fillStyle = "#FF5500";
    ctx.beginPath();
    ctx.arc(60, 64, 14, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright white dot
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(60, 64, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pilot name text (truncated cleanly if long)
    const displayName = this.pilotName.length > 18 ? this.pilotName.substring(0, 16) + "…" : this.pilotName;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 36px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(displayName, 95, 64);

    // "YOU" tag on the right
    ctx.fillStyle = "#FF5500";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "right";
    ctx.fillText("YOU", 470, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      depthTest: true,
      depthWrite: false,
    });
    this.nameTagSprite = new THREE.Sprite(spriteMat);
    // Position floating above the drone canopy
    this.nameTagSprite.position.set(0, 0.52, 0);
    this.nameTagSprite.scale.set(1.4, 0.35, 1);
    this.group.add(this.nameTagSprite);
  }

  public setDefinition(definition: DroneDefinition) {
    this.def = definition;
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.propellers = [];
    this.armGroups = [];
    this.armOriginalAngles = [];
    this.propGroups = [];
    this.batteryLeds = [];
    this.nameTagSprite = null;
    this.buildDrone();
    this.updateNameTag();
  }

  /**
   * Generates a realistic procedural radial motion-blur texture for high-RPM propellers
   */
  private createPropBlurTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const center = size / 2;
    const outerRadius = size / 2 - 4;

    // Transparent background
    ctx.clearRect(0, 0, size, size);

    // Concentric aerodynamic path rings
    for (let r = 18; r < outerRadius; r += 1.5) {
      const normR = (r - 18) / (outerRadius - 18);
      const density = Math.sin(normR * Math.PI) * 0.42 + 0.12;
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(32, 36, 42, ${density.toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // Outer safety orange safety tip ring streak (outer 18% radius)
    const tipInner = outerRadius - 24;
    for (let r = tipInner; r < outerRadius; r += 2) {
      const tipAlpha = ((r - tipInner) / 24) * 0.65;
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 85, 0, ${tipAlpha.toFixed(3)})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    // Subtle specular radial streak sheen
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
    grad.addColorStop(0.45, "rgba(255, 255, 255, 0.08)");
    grad.addColorStop(0.55, "rgba(255, 255, 255, 0.18)");
    grad.addColorStop(0.65, "rgba(255, 255, 255, 0.08)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  private buildDrone() {
    // ------------------------------------------------------
    // 1. PROFESSIONAL AEROSPACE MATERIALS PALETTE
    // ------------------------------------------------------
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x333842, // Matte engineered slate polymer
      roughness: 0.35,
      metalness: 0.22,
    });

    const chassisCarbonMat = new THREE.MeshStandardMaterial({
      color: 0x181a1f, // Structural carbon-composite bottom tub
      roughness: 0.45,
      metalness: 0.35,
    });

    const titaniumTrimMat = new THREE.MeshStandardMaterial({
      color: 0x5a606d, // CNC anodized aerospace aluminum
      roughness: 0.22,
      metalness: 0.88,
    });

    const carbonArmMat = new THREE.MeshStandardMaterial({
      color: 0x141619, // Carbon fiber arm tube
      roughness: 0.38,
      metalness: 0.40,
    });

    const motorBellMat = new THREE.MeshStandardMaterial({
      color: 0x1e2127, // Brushed motor bell housing
      roughness: 0.20,
      metalness: 0.90,
    });

    const copperStatorMat = new THREE.MeshStandardMaterial({
      color: 0xcc6f2a, // Stator copper wire windings
      roughness: 0.25,
      metalness: 0.95,
    });

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x1d1f24,
      roughness: 0.30,
      metalness: 0.25,
      transparent: true,
      opacity: 1.0,
    });

    const orangeTipMat = new THREE.MeshStandardMaterial({
      color: 0xff5500, // Aviation safety orange
      roughness: 0.30,
      metalness: 0.10,
      transparent: true,
      opacity: 1.0,
    });

    const lensGlassMat = new THREE.MeshStandardMaterial({
      color: 0x050c18,
      emissive: 0x0077b6,
      emissiveIntensity: 0.6,
      roughness: 0.04,
      metalness: 0.96,
    });

    const rubberPadMat = new THREE.MeshStandardMaterial({
      color: 0x101113,
      roughness: 0.92,
      metalness: 0.05,
    });

    const heatSinkMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c21,
      roughness: 0.28,
      metalness: 0.85,
    });

    // LEDs & Navigation Lighting
    const ledGreen = new THREE.MeshBasicMaterial({ color: 0x00e676 }); // Starboard (Right)
    const ledRed = new THREE.MeshBasicMaterial({ color: 0xff1744 });   // Port (Left)
    const ledHeadlight = new THREE.MeshBasicMaterial({ color: 0xfffaed }); // Forward white spotlight
    this.strobeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Rear anti-collision strobe
    this.ledBatteryGreenMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
    this.ledBatteryAmberMat = new THREE.MeshBasicMaterial({ color: 0xffb300 });
    this.ledBatteryRedMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    this.ledBatteryOffMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.8 });

    // ------------------------------------------------------
    // 2. SCULPTED AERODYNAMIC MONOCOQUE FUSELAGE
    // Distinct Front vs Rear Orientation
    // ------------------------------------------------------
    const bodyScale = this.def.type === "octacopter" ? 1.10 : this.def.type === "hexacopter" ? 1.04 : 0.98;
    const bodyLength = 0.54 * bodyScale;
    const bodyWidth = 0.23 * bodyScale;
    const bodyHeight = 0.12 * bodyScale;

    const fuselage = new THREE.Group();

    // A. Bottom Structural Carbon Tub (sloped aerodynamic keel)
    const tubGeo = new THREE.CylinderGeometry(bodyWidth * 0.44, bodyWidth * 0.48, bodyLength * 0.88, 8);
    tubGeo.rotateX(Math.PI / 2);
    tubGeo.scale(1.0, 0.45, 1.0);
    const bottomTub = new THREE.Mesh(tubGeo, chassisCarbonMat);
    bottomTub.position.set(0, -bodyHeight * 0.22, 0);
    fuselage.add(bottomTub);

    // B. Main Mid-Hull Deck
    const midDeck = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth, bodyHeight * 0.52, bodyLength * 0.86),
      hullMat
    );
    midDeck.position.set(0, bodyHeight * 0.04, -bodyLength * 0.02);
    fuselage.add(midDeck);

    // C. Sculpted Aerodynamic Nose Canopy (FRONT INDICATOR)
    const noseGeo = new THREE.ConeGeometry(bodyWidth * 0.48, bodyLength * 0.42, 6);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.scale(1.0, 0.48, 1.0);
    const noseCanopy = new THREE.Mesh(noseGeo, hullMat);
    noseCanopy.position.set(0, bodyHeight * 0.06, bodyLength * 0.44);
    fuselage.add(noseCanopy);

    // D. Dual Forward Inspection Headlights (Warm White Spotlights)
    [-0.06 * bodyScale, 0.06 * bodyScale].forEach((xOff) => {
      const lightHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.020, 0.015, 12),
        titaniumTrimMat
      );
      lightHousing.rotation.x = Math.PI / 2;
      lightHousing.position.set(xOff, -bodyHeight * 0.10, bodyLength * 0.50);
      fuselage.add(lightHousing);

      const lightLens = new THREE.Mesh(new THREE.CircleGeometry(0.015, 12), ledHeadlight);
      lightLens.position.set(xOff, -bodyHeight * 0.10, bodyLength * 0.508);
      fuselage.add(lightLens);
    });

    // E. Forward Binocular Obstacle-Avoidance Stereo Vision Sensors
    [-0.045 * bodyScale, 0.045 * bodyScale].forEach((xOff) => {
      const eyeHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.016, 0.018, 12),
        titaniumTrimMat
      );
      eyeHousing.rotation.x = Math.PI / 2;
      eyeHousing.position.set(xOff, bodyHeight * 0.18, bodyLength * 0.42);
      fuselage.add(eyeHousing);

      const eyeLens = new THREE.Mesh(new THREE.CircleGeometry(0.012, 12), lensGlassMat);
      eyeLens.position.set(xOff, bodyHeight * 0.18, bodyLength * 0.43);
      fuselage.add(eyeLens);
    });

    // F. Top RTK GNSS Disc (with metallic bezel and carbon core)
    const rtkBezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062 * bodyScale, 0.065 * bodyScale, 0.04, 16),
      titaniumTrimMat
    );
    rtkBezel.position.set(0, bodyHeight * 0.38 + 0.02, -bodyLength * 0.04);
    fuselage.add(rtkBezel);

    const rtkCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056 * bodyScale, 0.056 * bodyScale, 0.015, 16),
      chassisCarbonMat
    );
    rtkCap.position.set(0, bodyHeight * 0.38 + 0.045, -bodyLength * 0.04);
    fuselage.add(rtkCap);

    // G. Top Aluminum Heat-Sink Cooling Fins
    for (let i = -2; i <= 2; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.005, 0.016, 0.14),
        heatSinkMat
      );
      fin.position.set(i * 0.018, bodyHeight * 0.34, -bodyLength * 0.22);
      fuselage.add(fin);
    }

    // H. Rear Quick-Release Battery Cartridge (REAR INDICATOR)
    const batteryPack = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.82, bodyHeight * 0.58, bodyLength * 0.36),
      chassisCarbonMat
    );
    batteryPack.position.set(0, bodyHeight * 0.06, -bodyLength * 0.46);
    fuselage.add(batteryPack);

    // Battery Release Latch / Pull Handle
    const latch = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.42, 0.016, 0.02),
      titaniumTrimMat
    );
    latch.position.set(0, bodyHeight * 0.28, -bodyLength * 0.58);
    fuselage.add(latch);

    // 4-LED Battery Fuel Gauge on top of battery pack
    this.batteryLeds = [];
    for (let i = 0; i < 4; i++) {
      const ledDot = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.006, 0.008),
        this.ledBatteryGreenMat
      );
      ledDot.position.set(-0.03 + i * 0.02, bodyHeight * 0.36, -bodyLength * 0.46);
      fuselage.add(ledDot);
      this.batteryLeds.push(ledDot);
    }

    // I. Rear High-Intensity Anti-Collision Strobe Beacon
    const strobeMount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.018, 0.02, 12),
      titaniumTrimMat
    );
    strobeMount.position.set(0, bodyHeight * 0.16, -bodyLength * 0.65);
    fuselage.add(strobeMount);

    this.tailStrobeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 12, 12),
      this.strobeMaterial
    );
    this.tailStrobeMesh.position.set(0, bodyHeight * 0.16 + 0.015, -bodyLength * 0.65);
    fuselage.add(this.tailStrobeMesh);

    // J. Downward Optical Flow & LiDAR Sensor Pod (belly)
    const downwardSensor = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.02, 0.06),
      titaniumTrimMat
    );
    downwardSensor.position.set(0, -bodyHeight * 0.34, 0.04);
    fuselage.add(downwardSensor);

    const downwardLens1 = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), lensGlassMat);
    downwardLens1.rotation.x = Math.PI / 2;
    downwardLens1.position.set(-0.022, -bodyHeight * 0.352, 0.04);
    fuselage.add(downwardLens1);

    const downwardLens2 = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), lensGlassMat);
    downwardLens2.rotation.x = Math.PI / 2;
    downwardLens2.position.set(0.022, -bodyHeight * 0.352, 0.04);
    fuselage.add(downwardLens2);

    this.group.add(fuselage);

    // ------------------------------------------------------
    // 3. ACTIVE 3-AXIS STABILIZED CAMERA GIMBAL
    // Under-slung inspection camera that counter-stabilizes with drone tilt
    // ------------------------------------------------------
    this.gimbalGroup = new THREE.Group();
    this.gimbalGroup.position.set(0, -bodyHeight * 0.28, bodyLength * 0.35);

    // Gimbal Base Vibration Damping Plate
    const damperPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.042, 0.014, 16),
      titaniumTrimMat
    );
    this.gimbalGroup.add(damperPlate);

    // Yaw Motor
    const yawMotor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.024, 16),
      titaniumTrimMat
    );
    yawMotor.position.y = -0.016;
    this.gimbalGroup.add(yawMotor);

    // Roll Arm & Motor
    this.gimbalRollArm = new THREE.Group();
    this.gimbalRollArm.position.y = -0.032;

    const rollBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.016, 0.016),
      titaniumTrimMat
    );
    this.gimbalRollArm.add(rollBracket);

    const rollMotor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12),
      titaniumTrimMat
    );
    rollMotor.rotation.z = Math.PI / 2;
    rollMotor.position.set(0.034, -0.018, 0);
    this.gimbalRollArm.add(rollMotor);

    // Pitch Bracket & Cylindrical Camera Pod
    this.cameraPod = new THREE.Group();
    this.cameraPod.position.set(0, -0.035, 0);

    // Main Camera Barrel Housing
    const cameraHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.075, 16),
      hullMat
    );
    cameraHousing.rotation.x = Math.PI / 2;
    this.cameraPod.add(cameraHousing);

    // Outer Anodized Lens Bezel
    const lensBezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.034, 0.016, 16),
      titaniumTrimMat
    );
    lensBezel.rotation.x = Math.PI / 2;
    lensBezel.position.z = 0.042;
    this.cameraPod.add(lensBezel);

    // Front Optical Element (Coated Glass with cyan/sapphire glow)
    const mainLens = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), lensGlassMat);
    mainLens.position.z = 0.051;
    this.cameraPod.add(mainLens);

    this.gimbalRollArm.add(this.cameraPod);
    this.gimbalGroup.add(this.gimbalRollArm);
    this.group.add(this.gimbalGroup);

    // ------------------------------------------------------
    // 4. STRUCTURAL COMPOSITE ARMS, MOTORS & PROPELLERS
    // Supports Quadcopter, Hexacopter, & Octacopter configurations
    // ------------------------------------------------------
    const propBlurTex = this.createPropBlurTexture();

    this.def.motors.forEach((motor, idx) => {
      const armGroup = new THREE.Group();

      const armVector = new THREE.Vector3(motor.position.x, 0, motor.position.z);
      const armLength = armVector.length();
      const angle = Math.atan2(motor.position.x, motor.position.z);

      armGroup.rotation.y = angle;

      // A. CNC Fuselage Root Collar Clamp
      const rootClamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.034, 0.045, 8),
        titaniumTrimMat
      );
      rootClamp.rotation.x = Math.PI / 2;
      rootClamp.position.z = 0.08;
      armGroup.add(rootClamp);

      // B. Structural Streamlined Carbon Arm Spar
      const armTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.024, armLength - 0.04, 12),
        carbonArmMat
      );
      armTube.rotation.x = Math.PI / 2;
      armTube.scale.set(0.85, 1.0, 1.15); // Aerodynamic streamline
      armTube.position.z = (armLength + 0.04) / 2;
      armGroup.add(armTube);

      // C. High-Visibility Orange Leading-Edge Stripe on Front Arms
      const isFrontArm = motor.position.z > 0;
      if (isFrontArm) {
        const stripe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.024, 0.025, armLength * 0.35, 12),
          orangeTipMat
        );
        stripe.rotation.x = Math.PI / 2;
        stripe.scale.set(0.86, 1.0, 1.16);
        stripe.position.z = armLength * 0.65;
        armGroup.add(stripe);
      }

      // D. Aerodynamic Motor Nacelle & Mounting Bracket
      const motorNacelle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.052, 0.05, 16),
        chassisCarbonMat
      );
      motorNacelle.position.set(0, 0.015, armLength);
      armGroup.add(motorNacelle);

      // CNC Aluminum Motor Top Mount
      const motorMount = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.060, 0.016, 16),
        titaniumTrimMat
      );
      motorMount.position.set(0, 0.038, armLength);
      armGroup.add(motorMount);

      // E. Brushless Outrunner Motor
      // Exposed Stator Core with visible Copper Windings
      const statorCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.056, 0.056, 0.020, 16),
        copperStatorMat
      );
      statorCore.position.set(0, 0.052, armLength);
      armGroup.add(statorCore);

      // Motor Bell Housing
      const motorBell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.062, 0.064, 0.038, 16),
        motorBellMat
      );
      motorBell.position.set(0, 0.070, armLength);
      armGroup.add(motorBell);

      // Stainless Steel Center Rotor Shaft & Knurled Prop Nut
      const shaftNut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.020, 0.035, 12),
        titaniumTrimMat
      );
      shaftNut.position.set(0, 0.096, armLength);
      armGroup.add(shaftNut);

      // F. Aviation Navigation LED on Motor Underside
      // Starboard (Right) = Green, Port (Left) = Red
      const isStarboard = motor.position.x > 0;
      const navLightHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.020, 0.014, 12),
        titaniumTrimMat
      );
      navLightHousing.position.set(0, -0.015, armLength);
      armGroup.add(navLightHousing);

      const navLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 8, 8),
        isStarboard ? ledGreen : ledRed
      );
      navLed.position.set(0, -0.024, armLength);
      armGroup.add(navLed);

      // G. Motor-Integrated Angled Landing Gear Strut
      const legHeight = 0.23;
      const landingStrut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.011, legHeight, 8),
        hullMat
      );
      landingStrut.rotation.x = -0.15;
      landingStrut.position.set(0, -legHeight / 2 - 0.02, armLength - 0.02);
      armGroup.add(landingStrut);

      // Vibration Damper Silicone Rubber Foot
      const rubberFoot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.022, 0.028, 8),
        rubberPadMat
      );
      rubberFoot.position.set(0, -legHeight - 0.025, armLength - 0.035);
      armGroup.add(rubberFoot);

      // ----------------------------------------------------
      // H. DUAL-STATE PROPELLER SYSTEM
      // 1. Visible 3D Twisted Aerodynamic Blades (Low RPM)
      // 2. Procedural Radial Motion Blur Disc (High RPM)
      // ----------------------------------------------------
      const propAssemblyGroup = new THREE.Group();
      propAssemblyGroup.position.set(0, 0.105, armLength);

      const bladeRadius = 0.28;
      const orangeRatio = 0.24;

      // 1. Aerodynamic Blade Group
      const bladeGroup = new THREE.Group();
      const bladeMatInstance = bladeMat.clone();
      const orangeTipMatInstance = orangeTipMat.clone();

      // Blade Hub Spinner Cap
      const spinnerCap = new THREE.Mesh(
        new THREE.ConeGeometry(0.026, 0.036, 12),
        titaniumTrimMat
      );
      spinnerCap.position.y = 0.015;
      bladeGroup.add(spinnerCap);

      [-1, 1].forEach((dir) => {
        const carbonLen = bladeRadius * (1 - orangeRatio);
        const rootBlade = new THREE.Mesh(
          new THREE.BoxGeometry(carbonLen, 0.006, 0.036),
          bladeMatInstance
        );
        rootBlade.position.x = (dir * carbonLen) / 2;
        rootBlade.rotation.x = dir * motor.direction * 0.16;
        bladeGroup.add(rootBlade);

        // Safety Orange Outer Tip
        const tipLen = bladeRadius * orangeRatio;
        const tipBlade = new THREE.Mesh(
          new THREE.BoxGeometry(tipLen, 0.007, 0.035),
          orangeTipMatInstance
        );
        tipBlade.position.x = dir * (carbonLen + tipLen / 2);
        tipBlade.rotation.x = dir * motor.direction * 0.16;
        bladeGroup.add(tipBlade);
      });

      propAssemblyGroup.add(bladeGroup);

      // 2. High-RPM Procedural Motion Blur Disc
      const blurDiscGeo = new THREE.PlaneGeometry(bladeRadius * 2.12, bladeRadius * 2.12);
      const blurDiscMat = new THREE.MeshBasicMaterial({
        map: propBlurTex,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const blurMesh = new THREE.Mesh(blurDiscGeo, blurDiscMat);
      blurMesh.rotation.x = -Math.PI / 2;
      blurMesh.position.y = 0.005;
      propAssemblyGroup.add(blurMesh);

      armGroup.add(propAssemblyGroup);

      this.propellers.push({
        bladeGroup,
        blurMesh,
        blurMaterial: blurDiscMat,
        bladeMaterial: bladeMatInstance,
        direction: motor.direction,
        motorIndex: idx,
      });

      this.armGroups.push(armGroup);
      this.armOriginalAngles.push(angle);
      this.propGroups.push(propAssemblyGroup);

      this.group.add(armGroup);
    });

    // ------------------------------------------------------
    // 5. CRASH SMOKE & HIGH-VOLTAGE ELECTRICAL SPARK EMITTERS
    // ------------------------------------------------------
    this.buildCrashFX();

    // ------------------------------------------------------
    // 6. SHADOW CASTING ON ALL DRONE MESHES
    // ------------------------------------------------------
    this.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh) !== this.groundShadowMesh) {
        child.castShadow = true;
      }
    });

    // ------------------------------------------------------
    // 7. REALISTIC GROUND CONTACT SHADOW DECAL
    // ------------------------------------------------------
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(0,0,0,0.55)");
      grad.addColorStop(0.35, "rgba(0,0,0,0.28)");
      grad.addColorStop(0.70, "rgba(0,0,0,0.08)");
      grad.addColorStop(1, "rgba(0,0,0,0.0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    this.groundShadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.9),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.50,
        depthWrite: false,
      })
    );
    this.groundShadowMesh.rotation.x = -Math.PI / 2;
    this.groundShadowMesh.position.set(0, 0.445, 0);
  }

  /**
   * Builds billowing smoke and sparking particle systems for visual crash damage
   */
  private buildCrashFX() {
    // 1. Billowing Dark Smoke
    const smokeCount = 50;
    this.smokePositions = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount; i++) {
      this.smokePositions[i * 3] = (Math.random() - 0.5) * 0.2;
      this.smokePositions[i * 3 + 1] = Math.random() * 0.9;
      this.smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute("position", new THREE.BufferAttribute(this.smokePositions, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0x1f2937,
      size: 0.25,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    this.smokeParticles = new THREE.Points(smokeGeo, smokeMat);
    this.smokeParticles.visible = false;
    this.group.add(this.smokeParticles);

    // 2. High-Voltage Electrical Sparks
    const sparkCount = 35;
    this.sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      this.sparkPositions[i * 3] = (Math.random() - 0.5) * 0.25;
      this.sparkPositions[i * 3 + 1] = Math.random() * 0.4;
      this.sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(this.sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.09,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    this.sparkParticles = new THREE.Points(sparkGeo, sparkMat);
    this.sparkParticles.visible = false;
    this.group.add(this.sparkParticles);
  }

  public setDamaged(damaged: boolean) {
    this.isDamaged = damaged;

    if (damaged) {
      if (this.armGroups[0]) {
        this.armGroups[0].rotation.z = -0.65;
        this.armGroups[0].rotation.x = 0.45;
      }
      if (this.armGroups[1]) {
        this.armGroups[1].rotation.z = 0.52;
        this.armGroups[1].rotation.x = -0.38;
      }
      if (this.propGroups[0]) {
        this.propGroups[0].visible = false;
      }
      if (this.propGroups[1]) {
        this.propGroups[1].scale.set(0.25, 0.25, 0.25);
      }
      if (this.smokeParticles) this.smokeParticles.visible = true;
      if (this.sparkParticles) this.sparkParticles.visible = true;
    } else {
      this.armGroups.forEach((arm, i) => {
        arm.rotation.set(0, this.armOriginalAngles[i] || 0, 0);
      });
      this.propGroups.forEach((prop) => {
        prop.visible = true;
        prop.scale.set(1, 1, 1);
      });
      if (this.smokeParticles) this.smokeParticles.visible = false;
      if (this.sparkParticles) this.sparkParticles.visible = false;
    }
  }

  /**
   * Master frame-by-frame visual simulation update.
   * Integrates physics attitude smoothing, dual-state propeller blur,
   * active 3-axis camera gimbal stabilization, hover micro-corrections,
   * battery status gauge, anti-collision beacon, and ground shadow.
   */
  public update(telemetry: TelemetryState, dt: number) {
    // 1. Crash State Transition
    const isCrashed = !!telemetry.isCrashed;
    if (isCrashed !== this.isDamaged) {
      this.setDamaged(isCrashed);
    }

    // 2. Animate Crash Particles
    if (this.isDamaged) {
      if (this.smokePositions && this.smokeParticles) {
        for (let i = 0; i < this.smokePositions.length / 3; i++) {
          this.smokePositions[i * 3 + 1] += dt * 0.85;
          this.smokePositions[i * 3] += (Math.random() - 0.5) * dt * 0.18;
          this.smokePositions[i * 3 + 2] += (Math.random() - 0.5) * dt * 0.18;
          if (this.smokePositions[i * 3 + 1] > 1.8) {
            this.smokePositions[i * 3 + 1] = 0.05;
            this.smokePositions[i * 3] = (Math.random() - 0.5) * 0.2;
            this.smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
          }
        }
        this.smokeParticles.geometry.attributes.position.needsUpdate = true;
      }

      if (this.sparkPositions && this.sparkParticles) {
        for (let i = 0; i < this.sparkPositions.length / 3; i++) {
          this.sparkPositions[i * 3 + 1] += (Math.random() - 0.45) * dt * 2.0;
          this.sparkPositions[i * 3] += (Math.random() - 0.5) * dt * 1.6;
          this.sparkPositions[i * 3 + 2] += (Math.random() - 0.5) * dt * 1.6;
          if (this.sparkPositions[i * 3 + 1] > 0.8 || this.sparkPositions[i * 3 + 1] < 0) {
            this.sparkPositions[i * 3 + 1] = Math.random() * 0.2;
            this.sparkPositions[i * 3] = (Math.random() - 0.5) * 0.25;
            this.sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
          }
        }
        this.sparkParticles.geometry.attributes.position.needsUpdate = true;
      }
    }

    // 3. Smooth Physical-to-Visual Attitude Interpolation & Hover Micro-Dynamics
    const targetPos = new THREE.Vector3(telemetry.position.x, telemetry.position.y, telemetry.position.z);
    
    // Calculate subtle organic hover micro-corrections ONLY when hovering at low speeds (< 3 km/h)
    let microPitch = 0;
    let microRoll = 0;
    const isAirborne = telemetry.altitude > 0.08 && !isCrashed;
    if (isAirborne) {
      const speedKmh = telemetry.groundSpeed || 0;
      // Fade out completely as speed increases above 3 km/h to eliminate WASD vibration
      const hoverFactor = Math.max(0, Math.min(1, 1.0 - (speedKmh / 3.0)));
      if (hoverFactor > 0.01) {
        const time = performance.now() * 0.002;
        microPitch = (Math.sin(time * 2.8) * 0.003 + Math.cos(time * 5.1) * 0.0015) * hoverFactor;
        microRoll = (Math.cos(time * 3.2) * 0.003 + Math.sin(time * 4.5) * 0.0015) * hoverFactor;
      }
    }

    const targetPitch = telemetry.rotation.pitch + microPitch;
    const targetRoll = telemetry.rotation.roll + microRoll;
    const targetYaw = telemetry.rotation.yaw;

    if (!this.isInitialized) {
      this.visualPos.copy(targetPos);
      this.visualPitch = targetPitch;
      this.visualRoll = targetRoll;
      this.visualYaw = targetYaw;
      this.isInitialized = true;
    } else {
      // Direct positioning for instant responsive handling without visual lag
      this.visualPos.copy(targetPos);
      // Fast exponential smoothing on attitude to eliminate micro-stutter
      const smoothFactor = Math.min(1.0, dt * 28.0);
      this.visualPitch += (targetPitch - this.visualPitch) * smoothFactor;
      this.visualRoll += (targetRoll - this.visualRoll) * smoothFactor;
      this.visualYaw = targetYaw; // Yaw tracks 1:1 for crisp flight direction
    }

    this.group.position.copy(this.visualPos);
    this.group.rotation.order = "YXZ";
    this.group.rotation.y = this.visualYaw;
    this.group.rotation.x = this.visualPitch;
    this.group.rotation.z = this.visualRoll;

    // 4. Active 3-Axis Horizon-Locked Camera Gimbal Stabilization
    if (this.cameraPod && this.gimbalRollArm) {
      // Counter-pitch and counter-roll to keep the inspection camera locked to the horizon!
      const counterPitch = -this.visualPitch * 0.92;
      const counterRoll = -this.visualRoll * 0.88;
      this.cameraPod.rotation.x = counterPitch;
      this.gimbalRollArm.rotation.z = counterRoll;
    }

    // 5. Dual-State Propeller Spin & Motion-Blur Disc Cross-Fade
    const baseRpmPercent = telemetry.rotorRpmPercent || 0;
    const outputs = telemetry.motorOutputs && telemetry.motorOutputs.length > 0 
      ? telemetry.motorOutputs 
      : [baseRpmPercent / 100, baseRpmPercent / 100, baseRpmPercent / 100, baseRpmPercent / 100];

    this.propellers.forEach((p) => {
      // Individual motor throttle level [0.0 - 1.0]
      const motorThrottle = outputs[p.motorIndex] !== undefined ? outputs[p.motorIndex] : baseRpmPercent / 100;
      // Rotation angular velocity (rad/s)
      const spinSpeed = (12.0 + motorThrottle * 68.0) * p.direction;
      p.bladeGroup.rotation.y += spinSpeed * dt;

      // Blur disc blending logic:
      // - Below 18% RPM: Individual blades are sharp; blur disc is invisible.
      // - 18% to 55% RPM: Blades spin fast and begin blurring; blur disc fades in.
      // - Above 55% RPM: Translucent high-speed disc dominates with realistic motion swirl!
      if (motorThrottle < 0.18) {
        p.blurMaterial.opacity = 0.0;
        p.blurMesh.visible = false;
        p.bladeMaterial.opacity = 1.0;
      } else if (motorThrottle < 0.55) {
        const t = (motorThrottle - 0.18) / (0.55 - 0.18);
        p.blurMesh.visible = true;
        p.blurMaterial.opacity = t * 0.70;
        p.bladeMaterial.opacity = 1.0 - t * 0.65; // Fade blade as motion blur increases
      } else {
        p.blurMesh.visible = true;
        p.blurMaterial.opacity = 0.82;
        p.bladeMaterial.opacity = 0.22; // Faint blade ghosting under the motion disc
      }
    });

    // 6. Anti-Collision White Beacon Strobe Flash (1.0 Hz strobe pulse)
    this.strobeTimer += dt;
    if (this.strobeTimer >= 1.0) {
      this.strobeTimer = 0;
    }
    if (this.tailStrobeMesh) {
      const isFlash = this.strobeTimer < 0.08;
      this.tailStrobeMesh.visible = isFlash;
    }

    // 7. Battery Pack Fuel Gauge LEDs
    const batteryPct = telemetry.batteryLevel || 100;
    const activeLedCount = Math.ceil((batteryPct / 100) * 4);
    this.batteryLeds.forEach((led, i) => {
      if (i < activeLedCount) {
        if (batteryPct > 40) {
          led.material = this.ledBatteryGreenMat;
        } else if (batteryPct > 20) {
          led.material = this.ledBatteryAmberMat;
        } else {
          led.material = this.ledBatteryRedMat;
        }
      } else {
        led.material = this.ledBatteryOffMat;
      }
    });

    // 8. Dedicated Ground Contact Shadow Decal
    if (this.groundShadowMesh) {
      const surfaceY = Math.max(0.01, telemetry.position.y - telemetry.altitude - 0.245 + 0.005);
      this.groundShadowMesh.position.set(telemetry.position.x, surfaceY, telemetry.position.z);
      this.groundShadowMesh.rotation.z = -telemetry.rotation.yaw;

      const alt = Math.max(0, telemetry.altitude);
      const opacity = Math.max(0, 0.50 * Math.exp(-alt / 5.2));
      (this.groundShadowMesh.material as THREE.MeshBasicMaterial).opacity = opacity;

      const scale = 1.0 + alt * 0.09;
      this.groundShadowMesh.scale.set(scale, scale, 1);
      this.groundShadowMesh.visible = opacity > 0.01;
    }
  }
}