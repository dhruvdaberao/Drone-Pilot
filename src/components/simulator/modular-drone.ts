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
  private def: DroneDefinition;
  private propellers: PropellerAssembly[] = [];

  constructor(definition: DroneDefinition) {
    this.def = definition;
    this.buildDrone();
  }

  public setDefinition(definition: DroneDefinition) {
    this.def = definition;
    // Clear and rebuild
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.propellers = [];
    this.buildDrone();
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

      this.group.add(armGroup);
    });

    // ----------------------------------------------------
    // 5. ENABLE REAL 3D SHADOW CASTING ON ALL DRONE MESHES
    // ----------------------------------------------------
    this.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
      }
    });

    // ----------------------------------------------------
    // 6. DEDICATED GROUND CONTACT SHADOW DECAL
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
    this.groundShadowMesh.position.set(0, 0.33, 0); // Strictly locked to ground!
    // NOTE: NOT added to this.group! Added directly to the scene.
  }

  /**
   * Updates drone transforms and spinning propeller animations
   */
  public update(telemetry: TelemetryState, dt: number) {
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
    // Follows drone (X, Z), but Y IS STRICTLY ON THE GROUND (0.33m), NEVER IN SKY!
    if (this.groundShadowMesh) {
      this.groundShadowMesh.position.set(telemetry.position.x, 0.33, telemetry.position.z);
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