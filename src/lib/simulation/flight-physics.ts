// ==========================================================
// DRONE PILOT — FLIGHT PHYSICS ENGINE (MASTER SIMULATION PHASE)
// Deterministic 6-DoF Multirotor Aerodynamic & Dynamic Solver
// Integrates Motor Mixing, LiPo Battery Sag, Environmental
// Wind Forces, Payload Mass, and Ground/Obstacle Collision.
// ==========================================================

import {
  DroneDefinition,
  FlightInput,
  TelemetryState,
  FlightMode,
  EnvironmentState,
  CrashState,
  PhysicsDebugTelemetry,
} from "./types";
import { MotorMixer } from "./motor-mixer";
import { BatteryModel } from "./battery-model";
import { EnvironmentModel } from "./environment-model";

export class FlightPhysicsEngine {
  private def: DroneDefinition;
  private battery: BatteryModel;
  public environment: EnvironmentModel;

  // Rigid Body State
  public posX = 0;
  public posY = 1.445; // resting on top of raised helipad platform
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

  // Accelerations for debug telemetry
  public accelX = 0;
  public accelY = 0;
  public accelZ = 0;

  // Aerodynamic Forces for debug
  public windForceX = 0;
  public windForceY = 0;
  public windForceZ = 0;
  public dragForceX = 0;
  public dragForceY = 0;
  public dragForceZ = 0;
  public totalThrust = 0;

  // System State
  public isArmed = false;
  public flightTime = 0.0;
  public isHoverMode = true;
  public groundLevel = 1.445;
  public isAutoLanding = false;
  public payloadMass = 0.0; // kg

  // Motor outputs [0.0 - 1.0]
  public motorOutputs: number[] = [0, 0, 0, 0];
  public rotorRpm = 0;
  public elevationQueryFn?: (x: number, z: number) => number;

  // Crash State
  public crashState: CrashState | null = null;

  // Breadcrumbs path history
  private breadcrumbs: Array<{ x: number; z: number }> = [{ x: 0, z: 0 }];
  private lastBreadcrumbTime = 0;

  constructor(definition: DroneDefinition) {
    this.def = definition;
    this.battery = new BatteryModel(definition.batteryCapacity, definition.batteryCells || 4);
    this.environment = new EnvironmentModel();
    this.reset();
  }

  public setDefinition(def: DroneDefinition) {
    this.def = def;
    this.battery = new BatteryModel(def.batteryCapacity, def.batteryCells || 4);
  }

  public setPayloadMass(kg: number) {
    this.payloadMass = Math.max(0, Math.min(this.def.payloadCapacity * 1.5, kg));
  }

  public setEnvironment(env: EnvironmentState) {
    this.environment.setState(env);
    this.battery.setTemperature(env.temperature);
  }

  public resetCrash() {
    this.crashState = null;
  }

  public reset(spawnX = 0, spawnY?: number, spawnZ = 0, spawnYaw = 0) {
    if (spawnY !== undefined) {
      this.groundLevel = spawnY;
    } else if (this.elevationQueryFn) {
      this.groundLevel = this.elevationQueryFn(spawnX, spawnZ) + 0.245;
    } else {
      this.groundLevel = 1.445;
    }

    this.posX = spawnX;
    this.posY = this.groundLevel;
    this.posZ = spawnZ;
    this.yaw = spawnYaw;

    this.velX = 0;
    this.velY = 0;
    this.velZ = 0;

    this.pitch = 0;
    this.roll = 0;

    this.pitchRate = 0;
    this.rollRate = 0;
    this.yawRate = 0;

    this.accelX = 0;
    this.accelY = 0;
    this.accelZ = 0;

    this.isArmed = false;
    this.flightTime = 0.0;
    this.isHoverMode = true;
    this.isAutoLanding = false;
    this.rotorRpm = 0;
    this.motorOutputs = new Array(this.def.motorCount).fill(0);
    this.crashState = null;
    this.battery.reset(100.0);

    this.breadcrumbs = [{ x: Math.round(spawnX), z: Math.round(spawnZ) }];
    this.lastBreadcrumbTime = 0;
  }

