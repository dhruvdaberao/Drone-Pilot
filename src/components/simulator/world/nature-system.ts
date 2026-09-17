// ==========================================================
// DRONE PILOT — REALISTIC NATURAL ENVIRONMENT & WORLD SCENERY (PHASE 2)
// Multi-Layer Woodland, Ecological Mountain Zones, Riparian Corridors,
// Shoreline Debris, Authored Vignettes & GPU Instancing
// ==========================================================

import * as THREE from "three";
import { evaluateIslandElevation } from "@/lib/world/terrain-math";
import {
  SeededPRNG,
  getBiomeAt,
  isProtectedZone,
  getDistanceToRoad,
  WORLD_SEED,
} from "@/lib/world/biome-system";
import { ENV_MATERIALS, ENV_GEOMETRIES } from "./environment/environment-models";

export class NatureSystem {
  public group = new THREE.Group();

  constructor() {
    const prng = new SeededPRNG(WORLD_SEED);

    // 1. CANOPY LAYER: Distinct species with organic silhouettes
    this.buildCanopyPines(prng);
    this.buildCanopySpruces(prng);
    this.buildCanopyOaks(prng);
    this.buildCanopyBirches(prng);
    this.buildCanopyPalms(prng);
    this.buildCanopyWillows(prng);
    this.buildDeadwoodSnags(prng);

    // 2. UNDERSTORY & GROUND COVER: Layered shrubs, ferns & reeds
    this.buildUnderstoryShrubs(prng);
    this.buildAlpineJunipers(prng);
    this.buildForestFerns(prng);
    this.buildRiverReeds(prng);

    // 3. ROCKS, BOULDERS & MOUNTAIN SCREE
    this.buildGraniteBoulders(prng);
    this.buildAlpineScree(prng);
    this.buildRiverPebbleBeds(prng);
    this.buildCoastalSeaStacks(prng);

    // 4. FOREST DEBRIS & AUTHORED STORYTELLING
    this.buildFallenLogs(prng);
    this.buildTreeStumps(prng);
    this.buildBeachDriftwood(prng);

    // 5. SCENERY & TRAIL PROPS
    this.buildMooringPilings(prng);
    this.buildTrailFences(prng);
    this.buildWaterfallEnvironment();
    this.buildMeadowFlowers(prng);
  }

  // ----------------------------------------------------------------
  // 1. CANOPY TREES
  // ----------------------------------------------------------------

  /**
   * Scots Pines (Pinus Sylvestris): Towering 26m conifer canopy across Whispering Pines & Foothills
   */
  private buildCanopyPines(prng: SeededPRNG) {
    const count = 1600;
    const { trunk, foliage } = ENV_GEOMETRIES.buildScotsPine();

    const trunkMesh = new THREE.InstancedMesh(trunk, ENV_MATERIALS.barkPine, count);
    const foliageMesh = new THREE.InstancedMesh(foliage, ENV_MATERIALS.foliagePine, count);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    foliageMesh.castShadow = true;
    foliageMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      trunkMesh.setMatrixAt(i, dummy.matrix);
      foliageMesh.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      // Clustered heavily in Whispering Pines and western mountain foothills
      const ang = prng.next() * Math.PI * 2;
      const rad = prng.nextRange(25, 420);
      const x = -640 + Math.cos(ang) * rad;
      const z = 20 + Math.sin(ang) * rad;

      if (isProtectedZone(x, z, 10)) continue;
      if (getDistanceToRoad(x, z) < 6.5) continue;

      const biome = getBiomeAt(x, z);
      if (!biome.canSupportTrees) continue;
      if (
        biome.primaryBiome !== "FOREST_CORE" &&
        biome.primaryBiome !== "FOREST_EDGE" &&
        biome.primaryBiome !== "MOUNTAIN_LOWER"
      ) {
        continue;
      }

      const scale = prng.nextRange(0.85, 1.25);
      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale * prng.nextRange(0.95, 1.12), scale);
      dummy.updateMatrix();

