// ==========================================================
// DRONE PILOT — MODULAR 3D DRONE (ENTERPRISE MATRICE SPEC)
// Hierarchical Component Architecture:
// Frame, Motors, Propellers (with Orange Tips), Battery,
// Flight Controller, RTK GNSS, Cameras, Landing Gear.
// ==========================================================

import * as THREE from "three";
import { DroneDefinition, TelemetryState } from "@/lib/simulation/types";
import { buildProfessionalUAV } from "../ui/aircraft-model-builder";

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
    const parts = buildProfessionalUAV(
      this.def.type as any,
      this.def.motors.map((m, i) => ({ index: i, position: m.position, direction: m.direction }))
    );

    this.group.add(parts.rootGroup);

    this.gimbalGroup = parts.gimbalGroup;
    this.gimbalRollArm = parts.gimbalGroup; // Fallback mapping
    this.cameraPod = parts.cameraPitchGroup;

    this.batteryLeds = parts.batteryLeds;
    this.tailStrobeMesh = parts.tailStrobe;

    const propBlurTex = this.createPropBlurTexture();

    parts.propellers.forEach((p, idx) => {
      // Add high RPM blur disc
      const bladeRadius = this.def.type === "quadcopter" ? 0.18 : this.def.type === "hexacopter" ? 0.25 : 0.32;
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
      p.bladeGroup.parent?.add(blurMesh);

      // Access the blade meshes to modify materials (they are children of bladeGroup)
      const bladeMaterial = new THREE.MeshStandardMaterial({
        color: 0x1d1f24,
        roughness: 0.30,
        metalness: 0.25,
        transparent: true,
        opacity: 1.0,
      });

      p.bladeGroup.children.forEach(c => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).material = bladeMaterial;
        }
      });

      this.propellers.push({
        bladeGroup: p.bladeGroup,
        blurMesh,
        blurMaterial: blurDiscMat,
        bladeMaterial,
        direction: p.direction,
        motorIndex: p.motorIndex,
      });
      
      // Push arm and prop group for animation
      this.armGroups.push(p.bladeGroup.parent?.parent as THREE.Group);
      this.propGroups.push(p.bladeGroup.parent as THREE.Group);
    });

    this.buildCrashFX();

    this.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh) !== this.groundShadowMesh) {
        child.castShadow = true;
      }
    });
    
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(0,0,0,0.55)");
      grad.addColorStop(0.35, "rgba(0,0,0,0.28)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    this.groundShadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 2.2),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    this.groundShadowMesh.rotation.x = -Math.PI / 2;
    this.groundShadowMesh.position.y = -0.12;
    this.group.add(this.groundShadowMesh);
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