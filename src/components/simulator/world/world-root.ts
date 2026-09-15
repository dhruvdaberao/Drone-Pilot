// ==========================================================
// DRONE PILOT — WORLD ROOT (PUBG-GRADE LIVING OPEN WORLD)
// Master coordinator integrating realistic terrain, nature, city,
// autonomous traffic, walking NPCs, soaring wildlife & downwash physics
// ==========================================================

import * as THREE from "three";
import { WorldEnvironment } from "./world-environment";
import { TerrainSystem } from "./terrain/terrain-system";
import { InstancedGrass } from "./terrain/instanced-grass";
import { NatureSystem } from "./nature-system";
import { RoadNetwork } from "./road-network";
import { TrafficManager } from "./traffic-manager";
import { NPCManager } from "./npc-manager";
import { WildlifeManager } from "./wildlife-manager";
import { WaterSystem } from "./water/water-system";
import { RotorWashFX } from "./rotor-wash-fx";

import { TrainingRegion } from "./regions/training-region";
import { ForestRegion } from "./regions/forest-region";
import { MountainRegion } from "./regions/mountain-region";
import { RiverRegion } from "./regions/river-region";
import { CityRegion } from "./regions/city-region";
import { IndustrialRegion } from "./regions/industrial-region";
import { CoastRegion } from "./regions/coast-region";
import { HELIPADS } from "@/lib/world/helipad-definitions";

export class WorldRoot {
  public group = new THREE.Group();

  // Core Environment & Foundations
  public environment: WorldEnvironment;
  public terrain: TerrainSystem;
  public grass: InstancedGrass;
  public nature: NatureSystem;
  public roads: RoadNetwork;
  public water: WaterSystem;
  public rotorWash: RotorWashFX;

  // Living World Agents
  public traffic: TrafficManager;
  public npcs: NPCManager;
  public wildlife: WildlifeManager;

  // Regional Landmarks
  public trainingRegion: TrainingRegion;
  public forestRegion: ForestRegion;
  public mountainRegion: MountainRegion;
  public riverRegion: RiverRegion;
  public cityRegion: CityRegion;
  public industrialRegion: IndustrialRegion;
  public coastRegion: CoastRegion;

  constructor(scene: THREE.Scene) {
    // 1. Atmosphere, Sun, Shadows, Lighting & Clouds
    this.environment = new WorldEnvironment(scene);

    // 2. Realistic Water System (4000m Ocean, Coastal Shallows, Lake, River & Waterfall)
    this.water = new WaterSystem();
    this.group.add(this.water.group);

    // 3. Natural Island Terrain Heightfield & Airfield Runway
    this.terrain = new TerrainSystem();
    this.group.add(this.terrain.group);

    // 4. Dense 3D Instanced Grass with Wind Waves (14,000 instances)
    this.grass = new InstancedGrass(14000);
    this.group.add(this.grass.group);

    // 5. Realistic Vegetation (Pines, Oaks, Palms, Boulders, Wildflowers)
    this.nature = new NatureSystem();
    this.group.add(this.nature.group);

    // 6. Asphalt Road Network & Streetlights
    this.roads = new RoadNetwork();
    this.group.add(this.roads.group);

    // 7. Autonomous Traffic Fleet
    this.traffic = new TrafficManager(this.roads.waypoints);
    this.group.add(this.traffic.group);

    // 8. Animated Ground Crew & Pedestrians
    this.npcs = new NPCManager();
    this.group.add(this.npcs.group);

    // 9. Soaring Eagles & Seabirds
    this.wildlife = new WildlifeManager();
    this.group.add(this.wildlife.group);

    // 10. Dynamic Rotor Downwash Particles & Ripples
    this.rotorWash = new RotorWashFX();
    this.group.add(this.rotorWash.group);

    // 11. Regional Modules
    this.trainingRegion = new TrainingRegion();
    this.group.add(this.trainingRegion.group);

    this.forestRegion = new ForestRegion();
    this.group.add(this.forestRegion.group);

    this.mountainRegion = new MountainRegion();
    this.group.add(this.mountainRegion.group);

    this.riverRegion = new RiverRegion();
    this.group.add(this.riverRegion.group);

    this.cityRegion = new CityRegion();
    this.group.add(this.cityRegion.group);

    this.industrialRegion = new IndustrialRegion();
    this.group.add(this.industrialRegion.group);

    this.coastRegion = new CoastRegion();
    this.group.add(this.coastRegion.group);

    scene.add(this.group);
  }

  /**
   * Elevation query for physics collision, helipad landing, and altitude AGL calculation.
   */
  public getGroundElevation(x: number, z: number): number {
    // Check if drone is positioned over any known helipad platform
    for (const h of Object.values(HELIPADS)) {
      const radius = h.dimensions.radius || h.dimensions.width / 2;
      const dist = Math.hypot(x - h.position.x, z - h.position.z);
      if (dist <= radius) {
        return h.elevation;
      }
    }

    // Otherwise return physical terrain heightfield elevation
    return this.terrain.getElevationAt(x, z);
  }

  /**
   * Master frame-by-frame simulation coordinator
   */
  public update(dt: number, elapsed: number, dronePos?: THREE.Vector3, thrust = 1.0) {
    this.environment.update(dt, elapsed);
    this.water.update(dt, elapsed);
    this.grass.update(dt, elapsed, dronePos);
    this.traffic.update(dt);
    this.npcs.update(dt, elapsed);
    this.wildlife.update(dt, elapsed);

    if (dronePos) {
      this.rotorWash.update(dt, elapsed, dronePos, thrust);
    }

    this.trainingRegion.update(dt, elapsed);
    this.mountainRegion.update(dt, elapsed);
    this.cityRegion.update(dt, elapsed);
    this.forestRegion.update(dt, elapsed);
  }
}
