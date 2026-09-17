// ==========================================================
// DRONE PILOT — REGION 6: HARBOR INDUSTRIAL PARK (PHASE 1)
// Cargo Terminal Pad, Hangars, Bulk Fuel Silos & Deepwater Piers
// ==========================================================

import * as THREE from "three";
import { HELIPADS } from "@/lib/world/helipad-definitions";
import { createHelipadMesh } from "../helipad-mesh";

export class IndustrialRegion {
  public group = new THREE.Group();

  constructor() {
    // 1. Heavy Paved Logistics Concrete Apron
    this.buildLogisticsApron();

    // 2. Logistics Cargo Helipad
    const pad = createHelipadMesh(HELIPADS["industrial-alpha"]);
    this.group.add(pad);

    // 3. Foundation Volumes: Hangars, Warehouses, Fuel Silos, and Shipping Piers
    this.buildIndustrialVolumes();
    this.buildHarborPiers();
    this.buildYardLighting();
  }

  private buildLogisticsApron() {
    const apronGeo = new THREE.PlaneGeometry(320, 280);
    apronGeo.rotateX(-Math.PI / 2);

    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Heavy reinforced industrial concrete
      roughness: 0.9,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.set(380, 1.82, 780);
    apron.receiveShadow = true;
    this.group.add(apron);
  }

  private buildIndustrialVolumes() {
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const hangar = new THREE.Mesh(new THREE.BoxGeometry(36, 12, 48), hangarMat);
    hangar.position.set(400, 6 + 1.8, 740);
    hangar.castShadow = true;
    hangar.receiveShadow = true;
    this.group.add(hangar);

    // Curved barrel roof
    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(18.2, 18.2, 48, 14, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
    );
    roof.rotation.z = Math.PI / 2;
    roof.rotation.x = Math.PI / 2;
    roof.position.set(400, 12 + 1.8, 740);
    this.group.add(roof);

    // Secondary Distribution Warehouse
    const whMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75 });
    const warehouse = new THREE.Mesh(new THREE.BoxGeometry(42, 9, 32), whMat);
    warehouse.position.set(450, 4.5 + 1.8, 800);
    warehouse.castShadow = true;
    warehouse.receiveShadow = true;
    this.group.add(warehouse);

    // Bulk Fuel Silos
    const siloMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.8,
    });
    [
      { x: 310, z: 800 },
      { x: 335, z: 800 },
      { x: 310, z: 830 },
      { x: 335, z: 830 },
    ].forEach((s) => {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 16, 16), siloMat);
      cyl.position.set(s.x, 8 + 1.8, s.z);
      cyl.castShadow = true;
      this.group.add(cyl);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(5.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        siloMat
      );
      dome.position.set(s.x, 16 + 1.8, s.z);
      this.group.add(dome);
    });

    // Intermodal shipping container stacks (multi-tiered)
    const containerColors = [0xdc2626, 0x0284c7, 0xeab308, 0x16a34a];
    const boxGeo = new THREE.BoxGeometry(6.2, 2.6, 14);

    for (let c = 0; c < 20; c++) {
      const cx = 350 + (c % 5) * 7.5;
      const cz = 690 + Math.floor((c % 15) / 5) * 16;
      const tier = Math.floor(c / 10);
      const cMat = new THREE.MeshStandardMaterial({
        color: containerColors[c % containerColors.length],
        roughness: 0.6,
      });
      const box = new THREE.Mesh(boxGeo, cMat);
      box.position.set(cx, 1.3 + tier * 2.7 + 1.8, cz);
      box.castShadow = true;
      this.group.add(box);
    }
  }

  /**
   * Deepwater shipping pier extending into the harbor channel
   */
  private buildHarborPiers() {
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const pier = new THREE.Mesh(new THREE.BoxGeometry(18, 1.4, 85), pierMat);
    pier.position.set(420, 1.2, 875);
    pier.castShadow = true;
    pier.receiveShadow = true;
    this.group.add(pier);

    // Mooring bollards
    const bollardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
    for (let b = -35; b <= 35; b += 14) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 8), bollardMat);
      bollard.position.set(420 + 8.2, 1.9 + 0.45, 875 + b);
      this.group.add(bollard);
    }

    // Pierhead navigation beacon (green flashing harbor channel marker)
    const beaconPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 4.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 })
    );
    beaconPost.position.set(420, 3.5, 915);
    this.group.add(beaconPost);

    const beaconLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    beaconLight.position.set(420, 5.8, 915);
    this.group.add(beaconLight);
  }

  /**
   * High-mast yard floodlight towers
   */
  private buildYardLighting() {
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85 });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2.5,
    });

    [
      { x: 300, z: 720 },
      { x: 460, z: 720 },
      { x: 300, z: 850 },
      { x: 460, z: 850 },
    ].forEach((pos) => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 18, 8), mastMat);
      mast.position.set(pos.x, 9 + 1.8, pos.z);
      this.group.add(mast);

      const crossbar = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.4, 0.8), mastMat);
      crossbar.position.set(pos.x, 18 + 1.8, pos.z);
      this.group.add(crossbar);

      const lamp = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 0.6), lampMat);
      lamp.position.set(pos.x, 17.8 + 1.8, pos.z);
      this.group.add(lamp);
    });
  }

  public update(_dt: number, _elapsed: number) {
    // Ready for future maritime animations
  }
}
