// ==========================================================
// DRONE PILOT — REGION D: METROPOLIS CITY DISTRICT
// Commercial Towers, Rooftop Helipads, Streets & 48m Comms Tower
// ==========================================================

import * as THREE from "three";

export class CityRegion {
  public group = new THREE.Group();
  private radarDish!: THREE.Mesh;
  private commsStrobe!: THREE.Mesh;

  constructor() {
    this.buildRoadNetwork();
    this.buildSkyscrapers();
    this.buildCommunicationsTower();
  }

  // 1. ROAD NETWORK & AVENUES
  private buildRoadNetwork() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const avenue1 = new THREE.Mesh(new THREE.PlaneGeometry(16, 260), roadMat);
    avenue1.rotation.x = -Math.PI / 2;
    avenue1.position.set(130, 0.31, 130);
    this.group.add(avenue1);

    const avenue2 = new THREE.Mesh(new THREE.PlaneGeometry(260, 16), roadMat);
    avenue2.rotation.x = -Math.PI / 2;
    avenue2.position.set(130, 0.31, 130);
    this.group.add(avenue2);

    // Yellow Lane Dividers
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const line1 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 250), lineMat);
    line1.rotation.x = -Math.PI / 2;
    line1.position.set(130, 0.315, 130);
    this.group.add(line1);

    const line2 = new THREE.Mesh(new THREE.PlaneGeometry(250, 0.3), lineMat);
    line2.rotation.x = -Math.PI / 2;
    line2.position.set(130, 0.315, 130);
    this.group.add(line2);
  }

  // 2. COMMERCIAL SKYSCRAPERS & TOWERS
  private buildSkyscrapers() {
    const bldgColors = [0x334155, 0x1e293b, 0x475569, 0x0f172a];
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
    });

    const buildings = [
      { x: 100, z: 100, w: 22, l: 22, h: 48, name: "Skyline Tower A" },
      { x: 135, z: 95, w: 26, l: 24, h: 54, name: "Nexus Headquarters" },
      { x: 175, z: 105, w: 20, l: 26, h: 42, name: "Vanguard Spire" },
      { x: 95, z: 140, w: 24, l: 24, h: 36, name: "Commerce Plaza" },
      { x: 135, z: 145, w: 30, l: 28, h: 58, name: "Apex Center" },
      { x: 180, z: 145, w: 24, l: 22, h: 38, name: "Horizon Hub" },
      { x: 100, z: 185, w: 26, l: 22, h: 30, name: "East River Lofts" },
      { x: 140, z: 195, w: 28, l: 26, h: 45, name: "Tech Core" },
      { x: 180, z: 185, w: 22, l: 24, h: 34, name: "Harbor View" },
    ];

    buildings.forEach((b, idx) => {
      const bMat = new THREE.MeshStandardMaterial({
        color: bldgColors[idx % bldgColors.length],
        roughness: 0.4,
        metalness: 0.6,
      });
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.l), bMat);
      bMesh.position.set(b.x, b.h / 2 + 0.30, b.z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      this.group.add(bMesh);

      // Glass window bands on facade
      const winBands = Math.floor(b.h / 5);
      for (let w = 1; w < winBands; w++) {
        const band = new THREE.Mesh(
          new THREE.BoxGeometry(b.w + 0.2, 1.2, b.l + 0.2),
          glassMat
        );
        band.position.set(b.x, w * 5 + 0.30, b.z);
        this.group.add(band);
      }

      // Rooftop Helipad on tall towers (h >= 50m)
      if (b.h >= 50) {
        const roofH = new THREE.Mesh(
          new THREE.CylinderGeometry(6, 6, 0.4, 16),
          new THREE.MeshStandardMaterial({ color: 0x111827 })
        );
        roofH.position.set(b.x, b.h + 0.5 + 0.30, b.z);
        this.group.add(roofH);

        const hRing = new THREE.Mesh(
          new THREE.RingGeometry(4.8, 5.4, 24),
          new THREE.MeshBasicMaterial({ color: 0xff5500 })
        );
        hRing.rotation.x = -Math.PI / 2;
        hRing.position.set(b.x, b.h + 0.72 + 0.30, b.z);
        this.group.add(hRing);
      }
    });
  }

  // 3. 48M COMMUNICATIONS LATTICE TOWER
  private buildCommunicationsTower() {
    const towerX = 75;
    const towerZ = 80;
    const mastOrangeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85 });
    const mastWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.85 });

    for (let i = 0; i < 6; i++) {
      const segH = 8.0;
      const lowerR = 2.6 - i * 0.38;
      const upperR = 2.2 - i * 0.38;
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(upperR, lowerR, segH, 4),
        i % 2 === 0 ? mastOrangeMat : mastWhiteMat
      );
      seg.position.set(towerX, i * segH + segH / 2 + 0.30, towerZ);
      seg.rotation.y = Math.PI / 4;
      seg.castShadow = true;
      this.group.add(seg);
    }

    // Rotating Radar Dish on Tower
    this.radarDish = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 0.4, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7 })
    );
    this.radarDish.position.set(towerX, 47 + 0.30, towerZ);
    this.group.add(this.radarDish);

    // Tower Warning Strobe
    this.commsStrobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    this.commsStrobe.position.set(towerX, 49.5 + 0.30, towerZ);
    this.group.add(this.commsStrobe);
  }

  public update(_dt: number, elapsed: number) {
    if (this.radarDish) {
      this.radarDish.rotation.y = elapsed * 1.5;
    }
    if (this.commsStrobe) {
      this.commsStrobe.visible = Math.floor(elapsed * 2.5) % 2 === 0;
    }
  }
}
