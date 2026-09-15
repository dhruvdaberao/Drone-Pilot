// ==========================================================
// DRONE PILOT — ROAD NETWORK & HIGHWAY SYSTEM
// Realistic asphalt streets, intersections, streetlights & traffic waypoints
// ==========================================================

import * as THREE from "three";
import { AssetManager } from "./asset-manager";

export interface RoadSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  width: number;
}

export class RoadNetwork {
  public group = new THREE.Group();
  private assetMgr = AssetManager.getInstance();

  // Navigation waypoints for traffic simulation
  public waypoints: THREE.Vector3[] = [];

  constructor() {
    this.buildDowntownAvenues();
    this.buildArterialHighway();
    this.buildStreetlights();
  }

  /**
   * Main city street grid with realistic asphalt, curbs, and double-yellow centerlines
   */
  private buildDowntownAvenues() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1f242b,
      roughness: 0.85,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const markingMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    // Avenue A: North-South through downtown (X = 420, Z = 220 to 500, length 280m, width 14m)
    // Avenue B: North-South through downtown (X = 560, Z = 220 to 500, length 280m, width 14m)
    // 1st Street: East-West (Z = 280, X = 350 to 630, length 280m, width 14m)
    // 2nd Street: East-West (Z = 450, X = 350 to 630, length 280m, width 14m)

    const avenues = [
      { x: 420, z: 360, length: 280, isNS: true },
      { x: 560, z: 360, length: 280, isNS: true },
    ];

    const crossStreets = [
      { x: 490, z: 280, length: 280, isNS: false },
      { x: 490, z: 450, length: 280, isNS: false },
    ];

    const roadWidth = 14;
    const yElevation = 2.53;

    // Build North-South avenues
    avenues.forEach((ave) => {
      const geo = new THREE.PlaneGeometry(roadWidth, ave.length);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.position.set(ave.x, yElevation, ave.z);
      mesh.receiveShadow = true;
      this.group.add(mesh);

      // Centerline double-yellow stripes
      const lineGeo = new THREE.PlaneGeometry(0.3, ave.length);
      lineGeo.rotateX(-Math.PI / 2);
      const line1 = new THREE.Mesh(lineGeo, markingMat);
      line1.position.set(ave.x - 0.25, yElevation + 0.01, ave.z);
      this.group.add(line1);

      const line2 = new THREE.Mesh(lineGeo, markingMat);
      line2.position.set(ave.x + 0.25, yElevation + 0.01, ave.z);
      this.group.add(line2);
    });

    // Build East-West cross streets
    crossStreets.forEach((street) => {
      const geo = new THREE.PlaneGeometry(street.length, roadWidth);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.position.set(street.x, yElevation, street.z);
      mesh.receiveShadow = true;
      this.group.add(mesh);

      // Centerline double-yellow stripes
      const lineGeo = new THREE.PlaneGeometry(street.length, 0.3);
      lineGeo.rotateX(-Math.PI / 2);
      const line1 = new THREE.Mesh(lineGeo, markingMat);
      line1.position.set(street.x, yElevation + 0.01, street.z - 0.25);
      this.group.add(line1);

      const line2 = new THREE.Mesh(lineGeo, markingMat);
      line2.position.set(street.x, yElevation + 0.01, street.z + 0.25);
      this.group.add(line2);
    });

    // Traffic circuit waypoints: Outer rectangular loop around the city
    this.waypoints = [
      new THREE.Vector3(423.5, yElevation, 240), // Heading south on Ave A
      new THREE.Vector3(423.5, yElevation, 280),
      new THREE.Vector3(423.5, yElevation, 450),
      new THREE.Vector3(423.5, yElevation, 480), // Turn east
      new THREE.Vector3(563.5, yElevation, 480),
      new THREE.Vector3(563.5, yElevation, 450), // Heading north on Ave B
      new THREE.Vector3(563.5, yElevation, 280),
      new THREE.Vector3(563.5, yElevation, 240), // Turn west
      new THREE.Vector3(423.5, yElevation, 240),
    ];
  }

  /**
   * Arterial highway connecting the City to the Training Academy
   */
  private buildArterialHighway() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x22262c,
      roughness: 0.88,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    // Diagonal connector from (120, 1.22, 60) to (380, 2.52, 260)
    const p1 = new THREE.Vector3(120, 1.22, 60);
    const p2 = new THREE.Vector3(380, 2.52, 260);
    const dist = p1.distanceTo(p2);
    const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

    const geo = new THREE.PlaneGeometry(dist, 10);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, roadMat);
    mesh.position.set((p1.x + p2.x) / 2, 1.87, (p1.z + p2.z) / 2);
    mesh.rotation.y = -angle;
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  /**
   * Installs modern curved streetlights along sidewalks
   */
  private async buildStreetlights() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      emissive: 0xffeedd,
      emissiveIntensity: 2.0,
    });

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 6);
    armGeo.rotateZ(Math.PI / 3);
    const headGeo = new THREE.SphereGeometry(0.35, 8, 8);

    const lampPositions = [
      { x: 412, z: 250 },
      { x: 412, z: 310 },
      { x: 412, z: 370 },
      { x: 412, z: 430 },
      { x: 568, z: 250 },
      { x: 568, z: 310 },
      { x: 568, z: 370 },
      { x: 568, z: 430 },
      { x: 380, z: 272 },
      { x: 500, z: 272 },
      { x: 380, z: 442 },
      { x: 500, z: 442 },
    ];

    lampPositions.forEach((pos) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 2.52, pos.z);

      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 3.75;
      pole.castShadow = true;
      group.add(pole);

      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(0.8, 7.0, 0);
      group.add(arm);

      const head = new THREE.Mesh(headGeo, lampMat);
      head.position.set(1.8, 7.8, 0);
      group.add(head);

      this.group.add(group);
    });
  }
}