  public triggerAutoLand() {
    if (this.posY > this.groundLevel + 0.05 && !this.crashState) {
      this.isAutoLanding = !this.isAutoLanding;
    }
  }

  public getMotorOutputs(): number[] {
    return [...this.motorOutputs];
  }

  /**
   * Main 6-DoF Physics Step
   */
  public update(input: FlightInput, dt: number): TelemetryState {
    const clampedDt = Math.min(dt, 0.05);

    if (input.reset) {
      this.reset();
    }

    // Freeze motion if in crashed state
    if (this.crashState?.isCrashed) {
      return this.generateTelemetry();
    }

    // Dynamic ground elevation query
    if (this.elevationQueryFn) {
      this.groundLevel = this.elevationQueryFn(this.posX, this.posZ) + 0.245;
    }

    const onGround = this.posY <= this.groundLevel + 0.02;

    // Auto-arm on throttle or stick input
    if (!this.isArmed) {
      if (input.throttle > 0.1 || Math.abs(input.pitch) > 0.1 || Math.abs(input.roll) > 0.1 || Math.abs(input.yaw) > 0.1) {
        this.isArmed = true;
      }
    }

    if (this.isAutoLanding) {
      if (Math.abs(input.throttle) > 0.2 || Math.abs(input.pitch) > 0.2 || Math.abs(input.roll) > 0.2) {
        this.isAutoLanding = false;
      }
    }

    // ----------------------------------------------------
    // 1. MASS, WEIGHT & HOVER EQUILIBRIUM
    // ----------------------------------------------------
    const g = 9.81; // m/s^2
    const totalMass = this.def.mass + this.payloadMass;
    const hoverWeight = totalMass * g; // Newtons

    // ----------------------------------------------------
    // 2. MOTOR MIXING & COMMAND DISPATCH
    // ----------------------------------------------------
    let commandedThrottle = 0;

    if (this.isArmed) {
      this.flightTime += clampedDt;

      if (this.isAutoLanding) {
        const currentAlt = Math.max(0, this.posY - this.groundLevel);
        const targetDescentSpeed = currentAlt > 3.0 ? -1.4 : -0.65;
        this.velY += (targetDescentSpeed - this.velY) * (clampedDt * 5.0);
        this.velX *= 0.88;
        this.velZ *= 0.88;
        commandedThrottle = (hoverWeight / this.def.maximumThrust) * 0.92;
      } else if (this.isHoverMode) {
        // Base throttle balances gravity perfectly:
        const baseHoverThrottle = hoverWeight / this.def.maximumThrust;
        const verticalDelta = input.throttle * (1.0 - baseHoverThrottle) * 0.85;
        commandedThrottle = baseHoverThrottle + verticalDelta;

        // Active vertical hover damping
        if (Math.abs(input.throttle) < 0.05 && !onGround) {
          commandedThrottle -= (this.velY * (totalMass * 3.5)) / this.def.maximumThrust;
        }
      } else {
        commandedThrottle = Math.max(0, (input.throttle + 1) / 2);
      }
    }

    // Apply battery authority (voltage sag throttles max output)
    const thrustAuth = this.battery.getThrustAuthority();
    commandedThrottle *= thrustAuth;

    // Mix commands into individual motors
    this.motorOutputs = MotorMixer.mix(
      {
        throttle: commandedThrottle,
        pitch: this.isAutoLanding ? 0 : input.pitch,
        roll: this.isAutoLanding ? 0 : input.roll,
        yaw: input.yaw,
      },
      this.def.type,
      this.def.motors
    );

    // Sum collective thrust
    let sumThrustFactor = 0;
    for (let i = 0; i < this.motorOutputs.length; i++) {
      sumThrustFactor += this.motorOutputs[i];
    }
    const avgThrottle = this.motorOutputs.length > 0 ? sumThrustFactor / this.motorOutputs.length : 0;
    this.totalThrust = avgThrottle * this.def.maximumThrust;

    // ----------------------------------------------------
    // 3. ELECTRICAL BATTERY DRAIN (OHM'S LAW + MOTOR CURRENT)
    // ----------------------------------------------------
    const motorCount = this.def.motorCount;
    const maxAmpsPerMotor = 12.0; // typical 4S brushless motor draw
    let totalCurrentAmps = 0.8; // avionics baseline

    if (this.isArmed) {
      for (let i = 0; i < motorCount; i++) {
        totalCurrentAmps += 0.4 + Math.pow(this.motorOutputs[i], 1.8) * maxAmpsPerMotor;
      }
    }
    this.battery.update(totalCurrentAmps, clampedDt);

    // Update rotor RPM telemetry
    const targetRpm = onGround && input.throttle <= 0 ? 20 : avgThrottle * 100;
    this.rotorRpm += (targetRpm - this.rotorRpm) * (clampedDt * 8.0);

    // ----------------------------------------------------
    // 4. ATTITUDE (PITCH, ROLL, YAW)
    // ----------------------------------------------------
    const targetYawRate = -input.yaw * 2.2;
    this.yawRate += (targetYawRate - this.yawRate) * (clampedDt * 10.0);
    this.yaw += this.yawRate * clampedDt;

    if (this.yaw > Math.PI * 2) this.yaw -= Math.PI * 2;
    if (this.yaw < 0) this.yaw += Math.PI * 2;

    const effPitch = this.isAutoLanding ? 0 : input.pitch;
    const effRoll = this.isAutoLanding ? 0 : input.roll;
    const targetPitch = effPitch * this.def.maxTiltAngle;
    const targetRoll = effRoll * this.def.maxTiltAngle;

    const tiltSpeed = 12.0;
    this.pitch += (targetPitch - this.pitch) * (clampedDt * tiltSpeed);
    this.roll += (targetRoll - this.roll) * (clampedDt * tiltSpeed);

    // ----------------------------------------------------
    // 5. ENVIRONMENTAL AERODYNAMIC FORCES (WIND & DRAG)
    // ----------------------------------------------------
    const windVec = this.environment.getInstantaneousWind(clampedDt);
    const airDensity = this.environment.getAirDensity();

    // Relative airspeed: V_rel = V_drone - V_wind
    const relVx = this.velX - windVec.x;
    const relVy = this.velY - windVec.y;
    const relVz = this.velZ - windVec.z;

    const aeroFactor = 0.5 * airDensity * this.def.drag.linear;
    this.dragForceX = -relVx * Math.abs(relVx) * aeroFactor;
    this.dragForceY = -relVy * Math.abs(relVy) * aeroFactor * 0.5;
    this.dragForceZ = -relVz * Math.abs(relVz) * aeroFactor;

    this.windForceX = windVec.x * Math.abs(windVec.x) * aeroFactor;
    this.windForceY = windVec.y * Math.abs(windVec.y) * aeroFactor;
    this.windForceZ = windVec.z * Math.abs(windVec.z) * aeroFactor;

    // ----------------------------------------------------
    // 6. THRUST FORCES IN WORLD FRAME
    // ----------------------------------------------------
    const forwardX = -Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    const thrustWorldX = (forwardX * this.pitch + rightX * this.roll) * this.totalThrust;
    const thrustWorldZ = (forwardZ * this.pitch + rightZ * this.roll) * this.totalThrust;
    const thrustWorldY = this.totalThrust * Math.cos(this.pitch) * Math.cos(this.roll);

    // Total Accelerations: a = F_net / m
    this.accelX = (thrustWorldX + this.dragForceX) / totalMass;
    this.accelY = (thrustWorldY - hoverWeight + this.dragForceY) / totalMass;
    this.accelZ = (thrustWorldZ + this.dragForceZ) / totalMass;

    // Integrate Velocities
    this.velX += this.accelX * clampedDt;
    this.velY += this.accelY * clampedDt;
    this.velZ += this.accelZ * clampedDt;

    // Integrate Positions
    this.posX += this.velX * clampedDt;
    this.posY += this.velY * clampedDt;
    this.posZ += this.velZ * clampedDt;

    // ----------------------------------------------------
    // 7. GROUND & OBSTACLE COLLISION DETECTION
    // ----------------------------------------------------
    if (this.posY <= this.groundLevel) {
      const impactSpeed = Math.sqrt(this.velX * this.velX + this.velY * this.velY + this.velZ * this.velZ);
      const tiltAngleDeg = Math.max(Math.abs(this.pitch), Math.abs(this.roll)) * (180 / Math.PI);

      // Crash Criteria: Hard impact (> 6.2 m/s) or extreme tilt (> 42°)
      if (impactSpeed > 6.2 || (impactSpeed > 3.0 && tiltAngleDeg > 42)) {
        const kineticEnergy = 0.5 * totalMass * impactSpeed * impactSpeed;
        let cause = "Excessive vertical descent velocity exceeding airframe tolerance.";
        if (tiltAngleDeg > 42) cause = "Attitude instability: aircraft struck ground in banked attitude (" + tiltAngleDeg.toFixed(0) + "°).";
        else if (Math.abs(this.velX) + Math.abs(this.velZ) > 5.0) cause = "High-speed horizontal impact with terrain.";

        this.crashState = {
          isCrashed: true,
          impactSpeedKmh: Math.round(impactSpeed * 3.6 * 10) / 10,
          impactSpeedMs: Math.round(impactSpeed * 10) / 10,
          impactLocation: { x: this.posX, y: this.posY, z: this.posZ },
          kineticEnergyJoules: Math.round(kineticEnergy),
          primaryCause: cause,
          impactNormal: { x: 0, y: 1, z: 0 },
          timestamp: Date.now(),
        };

        this.velX = 0;
        this.velY = 0;
        this.velZ = 0;
        this.isArmed = false;
        return this.generateTelemetry();
      }

      // Normal Touchdown
      this.posY = this.groundLevel;
      if (this.velY < 0) this.velY = 0;
      this.velX *= 0.88;
      this.velZ *= 0.88;
      this.pitch *= 0.85;
      this.roll *= 0.85;

      if (this.isAutoLanding) {
        this.isAutoLanding = false;
        this.isArmed = false;
      }
      if (input.throttle < -0.6) {
        this.isArmed = false;
      }
    }

    // Island Airspace Boundary Constraints (2000m x 1800m island)
    const maxBound = 1180.0;
    if (Math.abs(this.posX) > maxBound) {
      this.posX = Math.sign(this.posX) * maxBound;
      this.velX *= -0.3;
    }
    if (Math.abs(this.posZ) > maxBound) {
      this.posZ = Math.sign(this.posZ) * maxBound;
      this.velZ *= -0.3;
    }
    if (this.posY > 250.0) {
      this.posY = 250.0;
      if (this.velY > 0) this.velY = 0;
    }

    // Breadcrumbs tracking
    if (this.flightTime - this.lastBreadcrumbTime > 0.5) {
      const last = this.breadcrumbs[this.breadcrumbs.length - 1];
      const dist = last ? Math.hypot(this.posX - last.x, this.posZ - last.z) : 999;
      if (dist > 2.5) {
        this.breadcrumbs.push({ x: Math.round(this.posX * 10) / 10, z: Math.round(this.posZ * 10) / 10 });
        if (this.breadcrumbs.length > 250) {
          this.breadcrumbs.shift();
        }
        this.lastBreadcrumbTime = this.flightTime;
      }
    }

    return this.generateTelemetry();
  }

