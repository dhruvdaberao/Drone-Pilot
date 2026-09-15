// ==========================================================
// DRONE PILOT — TACTICAL MAP & MINIMAP DATA MODEL
// Exposes irregular coastline vectors and region projections
// ==========================================================

import { generateCoastlinePolygon } from "./coastline-math";
import { REGION_LIST } from "./region-definitions";
import { HELIPAD_LIST } from "./helipad-definitions";

/**
 * Projects a 3D world position (meters) into a 200x200 normalized SVG radar canvas.
 * Map viewport covers from -1100m to +1100m.
 */
export function worldToRadarCoords(worldX: number, worldZ: number, canvasSize = 200) {
  const halfRange = 1100; // meters from center
  const center = canvasSize / 2;
  const scale = (canvasSize * 0.44) / halfRange;

  const rx = center + worldX * scale;
  const rz = center + worldZ * scale;

  return {
    x: Math.max(6, Math.min(canvasSize - 6, rx)),
    y: Math.max(6, Math.min(canvasSize - 6, rz)),
  };
}

/**
 * Generates an SVG path string `d="..."` tracing the natural irregular coastline.
 */
export function getCoastlineSvgPath(sampleCount = 96, canvasSize = 200): string {
  const polygon = generateCoastlinePolygon(sampleCount);
  if (polygon.length === 0) return "";

  const first = worldToRadarCoords(polygon[0].x, polygon[0].z, canvasSize);
  let d = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;

  for (let i = 1; i < polygon.length; i++) {
    const pt = worldToRadarCoords(polygon[i].x, polygon[i].z, canvasSize);
    d += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }

  d += " Z";
  return d;
}

/**
 * Tactical Map Data Bundle for UI consumption
 */
export function getTacticalMapData(canvasSize = 200) {
  const coastlinePath = getCoastlineSvgPath(96, canvasSize);

  const regionMarkers = REGION_LIST.filter((r) => r.id !== "water").map((r) => {
    const coords = worldToRadarCoords(r.center.x, r.center.z, canvasSize);
    return {
      id: r.id,
      name: r.shortName,
      fullName: r.name,
      x: coords.x,
      y: coords.y,
      color: r.mapColor,
    };
  });

  const helipadMarkers = HELIPAD_LIST.map((h) => {
    const coords = worldToRadarCoords(h.position.x, h.position.z, canvasSize);
    return {
      id: h.id,
      name: h.name,
      x: coords.x,
      y: coords.y,
      regionId: h.regionId,
    };
  });

  return {
    coastlinePath,
    regionMarkers,
    helipadMarkers,
  };
}
