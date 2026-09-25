// ==========================================================
// DRONE PILOT — PRESET TRAINING SCENARIOS (PHASE 5)
// Aeronautical training scenarios demonstrating physical consequences
// ==========================================================

import { EnvironmentState } from "./types";
import { ScenarioObjective } from "./scenario-engine";

export interface ScenarioFaults {
  motorHealth?: Record<number, number>; // index (0-based) -> health (0.0 to 1.0)
  sensorHealth?: {
    gps?: boolean;
    imu?: boolean;
    baro?: boolean;
    compass?: boolean;
  };
  batteryInitialSocPercent?: number;
  payloadMassKg?: number;
}

export interface TrainingScenario {
  id: string;
  name: string;
  category: "Standard" | "Emergency" | "Environmental" | "Industrial";
  badgeColor: string;
  description: string;
  learningObjective: string;
  environment: Partial<EnvironmentState>;
  faults: ScenarioFaults;
  expectedBehavior: string;
  recommendedOperatorAction: string;
  objectives?: ScenarioObjective[];
}

export const TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: "edu-basic-hover",
    name: "Scenario 1: Basic Hover",
    category: "Standard",
    badgeColor: "#10b981", 
    description: "Learn how the aircraft maintains stable hover equilibrium in calm conditions.",
    learningObjective: "Understand how the aircraft maintains stable hover.",
    environment: {
      preset: "normal", weather: "clear", windSpeed: 0.0, windDirection: 0,
      temperature: 20.0, turbulence: 0.0,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0 },
      sensorHealth: { gps: true, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 100,
      payloadMassKg: 0.0,
    },
    expectedBehavior: "Altitude remains stable inside the allowed safety envelope.",
    recommendedOperatorAction: "Take off to 10m and maintain hover without drifting.",
    objectives: [
      {
        id: "obj-hover-10s",
        type: "ALTITUDE_HOLD",
        description: "Maintain 10m altitude for 10 seconds",
        targetValue: 10,
        tolerance: 1.5,
        requiredDurationSeconds: 10
      }
    ]
  },
  {
    id: "edu-wind-response",
    name: "Scenario 2: Wind Response",
    category: "Environmental",
    badgeColor: "#0284c7", 
    description: "Learn how environmental wind affects aircraft stability and power consumption.",
    learningObjective: "Understand how environmental wind affects aircraft stability.",
    environment: {
      preset: "windy", weather: "windy", windSpeed: 6.0, windDirection: 90,
      temperature: 20.0, turbulence: 0.2,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0 },
      sensorHealth: { gps: true, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 100,
      payloadMassKg: 0.0,
    },
    expectedBehavior: "The aircraft tilts into the wind to maintain horizontal position. Total motor thrust increases.",
    recommendedOperatorAction: "Observe position drift and flight controller response.",
    objectives: [
      {
        id: "obj-wind-15s",
        type: "POSITION_HOLD",
        description: "Maintain position for 15 seconds in crosswind",
        tolerance: 3.5,
        requiredDurationSeconds: 15
      }
    ]
  },
  {
    id: "edu-motor-imbalance",
    name: "Scenario 3: Motor Imbalance",
    category: "Emergency",
    badgeColor: "#f59e0b", 
    description: "Experience the effects of a partially degraded propulsion system.",
    learningObjective: "Understand asymmetric propulsion.",
    environment: {
      preset: "normal", weather: "clear", windSpeed: 2.0, windDirection: 0,
      temperature: 20.0, turbulence: 0.0,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 0.6, 3: 1.0 },
      sensorHealth: { gps: true, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 100,
      payloadMassKg: 0.0,
    },
    expectedBehavior: "Opposing motors must spin faster to compensate for the torque imbalance, increasing battery drain.",
    recommendedOperatorAction: "Maintain hover and observe individual motor RPM and attitude stability.",
    objectives: [
      {
        id: "obj-imbalance-10s",
        type: "MOTOR_RESPONSE",
        description: "Observe asymmetric motor response for 10 seconds",
        requiredDurationSeconds: 10
      }
    ]
  },
  {
    id: "edu-payload-effect",
    name: "Scenario 4: Payload Effect",
    category: "Industrial",
    badgeColor: "#8b5cf6", 
    description: "Understand the consequences of flying at maximum takeoff weight (MTOW).",
    learningObjective: "Understand how additional mass affects aircraft performance.",
    environment: {
      preset: "normal", weather: "clear", windSpeed: 0.0, windDirection: 0,
      temperature: 20.0, turbulence: 0.0,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0 },
      sensorHealth: { gps: true, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 100,
      payloadMassKg: 4.5,
    },
    expectedBehavior: "The aircraft requires significantly more throttle to climb, and will lose altitude faster on descent.",
    recommendedOperatorAction: "Lift off carefully and note the higher hover throttle equilibrium.",
    objectives: [
      {
        id: "obj-payload-15s",
        type: "PAYLOAD_TEST",
        description: "Operate at high payload mass for 15 seconds",
        requiredDurationSeconds: 15
      }
    ]
  },
  {
    id: "edu-battery-effect",
    name: "Scenario 5: Battery Drain",
    category: "Emergency",
    badgeColor: "#ef4444", 
    description: "Observe the physics of battery voltage sag at low state-of-charge.",
    learningObjective: "Understand the effect of reduced battery state.",
    environment: {
      preset: "normal", weather: "clear", windSpeed: 0.0, windDirection: 0,
      temperature: 20.0, turbulence: 0.0,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0 },
      sensorHealth: { gps: true, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 25,
      payloadMassKg: 0.0,
    },
    expectedBehavior: "Voltage sags heavily under load, potentially restricting maximum climb rate.",
    recommendedOperatorAction: "Apply full throttle and observe the terminal voltage drop and current surge.",
    objectives: [
      {
        id: "obj-battery-10s",
        type: "BATTERY_TEST",
        description: "Operate at low battery capacity for 10 seconds",
        requiredDurationSeconds: 10
      }
    ]
  }
];
