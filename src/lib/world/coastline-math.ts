// ==========================================================
// DRONE PILOT — IRREGULAR COASTLINE MATHEMATICAL MODEL
// Multi-harmonic parametric boundary for naturally formed island
// ==========================================================

import { CoastlinePoint } from "./world-types";

/**
 * Evaluates the natural irregular coastline radius at any compass angle.
 * Replaces circular/oval geometry with organic bays, coves, and peninsulas.
 * 
 * Coordinate orientation:
 * Angle 0 = East (+X)
 * Angle -PI/2 = North (-Z)
 * Angle PI/2 = South (+Z)
 * Angle PI or -PI = West (-X)
 */
export function getCoastlineRadius(angleRad: number): number {
  const baseR = 860; // Base radius in meters (~1720m nominal diameter)

  // Harmonic perturbations calibrated to form distinct geographic landforms:
  // 1. North Cape Peninsula & North-East Emerald Bay (2-wave component)
  const h1 = 0.18 * Math.cos(2 * angleRad - 0.35);
  // 2. South Harbor Bay & River Delta estuary (3-wave component)
  const h2 = 0.14 * Math.sin(3 * angleRad + 0.82);
  // 3. Western Bluffs & Southwest Crescent Beach coves (4-wave component)
  const h3 = 0.08 * Math.cos(4 * angleRad - 1.10);
  // 4. Fine coastal jaggedness & headlands (5 & 6-wave components)
  const h4 = 0.06 * Math.sin(5 * angleRad + 0.45);
  const h5 = -0.04 * Math.cos(6 * angleRad - 0.70);

  const factor = 1.0 + h1 + h2 + h3 + h4 + h5;
  return baseR * factor;
}

/**
 * Returns true if coordinates (x, z) are on the physical island landmass.
 */
export function isInsideIsland(x: number, z: number): boolean {
  const dist = Math.hypot(x, z);
  const angle = Math.atan2(z, x);
  const coastR = getCoastlineRadius(angle);
  return dist <= coastR;
}

/**
 * Signed distance to coastline:
 * Positive = inland (meters from shore)
 * Negative = offshore in the ocean
 */
export function getDistanceToCoast(x: number, z: number): number {
  const dist = Math.hypot(x, z);
  const angle = Math.atan2(z, x);
  const coastR = getCoastlineRadius(angle);
  return coastR - dist;
}

/**
 * Generates an array of 2D points along the irregular perimeter.
 * Useful for 3D terrain extrusion and 2D vector minimap rendering.
 */
export function generateCoastlinePolygon(sampleCount = 128): CoastlinePoint[] {
  const points: CoastlinePoint[] = [];
  const step = (Math.PI * 2) / sampleCount;

  for (let i = 0; i < sampleCount; i++) {
    const angle = i * step;
    const r = getCoastlineRadius(angle);
    points.push({
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      angleRad: angle,
      distance: r,
    });
  }

  return points;
}
