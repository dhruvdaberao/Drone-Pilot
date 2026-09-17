// ==========================================================
// DRONE PILOT — OCEAN MESH
// 4000m x 4000m continuous ocean expanse with coastal shallow shelf
// ==========================================================

import * as THREE from "three";
import { WORLD_CONFIG } from "@/lib/world/world-config";
import { getCoastlineRadius, getDistanceToCoast } from "@/lib/world/coastline-math";

export class OceanMesh {
  public group = new THREE.Group();
  private posAttr!: THREE.BufferAttribute;
  private initialY: Float32Array = new Float32Array(0);
  private initialX: Float32Array = new Float32Array(0);
  private initialZ: Float32Array = new Float32Array(0);

  constructor() {
    this.buildDeepOceanPlane();
    this.buildCoastalShallowShelf();
  }

  private oceanMat!: THREE.MeshStandardMaterial;
  private waveNormalTex!: THREE.CanvasTexture;

  /**
   * 4000m x 4000m continuous deep ocean expanse with sparkling wave normals
   */
  private buildDeepOceanPlane() {
    // 96x96 subdivision grid for rich visible 3D wave swells
    const geo = new THREE.PlaneGeometry(
      WORLD_CONFIG.worldWidth,
      WORLD_CONFIG.worldLength,
      96,
      96
    );
    geo.rotateX(-Math.PI / 2);

    this.posAttr = geo.attributes.position as THREE.BufferAttribute;
    const count = this.posAttr.count;
    this.initialX = new Float32Array(count);
    this.initialY = new Float32Array(count);
    this.initialZ = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.initialX[i] = this.posAttr.getX(i);
      this.initialY[i] = this.posAttr.getY(i);
      this.initialZ[i] = this.posAttr.getZ(i);
    }

    // High-frequency ripple normal canvas for realistic sun glints & specular waves
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const imgData = ctx.createImageData(size, size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const u = (x / size) * Math.PI * 16;
          const v = (y / size) * Math.PI * 16;
          // Multi-harmonic wave gradients for sharp sun sparkle
          const dx =
            Math.sin(u) * 0.45 +
            Math.sin(u * 2.3 + v * 1.5) * 0.3 +
            Math.cos(u * 4.7 - v * 2.1) * 0.15;
          const dy =
            Math.cos(v) * 0.45 +
            Math.cos(v * 2.1 - u * 1.7) * 0.3 +
            Math.sin(v * 4.3 + u * 2.9) * 0.15;
          const r = Math.floor((dx * 0.42 + 0.5) * 255);
          const g = Math.floor((dy * 0.42 + 0.5) * 255);
          const idx = (y * size + x) * 4;
          imgData.data[idx] = r;
          imgData.data[idx + 1] = g;
          imgData.data[idx + 2] = 255;
          imgData.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
    this.waveNormalTex = new THREE.CanvasTexture(canvas);
    this.waveNormalTex.wrapS = THREE.RepeatWrapping;
    this.waveNormalTex.wrapT = THREE.RepeatWrapping;
    this.waveNormalTex.repeat.set(64, 64);

    this.oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0891b2, // Bright tropical turquoise — lighter & more natural
      roughness: 0.12, // Slightly rough for scattered sunlight sparkle
      metalness: 0.55, // Lower metalness for more natural water look
      normalMap: this.waveNormalTex,
      normalScale: new THREE.Vector2(1.2, 1.2), // Strong normal map for visible wave ripples
      transparent: true,
      opacity: 0.88,
      envMapIntensity: 1.5, // Bright sky reflections
    });

    const ocean = new THREE.Mesh(geo, this.oceanMat);
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
      roughness: 0.12,
      metalness: 0.6,
      transparent: true,
      opacity: 0.75,
    });

    const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    this.group.add(shelfMesh);
  }

  /**
   * Multi-harmonic 3D Gerstner-like rolling ocean swells with coastal dampening
   */
  public update(_dt: number, elapsed: number) {
    if (!this.posAttr) return;

    const count = this.posAttr.count;
    for (let i = 0; i < count; i++) {
      const x = this.initialX[i];
      const z = this.initialZ[i];

      // Calculate distance to coast to smoothly dampen waves near shoreline
      const distCoast = getDistanceToCoast(x, z);
      // Offshore distCoast < 0; inland > 0
      // Damping factor: 0 when inside island, 1 when > 60m offshore
      const dampFactor =
        distCoast >= 0 ? 0.0 : Math.min(1.0, -distCoast / 60.0);

      if (dampFactor <= 0.01) {
        this.posAttr.setY(i, this.initialY[i]);
        continue;
      }

      // 1. Primary Ocean Swell (rolling in from South-West at 225 deg, wavelength ~110m)
      const k1 = 0.057; // 2 * PI / 110
      const phase1 = elapsed * 1.5 + (x * 0.707 + z * 0.707) * k1;
      const swell1 = Math.sin(phase1) * 1.4;

      // 2. Secondary Cross-Swell (choppier wave train, wavelength ~48m)
      const k2 = 0.13; // 2 * PI / 48
      const phase2 = elapsed * 2.2 + (x * -0.5 + z * 0.866) * k2;
      const swell2 = Math.sin(phase2) * 0.7;

      // 3. High-frequency surface chop (wavelength ~22m)
      const k3 = 0.28;
      const phase3 = elapsed * 3.1 + (x * 0.9 + z * -0.4) * k3;
      const swell3 = Math.cos(phase3) * 0.35;

      const totalDisplacement = (swell1 + swell2 + swell3) * dampFactor;
      this.posAttr.setY(i, this.initialY[i] + totalDisplacement);
    }
    this.posAttr.needsUpdate = true;

    // Animate wave normal offset for moving sea ripples
    if (this.waveNormalTex) {
      this.waveNormalTex.offset.x = (elapsed * 0.045) % 1;
      this.waveNormalTex.offset.y = (elapsed * 0.035) % 1;
    }
  }
}
