// ==========================================================
// DRONE PILOT SIMULATION CORE — TYPE DEFINITIONS
// Modular Drone Architecture, Flight Controller & Avionics
// ==========================================================

export type DroneCategory = "quadcopter" | "hexacopter" | "octacopter";

export interface MotorDefinition {
  id: number;
  position: { x: number; y: number; z: number };
  direction: 1 | -1; // 1: CW, -1: CCW
  thrustFactor: number;
}

export interface DroneDefinition {
  id: string;
  name: string;
  type: DroneCategory;
  
  // --------------------------------------------------------
  // SIMULATION / PROTOTYPE PARAMETERS (Prototype Flight Model)
  // --------------------------------------------------------
  mass: number; // kg
  motorCount: number;
  motors: MotorDefinition[];
  maximumThrust: number; // Newtons total collective
  batteryCapacity: number; // mAh (nominal simulation capacity)
  batteryDischargeRate: number; // % per minute hovering
  dimensions: {
    length: number; // meters
    width: number;
    height: number;
  };
  payloadCapacity: number; // kg
  inertia: {
    pitch: number;
    roll: number;
    yaw: number;
  };
  drag: {
    linear: number; // aerodynamic drag coefficient
    angular: number; // rotational damping coefficient
  };
  maxTiltAngle: number; // radians (banking limit for assisted hover)
  maxAscentSpeed: number; // m/s
  maxDescentSpeed: number; // m/s
  maxForwardSpeed: number; // m/s
}

export interface FlightInput {
  throttle: number; // 1: ascend, -1: descend, 0: hold/neutral
  pitch: number;    // 1: forward, -1: backward, 0: neutral
  roll: number;     // 1: right, -1: left, 0: neutral
  yaw: number;      // 1: rotate right, -1: rotate left, 0: neutral
  hoverHold: boolean;
  reset: boolean;
  cameraToggle: boolean;
}

export type FlightMode = "LANDED" | "HOVER" | "MANUAL" | "RTH";

export interface TelemetryState {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: { pitch: number; roll: number; yaw: number }; // radians
  altitude: number; // meters Above Ground Level
  groundSpeed: number; // km/h
  verticalSpeed: number; // m/s
  heading: number; // degrees 0-360 (North=0, East=90, South=180, West=270)
  batteryLevel: number; // 0 - 100 %
  flightTimeSeconds: number;
  flightMode: FlightMode;
  isArmed: boolean;
  rotorRpmPercent: number; // 0 - 100 %
  distanceFromHome: number; // meters
}

export type WeatherType = "clear" | "overcast" | "windy";
export type TimeOfDay = "morning" | "noon" | "sunset" | "night";

export interface EnvironmentState {
  weather: WeatherType;
  windSpeed: number; // m/s (default 0 for prototype)
  windDirection: number; // degrees
  visibility: "high" | "medium" | "low";
  temperature: number; // Celsius
  timeOfDay: TimeOfDay;
}

export interface EducationalEvent {
  id: string;
  title: string;
  message: string;
  severity: "info" | "success" | "warning" | "error";
  timestamp: number;
}