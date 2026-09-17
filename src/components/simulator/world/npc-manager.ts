// ==========================================================
// DRONE PILOT — NPC & HUMAN CREW SIMULATION (LIVING WORLD)
// Animated flightline ground crew, marshals with wands & pedestrians
// ==========================================================

import * as THREE from "three";
import { evaluateIslandElevation } from "@/lib/world/terrain-math";

interface NPCCharacter {
  root: THREE.Group;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  isWalking: boolean;
  walkSpeed: number;
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  t: number;
  dir: number;
  isMarshal?: boolean;
}

export class NPCManager {
  public group = new THREE.Group();
  private npcs: NPCCharacter[] = [];

  constructor() {
    this.spawnFlightlineGroundCrew();
    this.spawnCityPedestrians();
    this.spawnForestRangers();
  }

  /**
   * Helper to build a humanoid 3D figure with articulated limbs for walk cycles
   */
  private createHumanoid(options: {
    vestColor?: number;
    pantsColor?: number;
    shirtColor?: number;
    isMarshal?: boolean;
  }): {
    root: THREE.Group;
    leftLeg: THREE.Object3D;
    rightLeg: THREE.Object3D;
    leftArm: THREE.Object3D;
    rightArm: THREE.Object3D;
  } {
    const root = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd2a679, roughness: 0.75 });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: options.pantsColor || 0x1e293b,
      roughness: 0.78,
    });
    const torsoMat = new THREE.MeshStandardMaterial({
      color: options.vestColor || options.shirtColor || 0xf97316, // Default Hi-Vis Orange
      roughness: 0.68,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Tactical black leather boots
      roughness: 0.5,
    });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x27272a, // Mechanix flight gloves
      roughness: 0.6,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark polarized aviator visor / sunglasses
      roughness: 0.1,
      metalness: 0.9,
    });

    // 1. Torso: Tapered athletic chest
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.42, 8), torsoMat);
    chest.position.y = 1.34;
    chest.castShadow = true;
    root.add(chest);

    // Abdomen / Pelvis
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.19, 0.32, 8), pantsMat);
    pelvis.position.y = 1.02;
    pelvis.castShadow = true;
    root.add(pelvis);

    // Tactical utility belt & radio pouch
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.08, 8), bootMat);
    belt.position.y = 0.94;
    root.add(belt);

    // Reflective safety harness on chest
    if (options.vestColor) {
      const stripeMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xeab308,
        emissiveIntensity: 0.5,
      });
      const harness = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.32), stripeMat);
      harness.position.y = 1.35;
      root.add(harness);
    }

    // 2. Head, Cap / Helmet & Aviation Headset
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.16, 6), skinMat);
    neck.position.y = 1.58;
    root.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), skinMat);
    head.scale.set(1.0, 1.15, 1.0);
    head.position.y = 1.72;
    head.castShadow = true;
    root.add(head);

    // Polarized sunglasses / aviator visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), visorMat);
    visor.position.set(0, 1.74, 0.10);
    root.add(visor);

    // Baseball cap / flightline hardhat
    const capMat = new THREE.MeshStandardMaterial({
      color: options.vestColor ? 0xfacc15 : 0x0f172a,
      roughness: 0.5,
    });
    const capDome = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), capMat);
    capDome.position.set(0, 1.76, 0);
    root.add(capDome);

    // Cap visor bill
    const capBill = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.12), capMat);
    capBill.position.set(0, 1.76, 0.14);
    root.add(capBill);

    // 3. Articulated Legs with Flight Boots
    const createLeg = (xOffset: number) => {
      const legRoot = new THREE.Group();
      legRoot.position.set(xOffset, 0.88, 0);

      // Thigh
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.44, 6), pantsMat);
      thigh.position.y = -0.22;
      thigh.castShadow = true;
      legRoot.add(thigh);

      // Calf / shin
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 6), pantsMat);
      shin.position.y = -0.58;
      shin.castShadow = true;
      legRoot.add(shin);

      // Tactical combat boot with sole
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.22), bootMat);
      boot.position.set(0, -0.82, 0.04);
      boot.castShadow = true;
      legRoot.add(boot);

      return legRoot;
    };

    const leftLeg = createLeg(-0.12);
    root.add(leftLeg);

    const rightLeg = createLeg(0.12);
    root.add(rightLeg);

    // 4. Articulated Arms with Gloves
    const createArm = (xOffset: number) => {
      const armRoot = new THREE.Group();
      armRoot.position.set(xOffset, 1.45, 0);

      // Upper arm sleeve
      const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.35, 6), torsoMat);
      bicep.position.y = -0.18;
      bicep.castShadow = true;
      armRoot.add(bicep);

      // Forearm
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.32, 6), skinMat);
      forearm.position.y = -0.45;
      forearm.castShadow = true;
      armRoot.add(forearm);

      // Flight glove
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.09), gloveMat);
      hand.position.set(0, -0.62, 0);
      hand.castShadow = true;
      armRoot.add(hand);

      return armRoot;
    };

    const leftArm = createArm(-0.28);
    root.add(leftArm);

    const rightArm = createArm(0.28);
    root.add(rightArm);

    // If flightline marshal, add luminescent orange marshaling wands!
    if (options.isMarshal) {
      const wandMat = new THREE.MeshStandardMaterial({
        color: 0xff3b00,
        emissive: 0xff2200,
        emissiveIntensity: 2.5,
      });
      const wandGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6);

      const wandL = new THREE.Mesh(wandGeo, wandMat);
      wandL.position.set(0, -0.65, 0.15);
      wandL.rotation.x = Math.PI / 4;
      leftArm.add(wandL);

      const wandR = new THREE.Mesh(wandGeo, wandMat);
      wandR.position.set(0, -0.65, 0.15);
      wandR.rotation.x = Math.PI / 4;
      rightArm.add(wandR);
    }

    return { root, leftLeg, rightLeg, leftArm, rightArm };
  }

  /**
   * Ground crew marshaling drones and patrolling the flight apron
   */
  private spawnFlightlineGroundCrew() {
    // 1. Marshalling officer at Helipad Alpha edge
    const marshal = this.createHumanoid({ vestColor: 0xf97316, isMarshal: true });
    marshal.root.position.set(8.5, 1.22, 5.0);
    marshal.root.rotation.y = -Math.PI / 3;
    this.group.add(marshal.root);

    this.npcs.push({
      ...marshal,
      isWalking: false,
      isMarshal: true,
      walkSpeed: 0,
      p1: new THREE.Vector3(8.5, 1.22, 5.0),
      p2: new THREE.Vector3(8.5, 1.22, 5.0),
      t: 0,
      dir: 1,
    });

    // 2. Flightline technician walking along runway service line
    const tech = this.createHumanoid({ vestColor: 0x84cc16, pantsColor: 0x0f172a });
    this.group.add(tech.root);

    this.npcs.push({
      ...tech,
      isWalking: true,
      walkSpeed: 1.4,
      p1: new THREE.Vector3(3.0, 1.22, -15.0),
      p2: new THREE.Vector3(3.0, 1.22, -65.0),
      t: 0.1,
      dir: 1,
    });

    // 3. Drone Inspector near Helipad Bravo
    const inspector = this.createHumanoid({ vestColor: 0x06b6d4, pantsColor: 0x1e293b });
    this.group.add(inspector.root);

    this.npcs.push({
      ...inspector,
      isWalking: true,
      walkSpeed: 1.2,
      p1: new THREE.Vector3(30, 1.22, 18),
      p2: new THREE.Vector3(42, 1.22, 18),
      t: 0.6,
      dir: 1,
    });
  }

  /**
   * Pedestrians walking along Downtown Metropolis sidewalks and plazas
   */
  private spawnCityPedestrians() {
    const pedConfigs = [
      // 1st Avenue West Sidewalk
      {
        shirtColor: 0x3b82f6,
        pantsColor: 0x1e293b,
        p1: new THREE.Vector3(632, 2.53, 240),
        p2: new THREE.Vector3(632, 2.53, 390),
      },
      // 1st Avenue East Sidewalk
      {
        shirtColor: 0xec4899,
        pantsColor: 0x374151,
        p1: new THREE.Vector3(648, 2.53, 380),
        p2: new THREE.Vector3(648, 2.53, 250),
      },
      // 2nd Avenue Downtown Pedestrians
      {
        shirtColor: 0x10b981,
        pantsColor: 0x111827,
        p1: new THREE.Vector3(772, 2.53, 260),
        p2: new THREE.Vector3(772, 2.53, 380),
      },
      // Central Crosswalk & Commercial Plaza
      {
        shirtColor: 0xf59e0b,
        pantsColor: 0x1e293b,
        p1: new THREE.Vector3(650, 2.53, 320),
        p2: new THREE.Vector3(770, 2.53, 320),
      },
      // Apex Tower Plaza
      {
        shirtColor: 0x8b5cf6,
        pantsColor: 0x334155,
        p1: new THREE.Vector3(740, 2.53, 340),
        p2: new THREE.Vector3(780, 2.53, 380),
      },
    ];

    pedConfigs.forEach((cfg, i) => {
      const ped = this.createHumanoid({
        shirtColor: cfg.shirtColor,
        pantsColor: cfg.pantsColor,
      });
      this.group.add(ped.root);

      this.npcs.push({
        ...ped,
        isWalking: true,
        walkSpeed: 1.3 + (i % 3) * 0.2,
        p1: cfg.p1,
        p2: cfg.p2,
        t: (i / pedConfigs.length),
        dir: 1,
      });
    });
  }

  /**
   * Rangers at Whispering Pines Outpost and Crystal Mountain Lake
   */
  private spawnForestRangers() {
    // 1. Whispering Pines Station Ranger
    const ranger1 = this.createHumanoid({
      shirtColor: 0x3f6212, // Forest Green
      pantsColor: 0x451a03, // Khaki
    });
    this.group.add(ranger1.root);

    this.npcs.push({
      ...ranger1,
      isWalking: true,
      walkSpeed: 1.1,
      p1: new THREE.Vector3(-625, 5.5, -45),
      p2: new THREE.Vector3(-605, 5.5, -35),
      t: 0.2,
      dir: 1,
    });

    // 2. Crystal Mountain Lake Shoreline Ranger
    const ranger2 = this.createHumanoid({
      shirtColor: 0x1e3a8a, // Park Police Blue
      pantsColor: 0x1e293b,
    });
    this.group.add(ranger2.root);

    this.npcs.push({
      ...ranger2,
      isWalking: true,
      walkSpeed: 1.2,
      p1: new THREE.Vector3(-310, 8.6, -240),
      p2: new THREE.Vector3(-280, 8.6, -250),
      t: 0.6,
      dir: 1,
    });
  }

  /**
   * Frame-by-frame walk cycle animation and patrol waypoint tracking
   */
  public update(dt: number, elapsed: number) {
    for (const npc of this.npcs) {
      if (npc.isMarshal) {
        // Marshaller waving wands in circular takeoff guide motion
        npc.leftArm.rotation.x = -Math.PI / 2 + Math.sin(elapsed * 4) * 0.4;
        npc.rightArm.rotation.x = -Math.PI / 2 - Math.sin(elapsed * 4) * 0.4;
        npc.leftArm.rotation.z = Math.sin(elapsed * 2) * 0.3;
        npc.rightArm.rotation.z = -Math.sin(elapsed * 2) * 0.3;
        continue;
      }

      if (npc.isWalking) {
        const segDist = npc.p1.distanceTo(npc.p2);
        if (segDist > 0.01) {
          npc.t += (npc.dir * npc.walkSpeed * dt) / segDist;

          if (npc.t >= 1.0) {
            npc.t = 1.0;
            npc.dir = -1;
          } else if (npc.t <= 0.0) {
            npc.t = 0.0;
            npc.dir = 1;
          }

          npc.root.position.lerpVectors(npc.p1, npc.p2, npc.t);

          // Face direction of travel
          const target = npc.dir > 0 ? npc.p2 : npc.p1;
          const heading = Math.atan2(
            target.x - npc.root.position.x,
            target.z - npc.root.position.z
          );
          npc.root.rotation.y = heading;

          // Leg & arm swing walk cycles
          const walkCycle = Math.sin(elapsed * 7.5);
          npc.leftLeg.rotation.x = walkCycle * 0.6;
          npc.rightLeg.rotation.x = -walkCycle * 0.6;
          npc.leftArm.rotation.x = -walkCycle * 0.5;
          npc.rightArm.rotation.x = walkCycle * 0.5;
        }
      }
    }
  }
}
