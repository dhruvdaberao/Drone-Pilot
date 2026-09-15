// ==========================================================
// DRONE PILOT — CANONICAL HELIPAD REGISTRY
// Reusable, multi-region helipad launch and landing stations
// ==========================================================

import { Helipad } from "./world-types";

export const HELIPADS: Record<string, Helipad> = {
  // --- REGION 1: TRAINING AREA ---
  "training-alpha": {
    id: "training-alpha",
    regionId: "training",
    name: "Helipad Alpha (Academy Main)",
    position: { x: 0, y: 1.2, z: 0 },
    headingDeg: 0,
    elevation: 1.2,
    dimensions: { width: 14, length: 14, radius: 7 },
    surfaceType: "concrete",
    spawnAllowed: true,
    description: "Primary drone flight academy launchpad with high-visibility aviation markings.",
  },
  "training-bravo": {
    id: "training-bravo",
    regionId: "training",
    name: "Helipad Bravo (Practice Pad)",
    position: { x: 35, y: 1.2, z: 10 },
    headingDeg: 90,
    elevation: 1.2,
    dimensions: { width: 10, length: 10, radius: 5 },
    surfaceType: "concrete",
    spawnAllowed: true,
    description: "Secondary practice pad for student takeoff, landing, and hover drills.",
  },

  // --- REGION 2: FOREST ---
  "forest-alpha": {
    id: "forest-alpha",
    regionId: "forest",
    name: "Forest Ranger Outpost Pad",
    position: { x: 450, y: 4.0, z: -420 },
    headingDeg: 45,
    elevation: 4.0,
    dimensions: { width: 12, length: 12, radius: 6 },
    surfaceType: "wood",
    spawnAllowed: true,
    description: "Timber-framed elevated pad situated within a natural pine clearing.",
  },

  // --- REGION 3: MOUNTAINS ---
  "mountain-alpha": {
    id: "mountain-alpha",
    regionId: "mountain",
    name: "Mount Apex Weather Station Pad",
    position: { x: -480, y: 28.5, z: -450 },
    headingDeg: 180,
    elevation: 28.5,
    dimensions: { width: 12, length: 12, radius: 6 },
    surfaceType: "steel",
    spawnAllowed: true,
    description: "High-altitude grated steel helipad on a rocky mountain ridge overlook.",
  },

  // --- REGION 4: RIVER / VALLEY ---
  "river-alpha": {
    id: "river-alpha",
    regionId: "river",
    name: "Valley Bridge Observation Pad",
    position: { x: -120, y: 2.5, z: 120 },
    headingDeg: 120,
    elevation: 2.5,
    dimensions: { width: 10, length: 10, radius: 5 },
    surfaceType: "concrete",
    spawnAllowed: true,
    description: "Observation station helipad perched beside the valley arched bridge.",
  },

  // --- REGION 5: CITY ---
  "city-alpha": {
    id: "city-alpha",
    regionId: "city",
    name: "Downtown Heliport Plaza",
    position: { x: 520, y: 2.5, z: 380 },
    headingDeg: 0,
    elevation: 2.5,
    dimensions: { width: 16, length: 16, radius: 8 },
    surfaceType: "concrete",
    spawnAllowed: true,
    description: "Ground-level municipal vertiport situated between commercial towers.",
  },
  "city-apex-rooftop": {
    id: "city-apex-rooftop",
    regionId: "city",
    name: "Apex Center Rooftop Skyport",
    position: { x: 560, y: 58.5, z: 410 },
    headingDeg: 270,
    elevation: 58.5,
    dimensions: { width: 14, length: 14, radius: 7 },
    surfaceType: "rooftop",
    spawnAllowed: true,
    description: "Skyscraper rooftop landing facility for advanced high-altitude challenges.",
  },

  // --- REGION 6: INDUSTRIAL ---
  "industrial-alpha": {
    id: "industrial-alpha",
    regionId: "industrial",
    name: "Harbor Cargo Terminal Pad",
    position: { x: 120, y: 1.8, z: 620 },
    headingDeg: 90,
    elevation: 1.8,
    dimensions: { width: 14, length: 14, radius: 7 },
    surfaceType: "concrete",
    spawnAllowed: true,
    description: "Industrial apron pad bordered by logistics hangars and container stacks.",
  },

  // --- REGION 7: COAST ---
  "coast-alpha": {
    id: "coast-alpha",
    regionId: "coast",
    name: "Pelican Cove Marine Station Pad",
    position: { x: -580, y: 1.5, z: 320 },
    headingDeg: 315,
    elevation: 1.5,
    dimensions: { width: 12, length: 12, radius: 6 },
    surfaceType: "wood",
    spawnAllowed: true,
    description: "Coastal rescue pad overlooking sandy crescent beaches and marine bluffs.",
  },
};

export const HELIPAD_LIST = Object.values(HELIPADS);
