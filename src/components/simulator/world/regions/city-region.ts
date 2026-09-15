// ==========================================================
// DRONE PILOT — REGION 5: DOWNTOWN METROPOLIS (PUBG-GRADE SKYLINE)
// High-rise skyscrapers, commercial office towers, concrete plazas & vertiport
// ==========================================================

import * as THREE from "three";
import { HELIPADS } from "@/lib/world/helipad-definitions";
import { createHelipadMesh } from "../helipad-mesh";
import { AssetManager } from "../asset-manager";

export class CityRegion {
  public group = new THREE.Group();
  private assetMgr = AssetManager.getInstance();
  private radarDish!: THREE.Mesh;
  private commsStrobe!: THREE.Mesh;

  constructor() {
    // 1. Urban Concrete Ground Plaza
    this.buildUrbanPlaza();

    // 2. Physical Helipads
    const padGround = createHelipadMesh(HELIPADS["city-alpha"]);
    this.group.add(padGround);

    const padRooftop = createHelipadMesh(HELIPADS["city-apex-rooftop"]);
    this.group.add(padRooftop);

    // 3. High-Rise Skyscraper Skyline & Commercial Blocks
    this.buildSkyscraperSkyline();

    // 4. 48m Communications Mast & Hazard Beacon
    this.buildCommunicationsTower();
  }

