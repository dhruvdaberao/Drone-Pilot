// ==========================================================
// DRONE PILOT — REGION 6: HARBOR INDUSTRIAL PARK
// Foundation: Cargo Terminal Pad, Hangars & Storage Volumes
// ==========================================================

import * as THREE from "three";
import { HELIPADS } from "@/lib/world/helipad-definitions";
import { createHelipadMesh } from "../helipad-mesh";

export class IndustrialRegion {
  public group = new THREE.Group();

  constructor() {
    // 1. Logistics Cargo Helipad
    const pad = createHelipadMesh(HELIPADS["industrial-alpha"]);
    this.group.add(pad);

    // 2. Foundation Volumes: Hangar & Fuel Silos
    this.buildIndustrialVolumes();
  }

  private buildIndustrialVolumes() {
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const hangar = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 36), hangarMat);
    hangar.position.set(160, 4.5 + 1.2, 600);
    hangar.castShadow = true;
    this.group.add(hangar);

    // Curved barrel roof
    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(13.2, 13.2, 36, 12, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
    );
    roof.rotation.z = Math.PI / 2;
    roof.rotation.x = Math.PI / 2;
    roof.position.set(160, 9 + 1.2, 600);
    this.group.add(roof);

    // Fuel Silos
    const siloMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.8 });
    [
      { x: 80, z: 650 },
      { x: 96, z: 650 },
    ].forEach((s) => {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 14, 16), siloMat);
      cyl.position.set(s.x, 7 + 1.2, s.z);
      cyl.castShadow = true;
      this.group.add(cyl);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(4.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), siloMat);
      dome.position.set(s.x, 14 + 1.2, s.z);
      this.group.add(dome);
    });
  }

  public update(_dt: number, _elapsed: number) {
    // Ready for future industrial elements
  }
}