  private generateTelemetry(): TelemetryState {
    const horizontalSpeedMs = Math.hypot(this.velX, this.velZ);
    const groundSpeedKmh = Math.round(horizontalSpeedMs * 3.6 * 10) / 10;
    const altitudeMeters = Math.max(0, Math.round((this.posY - this.groundLevel) * 10) / 10);
    const altitudeMsl = Math.round(this.posY * 10) / 10;
    const verticalSpeedMs = Math.round(this.velY * 10) / 10;
    const headingDeg = Math.round((((this.yaw * 180) / Math.PI) % 360 + 360) % 360);
    const distFromHome = Math.round(Math.hypot(this.posX, this.posZ) * 10) / 10;

    let flightMode: FlightMode = "HOVER";
    if (this.crashState?.isCrashed) {
      flightMode = "LANDED";
    } else if (this.posY <= this.groundLevel + 0.05 && Math.abs(horizontalSpeedMs) < 0.2) {
      flightMode = "LANDED";
    } else if (this.isAutoLanding) {
      flightMode = "AUTO LAND";
    } else if (!this.isHoverMode) {
      flightMode = "MANUAL";
    }

    const battState = this.battery.update(0, 0);

    return {
      position: { x: this.posX, y: this.posY, z: this.posZ },
      velocity: { x: this.velX, y: this.velY, z: this.velZ },
      rotation: { pitch: this.pitch, roll: this.roll, yaw: this.yaw },
      altitude: altitudeMeters,
      altitudeMsl,
      groundSpeed: groundSpeedKmh,
      verticalSpeed: verticalSpeedMs,
      heading: headingDeg,
      batteryLevel: Math.round(battState.percentage),
      batteryVoltage: battState.terminalVoltage,
      batteryCurrentAmps: battState.currentAmps,
      flightTimeSeconds: Math.floor(this.flightTime),
      flightMode,
      isArmed: this.isArmed && !this.crashState?.isCrashed,
      rotorRpmPercent: Math.round(this.rotorRpm),
      motorOutputs: [...this.motorOutputs],
      distanceFromHome: distFromHome,
      flightPath: this.breadcrumbs,
      payloadMassKg: this.payloadMass,
      isCrashed: !!this.crashState?.isCrashed,
    };
  }

