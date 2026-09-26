// ==========================================================
// DRONE PILOT — CHASE CAMERA CONTROLLER
// Cinematic 3rd-Person Spring-Damped Follow Camera,
// FPV Gimbal Cockpit View, and Tactical Top-Down Mode.
// Scroll-to-Zoom supported.
// ==========================================================

import * as THREE from "three";
import { TelemetryState } from "@/lib/simulation/types";

export type CameraMode = "chase" | "fpv" | "topdown";

export class ChaseCameraController {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = "chase";

  // Zoom state (meters)
  private followDistance = 5.0;
  private readonly MIN_FOLLOW_DISTANCE = 2.0;
  private readonly MAX_FOLLOW_DISTANCE = 30.0;

  private currentPos = new THREE.Vector3(0, 3.2, 5.0);
  private currentLookAt = new THREE.Vector3(0, 0.865, 0);

  // Orbit drag offset
  public orbitYaw = 0;
  public orbitPitch = 0;
  public isOrbiting = false;

  constructor(fov = 55, aspect = 16 / 9) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.15, 6000);
    this.camera.position.set(0, 3.2, 5.0);
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

  /**
   * Adjust follow distance by delta (negative = zoom in, positive = zoom out)
   * Uses exponential feel: delta in normalized [-1, 1]
   */
  public adjustZoom(delta: number) {
    // delta > 0 = scroll down = zoom out; delta < 0 = scroll up = zoom in
    const factor = 1.0 + Math.sign(delta) * Math.min(0.15, Math.abs(delta) * 0.002);
    this.followDistance = Math.max(
      this.MIN_FOLLOW_DISTANCE,
      Math.min(this.MAX_FOLLOW_DISTANCE, this.followDistance * factor)
    );
  }

  public getFollowDistance(): number {
    return this.followDistance;
  }

  public setOrbitDelta(deltaX: number, deltaY: number) {
    this.orbitYaw -= deltaX * 0.007;
    // Allows steep overhead top-down (+1.25 rad) down to skyward view (-1.1 rad)
    this.orbitPitch = Math.max(-1.1, Math.min(1.25, this.orbitPitch + deltaY * 0.006));
    this.isOrbiting = true;
  }

  public stopOrbiting() {
    this.isOrbiting = false;
  }

  public resetOrbit() {
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.followDistance = 5.0;
    this.isOrbiting = false;
  }

  public update(telemetry: TelemetryState, dt: number) {
    const dronePos = new THREE.Vector3(telemetry.position.x, telemetry.position.y, telemetry.position.z);
    const droneYaw = telemetry.rotation.yaw + this.orbitYaw;

    // Gently align orbit yaw back with flight heading when traveling fast
    if (!this.isOrbiting && telemetry.groundSpeed > 15) {
      this.orbitYaw *= 0.985;
    }

    if (this.mode === "chase") {
      // Third-Person Spherical Orbit Follow Cam
      const effectivePitch = this.orbitPitch + 0.45;

      // Spherical coordinate offset
      const clampedPitch = Math.max(-0.6, Math.min(1.35, effectivePitch));
      const horizDist = this.followDistance * Math.cos(clampedPitch);
      const vertDist = this.followDistance * Math.sin(clampedPitch);

      const targetX = dronePos.x + Math.sin(droneYaw) * horizDist;
      const targetZ = dronePos.z + Math.cos(droneYaw) * horizDist;
      // Ensure camera stays safely above terrain (at least 1.0m)
      const targetY = Math.max(1.0, dronePos.y + vertDist + 0.8);

      const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
      const targetLookAt = dronePos.clone().add(new THREE.Vector3(0, 0.5, 0));

      // Smooth lerp
      const lerpSpeed = Math.min(1.0, dt * 10.0);
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
      const topDistance = Math.max(10, this.followDistance * 4);
      const targetPos = dronePos.clone().add(new THREE.Vector3(0, topDistance, 0.01));
      this.currentPos.lerp(targetPos, dt * 10.0);
      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(dronePos);
    }
  }
}