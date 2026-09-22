// ==========================================================
// DRONE PILOT — PRESET TRAINING SCENARIOS (PHASE 5)
// Aeronautical training scenarios demonstrating physical consequences
// ==========================================================

import { EnvironmentState } from "./types";

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
}

export const TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: "normal-cruise",
    name: "Standard Navigational Cruise",
    category: "Standard",
    badgeColor: "#10b981", // green
    description: "Baseline flight operations under standard atmospheric conditions with all digital twin systems operating at 100% nominal capacity.",
    learningObjective: "Observe nominal hover throttle equilibrium (~38-42%), symmetric motor RPM distribution, and balanced battery discharge.",
    environment: {
      preset: "normal",
      weather: "clear",
      windSpeed: 2.0,
      windDirection: 45,
      windGust: 1.0,
      temperature: 20.0,
      rainIntensity: "off",
      visibility: "clear",
      turbulence: 0.05,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0 },
      sensorHealth: { gps: true, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 100,
      payloadMassKg: 0.0,
    },
    expectedBehavior: "Smooth attitude response, stable GPS hover hold, low vibration, and linear battery consumption (~18-24A draw).",
    recommendedOperatorAction: "Perform basic climb, translation, and yaw maneuvers to establish baseline flight metrics.",
  },
  {
    id: "high-wind-gusts",
    name: "High Wind & Severe Turbulence",
    category: "Environmental",
    badgeColor: "#f59e0b", // amber
    description: "Challenging meteorological condition featuring 14.5 m/s (52 km/h) northwest gale with continuous atmospheric wind gust turbulence.",
    learningObjective: "Understand how external aerodynamic drag and wind force tilt the aircraft, force the flight controller to raise RPM to maintain position, and accelerate battery drain by up to 45%.",
    environment: {
      preset: "windy",
      weather: "windy",
      windSpeed: 14.5,
      windDirection: 315,
      windGust: 6.5,
      temperature: 15.0,
      rainIntensity: "off",
      visibility: "clear",
      turbulence: 0.65,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0 },
      sensorHealth: { gps: true, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 90,
      payloadMassKg: 0.0,
    },
    expectedBehavior: "Aircraft tilts into the wind vector to produce opposing horizontal thrust. High motor RPM fluctuation and elevated power draw (>350W).",
    recommendedOperatorAction: "Keep throttle active to maintain altitude, avoid flying directly downwind at low altitudes, and prepare to crab into the wind on approach.",
  },
  {
    id: "low-battery-emergency",
    name: "Critical Battery & Voltage Sag",
    category: "Emergency",
    badgeColor: "#ef4444", // red
    description: "Low-state-of-charge emergency scenario with battery at 14% SOC under high internal resistance and terminal voltage drop.",
    learningObjective: "Observe how Ohm's Law voltage sag (V_terminal = V_oc - I * R_int) reduces available propulsion power, derates climb performance, and triggers emergency RTL.",
    environment: {
      preset: "normal",
      weather: "clear",
      windSpeed: 3.5,
      windDirection: 90,
      windGust: 1.5,
      temperature: 12.0,
      rainIntensity: "off",
      visibility: "clear",
      turbulence: 0.1,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0 },
      sensorHealth: { gps: true, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 14,
      payloadMassKg: 0.0,
    },
    expectedBehavior: "Telemetry HUD displays amber LOW BATTERY warning. Maximum climb rate is restricted by the battery manager. Voltage drops noticeably when full throttle is applied.",
    recommendedOperatorAction: "Throttle back to minimum safe hover, turn immediately toward nearest helipad, and initiate auto-land sequence.",
  },
  {
    id: "motor-degraded",
    name: "Motor 3 Asymmetric Thrust Degradation",
    category: "Emergency",
    badgeColor: "#dc2626", // dark red
    description: "Propulsion fault injection simulating a damaged rotor or overheating ESC on Motor 3 (rear-left), dropping its output capacity to 45%.",
    learningObjective: "Demonstrate how asymmetric motor thrust causes severe roll and pitch attitude torque, requiring counter-trim and increasing demand on opposing motors.",
    environment: {
      preset: "normal",
      weather: "clear",
      windSpeed: 2.5,
      windDirection: 0,
      windGust: 1.0,
      temperature: 22.0,
      rainIntensity: "off",
      visibility: "clear",
      turbulence: 0.1,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 0.45, 3: 1.0 },
      sensorHealth: { gps: true, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 85,
      payloadMassKg: 0.0,
    },
    expectedBehavior: "Aircraft develops roll instability. Opposite motors (M1, M4) spool to near maximum RPM to keep the frame level, leading to high current consumption and loss of climb authority.",
    recommendedOperatorAction: "Apply gentle right cyclic trim, reduce forward speed, avoid aggressive banking turns, and land immediately.",
  },
  {
    id: "gps-loss",
    name: "Avionics GPS Signal Loss (ATTI Mode)",
    category: "Emergency",
    badgeColor: "#8b5cf6", // purple
    description: "Satellite navigation blackout simulating GPS antenna disconnect or multi-path canyon interference.",
    learningObjective: "Experience the transition from automated GPS Position Hold to manual Attitude (ATTI) mode, where the aircraft no longer auto-brakes when control sticks are centered.",
    environment: {
      preset: "normal",
      weather: "clear",
      windSpeed: 6.5,
      windDirection: 225,
      windGust: 2.0,
      temperature: 19.0,
      rainIntensity: "off",
      visibility: "clear",
      turbulence: 0.2,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0 },
      sensorHealth: { gps: false, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 95,
      payloadMassKg: 0.0,
    },
    expectedBehavior: "When control sticks are released to center, the drone does NOT stop. It drifts downwind at ambient wind speed (6.5 m/s). Active braking is disabled.",
    recommendedOperatorAction: "Actively steer into the wind with subtle cyclic corrections to maintain visual position. Orient using visual island landmarks.",
  },
  {
    id: "heavy-payload",
    name: "Agricultural Heavy-Lift Payload (AUW Limit)",
    category: "Industrial",
    badgeColor: "#0284c7", // sky blue
    description: "Industrial agricultural mission with a full 6.5 kg liquid crop-spray tank and underslung dispersal boom at near maximum airframe AUW.",
    learningObjective: "Analyze the fundamental relationship between total mass, hover equilibrium throttle, climb acceleration, and endurance.",
    environment: {
      preset: "normal",
      weather: "clear",
      windSpeed: 4.0,
      windDirection: 180,
      windGust: 1.5,
      temperature: 24.0,
      rainIntensity: "off",
      visibility: "clear",
      turbulence: 0.15,
    },
    faults: {
      motorHealth: { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0 },
      sensorHealth: { gps: true, imu: true, baro: true, compass: true },
      batteryInitialSocPercent: 100,
      payloadMassKg: 6.5,
    },
    expectedBehavior: "Hover throttle jumps from ~40% to ~72%. Sluggish vertical climb rate. Total mass causes significant inertia when stopping. High motor heat and battery discharge (~42A).",
    recommendedOperatorAction: "Anticipate braking distance early when descending or translating. Maintain smooth collective throttle inputs.",
  },
];
