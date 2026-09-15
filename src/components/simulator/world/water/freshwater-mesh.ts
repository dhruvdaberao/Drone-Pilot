// ==========================================================
// DRONE PILOT — FRESHWATER MESH (LAKE & RIVER CORRIDOR)
// Alpine lake water sheet and descending river canyon surface
// ==========================================================

import * as THREE from "three";

export class FreshwaterMesh {
  public group = new THREE.Group();

  constructor() {
    this.buildMountainLake();
    this.buildRiverCorridor();
  }

  /**
   * Crystal Mountain Lake surface resting in foothill basin at Y = 7.5m
   */
  private buildMountainLake() {
    // Natural irregular circular lake plane
    const lakeGeo = new THREE.CircleGeometry(92, 32);
    lakeGeo.rotateX(-Math.PI / 2);

    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Clean alpine blue
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88,
    });

    const lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
    lakeMesh.position.set(-280, 7.5, -180);
    lakeMesh.receiveShadow = true;
    this.group.add(lakeMesh);
  }

  /**
   * Continuous river water ribbon descending through the canyon to the sea
   */
  private buildRiverCorridor() {
    const segments = 36;
    const riverPositions: number[] = [];

    const zStart = -160;
    const zEnd = 680;
    const zStep = (zEnd - zStart) / segments;

    for (let i = 0; i < segments; i++) {
      const z1 = zStart + i * zStep;
      const z2 = zStart + (i + 1) * zStep;

      // River centerline polynomial matching terrain-math.ts
      const x1 = -180 + (z1 + 160) * 0.42 - Math.pow((z1 - 200) * 0.012, 2) * 2.5;
      const x2 = -180 + (z2 + 160) * 0.42 - Math.pow((z2 - 200) * 0.012, 2) * 2.5;

      const p1 = (z1 + 160) / (zEnd + 160);
      const p2 = (z2 + 160) / (zEnd + 160);

      const y1 = Math.max(0.1, 7.2 * (1 - p1));
      const y2 = Math.max(0.1, 7.2 * (1 - p2));

      const halfWidth1 = 12 + p1 * 8; // Expands as it reaches delta
      const halfWidth2 = 12 + p2 * 8;

      // Quad vertices
      const left1 = [x1 - halfWidth1, y1, z1];
      const right1 = [x1 + halfWidth1, y1, z1];
      const left2 = [x2 - halfWidth2, y2, z2];
      const right2 = [x2 + halfWidth2, y2, z2];

      // Triangle 1
      riverPositions.push(...left1, ...right1, ...left2);
      // Triangle 2
      riverPositions.push(...left2, ...right1, ...right2);
    }

    const riverGeo = new THREE.BufferGeometry();
    riverGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(riverPositions, 3)
    );
    riverGeo.computeVertexNormals();

    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.75,
      transparent: true,
      opacity: 0.85,
    });

    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.receiveShadow = true;
    this.group.add(riverMesh);
  }
}
