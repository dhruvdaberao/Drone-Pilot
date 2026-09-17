// ==========================================================
// DRONE PILOT — REGION 7: PELICAN COVE & COASTAL BLUFFS (PHASE 1)
// Marine Rescue Pad, Boardwalk Pier, Channel Buoy & Sea Stack
// ==========================================================

import * as THREE from "three";
import { HELIPADS } from "@/lib/world/helipad-definitions";
import { createHelipadMesh } from "../helipad-mesh";

export class CoastRegion {
  public group = new THREE.Group();

  constructor() {
    // 1. Marine Rescue Helipad at (-720, 2.0, 560)
    const pad = createHelipadMesh(HELIPADS["coast-alpha"]);
    this.group.add(pad);

    // 2. Wooden Boardwalk Pier extending into the cove
    this.buildMarinaPier();

    // 3. Marine Channel Buoy with flashing navigation LED
    this.buildNavigationBuoy();

    // 4. Granite Sea Stack Rock Formation
    this.buildSeaStack();
  }

  private buildMarinaPier() {
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 48), pierMat);
    deck.position.set(-750, 0.8, 590);
    deck.rotation.y = 0.4;
    deck.castShadow = true;
    this.group.add(deck);

    // Pilings
    for (let i = -20; i <= 20; i += 10) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.8, 8), pierMat);
      piling.position.set(-750 + Math.sin(0.4) * i, 0, 590 + Math.cos(0.4) * i);
      this.group.add(piling);
    }
  }

  private buildNavigationBuoy() {
    const buoyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const buoy = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 1.6, 12), buoyMat);
    buoy.position.set(-800, 0.8, 620);
    this.group.add(buoy);

    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    light.position.set(-800, 1.8, 620);
    this.group.add(light);
  }

  /**
   * Granite Sea Stack offshore rock landmark in crashing surf
   */
  private buildSeaStack() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      metalness: 0.1,
    });
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 12, 22, 7),
      rockMat
    );
    stack.position.set(-840, 10, 650);
    stack.rotation.y = 0.5;
    stack.castShadow = true;
    this.group.add(stack);
  }

  public update(_dt: number, _elapsed: number) {
    // Ready for future maritime wave animations
  }
}
