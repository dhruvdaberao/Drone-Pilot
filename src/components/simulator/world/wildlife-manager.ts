// ==========================================================
// DRONE PILOT — DENSE LIVING WILDLIFE SIMULATION (PUBG-GRADE)
// 45+ grazing deer/stags in forest & valleys, 18 soaring eagles & 35 coastal gulls
// ==========================================================

import * as THREE from "three";
import { evaluateIslandElevation } from "@/lib/world/terrain-math";

interface GrazingDeer {
  root: THREE.Group;
  neck: THREE.Object3D;
  head: THREE.Object3D;
  leftFrontLeg: THREE.Object3D;
  rightFrontLeg: THREE.Object3D;
  leftBackLeg: THREE.Object3D;
  rightBackLeg: THREE.Object3D;
  centerPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  walkTimer: number;
  isWalking: boolean;
  grazePhase: number;
}

interface SoaringBird {
  root: THREE.Group;
  leftWing: THREE.Object3D;
  rightWing: THREE.Object3D;
  center: THREE.Vector3;
  radius: number;
  altitude: number;
  speed: number;
  angle: number;
  flapFrequency: number;
}

export class WildlifeManager {
  public group = new THREE.Group();
  private deer: GrazingDeer[] = [];
  private birds: SoaringBird[] = [];

  constructor() {
    this.spawnDeerHerds();
    this.spawnSoaringEagles();
    this.spawnCoastalGulls();
  }

