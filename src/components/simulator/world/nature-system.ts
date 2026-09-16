// ==========================================================
// DRONE PILOT — REALISTIC NATURE & VEGETATION SYSTEM (PUBG-GRADE)
// 5,000+ full-scale towering pines (28m), mature oaks (24m), coastal palms,
// boulders & wildflower meadows
// ==========================================================

import * as THREE from "three";
import { evaluateIslandElevation } from "@/lib/world/terrain-math";
import { HELIPADS } from "@/lib/world/helipad-definitions";

/**
 * Ensures trees, rocks, and foliage never spawn on helipads, runways, or city center
 */
function isNearProtectedZone(x: number, z: number, clearance = 32): boolean {
  // 1. Check all registered helipads with generous clearances
  for (const pad of Object.values(HELIPADS)) {
    const padRadius = pad.dimensions?.radius ?? 7;
    const requiredClearance = pad.id === "mountain-alpha" ? 75 : 45;
    if (Math.hypot(x - pad.position.x, z - pad.position.z) < (padRadius + requiredClearance)) {
      return true;
    }
  }

  // 2. Clear central training airfield runway & taxiways (X: -25 to 65, Z: -195 to 95)
  if (x >= -25 && x <= 65 && z >= -195 && z <= 95) {
    return true;
  }

  // 3. Clear downtown metropolis street core (X: 310 to 610, Z: 250 to 500)
  if (x >= 310 && x <= 610 && z >= 250 && z <= 500) {
    return true;
  }

  return false;
}

export class NatureSystem {
  public group = new THREE.Group();

  constructor() {
    this.buildDenseForestPines();
    this.buildDeciduousOaks();
    this.buildCoastalPalms();
    this.buildGraniteBoulders();
    this.buildWildflowerMeadows();
  }

  /**
   * Massive 28-meter full-scale conifer pine tree geometry with 6 tiered boughs
   * and 17m canopy diameter (PUBG Erangel proportions)
   */
  private createPineTreeGeometry(): { trunkGeo: THREE.BufferGeometry; foliageGeo: THREE.BufferGeometry } {
    // 1. Massive Trunk: 24m tall, 1.3m base diameter
    const trunkGeo = new THREE.CylinderGeometry(0.55, 1.15, 24, 10);
    trunkGeo.translate(0, 12, 0);

    // 2. 6-tiered jagged conifer needle boughs spanning 17m diameter
    const geometries: THREE.BufferGeometry[] = [];

    const tiers = [
      { y: 6.0, r: 8.5, h: 7.5 },
      { y: 10.5, r: 7.2, h: 6.5 },
      { y: 14.5, r: 5.8, h: 5.5 },
      { y: 18.0, r: 4.4, h: 4.8 },
      { y: 21.5, r: 3.0, h: 4.0 },
      { y: 24.5, r: 1.6, h: 3.2 },
    ];

    tiers.forEach((t) => {
      const cone = new THREE.ConeGeometry(t.r, t.h, 12);
      cone.translate(0, t.y + t.h / 2, 0);
      geometries.push(cone);
    });

    return { trunkGeo, foliageGeo: this.mergeGeometries(geometries) };
  }

  /**
   * Mature 24-meter broadleaf oak tree with 20m wide volumetric canopy
   */
  private createOakTreeGeometry(): { trunkGeo: THREE.BufferGeometry; foliageGeo: THREE.BufferGeometry } {
    const trunkGeo = new THREE.CylinderGeometry(0.75, 1.5, 16, 10);
    trunkGeo.translate(0, 8, 0);

    const geometries: THREE.BufferGeometry[] = [];
    const clusters = [
      { x: 0, y: 17.5, z: 0, r: 7.2 },
      { x: -3.8, y: 15.0, z: 2.8, r: 5.5 },
      { x: 4.2, y: 15.5, z: -2.5, r: 5.6 },
      { x: 2.0, y: 19.8, z: 2.6, r: 5.2 },
      { x: -2.8, y: 18.6, z: -3.2, r: 5.4 },
      { x: 0.0, y: 22.0, z: 0.0, r: 4.2 },
    ];

    clusters.forEach((c) => {
      const sphere = new THREE.DodecahedronGeometry(c.r, 2);
      sphere.translate(c.x, c.y, c.z);
      geometries.push(sphere);
    });

    return { trunkGeo, foliageGeo: this.mergeGeometries(geometries) };
  }

