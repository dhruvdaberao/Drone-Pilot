// ==========================================================
// DRONE PILOT — WATER SYSTEM (PUBG-GRADE DYNAMIC WATER)
// Ocean, shallow shelf, alpine lake, river & cascading mountain waterfall
// ==========================================================

import * as THREE from "three";
import { OceanMesh } from "./ocean-mesh";
import { FreshwaterMesh } from "./freshwater-mesh";

export class WaterSystem {
  public group = new THREE.Group();
  public ocean: OceanMesh;
  public freshwater: FreshwaterMesh;

  // Mountain Waterfall
  private waterfallMesh!: THREE.Mesh;
  private waterfallMat!: THREE.MeshStandardMaterial;
  private mistParticles!: THREE.Points;
  private mistGeo!: THREE.BufferGeometry;
  private mistPositions!: Float32Array;
  private mistCount = 120;

  constructor() {
    this.ocean = new OceanMesh();
    this.group.add(this.ocean.group);

    this.freshwater = new FreshwaterMesh();
    this.group.add(this.freshwater.group);

    this.buildMountainWaterfall();
  }

  /**
   * Cascading waterfall where Mountain Lake plunges over the rock cliff into the river
   */
  private buildMountainWaterfall() {
    // 1. Cascading Water Plane: 14m wide x 6m high
    const fallGeo = new THREE.PlaneGeometry(14, 6.2, 12, 12);
    fallGeo.rotateY(Math.PI / 4);

    // Procedural churning white-water texture
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(0, 0, 256, 512);

      // Churning foam streaks
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 600; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 512;
        ctx.fillRect(x, y, 4 + Math.random() * 8, 20 + Math.random() * 40);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);

    this.waterfallMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });

    this.waterfallMesh = new THREE.Mesh(fallGeo, this.waterfallMat);
    this.waterfallMesh.position.set(-250, 4.8, -165);
    this.waterfallMesh.rotation.x = 0.35; // Angle forward down the cliff
    this.group.add(this.waterfallMesh);

    // 2. Base Mist Spray Emitter
    this.mistPositions = new Float32Array(this.mistCount * 3);
    this.mistGeo = new THREE.BufferGeometry();

    for (let i = 0; i < this.mistCount; i++) {
      this.mistPositions[i * 3] = -246 + (Math.random() - 0.5) * 16;
      this.mistPositions[i * 3 + 1] = 2.2 + Math.random() * 2.5;
      this.mistPositions[i * 3 + 2] = -162 + (Math.random() - 0.5) * 8;
    }
    this.mistGeo.setAttribute("position", new THREE.BufferAttribute(this.mistPositions, 3));

    const mistMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.8,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    this.mistParticles = new THREE.Points(this.mistGeo, mistMat);
    this.group.add(this.mistParticles);
  }

  public update(dt: number, elapsed: number) {
    this.ocean.update(dt, elapsed);

    // Scroll waterfall foam downwards
    if (this.waterfallMat.map) {
      this.waterfallMat.map.offset.y = -(elapsed * 2.4) % 1;
    }

    // Animate mist turbulence
    if (this.mistGeo) {
      const pos = this.mistGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < this.mistCount; i++) {
        let py = this.mistPositions[i * 3 + 1] + dt * 1.2;
        if (py > 5.2) {
          py = 2.2;
        }
        this.mistPositions[i * 3 + 1] = py;
        this.mistPositions[i * 3] += Math.sin(elapsed * 3 + i) * dt * 0.4;
      }
      pos.needsUpdate = true;
    }
  }
}
