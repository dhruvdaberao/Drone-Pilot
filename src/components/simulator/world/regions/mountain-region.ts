// ==========================================================
// DRONE PILOT — REGION 3: MOUNT APEX HIGHLANDS
// Foundation: Mountain Weather Pad, Peak Silhouettes, Summit Mast
// ==========================================================

import * as THREE from "three";
import { HELIPADS } from "@/lib/world/helipad-definitions";
import { createHelipadMesh } from "../helipad-mesh";

export class MountainRegion {
  public group = new THREE.Group();
  private summitStrobe!: THREE.Mesh;
  private animatables: Array<(elapsed: number) => void> = [];

  constructor() {
    // 1. Mountain Peak Helipad (elevation 28.5m)
    const pad = createHelipadMesh(HELIPADS["mountain-alpha"]);
    this.group.add(pad);

    // 2. High-Altitude Meteorological Weather Station & Research Shelter
    this.buildWeatherStation();

    // 3. Communications Mast & Red Hazard Warning Strobe
    this.buildSummitMast();

    // 4. Overlook Safety Guardrails
    this.buildSafetyPerimeter();
  }

  /**
   * Scientific high-altitude weather outpost with instrumentation and solar arrays
   */
  private buildWeatherStation() {
    const stationGroup = new THREE.Group();
    const baseX = -498;
    const baseY = 28.5;
    const baseZ = -450;
    stationGroup.position.set(baseX, baseY, baseZ);

    // Reinforced weather station shelter cabin
    const shelterMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate steel
      roughness: 0.6,
      metalness: 0.4,
    });
    const shelter = new THREE.Mesh(new THREE.BoxGeometry(10, 5.0, 7), shelterMat);
    shelter.position.set(0, 2.5, 0);
    shelter.castShadow = true;
    shelter.receiveShadow = true;
    stationGroup.add(shelter);

    // Angled solar panel roof
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Deep blue solar cells
      roughness: 0.2,
      metalness: 0.8,
    });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.4, 7.5), solarMat);
    roof.position.set(0, 5.2, 0);
    roof.rotation.x = -0.15;
    roof.castShadow = true;
    stationGroup.add(roof);

    // Telemetry Satellite Dish
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.4,
      metalness: 0.6,
    });
    const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), dishMat);
    dishMast.position.set(3, 6.1, 0);
    stationGroup.add(dishMast);

    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      dishMat
    );
    dish.position.set(3, 7.2, 0);
    dish.rotation.x = -Math.PI / 3;
    dish.rotation.y = 0.4;
    stationGroup.add(dish);

    // Weather Anemometer
    const anemGroup = new THREE.Group();
    anemGroup.position.set(-3, 6.2, 1.5);
    const anemStem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), dishMat);
    anemGroup.add(anemStem);

    const spinner = new THREE.Group();
    spinner.position.set(0, 0.7, 0);
    for (let c = 0; c < 3; c++) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), dishMat);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = (c / 3) * Math.PI * 2;
      spinner.add(arm);
    }
    anemGroup.add(spinner);
    stationGroup.add(anemGroup);

    this.animatables.push((elapsed) => {
      spinner.rotation.y = elapsed * 8.0;
    });

    this.group.add(stationGroup);
  }

  /**
   * 18m lattice summit communications mast with flashing red aviation hazard strobe
   */
  private buildSummitMast() {
    const mastX = -498;
    const mastY = 28.5;
    const mastZ = -464;

    const mastMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // High-visibility hazard orange
      metalness: 0.8,
      roughness: 0.3,
    });

    // Vertical lattice mast structure
    const mastHeight = 18.0;
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.45, mastHeight, 6),
      mastMat
    );
    mast.position.set(mastX, mastY + mastHeight / 2, mastZ);
    mast.castShadow = true;
    this.group.add(mast);

    // Hazard strobe lamp
    this.summitStrobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    this.summitStrobe.position.set(mastX, mastY + mastHeight + 0.4, mastZ);
    this.group.add(this.summitStrobe);
  }

  /**
   * Safety guardrails along mountain terrace overlook
   */
  private buildSafetyPerimeter() {
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Caution yellow
      metalness: 0.6,
      roughness: 0.4,
    });

    const segments = [
      { x: -468, z: -450, rot: Math.PI / 2, len: 24 },
      { x: -480, z: -438, rot: 0, len: 24 },
      { x: -480, z: -462, rot: 0, len: 24 },
    ];

    segments.forEach((s) => {
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(s.len, 0.1, 0.1), railMat);
      topRail.position.set(s.x, 28.5 + 1.1, s.z);
      topRail.rotation.y = s.rot;
      this.group.add(topRail);

      const midRail = new THREE.Mesh(new THREE.BoxGeometry(s.len, 0.08, 0.08), railMat);
      midRail.position.set(s.x, 28.5 + 0.55, s.z);
      midRail.rotation.y = s.rot;
      this.group.add(midRail);

      // Posts
      for (let p = -s.len / 2; p <= s.len / 2; p += 4) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6), railMat);
        const px = s.x + (s.rot === 0 ? p : 0);
        const pz = s.z + (s.rot !== 0 ? p : 0);
        post.position.set(px, 28.5 + 0.55, pz);
        this.group.add(post);
      }
    });
  }

  public update(_dt: number, elapsed: number) {
    if (this.summitStrobe) {
      this.summitStrobe.visible = Math.floor(elapsed * 2.5) % 2 === 0;
    }
    for (let i = 0; i < this.animatables.length; i++) {
      this.animatables[i](elapsed);
    }
  }
}