      trunkMesh.setMatrixAt(placed, dummy.matrix);
      foliageMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    trunkMesh.count = placed;
    foliageMesh.count = placed;
    trunkMesh.instanceMatrix.needsUpdate = true;
    foliageMesh.instanceMatrix.needsUpdate = true;
    this.group.add(trunkMesh);
    this.group.add(foliageMesh);
  }

  /**
   * Norway Spruce: Slender spire conifer across forest core and mid-mountain elevations
   */
  private buildCanopySpruces(prng: SeededPRNG) {
    const count = 1300;
    const { trunk, foliage } = ENV_GEOMETRIES.buildNorwaySpruce();

    const trunkMesh = new THREE.InstancedMesh(trunk, ENV_MATERIALS.barkPine, count);
    const foliageMesh = new THREE.InstancedMesh(foliage, ENV_MATERIALS.foliageSpruce, count);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    foliageMesh.castShadow = true;
    foliageMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      trunkMesh.setMatrixAt(i, dummy.matrix);
      foliageMesh.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      // Distributed into mountain slopes and northern forest flank
      const x = prng.nextRange(-950, -320);
      const z = prng.nextRange(-680, 150);

      if (isProtectedZone(x, z, 10)) continue;
      if (getDistanceToRoad(x, z) < 7.0) continue;

      const biome = getBiomeAt(x, z);
      if (!biome.canSupportTrees) continue;
      if (
        biome.primaryBiome !== "FOREST_CORE" &&
        biome.primaryBiome !== "MOUNTAIN_LOWER" &&
        biome.primaryBiome !== "MOUNTAIN_MID"
      ) {
        continue;
      }

      // Height tapers naturally as altitude climbs towards tree line
      const altFactor = Math.max(0.65, 1.0 - (biome.elevation - 30) / 90);
      const scale = prng.nextRange(0.8, 1.25) * altFactor;

      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      trunkMesh.setMatrixAt(placed, dummy.matrix);
      foliageMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    trunkMesh.count = placed;
    foliageMesh.count = placed;
    trunkMesh.instanceMatrix.needsUpdate = true;
    foliageMesh.instanceMatrix.needsUpdate = true;
    this.group.add(trunkMesh);
    this.group.add(foliageMesh);
  }

  /**
   * Deciduous Oaks: Broadleaf spreading trees along forest edges, meadows, and pastures
   */
  private buildCanopyOaks(prng: SeededPRNG) {
    const count = 950;
    const { trunk, foliage } = ENV_GEOMETRIES.buildBroadleafOak();

    const trunkMesh = new THREE.InstancedMesh(trunk, ENV_MATERIALS.barkOak, count);
    const foliageMesh = new THREE.InstancedMesh(foliage, ENV_MATERIALS.foliageOak, count);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    foliageMesh.castShadow = true;
    foliageMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      trunkMesh.setMatrixAt(i, dummy.matrix);
      foliageMesh.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    while (placed < count && attempts++ < maxAttempts) {
      const x = prng.nextRange(-550, 480);
      const z = prng.nextRange(-250, 420);

      if (isProtectedZone(x, z, 12)) continue;
      if (getDistanceToRoad(x, z) < 8.0) continue;

      const biome = getBiomeAt(x, z);
      if (!biome.canSupportTrees) continue;
      if (
        biome.primaryBiome !== "FOREST_EDGE" &&
        biome.primaryBiome !== "LOWLAND_MEADOW" &&
        biome.primaryBiome !== "RURAL_PASTURE"
      ) {
        continue;
      }

      const scale = prng.nextRange(0.85, 1.25);
      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      trunkMesh.setMatrixAt(placed, dummy.matrix);
      foliageMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    trunkMesh.count = placed;
    foliageMesh.count = placed;
    trunkMesh.instanceMatrix.needsUpdate = true;
    foliageMesh.instanceMatrix.needsUpdate = true;
    this.group.add(trunkMesh);
    this.group.add(foliageMesh);
  }

  /**
   * Mountain Birches: Slender white trunks scattered through foothill groves and clearings
   */
  private buildCanopyBirches(prng: SeededPRNG) {
    const count = 650;
    const { trunk, foliage } = ENV_GEOMETRIES.buildMountainBirch();

    const trunkMesh = new THREE.InstancedMesh(trunk, ENV_MATERIALS.barkBirch, count);
    const foliageMesh = new THREE.InstancedMesh(foliage, ENV_MATERIALS.foliageBirch, count);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    foliageMesh.castShadow = true;
    foliageMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      trunkMesh.setMatrixAt(i, dummy.matrix);
      foliageMesh.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    while (placed < count && attempts++ < maxAttempts) {
      const x = prng.nextRange(-850, -100);
      const z = prng.nextRange(-450, 250);

      if (isProtectedZone(x, z, 10)) continue;
      if (getDistanceToRoad(x, z) < 5.0) continue;

      const biome = getBiomeAt(x, z);
      if (!biome.canSupportTrees) continue;
      if (
        biome.primaryBiome !== "FOREST_EDGE" &&
        biome.primaryBiome !== "MOUNTAIN_LOWER" &&
        biome.primaryBiome !== "RIVER_BANK"
      ) {
        continue;
      }

      const scale = prng.nextRange(0.80, 1.20);
      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      trunkMesh.setMatrixAt(placed, dummy.matrix);
      foliageMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    trunkMesh.count = placed;
    foliageMesh.count = placed;
    trunkMesh.instanceMatrix.needsUpdate = true;
    foliageMesh.instanceMatrix.needsUpdate = true;
    this.group.add(trunkMesh);
    this.group.add(foliageMesh);
  }

  /**
   * Coastal Palms: Curved palms along Pelican Cove sandy beaches and sunny coastal spurs
   */
  private buildCanopyPalms(prng: SeededPRNG) {
    const count = 240;
    const { trunk, foliage } = ENV_GEOMETRIES.buildCoastalPalm();

    const trunkMesh = new THREE.InstancedMesh(trunk, ENV_MATERIALS.barkPalm, count);
    const foliageMesh = new THREE.InstancedMesh(foliage, ENV_MATERIALS.foliagePalm, count);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    foliageMesh.castShadow = true;
    foliageMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      trunkMesh.setMatrixAt(i, dummy.matrix);
      foliageMesh.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    while (placed < count && attempts++ < maxAttempts) {
      // Clustered around Pelican Cove & Southwestern coastal headlands
      const ang = prng.next() * Math.PI * 2;
      const rad = prng.nextRange(15, 230);
      const x = -720 + Math.cos(ang) * rad;
      const z = 560 + Math.sin(ang) * rad;

      if (isProtectedZone(x, z, 10)) continue;
      if (getDistanceToRoad(x, z) < 4.5) continue;

      const biome = getBiomeAt(x, z);
      if (biome.elevation < 0.6 || biome.elevation > 7.5) continue;

      const scale = prng.nextRange(0.85, 1.25);
      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      trunkMesh.setMatrixAt(placed, dummy.matrix);
      foliageMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    trunkMesh.count = placed;
    foliageMesh.count = placed;
    trunkMesh.instanceMatrix.needsUpdate = true;
    foliageMesh.instanceMatrix.needsUpdate = true;
    this.group.add(trunkMesh);
    this.group.add(foliageMesh);
  }

  /**
   * River Willows: Cascading riparian foliage lining the riverbanks and lake shores
   */
  private buildCanopyWillows(prng: SeededPRNG) {
    const count = 300;
    const { trunk, foliage } = ENV_GEOMETRIES.buildRiverWillow();

    const trunkMesh = new THREE.InstancedMesh(trunk, ENV_MATERIALS.barkOak, count);
    const foliageMesh = new THREE.InstancedMesh(foliage, ENV_MATERIALS.foliageWillow, count);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    foliageMesh.castShadow = true;
    foliageMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      trunkMesh.setMatrixAt(i, dummy.matrix);
      foliageMesh.setMatrixAt(i, dummy.matrix);
    }

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    while (placed < count && attempts++ < maxAttempts) {
      // Along river canyon (-160, 160) or Crystal Lake shore (-320, -260)
      const isLake = prng.next() < 0.45;
      let x = 0;
      let z = 0;

      if (isLake) {
        const a = prng.next() * Math.PI * 2;
        const r = prng.nextRange(95, 130);
        x = -320 + Math.cos(a) * r;
        z = -260 + Math.sin(a) * r;
      } else {
        const t = prng.nextRange(-180, 420);
        x = -160 + (prng.next() - 0.5) * 35;
        z = t;
      }

      if (isProtectedZone(x, z, 8)) continue;
      if (getDistanceToRoad(x, z) < 6.0) continue;

      const biome = getBiomeAt(x, z);
      if (biome.elevation < 0.6 || biome.elevation > 14.0) continue;

      const scale = prng.nextRange(0.85, 1.20);
      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      trunkMesh.setMatrixAt(placed, dummy.matrix);
      foliageMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    trunkMesh.count = placed;
    foliageMesh.count = placed;
    trunkMesh.instanceMatrix.needsUpdate = true;
    foliageMesh.instanceMatrix.needsUpdate = true;
    this.group.add(trunkMesh);
    this.group.add(foliageMesh);
  }

  /**
   * Deadwood Snags: Weathered bare trunks standing on high ridges and deep forest clearings
   */
  private buildDeadwoodSnags(prng: SeededPRNG) {
    const count = 220;
    const geo = ENV_GEOMETRIES.buildDeadwoodSnag();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.barkDeadwood, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    while (placed < count && attempts++ < maxAttempts) {
      const isHighMountain = prng.next() < 0.6;
      let x = 0;
      let z = 0;

      if (isHighMountain) {
        x = prng.nextRange(-850, -450);
        z = prng.nextRange(-850, -450);
      } else {
        x = prng.nextRange(-750, -450);
        z = prng.nextRange(-150, 180);
      }

      if (isProtectedZone(x, z, 10)) continue;
      const biome = getBiomeAt(x, z);
      if (biome.elevation < 4.0 || biome.elevation > 115.0) continue;

      const scale = prng.nextRange(0.8, 1.25);
      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  // ----------------------------------------------------------------
  // 2. UNDERSTORY & GROUND COVER
  // ----------------------------------------------------------------

  /**
   * Broadleaf Dogwood Understory Shrubs: Clustered under forest canopy and meadow edges
   */
  private buildUnderstoryShrubs(prng: SeededPRNG) {
    const count = 2200;
    const geo = ENV_GEOMETRIES.buildDogwoodShrub();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.foliageShrub, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      const x = prng.nextRange(-850, 300);
      const z = prng.nextRange(-350, 380);

      if (isProtectedZone(x, z, 6)) continue;
      if (getDistanceToRoad(x, z) < 3.2) continue;

      const biome = getBiomeAt(x, z);
      if (!biome.canSupportFoliage) continue;
      if (
        biome.primaryBiome !== "FOREST_CORE" &&
        biome.primaryBiome !== "FOREST_EDGE" &&
        biome.primaryBiome !== "LOWLAND_MEADOW" &&
        biome.primaryBiome !== "RURAL_PASTURE"
      ) {
        continue;
      }

      const scale = prng.nextRange(0.75, 1.45);
      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale * prng.nextRange(0.85, 1.2), scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * Alpine Krummholz Juniper: Prostrate shrubs on high slopes and rocky crags
   */
  private buildAlpineJunipers(prng: SeededPRNG) {
    const count = 1400;
    const geo = ENV_GEOMETRIES.buildAlpineJuniper();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.foliageSpruce, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      const x = prng.nextRange(-950, -350);
      const z = prng.nextRange(-950, -350);

      if (isProtectedZone(x, z, 8)) continue;
      const biome = getBiomeAt(x, z);
      if (biome.elevation < 28.0 || biome.elevation > 125.0) continue;

      const scale = prng.nextRange(0.75, 1.55);
      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale * 1.2, scale * 0.75, scale * 1.2);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * Woodland Sword Ferns: Dense forest floor greenery clustering under tall trees and near streams
   */
  private buildForestFerns(prng: SeededPRNG) {
    const count = 2800;
    const geo = ENV_GEOMETRIES.buildForestFern();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.fernLeaf, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      // Focused in Whispering Pines and river margins
      const ang = prng.next() * Math.PI * 2;
      const rad = prng.nextRange(15, 380);
      const x = -640 + Math.cos(ang) * rad;
      const z = 20 + Math.sin(ang) * rad;

      if (isProtectedZone(x, z, 5)) continue;
      if (getDistanceToRoad(x, z) < 2.5) continue;

      const biome = getBiomeAt(x, z);
      if (biome.elevation < 0.6 || biome.elevation > 32.0) continue;

      const scale = prng.nextRange(0.8, 1.35);
      dummy.position.set(x, biome.elevation + 0.05, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * Freshwater Reeds & Bulrushes: Vertical shoreline vegetation along river canyon and lake perimeter
   */
  private buildRiverReeds(prng: SeededPRNG) {
    const count = 1600;
    const geo = ENV_GEOMETRIES.buildRiverReeds();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.reedMarsh, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      const isLake = prng.next() < 0.55;
      let x = 0;
      let z = 0;

      if (isLake) {
        // Tight around Crystal Mountain Lake waterline
        const a = prng.next() * Math.PI * 2;
        const r = prng.nextRange(92, 118);
        x = -320 + Math.cos(a) * r;
        z = -260 + Math.sin(a) * r;
      } else {
        // Along descending river corridor
        const t = prng.nextRange(-180, 520);
        x = -150 + (prng.next() - 0.5) * 26;
        z = t;
      }

      if (isProtectedZone(x, z, 4)) continue;
      const biome = getBiomeAt(x, z);
      if (biome.elevation < 0.3 || biome.elevation > 11.5) continue;

      const scale = prng.nextRange(0.85, 1.45);
      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  // ----------------------------------------------------------------
  // 3. ROCKS, BOULDERS & MOUNTAIN SCREE
  // ----------------------------------------------------------------

  /**
   * Glacial Granite Giant Boulders: Massive monolithic rocks anchoring natural vignettes
   */
  private buildGraniteBoulders(prng: SeededPRNG) {
    const count = 480;
    const geo = ENV_GEOMETRIES.buildGraniteBoulder();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.rockGranite, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    while (placed < count && attempts++ < maxAttempts) {
      const zone = prng.next();
      let x = 0;
      let z = 0;

      if (zone < 0.45) {
        // Mountain flanks
        x = prng.nextRange(-850, -450);
        z = prng.nextRange(-850, -450);
      } else if (zone < 0.75) {
        // Whispering Pines clearings & ridges
        x = prng.nextRange(-850, -420);
        z = prng.nextRange(-180, 220);
      } else {
        // Western bluffs
        x = -680 - prng.next() * 120;
        z = prng.nextRange(-100, 300);
      }

      if (isProtectedZone(x, z, 10)) continue;
      if (getDistanceToRoad(x, z) < 5.0) continue;

      const biome = getBiomeAt(x, z);
      const scale = prng.nextRange(0.75, 1.65);

      // Embedded slightly into ground for natural weight
      dummy.position.set(x, biome.elevation + 0.35, z);
      dummy.rotation.set(
        prng.next() * 0.4,
        prng.next() * Math.PI * 2,
        prng.next() * 0.4
      );
      dummy.scale.set(scale * 1.25, scale * 0.85, scale * 1.15);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * Alpine Scree & Talus Chutes: Angular rock fragments covering high mountain slopes
   */
  private buildAlpineScree(prng: SeededPRNG) {
    const count = 950;
    const geo = ENV_GEOMETRIES.buildMountainScree();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.rockScree, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      // Clustered heavily on steep Mount Apex slopes (>45m MSL)
      const x = prng.nextRange(-900, -420);
      const z = prng.nextRange(-900, -420);

      if (isProtectedZone(x, z, 10)) continue;
      const biome = getBiomeAt(x, z);
      if (biome.elevation < 35.0 || biome.elevation > 142.0) continue;

      const scale = prng.nextRange(0.65, 1.85);
      dummy.position.set(x, biome.elevation + 0.15, z);
      dummy.rotation.set(
        prng.next() * Math.PI,
        prng.next() * Math.PI,
        prng.next() * Math.PI
      );
      dummy.scale.set(scale, scale * 0.75, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * Riverbed Cobblestone Beds: Smooth rounded stones along river bends and lake shoreline
   */
  private buildRiverPebbleBeds(prng: SeededPRNG) {
    const count = 650;
    const geo = ENV_GEOMETRIES.buildRiverPebbleBed();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.rockRiver, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      const isLake = prng.next() < 0.45;
      let x = 0;
      let z = 0;

      if (isLake) {
        const a = prng.next() * Math.PI * 2;
        const r = prng.nextRange(92, 114);
        x = -320 + Math.cos(a) * r;
        z = -260 + Math.sin(a) * r;
      } else {
        const t = prng.nextRange(-190, 480);
        x = -155 + (prng.next() - 0.5) * 22;
        z = t;
      }

      if (isProtectedZone(x, z, 5)) continue;
      const biome = getBiomeAt(x, z);
      if (biome.elevation < 0.3 || biome.elevation > 12.0) continue;

      const scale = prng.nextRange(0.7, 1.5);
      dummy.position.set(x, biome.elevation + 0.05, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * Coastal Sea Stacks: Dramatic marine crags in surf waters along western cliffs and Pelican Cove
   */
  private buildCoastalSeaStacks(prng: SeededPRNG) {
    const count = 130;
    const geo = ENV_GEOMETRIES.buildSeaStackBoulder();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.rockCoastal, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 6;

    while (placed < count && attempts++ < maxAttempts) {
      // Along western bluffs and Pelican outer waters
      const ang = prng.nextRange(2.0, 3.8);
      const rad = prng.nextRange(880, 1150);
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;

      const sample = evaluateIslandElevation(x, z);
      // Positioned in shallow breaking water or rocky shoreline (-0.5m to +5.0m)
      if (sample.elevation < -1.5 || sample.elevation > 6.0) continue;

      const scale = prng.nextRange(0.85, 1.85);
      dummy.position.set(x, Math.max(0.1, sample.elevation), z);
      dummy.rotation.set(
        prng.next() * 0.2,
        prng.next() * Math.PI * 2,
        prng.next() * 0.2
      );
      dummy.scale.set(scale, scale * prng.nextRange(0.9, 1.4), scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  // ----------------------------------------------------------------
  // 4. FOREST DEBRIS & STORYTELLING
  // ----------------------------------------------------------------

  /**
   * Fallen Mossy Logs: Grounded timber logs in forest groves, riverbanks, and clearings
   */
  private buildFallenLogs(prng: SeededPRNG) {
    const count = 360;
    const geo = ENV_GEOMETRIES.buildFallenLog();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.woodLog, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      const x = prng.nextRange(-850, -250);
      const z = prng.nextRange(-250, 320);

      if (isProtectedZone(x, z, 8)) continue;
      if (getDistanceToRoad(x, z) < 4.5) continue;

      const biome = getBiomeAt(x, z);
      if (biome.elevation < 1.2 || biome.elevation > 35.0) continue;

      const scale = prng.nextRange(0.8, 1.35);
      dummy.position.set(x, biome.elevation + 0.1, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * Weathered Tree Stumps: Cut stumps and lightning shattered trunks
   */
  private buildTreeStumps(prng: SeededPRNG) {
    const count = 420;
    const geo = ENV_GEOMETRIES.buildTreeStump();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.woodLog, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      const x = prng.nextRange(-800, 150);
      const z = prng.nextRange(-220, 280);

      if (isProtectedZone(x, z, 6)) continue;
      if (getDistanceToRoad(x, z) < 3.5) continue;

      const biome = getBiomeAt(x, z);
      if (biome.elevation < 1.0 || biome.elevation > 40.0) continue;

      const scale = prng.nextRange(0.8, 1.35);
      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * Beach Driftwood: Sun-bleached twisted timber scattered across Pelican Cove sand
   */
  private buildBeachDriftwood(prng: SeededPRNG) {
    const count = 180;
    const geo = ENV_GEOMETRIES.buildDriftwood();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.woodDrift, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      const a = prng.next() * Math.PI * 2;
      const r = prng.nextRange(20, 200);
      const x = -720 + Math.cos(a) * r;
      const z = 560 + Math.sin(a) * r;

      const sample = evaluateIslandElevation(x, z);
      if (sample.elevation < 0.25 || sample.elevation > 3.5) continue;

      const scale = prng.nextRange(0.8, 1.35);
      dummy.position.set(x, sample.elevation + 0.1, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  // ----------------------------------------------------------------
  // 5. SCENERY & TRAIL PROPS
  // ----------------------------------------------------------------

  /**
   * Coastal Mooring Pilings: Clustered timber posts along Pelican Cove pier and port shore
   */
  private buildMooringPilings(prng: SeededPRNG) {
    const count = 65;
    const geo = ENV_GEOMETRIES.buildCoastalMooringPost();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.woodFence, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      const isPelican = prng.next() < 0.65;
      let x = 0;
      let z = 0;

      if (isPelican) {
        const a = prng.nextRange(1.8, 3.2);
        const r = prng.nextRange(110, 190);
        x = -720 + Math.cos(a) * r;
        z = 560 + Math.sin(a) * r;
      } else {
        x = prng.nextRange(280, 480);
        z = prng.nextRange(820, 910);
      }

      const sample = evaluateIslandElevation(x, z);
      if (sample.elevation < 0.2 || sample.elevation > 4.2) continue;

      const scale = prng.nextRange(0.9, 1.2);
      dummy.position.set(x, sample.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * Rustic Split-Rail Trail Fences: Delimiting nature paths and ranch borders
   */
  private buildTrailFences(prng: SeededPRNG) {
    const count = 90;
    const geo = ENV_GEOMETRIES.buildSplitRailFence();
    const mesh = new THREE.InstancedMesh(geo, ENV_MATERIALS.woodFence, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 5;

    while (placed < count && attempts++ < maxAttempts) {
      const x = prng.nextRange(-480, 280);
      const z = prng.nextRange(-120, 240);

      if (isProtectedZone(x, z, 8)) continue;
      const roadDist = getDistanceToRoad(x, z);
      // Positioned along roadsides (4m to 12m away)
      if (roadDist < 3.5 || roadDist > 14.0) continue;

      const biome = getBiomeAt(x, z);
      if (biome.elevation < 1.2 || biome.elevation > 25.0) continue;

      dummy.position.set(x, biome.elevation, z);
      dummy.rotation.set(0, prng.next() * Math.PI * 2, 0);
      dummy.scale.set(1.0, 1.0, 1.0);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed++, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * Cascade Falls Environment: Dark wet boulders and spray mist volume around waterfall
   */
  private buildWaterfallEnvironment() {
    const waterfallGroup = new THREE.Group();

    // 12 wet dark boulders flanking the waterfall chute
    const boulderGeo = ENV_GEOMETRIES.buildGraniteBoulder();
    const wetRockMat = new THREE.MeshStandardMaterial({
      color: 0x1f2429,
      roughness: 0.18,
      metalness: 0.45, // wet sheen
      flatShading: true,
    });

    const boulderOffsets = [
      { x: -245, y: 7.2, z: -205, s: 1.4 },
      { x: -238, y: 6.5, z: -198, s: 1.2 },
      { x: -232, y: 5.4, z: -192, s: 1.6 },
      { x: -224, y: 3.8, z: -185, s: 1.5 },
      { x: -252, y: 8.0, z: -212, s: 1.3 },
      { x: -218, y: 3.2, z: -178, s: 1.7 },
      { x: -248, y: 7.0, z: -196, s: 1.1 },
      { x: -228, y: 4.5, z: -188, s: 1.3 },
    ];

    boulderOffsets.forEach((b) => {
      const rock = new THREE.Mesh(boulderGeo, wetRockMat);
      rock.position.set(b.x, b.y, b.z);
      rock.scale.set(b.s, b.s * 0.85, b.s);
      rock.rotation.set(0.2, Math.random() * Math.PI, 0.2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      waterfallGroup.add(rock);
    });

    // Cascade Falls Spray Mist Volume
    const mistGeo = new THREE.SphereGeometry(14, 8, 8);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xdff4fc,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const mistSphere = new THREE.Mesh(mistGeo, mistMat);
    mistSphere.position.set(-232, 4.5, -190);
    mistSphere.scale.set(1.4, 0.6, 1.2);
    waterfallGroup.add(mistSphere);

    this.group.add(waterfallGroup);
  }

  /**
   * Instanced flower fields in empty meadow areas
   */
  private buildMeadowFlowers(prng: SeededPRNG) {
    const count = 600;
    const geo = new THREE.SphereGeometry(0.25, 6, 6);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const colors = [
      new THREE.Color(0xff0000), // red
      new THREE.Color(0xffff00), // yellow
      new THREE.Color(0x800080), // purple
      new THREE.Color(0xffc0cb), // pink
      new THREE.Color(0xffffff)  // white
    ];

    const dummy = new THREE.Object3D();
    const colorObj = new THREE.Color();
    let placed = 0;
    let attempts = 0;
    
    while (placed < count && attempts < count * 10) {
      attempts++;
      const x = prng.nextRange(-1000, 1000);
      const z = prng.nextRange(-1000, 1000);
      
      const biome = getBiomeAt(x, z);
      if (!biome.canSupportFoliage) continue;
      if (biome.primaryBiome !== "LOWLAND_MEADOW" && biome.primaryBiome !== "RURAL_PASTURE") continue;
      if (isProtectedZone(x, z, 5)) continue;
      
      const scale = prng.nextRange(0.5, 1.2);
      dummy.position.set(x, biome.elevation, z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      mesh.setMatrixAt(placed, dummy.matrix);
      colorObj.copy(colors[placed % colors.length]);
      mesh.setColorAt(placed, colorObj);
      placed++;
    }
    
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.group.add(mesh);
  }
}
