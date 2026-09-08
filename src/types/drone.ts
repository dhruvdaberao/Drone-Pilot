export type DroneType = "quadcopter" | "hexacopter" | "octacopter";

export interface DroneSpecs {
  rotors: number;
  handling: string;
  maxLift: string;
  stability: string;
  weightClass: string;
}

export interface DroneModel {
  id: DroneType;
  name: string;
  tagline: string;
  description: string;
  image: string; // e.g., "/drone1.png"
  specs: DroneSpecs;
  badge: string;
}
