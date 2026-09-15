// ==========================================================
// DRONE PILOT — OCEAN MESH
// 4000m x 4000m continuous ocean expanse with coastal shallow shelf
// ==========================================================

import * as THREE from "three";
import { WORLD_CONFIG } from "@/lib/world/world-config";
import { getCoastlineRadius } from "@/lib/world/coastline-math";

export class OceanMesh {
  public group = new THREE.Group();
  private posAttr!: THREE.BufferAttribute;
  private initialY: number[] = [];

  constructor() {
    this.buildDeepOceanPlane();
    this.buildCoastalShallowShelf();
  }

  /**
   * 4000m x 4000m continuous deep ocean expanse
   */
  private buildDeepOceanPlane() {
    const geo = new THREE.PlaneGeometry(
      WORLD_CONFIG.worldWidth,
      WORLD_CONFIG.worldLength,
      64,
      64
    );
    geo.rotateX(-Math.PI / 2);

    this.posAttr = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.posAttr.count; i++) {
      this.initialY.push(this.posAttr.getY(i));
    }

    const mat = new THREE.MeshStandardMaterial({
      color: 0x024a70, // Deep maritime azure
      roughness: 0.12,
      metalness: 0.82,
      transparent: true,
      opacity: 0.94,
    });

    const ocean = new THREE.Mesh(geo, mat);
    ocean.position.y = WORLD_CONFIG.seaLevel;
    ocean.receiveShadow = true;
    this.group.add(ocean);
  }

  /**
   * Submerged turquoise shallow water shelf along beach contours
   */
  private buildCoastalShallowShelf() {
    const sampleCount = 96;
    const step = (Math.PI * 2) / sampleCount;

    const shelfPositions: number[] = [];

    for (let i = 0; i < sampleCount; i++) {
      const a1 = i * step;
      const a2 = (i + 1) * step;

      const r1 = getCoastlineRadius(a1);
      const r2 = getCoastlineRadius(a2);

      // Inner edge at waterline (r), outer shelf 45m out to sea
      const xIn1 = Math.cos(a1) * r1;
      const zIn1 = Math.sin(a1) * r1;
      const xIn2 = Math.cos(a2) * r2;
      const zIn2 = Math.sin(a2) * r2;

      const xOut1 = Math.cos(a1) * (r1 + 45);
      const zOut1 = Math.sin(a1) * (r1 + 45);
      const xOut2 = Math.cos(a2) * (r2 + 45);
      const zOut2 = Math.sin(a2) * (r2 + 45);

      // Triangle 1
      shelfPositions.push(xIn1, 0.02, zIn1);
      shelfPositions.push(xOut1, -0.05, zOut1);
      shelfPositions.push(xIn2, 0.02, zIn2);

      // Triangle 2
      shelfPositions.push(xIn2, 0.02, zIn2);
      shelfPositions.push(xOut1, -0.05, zOut1);
      shelfPositions.push(xOut2, -0.05, zOut2);
    }

    const shelfGeo = new THREE.BufferGeometry();
    shelfGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(shelfPositions, 3)
    );
    shelfGeo.computeVertexNormals();

    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, // Tropical turquoise cyan
      roughness: 0.18,
      metalness: 0.5,
      transparent: true,
      opacity: 0.72,
    });

    const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    this.group.add(shelfMesh);
  }

  /**
   * Subtle wave oscillation
   */
  public update(_dt: number, elapsed: number) {
    if (!this.posAttr) return;

    for (let i = 0; i < this.posAttr.count; i++) {
      const x = this.posAttr.getX(i);
      const z = this.posAttr.getZ(i);

      this.posAttr.setY(
        i,
        this.initialY[i] +
          Math.sin(elapsed * 1.2 + x * 0.015) * 0.22 +
          Math.cos(elapsed * 0.9 + z * 0.015) * 0.16
      );
    }
    this.posAttr.needsUpdate = true;
  }
}