  /**
   * 18-meter coastal palm tree with 7.5m drooping frond crown
   */
  private createPalmGeometry(): { trunkGeo: THREE.BufferGeometry; frondGeo: THREE.BufferGeometry } {
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 18, 8);
    trunkGeo.translate(0, 9, 0);

    const geometries: THREE.BufferGeometry[] = [];
    const frondCount = 10;

    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const frond = new THREE.PlaneGeometry(1.8, 7.5);
      frond.rotateX(Math.PI / 3);
      frond.rotateY(angle);
      frond.translate(Math.sin(angle) * 2.2, 17.6, Math.cos(angle) * 2.2);
      geometries.push(frond);
    }

    return { trunkGeo, frondGeo: this.mergeGeometries(geometries) };
  }

  /**
   * Helper to merge buffer geometries
   */
  private mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const posList: number[] = [];
    const normList: number[] = [];
    const idxList: number[] = [];
    let vertexOffset = 0;

    geos.forEach((g) => {
      const pos = g.attributes.position;
      const norm = g.attributes.normal;
      const idx = g.index;

      for (let i = 0; i < pos.count; i++) {
        posList.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        if (norm) {
          normList.push(norm.getX(i), norm.getY(i), norm.getZ(i));
        } else {
          normList.push(0, 1, 0);
        }
      }

      if (idx) {
        for (let i = 0; i < idx.count; i++) {
          idxList.push(idx.getX(i) + vertexOffset);
        }
      } else {
        for (let i = 0; i < pos.count; i++) {
          idxList.push(vertexOffset + i);
        }
      }

      vertexOffset += pos.count;
    });

    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.Float32BufferAttribute(posList, 3));
    merged.setAttribute("normal", new THREE.Float32BufferAttribute(normList, 3));
    merged.setIndex(idxList);
    return merged;
  }

  /**
   * 3,500 towering conifer pine trees forming the thick Whispering Pines forest canopy
   */
  private buildDenseForestPines() {
    const { trunkGeo, foliageGeo } = this.createPineTreeGeometry();

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x2e1d11, // Dark bark
      roughness: 0.92,
      metalness: 0.05,
    });

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x163519, // Deep authentic conifer pine needle green
      roughness: 0.8,
      metalness: 0.06,
      flatShading: false,
    });

    const count = 3500;
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, count);

    trunkInst.castShadow = true;
    trunkInst.receiveShadow = true;
    foliageInst.castShadow = true;
    foliageInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      trunkInst.setMatrixAt(i, dummy.matrix);
      foliageInst.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    const pineGrid = new Set<string>();
    const pineCellSize = 13.0; // Enforces minimum 13m trunk clearance so canopies never overlap into solid blobs

    while (placed < count && attempts++ < maxAttempts) {
      let x = 0;
      let z = 0;

      if (placed < 2800) {
        // Whispering Pines Forest
        x = 310 + Math.random() * 330;
        z = -590 + Math.random() * 340;

        // Slalom Flight Corridor: Keep a 24m wide winding flight path clear through the pines
        const trailCenterZ = -420 + Math.sin(x * 0.028) * 32;
        if (Math.abs(z - trailCenterZ) < 12) continue;
      } else {
        // Mountain slopes
        x = -640 + Math.random() * 340;
        z = -580 + Math.random() * 280;
      }

      // Avoid all registered helipads, runways, and downtown
      if (isNearProtectedZone(x, z, 30)) continue;

      // Check spatial grid clearance against neighboring trees
      const gx = Math.floor(x / pineCellSize);
      const gz = Math.floor(z / pineCellSize);
      let overlaps = false;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (pineGrid.has(`${gx + dx}_${gz + dz}`)) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) break;
      }
      if (overlaps) continue;

      const sample = evaluateIslandElevation(x, z);
      if (sample.elevation < 1.0 || sample.elevation > 75 || sample.slope > 0.6) continue;

      pineGrid.add(`${gx}_${gz}`);

      const scale = 0.85 + Math.random() * 0.45; // 24m to 35m height!
      dummy.position.set(x, sample.elevation, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.06,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.06
      );
      dummy.scale.set(scale, scale * (0.95 + Math.random() * 0.25), scale);
      dummy.updateMatrix();

      trunkInst.setMatrixAt(placed, dummy.matrix);
      foliageInst.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    trunkInst.count = placed;
    foliageInst.count = placed;
    trunkInst.instanceMatrix.needsUpdate = true;
    foliageInst.instanceMatrix.needsUpdate = true;

    this.group.add(trunkInst);
    this.group.add(foliageInst);
  }

  /**
   * 1,400 mature broadleaf oaks along the river valley, airfield perimeter & meadows
   */
  private buildDeciduousOaks() {
    const { trunkGeo, foliageGeo } = this.createOakTreeGeometry();

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1c,
      roughness: 0.9,
      metalness: 0.04,
    });

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x244f1e, // Deep lush oak leaf green
      roughness: 0.82,
      metalness: 0.05,
    });

    const count = 1400;
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, count);

    trunkInst.castShadow = true;
    trunkInst.receiveShadow = true;
    foliageInst.castShadow = true;
    foliageInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      trunkInst.setMatrixAt(i, dummy.matrix);
      foliageInst.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;
    const oakGrid = new Set<string>();
    const oakCellSize = 14.0; // Enforces minimum 14m trunk clearance for broadleaf trees

    while (placed < count && attempts++ < maxAttempts) {
      let x = 0;
      let z = 0;

      if (placed < 350) {
        // Airfield perimeter ring (outer clearance beyond 70m)
        const a = Math.random() * Math.PI * 2;
        const r = 75 + Math.random() * 110;
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
      } else {
        // River valley & meadow glades
        const rz = -200 + Math.random() * 600;
        const rx = -120 + Math.sin(rz * 0.03) * 40;
        x = rx + (Math.random() - 0.5) * 160;
        z = rz;
      }

      // Avoid all helipads, runways, and urban downtown
      if (isNearProtectedZone(x, z, 35)) continue;

      // Check spatial grid clearance
      const gx = Math.floor(x / oakCellSize);
      const gz = Math.floor(z / oakCellSize);
      let overlaps = false;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (oakGrid.has(`${gx + dx}_${gz + dz}`)) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) break;
      }
      if (overlaps) continue;

      const sample = evaluateIslandElevation(x, z);
      if (sample.elevation < 0.9 || sample.elevation > 45 || sample.slope > 0.45) continue;

      oakGrid.add(`${gx}_${gz}`);

      const scale = 0.85 + Math.random() * 0.45; // 20m to 30m height!
      dummy.position.set(x, sample.elevation, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.06,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.06
      );
      dummy.scale.set(scale, scale * (0.95 + Math.random() * 0.25), scale);
      dummy.updateMatrix();

      trunkInst.setMatrixAt(placed, dummy.matrix);
      foliageInst.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    trunkInst.count = placed;
    foliageInst.count = placed;
    trunkInst.instanceMatrix.needsUpdate = true;
    foliageInst.instanceMatrix.needsUpdate = true;

    this.group.add(trunkInst);
    this.group.add(foliageInst);
  }

  /**
   * 160 coastal palm trees lining Crescent Beach and Emerald Bay
   */
  private buildCoastalPalms() {
    const { trunkGeo, frondGeo } = this.createPalmGeometry();

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5a432e,
      roughness: 0.88,
    });

    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x326624,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });

    const count = 160;
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const frondInst = new THREE.InstancedMesh(frondGeo, frondMat, count);

    trunkInst.castShadow = true;
    frondInst.castShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      trunkInst.setMatrixAt(i, dummy.matrix);
      frondInst.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    const beachAngles = [-0.6, -0.4, -0.2, 0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2];

    while (placed < count && attempts++ < maxAttempts) {
      const baseAngle = beachAngles[placed % beachAngles.length] + (Math.random() - 0.5) * 0.25;
      const dist = 580 + Math.random() * 120;
      const x = Math.cos(baseAngle) * dist;
      const z = Math.sin(baseAngle) * dist;

      if (isNearProtectedZone(x, z, 28)) continue;

      const sample = evaluateIslandElevation(x, z);
      if (sample.elevation < 0.4 || sample.elevation > 4.5) continue;

      const scale = 0.95 + Math.random() * 0.4;
      dummy.position.set(x, sample.elevation, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.12,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.12
      );
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      trunkInst.setMatrixAt(placed, dummy.matrix);
      frondInst.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    trunkInst.count = placed;
    frondInst.count = placed;
    trunkInst.instanceMatrix.needsUpdate = true;
    frondInst.instanceMatrix.needsUpdate = true;

    this.group.add(trunkInst);
    this.group.add(frondInst);
  }

  /**
   * 180 mossy granite rock boulders and cliff outcrops
   */
  private buildGraniteBoulders() {
    const rockGeo = new THREE.DodecahedronGeometry(3.5, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x3d434d,
      roughness: 0.92,
      metalness: 0.1,
      flatShading: true,
    });

    const count = 180;
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, count);
    rockInst.castShadow = true;
    rockInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      rockInst.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    while (placed < count && attempts++ < maxAttempts) {
      const zone = Math.random();
      let x = 0;
      let z = 0;

      if (zone < 0.4) {
        // Western Bluffs
        x = -650 - Math.random() * 140;
        z = (Math.random() - 0.5) * 500;
      } else if (zone < 0.7) {
        // Mountain base
        x = -450 - Math.random() * 200;
        z = -380 - Math.random() * 180;
      } else {
        // River valley rapids
        x = -130 + (Math.random() - 0.5) * 60;
        z = (Math.random() - 0.5) * 450;
      }

      if (isNearProtectedZone(x, z, 25)) continue;

      const sample = evaluateIslandElevation(x, z);
      const scale = 1.4 + Math.random() * 2.8;
      dummy.position.set(x, sample.elevation + 0.5, z);
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy.scale.set(scale * 1.3, scale * 0.75, scale * 1.1);
      dummy.updateMatrix();

      rockInst.setMatrixAt(placed++, dummy.matrix);
    }

    rockInst.count = placed;
    rockInst.instanceMatrix.needsUpdate = true;
    this.group.add(rockInst);
  }

  /**
   * 2,000 yellow and orange dandelions & wildflowers across meadows
   */
  private buildWildflowerMeadows() {
    const count = 2000;
    const geo = new THREE.PlaneGeometry(0.55, 0.55);
    geo.rotateX(-Math.PI / 2);

    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#facc15";
      for (let p = 0; p < 8; p++) {
        const ang = (p / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(64 + Math.cos(ang) * 26, 64 + Math.sin(ang) * 26, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.arc(64, 64, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.4,
      roughness: 0.9,
    });

    const instanced = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      instanced.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    while (placed < count && attempts++ < maxAttempts) {
      const a = Math.random() * Math.PI * 2;
      const r = 25 + Math.random() * 220;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;

      if (isNearProtectedZone(x, z, 15)) continue;

      const sample = evaluateIslandElevation(x, z);
      if (sample.elevation < 0.9 || sample.elevation > 35) continue;

      dummy.position.set(x, sample.elevation + 0.08, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      const s = 0.85 + Math.random() * 0.85;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      instanced.setMatrixAt(placed++, dummy.matrix);
    }

    instanced.count = placed;
    instanced.instanceMatrix.needsUpdate = true;
    this.group.add(instanced);
  }
}
