// ==========================================================
// DRONE PILOT — FRESHWATER MESH (LAKE & RIVER CORRIDOR)
// Alpine mountain lake and descending river canyon surface
// ==========================================================

import * as THREE from "three";
import { WORLD_DEFINITION } from "@/lib/world/world-definition";

export class FreshwaterMesh {
  public group = new THREE.Group();

  private riverMat!: THREE.MeshStandardMaterial;
  private lakeMat!: THREE.MeshStandardMaterial;

  constructor() {
    this.buildMountainLake();
    this.buildRiverCorridor();
  }

  private waveNormalTex!: THREE.CanvasTexture;

  private createWaterNormal(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const imgData = ctx.createImageData(size, size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const u = (x / size) * Math.PI * 12;
          const v = (y / size) * Math.PI * 12;
          const dx = Math.sin(u) * 0.5 + Math.sin(u * 2.2 + v * 1.8) * 0.3;
          const dy = Math.cos(v) * 0.5 + Math.cos(v * 2.4 - u * 1.6) * 0.3;
          const r = Math.floor((dx * 0.45 + 0.5) * 255);
          const g = Math.floor((dy * 0.45 + 0.5) * 255);
          const idx = (y * size + x) * 4;
          imgData.data[idx] = r;
          imgData.data[idx + 1] = g;
          imgData.data[idx + 2] = 255;
          imgData.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    return tex;
  }

  /**
   * Crystal Mountain Lake surface with natural organic shoreline and pebble gravel embankment
   */
  private buildMountainLake() {
    this.waveNormalTex = this.createWaterNormal();

    const segments = 64;
    const baseRadius = WORLD_DEFINITION.waterways.lakeRadiusMeters;
    const lakeCenter = WORLD_DEFINITION.waterways.lakeCenter;

    // Organic lake perimeter vertices
    const lakeShape = new THREE.Shape();
    const bankPositions: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      // Multi-frequency organic shoreline variation (radius 95m to 120m)
      const rVar =
        Math.sin(angle * 3.0) * 8.0 +
        Math.cos(angle * 5.0) * 4.5 +
        Math.sin(angle * 7.0) * 2.5;
      const r = baseRadius + rVar;

      const px = Math.cos(angle) * r;
      const pz = Math.sin(angle) * r;

      if (i === 0) {
        lakeShape.moveTo(px, pz);
      } else {
        lakeShape.lineTo(px, pz);
      }

      // Embankment border vertices (12m gravel bank sloping outward)
      const outerR = r + 12.0;
      const ox = Math.cos(angle) * outerR;
      const oz = Math.sin(angle) * outerR;

      if (i > 0) {
        const prevAngle = ((i - 1) / segments) * Math.PI * 2;
        const prevRVar =
          Math.sin(prevAngle * 3.0) * 8.0 +
          Math.cos(prevAngle * 5.0) * 4.5 +
          Math.sin(prevAngle * 7.0) * 2.5;
        const prevR = baseRadius + prevRVar;
        const prevOuterR = prevR + 12.0;

        const ppx = Math.cos(prevAngle) * prevR;
        const ppz = Math.sin(prevAngle) * prevR;
        const pox = Math.cos(prevAngle) * prevOuterR;
        const poz = Math.sin(prevAngle) * prevOuterR;

        // Quad for gravel bank
        bankPositions.push(
          ppx, 0.0, ppz,
          pox, 1.2, poz,
          px, 0.0, pz,

          px, 0.0, pz,
          pox, 1.2, poz,
          ox, 1.2, oz
        );
      }
    }

    const lakeGeo = new THREE.ShapeGeometry(lakeShape);
    lakeGeo.rotateX(-Math.PI / 2);

    this.lakeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Bright cyan alpine lake
      roughness: 0.15,
      metalness: 0.5,
      normalMap: this.waveNormalTex,
      normalScale: new THREE.Vector2(0.8, 0.8),
      transparent: true,
      opacity: 0.85,
    });

    const lakeMesh = new THREE.Mesh(lakeGeo, this.lakeMat);
    lakeMesh.position.set(lakeCenter.x, lakeCenter.y, lakeCenter.z);
    lakeMesh.receiveShadow = true;
    this.group.add(lakeMesh);

    // Natural stone & gravel embankment collar around lake
    const bankGeo = new THREE.BufferGeometry();
    bankGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(bankPositions, 3)
    );
    bankGeo.computeVertexNormals();

    const bankMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Wet granite gravel
      roughness: 0.88,
      metalness: 0.15,
    });
    const bankMesh = new THREE.Mesh(bankGeo, bankMat);
    bankMesh.position.set(lakeCenter.x, lakeCenter.y - 0.05, lakeCenter.z);
    bankMesh.receiveShadow = true;
    this.group.add(bankMesh);
  }

  /**
   * Continuous river water ribbon and stone embankments descending through canyon to ocean delta
   */
  private buildRiverCorridor() {
    const segments = 96;
    const riverPositions: number[] = [];
    const bankPositions: number[] = [];

    const zStart = -210;
    const zEnd = 930;
    const zStep = (zEnd - zStart) / segments;

    for (let i = 0; i < segments; i++) {
      const z1 = zStart + i * zStep;
      const z2 = zStart + (i + 1) * zStep;

      const p1 = (z1 - zStart) / (zEnd - zStart);
      const p2 = (z2 - zStart) / (zEnd - zStart);

      // Organic meandering river centerline
      const x1 =
        -270 +
        p1 * 190 +
        Math.sin(p1 * Math.PI * 2.5) * 45 +
        Math.cos(p1 * Math.PI * 6.0) * 8;
      const x2 =
        -270 +
        p2 * 190 +
        Math.sin(p2 * Math.PI * 2.5) * 45 +
        Math.cos(p2 * Math.PI * 6.0) * 8;

      const y1 = Math.max(0.12, 8.5 * (1 - p1));
      const y2 = Math.max(0.12, 8.5 * (1 - p2));

      const halfWidth1 = 12 + p1 * 18; // Expands from 24m to 60m at estuary delta
      const halfWidth2 = 12 + p2 * 18;

      const bankWidth = 8.0;

      // Water surface quad vertices
      const left1 = [x1 - halfWidth1, y1, z1];
      const right1 = [x1 + halfWidth1, y1, z1];
      const left2 = [x2 - halfWidth2, y2, z2];
      const right2 = [x2 + halfWidth2, y2, z2];

      riverPositions.push(...left1, ...right1, ...left2);
      riverPositions.push(...left2, ...right1, ...right2);

      // Left Bank (sloping up from water to canyon wall)
      const bLeftOuter1 = [x1 - halfWidth1 - bankWidth, y1 + 1.2, z1];
      const bLeftOuter2 = [x2 - halfWidth2 - bankWidth, y2 + 1.2, z2];
      bankPositions.push(
        ...bLeftOuter1, ...left1, ...bLeftOuter2,
        ...bLeftOuter2, ...left1, ...left2
      );

      // Right Bank
      const bRightOuter1 = [x1 + halfWidth1 + bankWidth, y1 + 1.2, z1];
      const bRightOuter2 = [x2 + halfWidth2 + bankWidth, y2 + 1.2, z2];
      bankPositions.push(
        ...right1, ...bRightOuter1, ...right2,
        ...right2, ...bRightOuter1, ...bRightOuter2
      );
    }

    const riverGeo = new THREE.BufferGeometry();
    riverGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(riverPositions, 3)
    );
    riverGeo.computeVertexNormals();

    this.riverPosAttr = riverGeo.attributes.position as THREE.BufferAttribute;
    const count = this.riverPosAttr.count;
    this.initialRiverY = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.initialRiverY[i] = this.riverPosAttr.getY(i);
    }

    this.riverMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee, // Bright turquoise river
      roughness: 0.14,
      metalness: 0.45,
      normalMap: this.waveNormalTex,
      normalScale: new THREE.Vector2(1.0, 1.0),
      transparent: true,
      opacity: 0.85,
    });

    const riverMesh = new THREE.Mesh(riverGeo, this.riverMat);
    riverMesh.receiveShadow = true;
    this.group.add(riverMesh);

    // River embankment banks (river stone & silt)
    const bankGeo = new THREE.BufferGeometry();
    bankGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(bankPositions, 3)
    );
    bankGeo.computeVertexNormals();

    const bankMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Dark wet river stone
      roughness: 0.85,
      metalness: 0.18,
    });
    const riverBankMesh = new THREE.Mesh(bankGeo, bankMat);
    riverBankMesh.receiveShadow = true;
    this.group.add(riverBankMesh);
  }

  private riverPosAttr!: THREE.BufferAttribute;
  private initialRiverY: Float32Array = new Float32Array(0);

  public update(_dt: number, elapsed: number) {
    // 1. Dynamic river rapids wave motion
    if (this.riverPosAttr) {
      const count = this.riverPosAttr.count;
      for (let i = 0; i < count; i++) {
        const z = this.riverPosAttr.getZ(i);
        const baseY = this.initialRiverY[i];
        const ripple =
          Math.sin(elapsed * 4.5 - z * 0.08) * 0.14 +
          Math.cos(elapsed * 3.2 + z * 0.14) * 0.08;
        this.riverPosAttr.setY(i, baseY + ripple);
      }
      this.riverPosAttr.needsUpdate = true;
    }

    // 2. Flow ripples rapidly downstream and shimmer in sunlight
    if (this.waveNormalTex) {
      this.waveNormalTex.offset.x = (elapsed * 0.06) % 1;
      this.waveNormalTex.offset.y = (elapsed * 0.12) % 1;
    }
  }
}
