// ==========================================================
// DRONE PILOT — CANONICAL TERRAIN MATHEMATICAL MODEL (PUBG-GRADE)
// Realistic multi-octave uneven terrain, rugged mountain massifs,
// carved river canyons, and natural rolling hills
// ==========================================================

import { getDistanceToCoast, getCoastlineRadius } from "./coastline-math";
import { RegionId } from "./world-types";

export type SurfaceMaterialType =
  | "grass"
  | "sand"
  | "rock"
  | "scree"
  | "mud"
  | "asphalt"
  | "water";

export interface TerrainSample {
  elevation: number;        // Surface elevation in meters above sea level (MSL)
  slope: number;            // 0.0 (horizontal) to 1.0 (vertical cliff)
  surfaceType: SurfaceMaterialType;
  regionId: RegionId;
  color: [number, number, number]; // RGB 0..1 for vertex color splatting
}

/**
 * Evaluates the precise natural island ground elevation and biome at any (X, Z) world coordinate.
 * Shared directly by Three.js mesh generation, physics ground collision, and HUD telemetry.
 */
export function evaluateIslandElevation(x: number, z: number): TerrainSample {
  const distToCoast = getDistanceToCoast(x, z);
  const angle = Math.atan2(z, x);

  // -------------------------------------------------------------
  // 1. SUBMERGED OFFSHORE OCEAN BATHYMETRY
  // -------------------------------------------------------------
  if (distToCoast < -60) {
    // Deep ocean floor
    return {
      elevation: -14.0,
      slope: 0.0,
      surfaceType: "water",
      regionId: "water",
      color: [0.02, 0.12, 0.24],
    };
  }

  if (distToCoast < 0) {
    // Continental shallow shelf sloping up from -14.0m to 0.0m
    const t = (distToCoast + 60) / 60; // 0..1
    const elevation = -14.0 * (1 - t) * (1 - t);
    return {
      elevation,
      slope: 0.2,
      surfaceType: "sand",
      regionId: "water",
      color: [0.08 + t * 0.2, 0.35 + t * 0.2, 0.45 + t * 0.1], // Turquoise coastal shallows
    };
  }

  // -------------------------------------------------------------
  // 2. COASTLINE PROFILE (Cliff vs Sandy Beach vs Headland)
  // -------------------------------------------------------------
  // Western Bluffs (angle ~ 150° to 220°): steep rocky sea cliffs
  const isWesternBluff = angle > 2.4 || angle < -2.4;
  // North Cape (angle ~ -105° to -75°): rocky headland
  const isNorthCape = angle > -1.9 && angle < -1.2;

  let baseCoastElevation = 0.0;
  let coastalRockWeight = 0.0;

  if (distToCoast < 60) {
    const tCoast = distToCoast / 60; // 0 at water line, 1 inland

    if (isWesternBluff) {
      // Steep rock cliff rising abruptly from sea level up to 18-24m
      const cliffHeight = 18.0 + Math.sin(z * 0.04) * 5.0;
      baseCoastElevation = Math.pow(tCoast, 0.35) * cliffHeight;
      coastalRockWeight = 0.9;
    } else if (isNorthCape) {
      // Rocky peninsula headland bluffs (12-16m)
      baseCoastElevation = Math.pow(tCoast, 0.42) * 14.0;
      coastalRockWeight = 0.7;
    } else {
      // Gentle sandy beaches (Crescent Beach, Emerald Bay, East shore)
      baseCoastElevation = Math.sin((tCoast * Math.PI) / 2) * 1.6;
      coastalRockWeight = 0.05;
    }
  }

  // -------------------------------------------------------------
  // 3. NATURAL UNEVEN MULTI-OCTAVE INLAND RELIEF
  // -------------------------------------------------------------
  // Macro rolling hills (180m-350m wavelength, 6m-14m amplitude)
  const macroHills =
    (Math.sin(x * 0.014 + 0.3) * Math.cos(z * 0.012 - 0.5) +
      Math.sin((x + z) * 0.009) * 0.5) *
    7.5;

  // Medium terrain swells & natural ridges (60m-100m wavelength, 2.5m-5m amplitude)
  const swells =
    (Math.cos(x * 0.035) * Math.sin(z * 0.032) +
      Math.sin(x * 0.028 - z * 0.022)) *
    2.8;

  // Micro surface bumpiness & natural soil relief (15m-30m wavelength, 0.6m-1.2m amplitude)
  const microNoise =
    (Math.sin(x * 0.09) * Math.cos(z * 0.085) +
      Math.cos(x * 0.065 + z * 0.06)) *
    0.75;

  let inlandElevation = 4.2 + macroHills + swells + microNoise;
  let activeRegion: RegionId = "training";
  let surface: SurfaceMaterialType = "grass";

  // A. CENTRAL TRAINING ACADEMY (Center at 0, 0)
  const distCenter = Math.hypot(x, z);
  if (distCenter < 160) {
    activeRegion = "training";
    // Smooth transition from perfectly leveled pad (radius 30m at 1.2m) into natural terrain
    if (distCenter < 30) {
      inlandElevation = 1.2;
    } else {
      const t = (distCenter - 30) / 130;
      const smoothT = t * t * (3 - 2 * t);
      inlandElevation = 1.2 * (1 - smoothT) + inlandElevation * smoothT;
    }
    surface = "grass";
  }

  // B. MOUNT APEX HIGHLANDS (North-West Quadrant, Summit Peak at -450, -560)
  const distApexPeak = Math.hypot(x - (-450), z - (-560));
  if (distApexPeak < 520) {
    activeRegion = "mountain";
    const mtnWeight = Math.cos((distApexPeak / 520) * (Math.PI / 2));
    
    // Main mountain massif towering up to 135m MSL at the summit peak
    const massifElevation = mtnWeight * mtnWeight * 128.0;
    
    // Sharp geological ridges and crags
    const crags =
      Math.abs(Math.sin(x * 0.022 + z * 0.016)) * 16.0 +
      Math.cos(x * 0.038 - z * 0.028) * 8.0;

    // Engineered Weather Station Helipad Terrace at (-480, -450) at elevation 28.5m
    const distToMtnPad = Math.hypot(x - (-480), z - (-450));
    if (distToMtnPad < 55) {
      // Wide level helipad terrace with smooth edge blend
      const tPad = Math.max(0, (distToMtnPad - 25) / 30);
      const smoothPad = tPad * tPad * (3 - 2 * tPad);
      // South of terrace (z > -450) slopes down towards valley; North slopes up towards summit
      const ambientHeight = z < -450 ? (28.5 + (massifElevation + crags * 0.4 - 28.5) * smoothPad) : (28.5 * (1 - smoothPad * 0.35));
      inlandElevation = ambientHeight;
    } else {
      inlandElevation = Math.max(
        inlandElevation,
        1.5 + massifElevation + crags * mtnWeight
      );
    }

    if (inlandElevation > 22.0) {
      surface = inlandElevation > 85.0 ? "scree" : "rock";
    }
  }

  // C. CRYSTAL MOUNTAIN LAKE BASIN (Saddle at -280, -180)
  const distLake = Math.hypot(x - (-280), z - (-180));
  if (distLake < 115) {
    // Lake basin depression (lake water plane rests at Y = 7.5m)
    const tLake = distLake / 115;
    const basinDepth = (1 - tLake) * 5.2;
    inlandElevation = Math.min(inlandElevation, 7.5 - basinDepth);
    if (inlandElevation < 7.5) {
      surface = "mud";
      activeRegion = "river";
    }
  }

  // D. VALLEY RIVER CORRIDOR (Carved canyon from lake south to ocean estuary)
  if (z > -160 && z < 700 && x > -360 && x < 200) {
    const riverX = -180 + (z + 160) * 0.42 - Math.pow((z - 200) * 0.012, 2) * 2.5;
    const distToRiver = Math.abs(x - riverX);

    if (distToRiver < 60) {
      activeRegion = "river";
      const tRiver = distToRiver / 60;
      const channelDepression = (1 - tRiver * tRiver) * 4.2; // 4.2m carved gorge
      
      const riverProgress = (z + 160) / (680 + 160);
      const waterSurfaceY = Math.max(0.2, 7.2 * (1 - riverProgress));
      
      const bedElevation = waterSurfaceY - 0.9;
      inlandElevation = Math.min(
        inlandElevation - channelDepression,
        bedElevation + tRiver * 3.2
      );

      if (distToRiver < 22) {
        surface = "mud";
      }
    }
  }

  // E. WHISPERING PINES FOREST (North-East Quadrant, center ~ 450, -420)
  const distForest = Math.hypot(x - 450, z - (-420));
  if (distForest < 420 && activeRegion !== "river") {
    activeRegion = "forest";
    // Rolling woodland ridges (5m to 16m)
    const forestHills =
      Math.sin(x * 0.018) * Math.cos(z * 0.018) * 5.5 +
      Math.cos(x * 0.032 + z * 0.024) * 3.2 +
      6.5;

    const distToForestPad = Math.hypot(x - 450, z - (-420));
    if (distToForestPad < 24) {
      const tPad = distToForestPad / 24;
      inlandElevation = 4.0 + (forestHills - 4.0) * (tPad * tPad);
    } else {
      inlandElevation = Math.max(inlandElevation, forestHills);
    }
    surface = "grass";
  }

  // F. DOWNTOWN METROPOLIS (South-East Quadrant, center ~ 460, 360)
  const distCity = Math.hypot(x - 460, z - 360);
  if (distCity < 320 && activeRegion !== "river") {
    activeRegion = "city";
    // Leveled urban commercial terrace at ~2.5m
    const distToCityAlpha = Math.hypot(x - 350, z - 320);
    if (distToCityAlpha < 20) {
      inlandElevation = 2.5; // Foundation under terminal
    } else {
      const cityPlane = 2.5 + Math.sin(x * 0.012) * 0.5;
      inlandElevation = cityPlane;
    }
    surface = "grass";
  }

  // G. HARBOR INDUSTRIAL PARK (South, center ~ 120, 620)
  const distInd = Math.hypot(x - 120, z - 620);
  if (distInd < 260 && activeRegion !== "river") {
    activeRegion = "industrial";
    inlandElevation = 1.8;
    surface = "grass";
  }

  // H. PELICAN COVE & BLUFFS (South-West Quadrant, center ~ -580, 320)
  const distCoast = Math.hypot(x - (-580), z - 320);
  if (distCoast < 320 && activeRegion !== "river") {
    activeRegion = "coast";
    if (distToCoast < 60) {
      surface = "sand";
    }
  }

  // -------------------------------------------------------------
  // 4. MERGE COASTLINE SHAPING WITH INLAND ELEVATION
  // -------------------------------------------------------------
  let finalElevation = inlandElevation;

  if (distToCoast < 60) {
    const t = distToCoast / 60;
    finalElevation = baseCoastElevation * (1 - t) + inlandElevation * t;
    if (coastalRockWeight > 0.4) {
      surface = "rock";
    } else if (distToCoast < 32 && !isWesternBluff && !isNorthCape) {
      surface = "sand";
    }
  }

  // Calculate approximate terrain slope from neighboring gradient
  const eps = 2.0;
  const hx = (Math.sin((x + eps) * 0.014) - Math.sin((x - eps) * 0.014)) * 3.5;
  const hz = (Math.cos((z + eps) * 0.012) - Math.cos((z - eps) * 0.012)) * 3.5;
  const slope = Math.min(1.0, Math.hypot(hx, hz) / (2 * eps));

  // If slope > 0.45, rock face breaks through grass
  if (slope > 0.45 && finalElevation > 3.0 && surface !== "sand") {
    surface = "rock";
  }

  // -------------------------------------------------------------
  // 5. COLOR SPLATTING FOR VERTEX SHADING
  // -------------------------------------------------------------
  let color: [number, number, number] = [0.24, 0.42, 0.18]; // Deep Lush Forest Grass Green

  switch (surface) {
    case "sand":
      // Warm golden dune sand
      color = [0.84, 0.73, 0.50];
      break;
    case "rock":
      // Weathered dark granite rock
      color = [0.42, 0.42, 0.40];
      break;
    case "scree":
      // High mountain snow/granite scree
      color = finalElevation > 95.0 ? [0.88, 0.90, 0.94] : [0.55, 0.55, 0.52];
      break;
    case "mud":
      // Wet dark riverbed mud
      color = [0.32, 0.26, 0.18];
      break;
    case "grass":
    default:
      // Height-modulated lush grass green
      if (finalElevation > 14.0) {
        // Alpine high meadow
        color = [0.28, 0.38, 0.18];
      } else {
        // Lowland vibrant meadow
        color = [0.24, 0.44, 0.18];
      }
      break;
  }

  return {
    elevation: Math.max(-14.0, finalElevation),
    slope,
    surfaceType: surface,
    regionId: activeRegion,
    color,
  };
}