  /**
   * Paved concrete urban base for the entire downtown core
   */
  private buildUrbanPlaza() {
    const plazaGeo = new THREE.PlaneGeometry(360, 360);
    plazaGeo.rotateX(-Math.PI / 2);

    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Concrete urban plaza base
      roughness: 0.85,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(480, 2.52, 380);
    plaza.receiveShadow = true;
    this.group.add(plaza);

    // Vertiport Terminal building beside city-alpha pad (x: 485, y: 2.5, z: 380)
    const terminalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.6,
    });
    const terminal = new THREE.Mesh(new THREE.BoxGeometry(22, 9, 32), terminalMat);
    terminal.position.set(485, 2.5 + 4.5, 380);
    terminal.castShadow = true;
    terminal.receiveShadow = true;
    this.group.add(terminal);

    // Terminal glass curtain facade
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8,
    });
    const terminalGlass = new THREE.Mesh(new THREE.BoxGeometry(22.4, 6.5, 32.4), glassMat);
    terminalGlass.position.set(485, 2.5 + 4.5, 380);
    this.group.add(terminalGlass);
  }

  /**
   * Spawns high-rise commercial skyscrapers and multi-story office blocks
   */
  private async buildSkyscraperSkyline() {
    const skyscraperModels = [
      "/models/commercial/building-skyscraper-a.glb",
      "/models/commercial/building-skyscraper-b.glb",
      "/models/commercial/building-skyscraper-c.glb",
      "/models/commercial/building-skyscraper-d.glb",
      "/models/commercial/building-skyscraper-e.glb",
    ];

    const commercialModels = [
      "/models/commercial/building-a.glb",
      "/models/commercial/building-c.glb",
      "/models/commercial/building-e.glb",
      "/models/commercial/building-g.glb",
      "/models/commercial/building-i.glb",
      "/models/commercial/building-k.glb",
    ];

    const [skyTemplates, commTemplates] = await Promise.all([
      Promise.all(skyscraperModels.map((p) => this.assetMgr.loadModel(p))),
      Promise.all(commercialModels.map((p) => this.assetMgr.loadModel(p))),
    ]);

    // Core Apex Center Tower supporting the rooftop skyport at (560, 58.5, 410)
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.7,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });

    const apexTower = new THREE.Mesh(new THREE.BoxGeometry(32, 58.2, 32), towerMat);
    apexTower.position.set(560, 58.2 / 2, 410);
    apexTower.castShadow = true;
    apexTower.receiveShadow = true;
    this.group.add(apexTower);

    // Glass curtain bands around Apex tower
    for (let f = 6; f < 56; f += 6) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(32.4, 2.8, 32.4), glassMat);
      band.position.set(560, f, 410);
      this.group.add(band);
    }

    // Dense cluster of realistic GLB skyscrapers across downtown (70m-130m tall)
    const skyLocations = [
      { x: 390, z: 340, scale: 18.0, rot: 0, idx: 0 },
      { x: 390, z: 270, scale: 20.0, rot: Math.PI / 2, idx: 1 },
      { x: 330, z: 380, scale: 17.0, rot: Math.PI, idx: 2 },
      { x: 440, z: 320, scale: 22.0, rot: 0, idx: 3 },
      { x: 440, z: 410, scale: 21.0, rot: Math.PI / 2, idx: 4 },
      { x: 490, z: 420, scale: 19.0, rot: 0, idx: 0 },
      { x: 500, z: 340, scale: 24.0, rot: -Math.PI / 2, idx: 1 },
      { x: 575, z: 340, scale: 21.0, rot: Math.PI / 2, idx: 2 },
      { x: 580, z: 470, scale: 18.5, rot: -Math.PI / 2, idx: 3 },
      { x: 500, z: 480, scale: 19.5, rot: 0, idx: 4 },
      { x: 530, z: 270, scale: 20.0, rot: 0, idx: 1 },
      { x: 470, z: 260, scale: 17.5, rot: -Math.PI / 2, idx: 2 },
    ];

    skyLocations.forEach((loc) => {
      const template = skyTemplates[loc.idx % skyTemplates.length].clone();
      template.scale.set(loc.scale, loc.scale * 3.5, loc.scale);
      template.position.set(loc.x, 2.5, loc.z);
      template.rotation.y = loc.rot;
      this.group.add(template);
    });

    // Commercial storefronts & multi-story office blocks (25m-45m tall)
    const midLocations = [
      { x: 340, z: 270, scale: 10.0, rot: 0 },
      { x: 380, z: 410, scale: 11.0, rot: 0 },
      { x: 420, z: 360, scale: 9.5, rot: Math.PI / 2 },
      { x: 420, z: 440, scale: 10.5, rot: Math.PI / 2 },
      { x: 540, z: 300, scale: 10.0, rot: Math.PI },
      { x: 540, z: 360, scale: 11.0, rot: Math.PI },
      { x: 540, z: 440, scale: 10.5, rot: Math.PI },
    ];

    midLocations.forEach((loc, i) => {
      const template = commTemplates[i % commTemplates.length].clone();
      template.scale.set(loc.scale, loc.scale * 2.2, loc.scale);
      template.position.set(loc.x, 2.5, loc.z);
      template.rotation.y = loc.rot;
      this.group.add(template);
    });
  }

  /**
   * Communications lattice tower with rotating radar dish and flashing red beacon
   */
  private buildCommunicationsTower() {
    const towerX = 430;
    const towerZ = 460;
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85 });

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 2.4, 48, 4),
      mastMat
    );
    mast.position.set(towerX, 24 + 1.2, towerZ);
    mast.rotation.y = Math.PI / 4;
    mast.castShadow = true;
    this.group.add(mast);

    // Rotating Radar Dish
    this.radarDish = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 0.4, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7 })
    );
    this.radarDish.position.set(towerX, 48 + 1.2, towerZ);
    this.group.add(this.radarDish);

    // Hazard Strobe Beacon
    this.commsStrobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    this.commsStrobe.position.set(towerX, 50.5 + 1.2, towerZ);
    this.group.add(this.commsStrobe);
  }

  public update(_dt: number, elapsed: number) {
    if (this.radarDish) {
      this.radarDish.rotation.y = elapsed * 1.5;
    }
    if (this.commsStrobe) {
      const strobeOn = Math.sin(elapsed * 6) > 0.3;
      (this.commsStrobe.material as THREE.MeshBasicMaterial).color.setHex(
        strobeOn ? 0xef4444 : 0x450a0a
      );
    }
  }
}
