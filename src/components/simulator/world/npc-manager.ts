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

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd2a679, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: options.pantsColor || 0x1e293b,
      roughness: 0.8,
    });
    const torsoMat = new THREE.MeshStandardMaterial({
      color: options.vestColor || options.shirtColor || 0xf97316, // Default Hi-Vis Orange
      roughness: 0.7,
    });

    // 1. Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.28), torsoMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    root.add(torso);

    // Reflective safety stripes on torso if hi-vis
    if (options.vestColor) {
      const stripeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xcccccc,
        emissiveIntensity: 0.4,
      });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.3), stripeMat);
      stripe.position.y = 1.15;
      root.add(stripe);
    }

    // 2. Head & Helmet / Cap
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    root.add(head);

    const helmetMat = new THREE.MeshStandardMaterial({
      color: options.vestColor ? 0xfacc15 : 0x334155, // Yellow hardhat for crew
      roughness: 0.4,
    });
    const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.12, 8), helmetMat);
    helmet.position.y = 1.74;
    root.add(helmet);

    // 3. Legs (articulated from hips at y = 0.82)
    const legGeo = new THREE.BoxGeometry(0.18, 0.82, 0.2);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.14, 0.82, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.position.y = -0.41;
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    root.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.14, 0.82, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.position.y = -0.41;
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);
    root.add(rightLeg);

    // 4. Arms (articulated from shoulders at y = 1.4)
    const armGeo = new THREE.BoxGeometry(0.14, 0.6, 0.14);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.32, 1.4, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, torsoMat);
    leftArmMesh.position.y = -0.3;
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    root.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.32, 1.4, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, torsoMat);
    rightArmMesh.position.y = -0.3;
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);
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
   * Pedestrians walking along city sidewalks
   */
  private spawnCityPedestrians() {
    const pedConfigs = [
      {
        shirtColor: 0x3b82f6,
        pantsColor: 0x1e293b,
        p1: new THREE.Vector3(412, 1.23, 260),
        p2: new THREE.Vector3(412, 1.23, 360),
      },
      {
        shirtColor: 0xec4899,
        pantsColor: 0x374151,
        p1: new THREE.Vector3(528, 1.23, 390),
        p2: new THREE.Vector3(528, 1.23, 290),
      },
      {
        shirtColor: 0x10b981,
        pantsColor: 0x111827,
        p1: new THREE.Vector3(380, 1.23, 272),
        p2: new THREE.Vector3(470, 1.23, 272),
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
        t: Math.random(),
        dir: 1,
      });
    });
  }

  /**
   * Ranger at Whispering Pines Outpost
   */
  private spawnForestRangers() {
    const ranger = this.createHumanoid({
      shirtColor: 0x3f6212, // Forest Green
      pantsColor: 0x451a03, // Khaki
    });
    this.group.add(ranger.root);

    this.npcs.push({
      ...ranger,
      isWalking: true,
      walkSpeed: 1.1,
      p1: new THREE.Vector3(440, 4.0, -415),
      p2: new THREE.Vector3(465, 4.0, -425),
      t: 0.3,
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