  public getDebugTelemetry(): PhysicsDebugTelemetry {
    const totalMass = this.def.mass + this.payloadMass;
    const weightNewtons = totalMass * 9.81;
    const battState = this.battery.update(0, 0);

    return {
      dryMass: this.def.mass,
      payloadMass: this.payloadMass,
      totalMass: Math.round(totalMass * 100) / 100,
      weightNewtons: Math.round(weightNewtons * 10) / 10,
      totalThrustNewtons: Math.round(this.totalThrust * 10) / 10,
      thrustToWeightRatio: weightNewtons > 0 ? Math.round((this.totalThrust / weightNewtons) * 100) / 100 : 0,
      motorOutputs: this.motorOutputs.map((o) => Math.round(o * 100) / 100),
      accel: {
        x: Math.round(this.accelX * 100) / 100,
        y: Math.round(this.accelY * 100) / 100,
        z: Math.round(this.accelZ * 100) / 100,
      },
      vel: {
        x: Math.round(this.velX * 100) / 100,
        y: Math.round(this.velY * 100) / 100,
        z: Math.round(this.velZ * 100) / 100,
      },
      windForce: {
        x: Math.round(this.windForceX * 10) / 10,
        y: Math.round(this.windForceY * 10) / 10,
        z: Math.round(this.windForceZ * 10) / 10,
      },
      dragForce: {
        x: Math.round(this.dragForceX * 10) / 10,
        y: Math.round(this.dragForceY * 10) / 10,
        z: Math.round(this.dragForceZ * 10) / 10,
      },
      batteryPowerWatts: Math.round(battState.powerWatts),
      groundElevationMsl: Math.round(this.groundLevel * 10) / 10,
      radarAgl: Math.max(0, Math.round((this.posY - this.groundLevel) * 10) / 10),
    };
  }
}