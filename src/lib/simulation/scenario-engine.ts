// ==========================================================
// DRONE PILOT — PHASE 5: EDUCATIONAL FLIGHT SESSION ENGINE
// Evaluates real-time telemetry against educational objectives
// ==========================================================

import { TelemetryState, EnvironmentState, CrashState } from "./types";
import { TrainingScenario } from "./scenario-presets";

export type ObjectiveType = "ALTITUDE_HOLD" | "POSITION_HOLD" | "MOTOR_RESPONSE" | "PAYLOAD_TEST" | "BATTERY_TEST" | "ENVIRONMENT_RESPONSE";

export interface ScenarioObjective {
  id: string;
  type: ObjectiveType;
  description: string;
  targetValue?: number;
  tolerance?: number;
  requiredDurationSeconds: number;
}

export type ScenarioStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface SessionState {
  sessionId: string;
  scenarioId: string;
  status: ScenarioStatus;
  startTime: number;
  elapsedTime: number;
  objectiveProgress: Record<string, {
    status: ScenarioStatus;
    timeInTolerance: number;
    lastValue: number;
  }>;
  resultData?: {
    maxAltitude: number;
    minAltitude: number;
    maxDrift: number;
    maxTilt: number;
    motorImbalance: number;
    batteryConsumed: number;
    windSpeed: number;
  };
  failureReason?: string;
}

export class ScenarioEngine {
  private activeScenario: TrainingScenario | null = null;
  private session: SessionState | null = null;
  private onStateChange?: (state: SessionState) => void;

  private startPos = { x: 0, y: 0, z: 0 };
  private startBattery = 100;
  
  constructor(listener?: (state: SessionState) => void) {
    this.onStateChange = listener;
  }

  public setListener(listener: (state: SessionState) => void) {
    this.onStateChange = listener;
  }

  public startScenario(scenario: TrainingScenario, initialTelemetry: TelemetryState) {
    this.activeScenario = scenario;
    this.startPos = { ...initialTelemetry.position };
    this.startBattery = initialTelemetry.batteryLevel;

    const objectiveProgress: Record<string, any> = {};
    if (scenario.objectives) {
      for (const obj of scenario.objectives) {
        objectiveProgress[obj.id] = { status: "IN_PROGRESS", timeInTolerance: 0, lastValue: 0 };
      }
    }

    this.session = {
      sessionId: "sess_" + Date.now(),
      scenarioId: scenario.id,
      status: "NOT_STARTED",
      startTime: initialTelemetry.flightTimeSeconds,
      elapsedTime: 0,
      objectiveProgress,
      resultData: {
        maxAltitude: initialTelemetry.altitude,
        minAltitude: initialTelemetry.altitude,
        maxDrift: 0,
        maxTilt: 0,
        motorImbalance: 0,
        batteryConsumed: 0,
        windSpeed: 0,
      }
    };
    
    this.notify();
  }

  public getSession(): SessionState | null {
    return this.session;
  }
  
  public getActiveScenario(): TrainingScenario | null {
    return this.activeScenario;
  }

  public begin() {
    if (this.session && this.session.status === "NOT_STARTED") {
      this.session.status = "IN_PROGRESS";
      this.notify();
    }
  }

  public evaluate(telemetry: TelemetryState, env: EnvironmentState, dt: number, crashState: CrashState | null) {
    if (!this.session || this.session.status !== "IN_PROGRESS" || !this.activeScenario) return;

    this.session.elapsedTime += dt;
    const res = this.session.resultData!;

    // Track extreme values
    res.maxAltitude = Math.max(res.maxAltitude, telemetry.altitude);
    res.minAltitude = Math.min(res.minAltitude, telemetry.altitude);
    
    const dx = telemetry.position.x - this.startPos.x;
    const dz = telemetry.position.z - this.startPos.z;
    const drift = Math.sqrt(dx * dx + dz * dz);
    res.maxDrift = Math.max(res.maxDrift, drift);
    
    const tilt = Math.max(Math.abs(telemetry.rotation.pitch), Math.abs(telemetry.rotation.roll)) * (180 / Math.PI);
    res.maxTilt = Math.max(res.maxTilt, tilt);
    
    res.batteryConsumed = this.startBattery - telemetry.batteryLevel;
    res.windSpeed = env.windSpeed;

    if (telemetry.motorOutputs && telemetry.motorOutputs.length > 0) {
       const maxM = Math.max(...telemetry.motorOutputs);
       const minM = Math.min(...telemetry.motorOutputs);
       res.motorImbalance = Math.max(res.motorImbalance, maxM - minM);
    }

    if (crashState) {
       this.failSession("Aircraft crashed or experienced critical impact.");
       return;
    }

    if (!this.activeScenario.objectives || this.activeScenario.objectives.length === 0) {
      return;
    }

    let allCompleted = true;

    for (const obj of this.activeScenario.objectives) {
      const prog = this.session.objectiveProgress[obj.id];
      if (prog.status !== "IN_PROGRESS") continue;

      let inTolerance = false;
      let currentValue = 0;

      switch (obj.type) {
        case "ALTITUDE_HOLD":
          currentValue = telemetry.altitude;
          inTolerance = Math.abs(currentValue - (obj.targetValue || 10)) <= (obj.tolerance || 1.5);
          break;
        case "POSITION_HOLD":
          currentValue = drift;
          inTolerance = currentValue <= (obj.tolerance || 3.0);
          break;
        case "MOTOR_RESPONSE":
          currentValue = res.motorImbalance;
          inTolerance = prog.timeInTolerance >= obj.requiredDurationSeconds; 
          break;
        case "PAYLOAD_TEST":
          currentValue = telemetry.altitude;
          inTolerance = prog.timeInTolerance >= obj.requiredDurationSeconds; 
          break;
        case "BATTERY_TEST":
          currentValue = res.batteryConsumed;
          inTolerance = prog.timeInTolerance >= obj.requiredDurationSeconds; 
          break;
        case "ENVIRONMENT_RESPONSE":
          currentValue = drift;
          inTolerance = prog.timeInTolerance >= obj.requiredDurationSeconds;
          break;
      }
      
      prog.lastValue = currentValue;

      if (obj.type === "ALTITUDE_HOLD" || obj.type === "POSITION_HOLD") {
          if (inTolerance) {
            prog.timeInTolerance += dt;
            if (prog.timeInTolerance >= obj.requiredDurationSeconds) {
              prog.status = "COMPLETED";
            } else {
              allCompleted = false;
            }
          } else {
            prog.timeInTolerance = 0; // Reset
            allCompleted = false;
          }
      } else {
          // Duration based observation
          prog.timeInTolerance += dt;
          if (prog.timeInTolerance >= obj.requiredDurationSeconds) {
              prog.status = "COMPLETED";
          } else {
              allCompleted = false;
          }
      }
    }

    if (allCompleted) {
      this.session.status = "COMPLETED";
      this.notify();
    }
  }

  private failSession(reason: string) {
    if (!this.session) return;
    this.session.status = "FAILED";
    this.session.failureReason = reason;
    this.notify();
  }

  public reset() {
    this.activeScenario = null;
    this.session = null;
    this.notify();
  }

  private notify() {
    if (this.onStateChange && this.session) {
      // Clone to ensure React triggers re-render
      this.onStateChange({ ...this.session, objectiveProgress: { ...this.session.objectiveProgress } });
    }
  }
}
