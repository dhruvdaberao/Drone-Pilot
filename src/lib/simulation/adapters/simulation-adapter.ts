// ==========================================================
// DRONE PILOT — SIMULATION ADAPTER INTERFACE (PHASE 7)
// Hardware-in-the-Loop & Software-in-the-Loop Integration Layer
// Decouples the 3D world, HUD, and educational engines from the physics solver.
// ==========================================================

import { DroneDefinition, TelemetryState, EnvironmentState, PhysicsDebugTelemetry, CrashState } from "../types";
import { NormalizedControlInput } from "../normalized-control";

export type AdapterType = "local" | "px4" | "gazebo" | "hardware";

export interface SimulationAdapterStatus {
  name: string;
  type: AdapterType;
  isConnected: boolean;
  isLiveHardware: boolean;
  latencyMs: number;
  packetsSent: number;
  packetsReceived: number;
  statusMessage: string;
}

export interface SimulationAdapter {
  readonly id: string;
  readonly name: string;
  readonly type: AdapterType;
  readonly isConnected: boolean;

  connect(): Promise<boolean>;
  disconnect(): Promise<void>;

  initialize(
    def: DroneDefinition,
    initialSpawn: { x: number; y: number; z: number; yaw: number }
  ): Promise<void>;

  step(control: NormalizedControlInput, dt: number): TelemetryState;
  reset(spawnX: number, spawnY: number, spawnZ: number, spawnYaw: number): void;

  setEnvironment(env: EnvironmentState): void;
  setPayloadMass(kg: number): void;
  setMotorHealth(motorIndex: number, health: number): void;
  setSensorHealth(sensors: Partial<{ gps: boolean; imu: boolean; baro: boolean; compass: boolean }>): void;
  setTurbulence(factor: number): void;

  triggerAutoLand(): void;
  getMotorOutputs(): number[];
  getDebugTelemetry(): PhysicsDebugTelemetry;
  getCrashState(): CrashState | null;
  resetCrash(): void;

  getStatus(): SimulationAdapterStatus;
  setElevationQueryFn?(fn: (x: number, z: number) => number): void;
}