  /**
   * Helper to build an articulated 3D deer / stag model with antlers
   */
  private createDeerModel(hasAntlers = true): {
    root: THREE.Group;
    neck: THREE.Object3D;
    head: THREE.Object3D;
    leftFrontLeg: THREE.Object3D;
    rightFrontLeg: THREE.Object3D;
    leftBackLeg: THREE.Object3D;
    rightBackLeg: THREE.Object3D;
  } {
    const root = new THREE.Group();

    const hideMat = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.85 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.8 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0x473c33, roughness: 0.7 });

    // 1. Torso: barrel body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 1.35), hideMat);
    body.position.y = 1.05;
    body.castShadow = true;
    root.add(body);

    // White underbelly / rump patch
    const rump = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.25), whiteMat);
    rump.position.set(0, 1.1, -0.65);
    root.add(rump);

    // 2. Neck & Head (hinged at front of torso: z = 0.55, y = 1.25)
    const neck = new THREE.Group();
    neck.position.set(0, 1.25, 0.55);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.65, 6), hideMat);
    neckMesh.rotation.x = -Math.PI / 4;
    neckMesh.position.set(0, 0.25, 0.2);
    neckMesh.castShadow = true;
    neck.add(neckMesh);

    // Head
    const head = new THREE.Group();
    head.position.set(0, 0.52, 0.42);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.42), hideMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Snout
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.2), whiteMat);
    muzzle.position.set(0, -0.04, 0.25);
    head.add(muzzle);

    // Antlers (for stags)
    if (hasAntlers) {
      const beamGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.55, 5);
      const tineGeo = new THREE.CylinderGeometry(0.018, 0.025, 0.25, 4);

      // Left antler main beam
      const beamL = new THREE.Mesh(beamGeo, antlerMat);
      beamL.position.set(-0.14, 0.32, -0.05);
      beamL.rotation.set(-0.3, 0, -0.4);
      head.add(beamL);

      const tineL = new THREE.Mesh(tineGeo, antlerMat);
      tineL.position.set(-0.24, 0.42, 0.05);
      tineL.rotation.set(0.4, 0, -0.8);
      head.add(tineL);

      // Right antler
      const beamR = new THREE.Mesh(beamGeo, antlerMat);
      beamR.position.set(0.14, 0.32, -0.05);
      beamR.rotation.set(-0.3, 0, 0.4);
      head.add(beamR);

      const tineR = new THREE.Mesh(tineGeo, antlerMat);
      tineR.position.set(0.24, 0.42, 0.05);
      tineR.rotation.set(0.4, 0, 0.8);
      head.add(tineR);
    }

    neck.add(head);
    root.add(neck);

    // 3. Legs (4 slender limbs)
    const legGeo = new THREE.BoxGeometry(0.12, 0.85, 0.14);

    // Left Front
    const leftFrontLeg = new THREE.Group();
    leftFrontLeg.position.set(-0.22, 0.85, 0.45);
    const lfMesh = new THREE.Mesh(legGeo, hideMat);
    lfMesh.position.y = -0.42;
    lfMesh.castShadow = true;
    leftFrontLeg.add(lfMesh);
    root.add(leftFrontLeg);

    // Right Front
    const rightFrontLeg = new THREE.Group();
    rightFrontLeg.position.set(0.22, 0.85, 0.45);
    const rfMesh = new THREE.Mesh(legGeo, hideMat);
    rfMesh.position.y = -0.42;
    rfMesh.castShadow = true;
    rightFrontLeg.add(rfMesh);
    root.add(rightFrontLeg);

    // Left Back
    const leftBackLeg = new THREE.Group();
    leftBackLeg.position.set(-0.22, 0.85, -0.45);
    const lbMesh = new THREE.Mesh(legGeo, hideMat);
    lbMesh.position.y = -0.42;
    lbMesh.castShadow = true;
    leftBackLeg.add(lbMesh);
    root.add(leftBackLeg);

    // Right Back
    const rightBackLeg = new THREE.Group();
    rightBackLeg.position.set(0.22, 0.85, -0.45);
    const rbMesh = new THREE.Mesh(legGeo, hideMat);
    rbMesh.position.y = -0.42;
    rbMesh.castShadow = true;
    rightBackLeg.add(rbMesh);
    root.add(rightBackLeg);

    return { root, neck, head, leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg };
  }

  /**
   * Spawns 45+ deer in 3 natural grazing herds across forest clearings and river valleys
   */
  private spawnDeerHerds() {
    const herdConfigs = [
      // Herd 1: Whispering Pines clearing (center ~ 420, -380) - 18 deer
      { cx: 420, cz: -380, count: 18, radius: 65 },
      // Herd 2: Valley River riparian meadow (center ~ -100, 180) - 15 deer
      { cx: -100, cz: 180, count: 15, radius: 55 },
      // Herd 3: Mount Apex foothills (center ~ -380, -320) - 14 deer
      { cx: -380, cz: -320, count: 14, radius: 50 },
    ];

    herdConfigs.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const hasAntlers = i % 3 === 0; // 1 in 3 are antlered stags
        const deer = this.createDeerModel(hasAntlers);

        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * cfg.radius;
        const x = cfg.cx + Math.cos(a) * r;
        const z = cfg.cz + Math.sin(a) * r;

        const elev = evaluateIslandElevation(x, z).elevation;
        deer.root.position.set(x, elev, z);
        deer.root.rotation.y = Math.random() * Math.PI * 2;

        const scale = 1.1 + Math.random() * 0.3; // Adult deer scale
        deer.root.scale.set(scale, scale, scale);

        this.group.add(deer.root);

        this.deer.push({
          ...deer,
          centerPos: new THREE.Vector3(x, elev, z),
          targetPos: new THREE.Vector3(x, elev, z),
          walkTimer: Math.random() * 8,
          isWalking: false,
          grazePhase: Math.random() * Math.PI * 2,
        });
      }
    });
  }

  /**
   * Helper to build soaring eagle model with large 3.2m wingspan
   */
  private createBirdModel(featherColor: number, wingSpan: number): {
    root: THREE.Group;
    leftWing: THREE.Object3D;
    rightWing: THREE.Object3D;
  } {
    const root = new THREE.Group();
    const featherMat = new THREE.MeshStandardMaterial({
      color: featherColor,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });

    // Fuselage / body
    const bodyGeo = new THREE.ConeGeometry(0.24, 1.2, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, featherMat);
    body.castShadow = true;
    root.add(body);

    // Beak
    const beakGeo = new THREE.ConeGeometry(0.08, 0.35, 4);
    beakGeo.rotateX(-Math.PI / 2);
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 0, 0.75);
    root.add(beak);

    // Tail fan
    const tailGeo = new THREE.PlaneGeometry(0.65, 0.5);
    tailGeo.rotateX(-Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, featherMat);
    tail.position.set(0, 0, -0.75);
    root.add(tail);

    // Left Wing (hinged at x = -0.2)
    const leftWing = new THREE.Group();
    leftWing.position.set(-0.2, 0.08, 0);
    const wingGeo = new THREE.PlaneGeometry(wingSpan / 2, 0.65);
    wingGeo.rotateX(-Math.PI / 2);
    wingGeo.translate(-wingSpan / 4, 0, 0);
    const leftWingMesh = new THREE.Mesh(wingGeo, featherMat);
    leftWingMesh.castShadow = true;
    leftWing.add(leftWingMesh);
    root.add(leftWing);

    // Right Wing (hinged at x = 0.2)
    const rightWing = new THREE.Group();
    rightWing.position.set(0.2, 0.08, 0);
    const rightWingMesh = new THREE.Mesh(wingGeo, featherMat);
    rightWingMesh.scale.x = -1;
    rightWingMesh.castShadow = true;
    rightWing.add(rightWingMesh);
    root.add(rightWing);

    return { root, leftWing, rightWing };
  }

  /**
   * 18 majestic eagles circling thermals over Mount Apex and Western Bluffs
   */
  private spawnSoaringEagles() {
    const eagleZones = [
      { x: -480, y: 85, z: -450, radius: 85, speed: 0.28 },
      { x: -420, y: 110, z: -410, radius: 110, speed: -0.24 },
      { x: -550, y: 95, z: -380, radius: 75, speed: 0.32 },
      { x: -640, y: 70, z: -200, radius: 90, speed: -0.3 }, // Western Bluffs
      { x: -620, y: 80, z: 50, radius: 80, speed: 0.26 },
      { x: 450, y: 65, z: -400, radius: 95, speed: 0.25 }, // Over Whispering Pines
    ];

    eagleZones.forEach((z, i) => {
      // 3 eagles per zone
      for (let k = 0; k < 3; k++) {
        const eagle = this.createBirdModel(0x2d1e12, 3.2); // 3.2m wingspan
        this.group.add(eagle.root);

        this.birds.push({
          ...eagle,
          center: new THREE.Vector3(z.x, z.y + k * 12, z.z),
          radius: z.radius + (k - 1) * 18,
          altitude: z.y + k * 12,
          speed: z.speed * (1 + k * 0.15),
          angle: (k * (Math.PI * 2)) / 3 + i,
          flapFrequency: 0.9, // Slow, majestic flaps
        });
      }
    });
  }

  /**
   * 35 coastal sea gulls gliding along Crescent Beach and the River
   */
  private spawnCoastalGulls() {
    const gullCenters = [
      { x: 550, y: 24, z: -150, radius: 60, speed: 0.45 },
      { x: 580, y: 20, z: 80, radius: 65, speed: -0.4 },
      { x: -120, y: 28, z: 120, radius: 55, speed: 0.5 },
      { x: -140, y: 22, z: 340, radius: 50, speed: -0.48 },
    ];

    gullCenters.forEach((c) => {
      for (let k = 0; k < 9; k++) {
        const gull = this.createBirdModel(0xf1f5f9, 1.4); // 1.4m wingspan
        this.group.add(gull.root);

        this.birds.push({
          ...gull,
          center: new THREE.Vector3(c.x, c.y, c.z),
          radius: c.radius + (Math.random() - 0.5) * 25,
          altitude: c.y + (Math.random() - 0.5) * 8,
          speed: c.speed * (0.85 + Math.random() * 0.3),
          angle: Math.random() * Math.PI * 2,
          flapFrequency: 2.5,
        });
      }
    });
  }

  /**
   * Frame-by-frame animation update for deer grazing and bird flight kinematics
   */
  public update(dt: number, elapsed: number) {
    // 1. Update Deer Herds
    for (const d of this.deer) {
      d.grazePhase += dt;

      // Natural grazing cycle: neck bows down to eat grass, lifts up to inspect surroundings
      const grazeCycle = Math.sin(d.grazePhase * 0.6);
      const isEating = grazeCycle > -0.2;

      if (isEating) {
        // Neck down eating grass
        d.neck.rotation.x = THREE.MathUtils.lerp(d.neck.rotation.x, 0.75, dt * 2);
        d.head.rotation.x = THREE.MathUtils.lerp(d.head.rotation.x, -0.35, dt * 2);
      } else {
        // Neck upright looking around
        d.neck.rotation.x = THREE.MathUtils.lerp(d.neck.rotation.x, -0.15, dt * 2);
        d.head.rotation.x = THREE.MathUtils.lerp(d.head.rotation.x, 0.1, dt * 2);
      }

      // Wander behavior
      d.walkTimer -= dt;
      if (d.walkTimer <= 0) {
        d.walkTimer = 6 + Math.random() * 10;
        d.isWalking = Math.random() < 0.45; // 45% chance to stroll to next patch

        if (d.isWalking) {
          const ang = Math.random() * Math.PI * 2;
          const dist = 3 + Math.random() * 8;
          const tx = d.centerPos.x + Math.cos(ang) * dist;
          const tz = d.centerPos.z + Math.sin(ang) * dist;
          const ty = evaluateIslandElevation(tx, tz).elevation;
          d.targetPos.set(tx, ty, tz);
        }
      }

      if (d.isWalking) {
        const cur = d.root.position;
        const dir = new THREE.Vector3().subVectors(d.targetPos, cur);
        const dist = dir.length();

        if (dist > 0.2) {
          dir.normalize();
          cur.addScaledVector(dir, 1.2 * dt);
          cur.y = evaluateIslandElevation(cur.x, cur.z).elevation;

          const heading = Math.atan2(dir.x, dir.z);
          d.root.rotation.y = THREE.MathUtils.lerp(d.root.rotation.y, heading, dt * 3);

          // 4-leg walk cycle
          const legPhase = Math.sin(elapsed * 6);
          d.leftFrontLeg.rotation.x = legPhase * 0.45;
          d.rightFrontLeg.rotation.x = -legPhase * 0.45;
          d.leftBackLeg.rotation.x = -legPhase * 0.45;
          d.rightBackLeg.rotation.x = legPhase * 0.45;
        } else {
          d.isWalking = false;
          d.leftFrontLeg.rotation.x = 0;
          d.rightFrontLeg.rotation.x = 0;
          d.leftBackLeg.rotation.x = 0;
          d.rightBackLeg.rotation.x = 0;
        }
      }
    }

    // 2. Update Soaring Birds & Coastal Flocks
    for (const b of this.birds) {
      b.angle += b.speed * dt;

      const x = b.center.x + Math.cos(b.angle) * b.radius;
      const z = b.center.z + Math.sin(b.angle) * b.radius;
      const y = b.altitude + Math.sin(elapsed * 0.5 + b.angle) * 3.5;

      b.root.position.set(x, y, z);

      const dirSign = b.speed >= 0 ? 1 : -1;
      const heading = b.angle + (dirSign > 0 ? Math.PI / 2 : -Math.PI / 2);
      b.root.rotation.y = -heading;
      b.root.rotation.z = dirSign * 0.25; // Bank into turn

      // Periodic flap vs long majestic glide
      const glidePhase = Math.sin(elapsed * 0.35 + b.radius);
      const isGliding = glidePhase > 0.2;

      if (isGliding) {
        b.leftWing.rotation.z = THREE.MathUtils.lerp(b.leftWing.rotation.z, 0.04, 0.1);
        b.rightWing.rotation.z = THREE.MathUtils.lerp(b.rightWing.rotation.z, -0.04, 0.1);
      } else {
        const flap = Math.sin(elapsed * b.flapFrequency * Math.PI * 2) * 0.45;
        b.leftWing.rotation.z = flap;
        b.rightWing.rotation.z = -flap;
      }
    }
  }
}
