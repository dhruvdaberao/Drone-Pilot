// ==========================================================
// DRONE PILOT — RURAL SETTLEMENTS & HOMESTEADS SYSTEM
// Rustic farmhouses, barns, animated windmills, wooden fences,
// haystacks & lakeside campsites populating open meadows & valleys
// ==========================================================

import * as THREE from "three";
import { evaluateIslandElevation } from "@/lib/world/terrain-math";

interface AnimatedWindmill {
  bladesGroup: THREE.Group;
  speed: number;
}

export class RuralSystem {
  public group = new THREE.Group();
  private windmills: AnimatedWindmill[] = [];

  constructor() {
    this.buildFarmHomesteads();
    this.buildLakesideCampgrounds();
    this.buildRuralWindmills();
    this.buildFencesAndHayBales();
  }

  /**
   * Helper to construct a cozy rural farmhouse cottage with pitched roof & chimney
   */
  private createFarmhouse(wallColor = 0xe2e8f0, roofColor = 0x991b1b): THREE.Group {
    const house = new THREE.Group();

    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.65 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.8 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });

    // Main House Body (10m x 7m x 4.5m)
    const body = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 7), wallMat);
    body.position.y = 2.25;
    body.castShadow = true;
    body.receiveShadow = true;
    house.add(body);

    // Pitched Gable Roof
    const roofGeo = new THREE.ConeGeometry(7.2, 3.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.scale(1.2, 1.0, 0.9);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 4.5 + 1.6;
    roof.castShadow = true;
    house.add(roof);

    // Stone Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.5, 1.2), stoneMat);
    chimney.position.set(3.8, 4.2, 1.8);
    chimney.castShadow = true;
    house.add(chimney);

    // Front Door (timber)
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 0.2), woodMat);
    door.position.set(0, 1.3, 3.55);
    house.add(door);

    // Glass Windows
    [-3.0, 3.0].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.15), glassMat);
      win.position.set(wx, 2.4, 3.55);
      house.add(win);
    });

    return house;
  }

  /**
   * Helper to construct a traditional red agricultural barn
   */
  private createBarn(): THREE.Group {
    const barn = new THREE.Group();

    const barnRedMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const whiteTrimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });

    // Barn Body (16m x 11m x 7m)
    const body = new THREE.Mesh(new THREE.BoxGeometry(16, 7.0, 11), barnRedMat);
    body.position.y = 3.5;
    body.castShadow = true;
    body.receiveShadow = true;
    barn.add(body);

    // Gambrel Barn Roof
    const roofGeo = new THREE.ConeGeometry(10.5, 4.5, 4);
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.scale(1.35, 1.0, 0.95);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 7.0 + 2.25;
    roof.castShadow = true;
    barn.add(roof);

    // Large Double Barn Doors with X trim
    const door = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.8, 0.2), whiteTrimMat);
    door.position.set(0, 2.4, 5.55);
    barn.add(door);

    return barn;
  }

  /**
   * Builds rural farmsteads across meadows and foothill grasslands
   */
  private buildFarmHomesteads() {
    const farms = [
      // Farm 1: Emerald Grassland Homestead (East of Academy runway)
      { x: 220, z: 80, rot: 0.3, hasBarn: true },
      // Farm 2: Southern River Valley Ranch
      { x: -90, z: 380, rot: 1.2, hasBarn: true },
      // Farm 3: Pelican Foothill Homestead
      { x: -580, z: 460, rot: -0.4, hasBarn: false },
      // Farm 4: Whispering Pines Border Cabin
      { x: -380, z: -380, rot: 0.8, hasBarn: false },
    ];

    farms.forEach((f) => {
      const elev = evaluateIslandElevation(f.x, f.z).elevation;
      const farmGroup = new THREE.Group();
      farmGroup.position.set(f.x, elev, f.z);
      farmGroup.rotation.y = f.rot;

      const house = this.createFarmhouse(0xf1f5f9, 0xb91c1c);
      farmGroup.add(house);

      if (f.hasBarn) {
        const barn = this.createBarn();
        barn.position.set(22, 0, -8);
        farmGroup.add(barn);

        // Grain Silo beside barn
        const siloMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
        const silo = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 11, 14), siloMat);
        silo.position.set(32, 5.5, -8);
        silo.castShadow = true;
        farmGroup.add(silo);

        const dome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), siloMat);
        dome.position.set(32, 11.0, -8);
        farmGroup.add(dome);
      }

      this.group.add(farmGroup);
    });
  }

  /**
   * Lakeside and riverbank campgrounds with tents and stone fire pits
   */
  private buildLakesideCampgrounds() {
    const camps = [
      { x: -250, z: -120, tents: 3 }, // Scenic ridge overlooking Crystal Lake
      { x: -110, z: 80, tents: 2 },   // Valley meadow east of river canyon
    ];

    const tentMat1 = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 });
    const tentMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });

    camps.forEach((c) => {
      const elev = evaluateIslandElevation(c.x, c.z).elevation;
      const campGroup = new THREE.Group();
      campGroup.position.set(c.x, elev, c.z);

      for (let i = 0; i < c.tents; i++) {
        const ang = (i / c.tents) * Math.PI * 2;
        const tx = Math.cos(ang) * 8.0;
        const tz = Math.sin(ang) * 8.0;

        // A-frame tent (width 3.2m x length 4.0m x height 2.2m)
        const tentGeo = new THREE.ConeGeometry(2.8, 2.4, 4);
        tentGeo.rotateY(Math.PI / 4);
        tentGeo.scale(1.2, 1.0, 0.85);

        const tent = new THREE.Mesh(tentGeo, i % 2 === 0 ? tentMat1 : tentMat2);
        tent.position.set(tx, 1.2, tz);
        tent.rotation.y = ang + Math.PI;
        tent.castShadow = true;
        campGroup.add(tent);
      }

      // Stone fire pit with glowing ember center
      const pitGeo = new THREE.TorusGeometry(1.2, 0.3, 6, 12);
      pitGeo.rotateX(Math.PI / 2);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
      const pit = new THREE.Mesh(pitGeo, stoneMat);
      pit.position.y = 0.2;
      campGroup.add(pit);

      const emberGeo = new THREE.CircleGeometry(0.8, 8);
      emberGeo.rotateX(-Math.PI / 2);
      const emberMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
      const ember = new THREE.Mesh(emberGeo, emberMat);
      ember.position.y = 0.25;
      campGroup.add(ember);

      this.group.add(campGroup);
    });
  }

  /**
   * Functional rural farm windmills with rotating 4-blade fans
   */
  private buildRuralWindmills() {
    const locations = [
      { x: 190, z: 120 },
      { x: -540, z: 420 },
    ];

    const towerMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    locations.forEach((loc) => {
      const elev = evaluateIslandElevation(loc.x, loc.z).elevation;
      const mill = new THREE.Group();
      mill.position.set(loc.x, elev, loc.z);

      // Lattice Tower
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.2, 14, 6), towerMat);
      tower.position.y = 7.0;
      tower.castShadow = true;
      mill.add(tower);

      // Nacelle Head
      const nacelle = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 2.4), towerMat);
      nacelle.position.set(0, 14.5, 0);
      mill.add(nacelle);

      // 4-Blade Windmill Rotor
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 14.5, 1.3);

      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5.2, 0.08), bladeMat);
        blade.position.y = 2.6;
        blade.castShadow = true;

        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = (b * Math.PI) / 2;
        bladePivot.add(blade);
        rotorGroup.add(bladePivot);
      }

      mill.add(rotorGroup);
      this.group.add(mill);

      this.windmills.push({
        bladesGroup: rotorGroup,
        speed: 1.2 + Math.random() * 0.8,
      });
    });
  }

  /**
   * Wooden paddock fences and golden cylindrical hay bales in pastures
   */
  private buildFencesAndHayBales() {
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 });

    // Pasture at Emerald Grassland (X: 200 to 250, Z: 50 to 90)
    const pX = 200;
    const pZ = 50;
    const pWidth = 45;
    const pLength = 35;
    const elev = evaluateIslandElevation(pX, pZ).elevation;

    // 4 Fence Rails enclosing paddock
    const railGeo = new THREE.BoxGeometry(pWidth, 0.15, 0.08);

    const r1 = new THREE.Mesh(railGeo, fenceMat);
    r1.position.set(pX + pWidth / 2, elev + 0.9, pZ);
    this.group.add(r1);

    const r2 = new THREE.Mesh(railGeo, fenceMat);
    r2.position.set(pX + pWidth / 2, elev + 0.9, pZ + pLength);
    this.group.add(r2);

    // Scattered round hay bales in meadow
    const balePositions = [
      { x: 215, z: 62 },
      { x: 228, z: 74 },
      { x: 236, z: 58 },
      { x: 242, z: 70 },
      { x: -75, z: 360 },
      { x: -105, z: 400 },
    ];

    balePositions.forEach((bp) => {
      const bElev = evaluateIslandElevation(bp.x, bp.z).elevation;
      const bale = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.8, 12), hayMat);
      bale.rotation.z = Math.PI / 2;
      bale.position.set(bp.x, bElev + 1.1, bp.z);
      bale.castShadow = true;
      this.group.add(bale);
    });
  }

  /**
   * Frame-by-frame animation of windmill rotation
   */
  public update(dt: number) {
    for (const w of this.windmills) {
      w.bladesGroup.rotation.z += w.speed * dt;
    }
  }
}
