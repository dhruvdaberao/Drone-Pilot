// ==========================================================
// DRONE PILOT — FLIGHT PHYSICS ENGINE
// Deterministic 6-DoF Multirotor Aerodynamic & Dynamic Solver
// Handles collective thrust, gravity, attitude stabilization,
// aerodynamic drag, ground reaction, and real-time telemetry.
// ==========================================================

import { DroneDefinition, FlightInput, TelemetryState } from "./types";

export class FlightPhysicsEngine {
  private def: DroneDefinition;

  // Rigid Body State
  public posX = 0;
  public posY = 0.32; // resting on helipad
  public posZ = 0;

  public velX = 0;
  public velY = 0;
  public velZ = 0;

  public pitch = 0; // tilt along lateral axis (radians)
  public roll = 0;  // tilt along longitudinal axis (radians)
  public yaw = 0;   // compass heading (radians)

  public pitchRate = 0;
  public rollRate = 0;
  public yawRate = 0;

  // System State
  public isArmed = false;
  public batteryPercent = 100.0;
  public flightTime = 0.0;
  public isHoverMode = true;
  public groundLevel = 0.32;

  // Rotor RPM telemetry
  public rotorRpm = 0;

  constructor(definition: DroneDefinition) {
    this.def = definition;
    this.reset();
  }

  public setDefinition(def: DroneDefinition) {
    this.def = def;
  }

  public reset(spawnX = 0, spawnZ = 0) {
    this.posX = spawnX;
    this.posY = this.groundLevel;
    this.posZ = spawnZ;

    this.velX = 0;
    this.velY = 0;
    this.velZ = 0;

    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;

    this.pitchRate = 0;
    this.rollRate = 0;
    this.yawRate = 0;

    this.isArmed = false;
    this.batteryPercent = 100.0;
    this.flightTime = 0.0;
    this.isHoverMode = true;
    this.rotorRpm = 0;
  }

  /**
   * Main Physics Step (called each animation frame with delta in seconds)
   */
  public update(input: FlightInput, dt: number): TelemetryState {
    // Clamp delta time to avoid physics tunneling on tab switch
    const clampedDt = Math.min(dt, 0.05);

    if (input.reset) {
      this.reset();
    }

    // Auto-arm if throttle or movement requested
    if (!this.isArmed) {
      if (input.throttle > 0.1 || Math.abs(input.pitch) > 0.1 || Math.abs(input.roll) > 0.1) {
        this.isArmed = true;
      }
    }

    const onGround = this.posY <= this.groundLevel + 0.02;

    // Toggle hover assist mode
    if (input.hoverHold) {
      // Toggle handled by caller or state
    }

    // ----------------------------------------------------
    // 1. ROTOR SPOOL-UP & BATTERY SIMULATION
    // ----------------------------------------------------
    if (this.isArmed) {
      this.flightTime += clampedDt;
      const targetRpm = onGround && input.throttle <= 0 ? 25 : 60 + Math.abs(input.throttle) * 35;
      this.rotorRpm += (targetRpm - this.rotorRpm) * (clampedDt * 8.0);

      // Drain battery
      const dischargePerSec = (this.def.batteryDischargeRate / 60) * (0.6 + (this.rotorRpm / 100) * 0.8);
      this.batteryPercent = Math.max(0, this.batteryPercent - dischargePerSec * clampedDt);
    } else {
      this.rotorRpm += (0 - this.rotorRpm) * (clampedDt * 6.0);
    }

    // ----------------------------------------------------
    // 2. FLIGHT CONTROLLER ATTITUDE LOGIC (PITCH, ROLL, YAW)
    // ----------------------------------------------------
    const targetYawRate = -input.yaw * 2.2; // rad/s
    this.yawRate += (targetYawRate - this.yawRate) * (clampedDt * 10.0);
    this.yaw += this.yawRate * clampedDt;

    // Normalizing yaw between 0 and 2*PI
    if (this.yaw > Math.PI * 2) this.yaw -= Math.PI * 2;
    if (this.yaw < 0) this.yaw += Math.PI * 2;

    // Assisted Leveling / Cyclic Tilt:
    // Pitch forward when W is pressed (+pitch input), roll right when D is pressed
    const targetPitch = input.pitch * this.def.maxTiltAngle;
    const targetRoll = input.roll * this.def.maxTiltAngle;

    const tiltSpeed = 12.0;
    this.pitch += (targetPitch - this.pitch) * (clampedDt * tiltSpeed);
    this.roll += (targetRoll - this.roll) * (clampedDt * tiltSpeed);

    // ----------------------------------------------------
    // 3. THRUST & AERODYNAMICS (FORCES -> ACCELERATION)
    // ----------------------------------------------------
    const g = 9.81; // m/s^2
    const hoverThrust = this.def.mass * g; // Newtons needed to balance gravity

    let collectiveThrust = 0;

    if (this.isArmed && this.batteryPercent > 0) {
      if (this.isHoverMode) {
        // Altitude-hold assist:
        // Input throttle > 0 climbs, < 0 descends, = 0 maintains vertical equilibrium
        const verticalCommand = input.throttle;
        const thrustDelta = verticalCommand * (this.def.maximumThrust - hoverThrust) * 0.85;
        collectiveThrust = hoverThrust + thrustDelta;

        // Counteract existing vertical velocity when stick is neutral (active hover damping)
        if (Math.abs(verticalCommand) < 0.05 && !onGround) {
          collectiveThrust -= this.velY * (this.def.mass * 4.5);
        }
      } else {
        // Manual throttle mode
        const normalizedThrottle = Math.max(0, (input.throttle + 1) / 2);
        collectiveThrust = normalizedThrottle * this.def.maximumThrust;
      }
    }

    // Thrust vector in world coordinates based on body yaw and tilt
    // Forward vector in world coordinates:
    const forwardX = -Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);

