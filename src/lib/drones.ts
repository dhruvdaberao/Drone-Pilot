import { DroneModel } from "@/types/drone";

export const DRONES: DroneModel[] = [
  {
    id: "quadcopter",
    name: "QUADCOPTER",
    tagline: "4 Rotors // Balanced Agility",
    description:
      "Highly responsive X-frame configuration. Exceptional maneuverability and balanced aerodynamic response, ideal for precision piloting.",
    image: "/drone1.png",
    badge: "Class 4A",
    specs: {
      rotors: 4,
      handling: "High Agility",
      maxLift: "Moderate",
      stability: "Dynamic",
      weightClass: "Lightweight",
    },
  },
  {
    id: "hexacopter",
    name: "HEXACOPTER",
    tagline: "6 Rotors // Enhanced Stability",
    description:
      "Radial 6-motor layout offering motor redundancy and increased lift stability. Smooth, consistent flight dynamics in variable winds.",
    image: "/drone2.png",
    badge: "Class 6B",
    specs: {
      rotors: 6,
      handling: "Smooth & Stable",
      maxLift: "High",
      stability: "Superior",
      weightClass: "Medium Duty",
    },
  },
  {
    id: "octacopter",
    name: "OCTACOPTER",
    tagline: "8 Rotors // Heavy Payload",
    description:
      "Industrial 8-rotor heavy lifter. Maximum thrust authority and rock-solid hovering stability for complex flight operations.",
    image: "/drone3.png",
    badge: "Class 8C",
    specs: {
      rotors: 8,
      handling: "Heavy Authority",
      maxLift: "Maximum",
      stability: "Rock Solid",
      weightClass: "Heavy Industrial",
    },
  },
];

export const DEFAULT_DRONE_STORAGE_KEY = "drone_pilot_selected_drone";

export function getDroneById(id: string): DroneModel | undefined {
  return DRONES.find((d) => d.id === id);
}
