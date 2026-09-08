// ==========================================================
// DRONE PILOT — CHASE CAMERA CONTROLLER
// Cinematic 3rd-Person Spring-Damped Follow Camera,
// FPV Gimbal Cockpit View, and Tactical Top-Down Mode.
// ==========================================================

import * as THREE from "three";
import { TelemetryState } from "@/lib/simulation/types";

export type CameraMode = "chase" | "fpv" | "topdown";

export class ChaseCameraController {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = "chase";

  private currentPos = new THREE.Vector3(0, 3.0, 6.0);
  private currentLookAt = new THREE.Vector3(0, 0, 0);

  // Orbit drag offset
  private orbitYaw = 0;
  private orbitPitch = 0;
  private isOrbiting = false;

  constructor(fov = 55, aspect = 16 / 9) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 800);
    this.camera.position.set(0, 3.0, 6.0);
  }

  public setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public setMode(mode: CameraMode): CameraMode {
    this.mode = mode;
    return this.mode;
  }

  public cycleMode(): CameraMode {
    if (this.mode === "chase") this.mode = "fpv";
    else if (this.mode === "fpv") this.mode = "topdown";
    else this.mode = "chase";
    return this.mode;
  }

  public setOrbitDelta(deltaX: number, deltaY: number) {
    this.orbitYaw -= deltaX * 0.006;
    this.orbitPitch = Math.max(-0.4, Math.min(0.6, this.orbitPitch + deltaY * 0.004));
    this.isOrbiting = true;
  }

  public resetOrbit() {
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.isOrbiting = false;
  }

  public update(telemetry: TelemetryState, dt: number) {
    const dronePos = new THREE.Vector3(telemetry.position.x, telemetry.position.y, telemetry.position.z);
    const droneYaw = telemetry.rotation.yaw + this.orbitYaw;

    // Decay orbit offset back to neutral when not dragging
    if (!this.isOrbiting) {
      this.orbitYaw *= 0.95;
      this.orbitPitch *= 0.95;
    }

    if (this.mode === "chase") {
      // Third-Person Chase Cam
      const followDistance = 4.2;
      const followHeight = 1.6 + this.orbitPitch * 2.0;

      // Position behind drone according to drone yaw
      const targetX = dronePos.x + Math.sin(droneYaw) * followDistance;
      const targetZ = dronePos.z + Math.cos(droneYaw) * followDistance;
      const targetY = Math.max(0.6, dronePos.y + followHeight);

      const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
      const targetLookAt = dronePos.clone().add(new THREE.Vector3(0, 0.15, 0));

      // Smooth exponential lerp
      const lerpSpeed = Math.min(1.0, dt * 8.0);
      this.currentPos.lerp(targetPos, lerpSpeed);
      this.currentLookAt.lerp(targetLookAt, lerpSpeed);

      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(this.currentLookAt);

    } else if (this.mode === "fpv") {
      // Nose Cockpit FPV Gimbal View
      const forwardX = -Math.sin(telemetry.rotation.yaw);
      const forwardZ = -Math.cos(telemetry.rotation.yaw);

      const eyePos = dronePos.clone().add(new THREE.Vector3(forwardX * 0.28, -0.04, forwardZ * 0.28));
      const lookPos = eyePos.clone().add(new THREE.Vector3(forwardX * 20.0, -0.5, forwardZ * 20.0));

      this.camera.position.copy(eyePos);
      this.camera.lookAt(lookPos);

    } else if (this.mode === "topdown") {
      // Tactical Top-Down Orthographic feel
      const targetPos = dronePos.clone().add(new THREE.Vector3(0, 26.0, 0.01));
      this.currentPos.lerp(targetPos, dt * 10.0);
      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(dronePos);
    }
  }
}