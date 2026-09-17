// ==========================================================
// DRONE PILOT — AUTONOMOUS TRAFFIC SIMULATION (LIVING WORLD)
// Real GLB vehicles (sedans, SUVs, police, ambulances, taxis) navigating roads
// ==========================================================

import * as THREE from "three";
import { AssetManager } from "./asset-manager";

interface TrafficVehicle {
  mesh: THREE.Group;
  speed: number;
  progress: number; // 0 to 1 along waypoint path
  pathIndex: number;
  wheels: THREE.Object3D[];
}

export class TrafficManager {
  public group = new THREE.Group();
  private assetMgr = AssetManager.getInstance();
  private vehicles: TrafficVehicle[] = [];
  private waypoints: THREE.Vector3[] = [];

  constructor(waypoints: THREE.Vector3[]) {
    this.waypoints = waypoints;
    this.spawnTrafficFleet();
  }

  /**
   * Spawns a varied fleet of city vehicles on the road network
   */
  private async spawnTrafficFleet() {
    if (this.waypoints.length < 2) return;

    const vehicleModels = [
      "/models/vehicles/sedan.glb",
      "/models/vehicles/suv.glb",
      "/models/vehicles/police.glb",
      "/models/vehicles/taxi.glb",
      "/models/vehicles/ambulance.glb",
      "/models/vehicles/van.glb",
      "/models/vehicles/truck.glb",
      "/models/vehicles/sedan-sports.glb",
    ];

    const templates = await Promise.all(
      vehicleModels.map((p) => this.assetMgr.loadModel(p))
    );

    const vehicleCount = 22;

    for (let i = 0; i < vehicleCount; i++) {
      const template = templates[i % templates.length].clone();
      // Kenney vehicles scale appropriately (1.9x) for human/road proportion
      template.scale.set(1.9, 1.9, 1.9);

      // Find wheel meshes for rotation animation & enhance lights
      const wheels: THREE.Object3D[] = [];
      template.traverse((child) => {
        if (child.name.toLowerCase().includes("wheel") || (child as THREE.Mesh).isMesh) {
          if (child.position.y < 0.6) {
            wheels.push(child);
          }
        }
      });

      // Add miniature headlight glow meshes so vehicles are easily spotted from flight altitude
      const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfffde0 });
      const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.05), headLightMat);
      hlLeft.position.set(-0.45, 0.45, 1.1);
      const hlRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.05), headLightMat);
      hlRight.position.set(0.45, 0.45, 1.1);
      template.add(hlLeft);
      template.add(hlRight);

      // Position evenly along the waypoint circuit
      const startWaypoint = i % (this.waypoints.length - 1);
      const startPos = this.waypoints[startWaypoint];
      template.position.copy(startPos);

      this.group.add(template);

      this.vehicles.push({
        mesh: template,
        speed: 13 + Math.random() * 9, // 13-22 m/s (~47-80 km/h)
        progress: (i / vehicleCount),
        pathIndex: startWaypoint,
        wheels,
      });
    }
  }

  /**
   * Updates vehicle positions along waypoints and spins wheels
   */
  public update(dt: number) {
    if (this.waypoints.length < 2) return;

    const totalPoints = this.waypoints.length;

    for (const v of this.vehicles) {
      const pCurrent = this.waypoints[v.pathIndex];
      const nextIdx = (v.pathIndex + 1) % totalPoints;
      const pNext = this.waypoints[nextIdx];

      const segmentDist = pCurrent.distanceTo(pNext);
      if (segmentDist <= 0.001) {
        v.pathIndex = nextIdx;
        continue;
      }

      // Advance along current segment
      v.progress += (v.speed * dt) / segmentDist;

      if (v.progress >= 1.0) {
        v.progress = 0.0;
        v.pathIndex = nextIdx;
      }

      // Interpolate position
      const p1 = this.waypoints[v.pathIndex];
      const p2 = this.waypoints[(v.pathIndex + 1) % totalPoints];
      v.mesh.position.lerpVectors(p1, p2, v.progress);

      // Steer heading towards next waypoint
      const heading = Math.atan2(p2.x - p1.x, p2.z - p1.z);
      v.mesh.rotation.y = heading;

      // Spin wheels
      const wheelSpin = (v.speed * dt) / 0.35; // r ~ 0.35m
      for (const w of v.wheels) {
        w.rotation.x += wheelSpin;
      }
    }
  }
}
