// ==========================================================
// DRONE PILOT — MODULAR 3D DRONE (ENTERPRISE MATRICE SPEC)
// Hierarchical Component Architecture:
// Frame, Motors, Propellers (with Orange Tips), Battery,
// Flight Controller, RTK GNSS, Cameras, Landing Gear.
// ==========================================================

import * as THREE from "three";
import { DroneDefinition, TelemetryState } from "@/lib/simulation/types";

interface PropellerAssembly {
  group: THREE.Group;
  direction: 1 | -1;
}

export class ModularDrone {
  public group = new THREE.Group();
  public groundShadowMesh!: THREE.Mesh;
  public def: DroneDefinition;
  private propellers: PropellerAssembly[] = [];
  private armGroups: THREE.Group[] = [];
  private armOriginalAngles: number[] = [];
  private propGroups: THREE.Group[] = [];
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
    // Clear and rebuild
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.propellers = [];
    this.nameTagSprite = null;
    this.buildDrone();
    this.updateNameTag();
  }

  private buildDrone() {
    // ------------------------------------------------------
    // 1. AEROSPACE MATERIALS (DJI MATRICE SPECIFICATION)
    // ------------------------------------------------------
    const tacticalHullMat = new THREE.MeshStandardMaterial({
      color: 0x5a5f67, // Matte tactical stealth gray
      roughness: 0.38,
      metalness: 0.25,
    });

    const underHullMat = new THREE.MeshStandardMaterial({
      color: 0x383c43,
      roughness: 0.42,
      metalness: 0.30,
    });

    const titaniumTrimMat = new THREE.MeshStandardMaterial({
      color: 0x22252a,
      roughness: 0.25,
      metalness: 0.75,
    });

    const carbonArmMat = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.40,
      metalness: 0.35,
    });

    const motorBellMat = new THREE.MeshStandardMaterial({
      color: 0x2e3238,
      roughness: 0.18,
      metalness: 0.88,
    });

    const copperStatorMat = new THREE.MeshStandardMaterial({
      color: 0xcc6f2a,
      roughness: 0.25,
      metalness: 0.95,
    });

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x1f2125,
      roughness: 0.35,
      metalness: 0.20,
    });

    // High-visibility aviation safety orange tips (Image 3 reference)
    const orangeTipMat = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      roughness: 0.30,
      metalness: 0.10,
    });

    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x050d18,
      emissive: 0x0088cc,
      emissiveIntensity: 0.5,
      roughness: 0.05,
      metalness: 0.95,
    });

    const rubberPadMat = new THREE.MeshStandardMaterial({
      color: 0x151618,
      roughness: 0.88,
      metalness: 0.05,
    });

    const ledGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const ledWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // ------------------------------------------------------
    // 2. CHISELED MONOCOQUE FUSELAGE
    // ------------------------------------------------------
    const bodyScale = this.def.type === "octacopter" ? 1.08 : this.def.type === "hexacopter" ? 1.02 : 0.96;
    const bodyLength = 0.52 * bodyScale;
    const bodyWidth = 0.22 * bodyScale;
    const bodyHeight = 0.11 * bodyScale;

    const fuselage = new THREE.Group();

    // Belly chassis
    const belly = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.92, bodyHeight * 0.45, bodyLength * 0.90),
      underHullMat
    );
    belly.position.set(0, -bodyHeight * 0.24, -bodyLength * 0.02);
    fuselage.add(belly);

    // Mid-hull deck
    const midHull = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth, bodyHeight * 0.55, bodyLength * 0.88),
      tacticalHullMat
    );
    midHull.position.set(0, bodyHeight * 0.08, -bodyLength * 0.03);
    fuselage.add(midHull);

    // Forward nose cowl
    const noseCowl = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.86, bodyHeight * 0.50, bodyLength * 0.32),
      tacticalHullMat
    );
    noseCowl.position.set(0, bodyHeight * 0.04, bodyLength * 0.44);
    noseCowl.rotation.x = 0.12;
    fuselage.add(noseCowl);

    // Forward stereo obstacle avoidance cameras (binocular eyes)
    [-0.05 * bodyScale, 0.05 * bodyScale].forEach((xOff) => {
      const eyeHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12),
        titaniumTrimMat
      );
      eyeHousing.rotation.x = Math.PI / 2;
      eyeHousing.position.set(xOff, bodyHeight * 0.14, bodyLength * 0.56);
      fuselage.add(eyeHousing);

      const eyeLens = new THREE.Mesh(new THREE.CircleGeometry(0.012, 12), lensMat);
      eyeLens.position.set(xOff, bodyHeight * 0.14, bodyLength * 0.572);
      fuselage.add(eyeLens);
    });

    // Top RTK GNSS Antenna module puck
    const rtkPuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055 * bodyScale, 0.058 * bodyScale, 0.07, 16),
      tacticalHullMat
    );
    rtkPuck.position.set(0, bodyHeight * 0.36 + 0.04, -bodyLength * 0.05);
    fuselage.add(rtkPuck);

    // Battery compartment & tail strobe
    const battery = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.78, bodyHeight * 0.48, bodyLength * 0.40),
      underHullMat
    );
    battery.position.set(0, bodyHeight * 0.12, -bodyLength * 0.46);
    fuselage.add(battery);

    const tailStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), ledWhite);
    tailStrobe.position.set(0, bodyHeight * 0.14, -bodyLength * 0.67);
    fuselage.add(tailStrobe);

    // Front multi-sensor gimbal camera pod
    const gimbal = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.08), tacticalHullMat);
    gimbal.position.set(0, -bodyHeight * 0.38 - 0.05, bodyLength * 0.36);
    fuselage.add(gimbal);

    const gimbalLens = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), lensMat);
    gimbalLens.position.set(0, -bodyHeight * 0.38 - 0.05, bodyLength * 0.36 + 0.042);
    fuselage.add(gimbalLens);

    this.group.add(fuselage);

    // ------------------------------------------------------
    // 3. STRUCTURAL ARMS, MOTORS & LANDING FEET
    // ------------------------------------------------------
    this.def.motors.forEach((motor, idx) => {
      const armGroup = new THREE.Group();

      const armVector = new THREE.Vector3(motor.position.x, 0, motor.position.z);
      const armLength = armVector.length();
      const angle = Math.atan2(motor.position.x, motor.position.z);

      armGroup.rotation.y = angle;

      // Carbon fiber arm tube
      const armTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.024, armLength, 8),
        carbonArmMat
      );
      armTube.rotation.x = Math.PI / 2;
      armTube.position.z = armLength / 2;
      armGroup.add(armTube);

      // Motor hub housing
      const motorHub = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.07), tacticalHullMat);
      motorHub.position.set(0, 0.01, armLength);
      armGroup.add(motorHub);

      // Brushless motor bell
      const motorBell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.062, 0.065, 0.045, 16),
        motorBellMat
      );
      motorBell.position.set(0, 0.05, armLength);
      armGroup.add(motorBell);

      const copperRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.066, 0.066, 0.014, 16),
        copperStatorMat
      );
      copperRing.position.set(0, 0.032, armLength);
      armGroup.add(copperRing);

      // Aviation Navigation LED
      const isRightSide = motor.position.x > 0;
      const navLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 8, 8),
        isRightSide ? ledGreen : ledRed
      );
      navLed.position.set(0, 0.02, armLength + 0.065);
      armGroup.add(navLed);

      // Motor-Integrated Landing Leg (extending downwards, Image 3 spec)
      const legHeight = 0.22;
      const landingLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.009, legHeight, 8),
        tacticalHullMat
      );
      landingLeg.position.set(0, -legHeight / 2 - 0.01, armLength);
      armGroup.add(landingLeg);

      const rubberFoot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.016, 0.02, 8),
        rubberPadMat
      );
      rubberFoot.position.set(0, -legHeight - 0.015, armLength);
      armGroup.add(rubberFoot);

      // ----------------------------------------------------
      // 4. PROPELLERS WITH SAFETY ORANGE TIPS
      // ----------------------------------------------------
      const propGroup = new THREE.Group();
      propGroup.position.set(0, 0.09, armLength);

      const spinnerNut = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.04, 12), titaniumTrimMat);
      spinnerNut.position.y = 0.02;
      propGroup.add(spinnerNut);

      const bladeRadius = 0.27;
      const orangeRatio = 0.25;

      [-1, 1].forEach((dir) => {
        const carbonLen = bladeRadius * (1 - orangeRatio);
        const bladeHalf = new THREE.Mesh(
          new THREE.BoxGeometry(carbonLen, 0.006, 0.034),
          bladeMat
        );
        bladeHalf.position.x = (dir * carbonLen) / 2;
        bladeHalf.rotation.x = dir * 0.12;
        propGroup.add(bladeHalf);

        const tipLen = bladeRadius * orangeRatio;
        const orangeTip = new THREE.Mesh(
          new THREE.BoxGeometry(tipLen, 0.007, 0.035),
          orangeTipMat
        );
        orangeTip.position.x = dir * (carbonLen + tipLen / 2);
        orangeTip.rotation.x = dir * 0.12;
        propGroup.add(orangeTip);
      });

      armGroup.add(propGroup);

      this.propellers.push({
        group: propGroup,
        direction: motor.direction,
      });

      this.armGroups.push(armGroup);
      this.armOriginalAngles.push(angle);
      this.propGroups.push(propGroup);

      this.group.add(armGroup);
    });

    // ----------------------------------------------------
    // 5. CRASH SMOKE & SPARK PARTICLE EMITTERS
    // ----------------------------------------------------
    this.buildCrashFX();

    // ----------------------------------------------------
    // 6. ENABLE REAL 3D SHADOW CASTING ON ALL DRONE MESHES
    // ----------------------------------------------------
    this.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
      }
    });

    // ----------------------------------------------------
    // 7. DEDICATED GROUND CONTACT SHADOW DECAL
    // Stays strictly on ground level (Y = 0.33m), NEVER in the sky!
    // ----------------------------------------------------
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(0,0,0,0.45)");
      grad.addColorStop(0.35, "rgba(0,0,0,0.20)");
      grad.addColorStop(0.7, "rgba(0,0,0,0.06)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    this.groundShadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.8),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    this.groundShadowMesh.rotation.x = -Math.PI / 2;
    this.groundShadowMesh.position.set(0, 0.445, 0); // Strictly locked to ground & helipad surface!
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

  /**
   * Sets the visual damage state (bent arms, shattered props, smoke/sparks)
   */
  public setDamaged(damaged: boolean) {
    this.isDamaged = damaged;

    if (damaged) {
      // Dislodge / bend motor arms at jarring impact angles
      if (this.armGroups[0]) {
        this.armGroups[0].rotation.z = -0.65;
        this.armGroups[0].rotation.x = 0.45;
      }
      if (this.armGroups[1]) {
        this.armGroups[1].rotation.z = 0.52;
        this.armGroups[1].rotation.x = -0.38;
      }
      // Shatter/hide damaged propellers
      if (this.propGroups[0]) {
        this.propGroups[0].visible = false;
      }
      if (this.propGroups[1]) {
        this.propGroups[1].scale.set(0.25, 0.25, 0.25);
      }
      if (this.smokeParticles) this.smokeParticles.visible = true;
      if (this.sparkParticles) this.sparkParticles.visible = true;
    } else {
      // Restore all motor arms to original factory angles
      this.armGroups.forEach((arm, i) => {
        arm.rotation.set(0, this.armOriginalAngles[i] || 0, 0);
      });
      // Restore all propellers
      this.propGroups.forEach((prop) => {
        prop.visible = true;
        prop.scale.set(1, 1, 1);
      });
      if (this.smokeParticles) this.smokeParticles.visible = false;
      if (this.sparkParticles) this.sparkParticles.visible = false;
    }
  }

  /**
   * Updates drone transforms and spinning propeller animations
   */
  public update(telemetry: TelemetryState, dt: number) {
    // Check damage / crash state transition
    const isCrashed = !!telemetry.isCrashed;
    if (isCrashed !== this.isDamaged) {
      this.setDamaged(isCrashed);
    }

    // Animate crash VFX (billowing smoke and flickering sparks)
    if (this.isDamaged) {
      if (this.smokePositions && this.smokeParticles) {
        for (let i = 0; i < this.smokePositions.length / 3; i++) {
          this.smokePositions[i * 3 + 1] += dt * 0.75;
          this.smokePositions[i * 3] += (Math.random() - 0.5) * dt * 0.15;
          this.smokePositions[i * 3 + 2] += (Math.random() - 0.5) * dt * 0.15;
          if (this.smokePositions[i * 3 + 1] > 1.6) {
            this.smokePositions[i * 3 + 1] = 0.05;
            this.smokePositions[i * 3] = (Math.random() - 0.5) * 0.2;
            this.smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
          }
        }
        this.smokeParticles.geometry.attributes.position.needsUpdate = true;
      }

      if (this.sparkPositions && this.sparkParticles) {
        for (let i = 0; i < this.sparkPositions.length / 3; i++) {
          this.sparkPositions[i * 3 + 1] += (Math.random() - 0.45) * dt * 1.8;
          this.sparkPositions[i * 3] += (Math.random() - 0.5) * dt * 1.4;
          this.sparkPositions[i * 3 + 2] += (Math.random() - 0.5) * dt * 1.4;
          if (this.sparkPositions[i * 3 + 1] > 0.7 || this.sparkPositions[i * 3 + 1] < 0) {
            this.sparkPositions[i * 3 + 1] = Math.random() * 0.2;
            this.sparkPositions[i * 3] = (Math.random() - 0.5) * 0.25;
            this.sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
          }
        }
        this.sparkParticles.geometry.attributes.position.needsUpdate = true;
      }
    }

    // 1. Synchronize drone position & 3D rotation
    this.group.position.set(telemetry.position.x, telemetry.position.y, telemetry.position.z);
    this.group.rotation.order = "YXZ";
    this.group.rotation.y = telemetry.rotation.yaw;
    this.group.rotation.x = telemetry.rotation.pitch;
    this.group.rotation.z = telemetry.rotation.roll;

    // 2. Spin Propellers based on real-time RPM
    const rpmFactor = (telemetry.rotorRpmPercent / 100) * 55;
    this.propellers.forEach((p) => {
      p.group.rotation.y += p.direction * rpmFactor * dt;
    });

    // 3. Update ground shadow:
    // Follows drone (X, Z), strictly anchored 5mm above the surface beneath the drone
    if (this.groundShadowMesh) {
      const surfaceY = Math.max(0.01, telemetry.position.y - telemetry.altitude - 0.245 + 0.005);
      this.groundShadowMesh.position.set(telemetry.position.x, surfaceY, telemetry.position.z);
      this.groundShadowMesh.rotation.z = -telemetry.rotation.yaw;

      // As drone climbs into the sky, shadow fades out and softens naturally
      const alt = Math.max(0, telemetry.altitude);
      const opacity = Math.max(0, 0.45 * Math.exp(-alt / 5.0));
      (this.groundShadowMesh.material as THREE.MeshBasicMaterial).opacity = opacity;

      // Soft ground shadow spreads slightly with altitude
      const scale = 1.0 + alt * 0.10;
      this.groundShadowMesh.scale.set(scale, scale, 1);

      // In the sky above 12m, ground shadow completely disappears
      this.groundShadowMesh.visible = opacity > 0.01;
    }
  }
}