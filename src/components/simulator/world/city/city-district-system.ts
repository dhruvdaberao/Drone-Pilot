// ==========================================================
// DRONE PILOT — CITY DISTRICT SYSTEM (PHASE 3)
// Multi-district urban center with building variety, sidewalks,
// street furniture, parking, parks, and civic buildings
// ==========================================================

import * as THREE from "three";
import { AssetManager } from "../asset-manager";
import { BuildingGenerator, BuildingPlacement } from "./building-generator";
import { StreetFurniture } from "./street-furniture";
import { CityPark } from "./city-park";
import { ParkingSystem } from "./parking-system";

// ──────────────────────────────────────────────────────────────
// District Definitions
// ──────────────────────────────────────────────────────────────

export type DistrictType =
  | "cbd"           // Central Business District — tall glass towers
  | "commercial"    // Mid-rise offices, shops, hotels
  | "residential_high" // Apartment blocks
  | "residential_low"  // Houses, townhouses
  | "civic"         // Hospital, fire station, school
  | "park"          // Green space
  | "industrial_transition"; // Warehouses near port

interface DistrictDef {
  id: DistrictType;
  name: string;
  center: { x: number; z: number };
  halfW: number;
  halfD: number;
  buildingDensity: number; // 0-1 how tightly packed
  minHeight: number;
  maxHeight: number;
  sidewalkWidth: number;
}

const DISTRICTS: DistrictDef[] = [
  {
    id: "cbd",
    name: "Central Business District",
    center: { x: 760, z: 340 },
    halfW: 60, halfD: 60,
    buildingDensity: 0.9,
    minHeight: 35, maxHeight: 110,
    sidewalkWidth: 3.0,
  },
  {
    id: "commercial",
    name: "Commercial Core",
    center: { x: 680, z: 320 },
    halfW: 70, halfD: 80,
    buildingDensity: 0.75,
    minHeight: 12, maxHeight: 40,
    sidewalkWidth: 2.8,
  },
  {
    id: "residential_high",
    name: "High-Density Residential",
    center: { x: 860, z: 340 },
    halfW: 55, halfD: 70,
    buildingDensity: 0.65,
    minHeight: 10, maxHeight: 28,
    sidewalkWidth: 2.5,
  },
  {
    id: "residential_low",
    name: "Low-Density Residential",
    center: { x: 600, z: 220 },
    halfW: 50, halfD: 50,
    buildingDensity: 0.45,
    minHeight: 5, maxHeight: 12,
    sidewalkWidth: 2.0,
  },
  {
    id: "civic",
    name: "Civic & Public District",
    center: { x: 700, z: 450 },
    halfW: 45, halfD: 40,
    buildingDensity: 0.5,
    minHeight: 8, maxHeight: 20,
    sidewalkWidth: 3.0,
  },
  {
    id: "park",
    name: "Central City Park",
    center: { x: 730, z: 200 },
    halfW: 40, halfD: 35,
    buildingDensity: 0.0,
    minHeight: 0, maxHeight: 0,
    sidewalkWidth: 2.0,
  },
  {
    id: "industrial_transition",
    name: "Industrial Transition Zone",
    center: { x: 540, z: 360 },
    halfW: 40, halfD: 45,
    buildingDensity: 0.55,
    minHeight: 6, maxHeight: 14,
    sidewalkWidth: 2.0,
  },
];

// ──────────────────────────────────────────────────────────────
// Seeded PRNG for deterministic city generation
// ──────────────────────────────────────────────────────────────