    // Right vector in world coordinates:
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    // Lateral and longitudinal thrust components produced by aircraft banking
    const thrustWorldX = (forwardX * this.pitch + rightX * this.roll) * collectiveThrust;
    const thrustWorldZ = (forwardZ * this.pitch + rightZ * this.roll) * collectiveThrust;
    const thrustWorldY = collectiveThrust * Math.cos(this.pitch) * Math.cos(this.roll);

    // Aerodynamic Drag: F_drag = -0.5 * drag_coeff * v
    const dragX = -this.velX * this.def.drag.linear;
    const dragY = -this.velY * (this.def.drag.linear * 0.6);
    const dragZ = -this.velZ * this.def.drag.linear;

    // Total Accelerations: F / m
    const accelX = (thrustWorldX + dragX) / this.def.mass;
    const accelY = (thrustWorldY - this.def.mass * g + dragY) / this.def.mass;
    const accelZ = (thrustWorldZ + dragZ) / this.def.mass;

    // Integrate Velocities
    this.velX += accelX * clampedDt;
    this.velY += accelY * clampedDt;
    this.velZ += accelZ * clampedDt;

    // Integrate Positions
    this.posX += this.velX * clampedDt;
    this.posY += this.velY * clampedDt;
    this.posZ += this.velZ * clampedDt;

    // ----------------------------------------------------
    // 4. GROUND COLLISION & REACTION
    // ----------------------------------------------------
    if (this.posY <= this.groundLevel) {
      this.posY = this.groundLevel;
      if (this.velY < 0) this.velY = 0;

      // Ground friction damping
      this.velX *= 0.88;
      this.velZ *= 0.88;

      // Auto-level on ground
      this.pitch *= 0.85;
      this.roll *= 0.85;

      // If user pulls back throttle completely on ground, auto-disarm/idle
      if (input.throttle < -0.6) {
        this.isArmed = false;
      }
    }

    // Soft Boundary Damping (keep drone inside training airspace: 380m diameter)
    const maxBound = 190.0;
    if (Math.abs(this.posX) > maxBound) {
      this.posX = Math.sign(this.posX) * maxBound;
      this.velX *= -0.4;
    }
    if (Math.abs(this.posZ) > maxBound) {
      this.posZ = Math.sign(this.posZ) * maxBound;
      this.velZ *= -0.4;
    }
    // Altitude Ceiling: 120m (FAA regulation recreational maximum)
    if (this.posY > 120.0) {
      this.posY = 120.0;
      if (this.velY > 0) this.velY = 0;
    }

    // ----------------------------------------------------
    // 5. CALCULATE AVIONICS TELEMETRY
    // ----------------------------------------------------
    const horizontalSpeedMs = Math.sqrt(this.velX * this.velX + this.velZ * this.velZ);
    const groundSpeedKmh = Math.round(horizontalSpeedMs * 3.6 * 10) / 10;
    const altitudeMeters = Math.max(0, Math.round((this.posY - this.groundLevel) * 10) / 10);
    const verticalSpeedMs = Math.round(this.velY * 10) / 10;

    // Heading in degrees (0° = North, 90° = East, etc.)
    const headingDeg = Math.round((((this.yaw * 180) / Math.PI) % 360 + 360) % 360);

    const distFromHome = Math.round(Math.sqrt(this.posX * this.posX + this.posZ * this.posZ) * 10) / 10;

    let flightMode: "LANDED" | "HOVER" | "MANUAL" = "HOVER";
    if (this.posY <= this.groundLevel + 0.05 && Math.abs(horizontalSpeedMs) < 0.2) {
      flightMode = "LANDED";
    } else if (!this.isHoverMode) {
      flightMode = "MANUAL";
    }

    return {
      position: { x: this.posX, y: this.posY, z: this.posZ },
      velocity: { x: this.velX, y: this.velY, z: this.velZ },
      rotation: { pitch: this.pitch, roll: this.roll, yaw: this.yaw },
      altitude: altitudeMeters,
      groundSpeed: groundSpeedKmh,
      verticalSpeed: verticalSpeedMs,
      heading: headingDeg,
      batteryLevel: Math.round(this.batteryPercent),
      flightTimeSeconds: Math.floor(this.flightTime),
      flightMode,
      isArmed: this.isArmed,
      rotorRpmPercent: Math.round(this.rotorRpm),
      distanceFromHome: distFromHome,
    };
  }
}