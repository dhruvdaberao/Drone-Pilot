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
  private mistCount = 200;

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
    // 1. Cascading Water Plane: 20m wide x 10m high
    const fallGeo = new THREE.PlaneGeometry(20, 10.0, 12, 12);
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
    this.waterfallMesh.position.set(-270, 6.0, -210);
    this.waterfallMesh.rotation.x = 0.35; // Angle forward down the cliff
    this.group.add(this.waterfallMesh);

    // Rocky cliff face behind waterfall
    const cliffGeo = new THREE.BoxGeometry(22, 12, 2);
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, metalness: 0.1 });
    const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
    cliffMesh.position.set(-275, 6.0, -215);
    cliffMesh.rotation.y = Math.PI / 4;
    this.group.add(cliffMesh);

    // Splash pool at the base
    const poolGeo = new THREE.CircleGeometry(8, 32);
    const poolMat = new THREE.MeshStandardMaterial({ color: 0x40e0d0, transparent: true, opacity: 0.8, roughness: 0.1, metalness: 0.8 });
    const poolMesh = new THREE.Mesh(poolGeo, poolMat);
    poolMesh.rotation.x = -Math.PI / 2;
    poolMesh.position.set(-260, 2.0, -200);
    this.group.add(poolMesh);

    // Wet boulders around pool base
    const boulderGeo = new THREE.DodecahedronGeometry(1.5, 1);
    const boulderMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.3 });
    const boulderPositions = [
      { x: -253, y: 1.5, z: -202 },
      { x: -256, y: 1.5, z: -193 },
      { x: -264, y: 1.5, z: -193 },
      { x: -267, y: 1.5, z: -205 },
    ];
    boulderPositions.forEach(pos => {
      const boulder = new THREE.Mesh(boulderGeo, boulderMat);
      boulder.position.set(pos.x, pos.y, pos.z);
      boulder.rotation.set(Math.random(), Math.random(), Math.random());
      boulder.scale.set(1 + Math.random()*0.5, 1 + Math.random()*0.5, 1 + Math.random()*0.5);
      this.group.add(boulder);
    });

    // Small stream leading away
    const streamGeo = new THREE.PlaneGeometry(6, 20);
    const streamMat = new THREE.MeshStandardMaterial({ color: 0x40e0d0, transparent: true, opacity: 0.7, roughness: 0.2, metalness: 0.6 });
    const streamMesh = new THREE.Mesh(streamGeo, streamMat);
    streamMesh.rotation.x = -Math.PI / 2;
    streamMesh.rotation.z = Math.PI / 6;
    streamMesh.position.set(-250, 1.9, -185);
    this.group.add(streamMesh);

    // 2. Base Mist Spray Emitter
    this.mistPositions = new Float32Array(this.mistCount * 3);
    this.mistGeo = new THREE.BufferGeometry();

    for (let i = 0; i < this.mistCount; i++) {
      this.mistPositions[i * 3] = -270 + (Math.random() - 0.5) * 16;
      this.mistPositions[i * 3 + 1] = 2.8 + Math.random() * 2.5;
      this.mistPositions[i * 3 + 2] = -205 + (Math.random() - 0.5) * 8;
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
    this.freshwater.update(dt, elapsed);

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
