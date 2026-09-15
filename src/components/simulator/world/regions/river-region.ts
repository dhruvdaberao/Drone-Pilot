// ==========================================================
// DRONE PILOT — REGION 4: VALLEY RIVER & CANYON
// Foundation: River Overlook Pad, Arched Bridge, Water Channel
// ==========================================================

import * as THREE from "three";
import { HELIPADS } from "@/lib/world/helipad-definitions";
import { createHelipadMesh } from "../helipad-mesh";

export class RiverRegion {
  public group = new THREE.Group();

  constructor() {
    // 1. Valley Observation Helipad
    const pad = createHelipadMesh(HELIPADS["river-alpha"]);
    this.group.add(pad);

    // 2. Arched Stone Bridge across the valley
    this.buildStoneBridge();

    // 3. River Bed Water Channel Segment
    this.buildRiverChannel();
  }

  private buildStoneBridge() {
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    const span = new THREE.Mesh(new THREE.BoxGeometry(12, 1.4, 38), bridgeMat);
    span.position.set(-105, 2.2, 140);
    span.rotation.y = 0.5;
    span.castShadow = true;
    this.group.add(span);

    // Guardrails
    [-5.5, 5.5].forEach((offset) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.9, 38),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      rail.position.set(-105 + Math.cos(0.5) * offset, 3.35, 140 - Math.sin(0.5) * offset);
      rail.rotation.y = 0.5;
      this.group.add(rail);
    });
  }

  private buildRiverChannel() {
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.9,
    });
    const river = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 180), waterMat);
    river.position.set(-110, 0.6, 140);
    river.rotation.y = 0.35;
    this.group.add(river);
  }

  public update(_dt: number, _elapsed: number) {
    // Ready for future river stream animations
  }
}