class CityPRNG {
  private s: number;
  constructor(seed: number) { this.s = seed | 0; }
  next(): number {
    this.s = (this.s + 0x6D2B79F5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// ──────────────────────────────────────────────────────────────
// Main City District System
// ──────────────────────────────────────────────────────────────

export class CityDistrictSystem {
  public group = new THREE.Group();
  private assetMgr = AssetManager.getInstance();
  private rng = new CityPRNG(831457);
  private buildingGen: BuildingGenerator;
  private streetFurniture: StreetFurniture;
  private cityPark: CityPark;
  private parkingSystem: ParkingSystem;

  constructor() {
    this.buildingGen = new BuildingGenerator(this.assetMgr, this.rng);
    this.streetFurniture = new StreetFurniture(this.assetMgr);
    this.cityPark = new CityPark();
    this.parkingSystem = new ParkingSystem(this.assetMgr);

    this.buildAllDistricts();
    this.buildSidewalks();

    this.group.add(this.streetFurniture.group);
    this.group.add(this.cityPark.group);
    this.group.add(this.parkingSystem.group);
  }

  private buildAllDistricts() {
    for (const dist of DISTRICTS) {
      if (dist.id === "park") {
        // Park handled by CityPark module
        this.cityPark.build(dist.center.x, dist.center.z, dist.halfW, dist.halfD);
        continue;
      }
      this.populateDistrict(dist);
    }
  }

  /**
   * Fill a district with buildings on a grid, avoiding the Apex Tower zone
   */
  private populateDistrict(dist: DistrictDef) {
    // Grid spacing depends on density and building size expectations
    const baseSpacing = dist.id === "cbd" ? 38 : dist.id === "residential_low" ? 28 : 32;
    const jitter = baseSpacing * 0.15;

    const minX = dist.center.x - dist.halfW;
    const maxX = dist.center.x + dist.halfW;
    const minZ = dist.center.z - dist.halfD;
    const maxZ = dist.center.z + dist.halfD;

    for (let gx = minX + baseSpacing / 2; gx < maxX; gx += baseSpacing) {
      for (let gz = minZ + baseSpacing / 2; gz < maxZ; gz += baseSpacing) {
        // Skip if density roll fails
        if (this.rng.next() > dist.buildingDensity) continue;

        const px = gx + this.rng.range(-jitter, jitter);
        const pz = gz + this.rng.range(-jitter, jitter);

        // Protect Apex Tower zone (760, 360) ± 20m
        if (Math.abs(px - 760) < 22 && Math.abs(pz - 360) < 22) continue;

        // Protect helipads
        if (Math.abs(px - 610) < 18 && Math.abs(pz - 320) < 18) continue; // city-alpha

        const height = this.rng.range(dist.minHeight, dist.maxHeight);
        const rotY = this.rng.pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]);

        const placement: BuildingPlacement = {
          x: px,
          z: pz,
          height,
          rotationY: rotY,
          districtType: dist.id,
        };

        const buildingGroup = this.buildingGen.createBuilding(placement);
        this.group.add(buildingGroup);

        // Street furniture near buildings
        this.streetFurniture.placeNearBuilding(px, pz, dist.id);

        // Parking near commercial and residential
        if (dist.id === "commercial" || dist.id === "residential_high") {
          if (this.rng.next() > 0.5) {
            this.parkingSystem.addParkedVehicle(
              px + this.rng.range(-12, 12),
              pz + this.rng.range(-12, 12),
              this.rng.next() * Math.PI * 2
            );
          }
        }
      }
    }
  }

  /**
   * Raised concrete sidewalks along major downtown roads
   */
  private buildSidewalks() {
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af, // Light grey concrete
      roughness: 0.85,
      metalness: 0.05,
    });

    const yElev = 2.55;
    const sidewalkH = 0.15;
    const sidewalkW = 2.8;

    // Along the 2 N-S Avenues (x=640 and x=780, z=190 to z=450)
    [640, 780].forEach(aveX => {
      // Left sidewalk
      const leftGeo = new THREE.BoxGeometry(sidewalkW, sidewalkH, 260);
      const leftMesh = new THREE.Mesh(leftGeo, sidewalkMat);
      leftMesh.position.set(aveX - 7 - sidewalkW / 2, yElev + sidewalkH / 2, 320);
      leftMesh.receiveShadow = true;
      this.group.add(leftMesh);

      // Right sidewalk
      const rightMesh = new THREE.Mesh(leftGeo.clone(), sidewalkMat);
      rightMesh.position.set(aveX + 7 + sidewalkW / 2, yElev + sidewalkH / 2, 320);
      rightMesh.receiveShadow = true;
      this.group.add(rightMesh);
    });

    // Along 2 E-W Cross Streets (z=240 and z=400, x=600 to x=820)
    [240, 400].forEach(streetZ => {
      const topGeo = new THREE.BoxGeometry(220, sidewalkH, sidewalkW);
      const topMesh = new THREE.Mesh(topGeo, sidewalkMat);
      topMesh.position.set(710, yElev + sidewalkH / 2, streetZ - 7 - sidewalkW / 2);
      topMesh.receiveShadow = true;
      this.group.add(topMesh);

      const botMesh = new THREE.Mesh(topGeo.clone(), sidewalkMat);
      botMesh.position.set(710, yElev + sidewalkH / 2, streetZ + 7 + sidewalkW / 2);
      botMesh.receiveShadow = true;
      this.group.add(botMesh);
    });

    // Crosswalks at 4 intersections
    const crosswalkMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });

    const intersections = [
      { x: 640, z: 240 },
      { x: 640, z: 400 },
      { x: 780, z: 240 },
      { x: 780, z: 400 },
    ];

    intersections.forEach(pos => {
      // Zebra stripes (6 stripes per crossing, 2 crossings per intersection)
      for (let dir = 0; dir < 2; dir++) {
        for (let s = -3; s <= 2; s++) {
          const stripeGeo = dir === 0
            ? new THREE.PlaneGeometry(1.0, 10)
            : new THREE.PlaneGeometry(10, 1.0);
          stripeGeo.rotateX(-Math.PI / 2);
          const stripe = new THREE.Mesh(stripeGeo, crosswalkMat);
          if (dir === 0) {
            stripe.position.set(pos.x + s * 2, yElev + 0.02, pos.z);
          } else {
            stripe.position.set(pos.x, yElev + 0.02, pos.z + s * 2);
          }
          this.group.add(stripe);
        }
      }
    });
  }

  public update(_dt: number, _elapsed: number) {
    // Future: animated signs, traffic light cycling
  }
}
