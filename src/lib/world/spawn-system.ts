// ==========================================================
// DRONE PILOT — DYNAMIC SPAWN SYSTEM
// Resolves starting coordinates, elevations, and orientations across all helipads
// ==========================================================

import { SpawnConfiguration, RegionId } from "./world-types";
import { HELIPADS } from "./helipad-definitions";
import { REGIONS } from "./region-definitions";

export class SpawnSystem {
  // Height offset from helipad surface to drone center of mass (skids rest on pad)
  public static readonly DRONE_SKID_VERTICAL_OFFSET = 0.245;

  /**
   * Resolves a fully qualified spawn configuration.
   * Defaults gracefully to Central Training Helipad Alpha if unspecified.
   */
  public static resolveSpawn(
    requestedRegionId?: string | null,
    requestedHelipadId?: string | null
  ): SpawnConfiguration {
    // 1. Check if specific helipad ID was directly requested
    let targetHelipad = requestedHelipadId ? HELIPADS[requestedHelipadId] : null;

    // 2. If no valid helipad, check requested region's primary helipad
    if (!targetHelipad && requestedRegionId && REGIONS[requestedRegionId]) {
      const region = REGIONS[requestedRegionId];
      targetHelipad = HELIPADS[region.primaryHelipadId] || null;
    }

    // 3. Fallback to canonical default: Training Helipad Alpha
    if (!targetHelipad) {
      targetHelipad = HELIPADS["training-alpha"];
    }

    const groundElevation = targetHelipad.elevation;
    const droneSpawnY = groundElevation + SpawnSystem.DRONE_SKID_VERTICAL_OFFSET;

    return {
      spawnId: `spawn-${targetHelipad.id}`,
      regionId: targetHelipad.regionId as RegionId,
      helipadId: targetHelipad.id,
      position: {
        x: targetHelipad.position.x,
        y: droneSpawnY,
        z: targetHelipad.position.z,
      },
      rotation: {
        pitch: 0,
        roll: 0,
        yaw: (targetHelipad.headingDeg * Math.PI) / 180,
      },
      groundElevation,
    };
  }

  /**
   * Get all registered helipads available for pilot spawning
   */
  public static getSpawnableHelipads() {
    return Object.values(HELIPADS).filter((h) => h.spawnAllowed);
  }
}
