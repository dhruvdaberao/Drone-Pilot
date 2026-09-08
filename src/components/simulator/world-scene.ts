// ==========================================================
// DRONE PILOT — 3D WORLD ENGINE
// Compact 400m x 400m Multi-Zone Interactive Training World:
// Area 1: Center Helipad & Open Training Field
// Area 2: North-East Alpine Forest (Instanced Trees & Foliage)
// Area 3: North-West Mountain Range (Rocky Peaks & Boulders)
// Area 4: South-East Industrial Complex & 45m Comms Tower
// Area 5: South-West Coastal Bay & Open Water
// ==========================================================

import * as THREE from "three";

export class WorldScene {
  public group = new THREE.Group();
  private animatedElements: Array<(elapsed: number) => void> = [];

  constructor(scene: THREE.Scene) {
    this.buildAtmosphere(scene);
    this.buildTerrain();
    this.buildArea1Helipad();
    this.buildArea2Forest();
    this.buildArea3Mountains();
    this.buildArea4IndustrialCity();
    this.buildArea5WaterBay();

    scene.add(this.group);
  }

  // --------------------------------------------------------
  // ATMOSPHERE, LIGHTING & FOG
  // --------------------------------------------------------
  private buildAtmosphere(scene: THREE.Scene) {
    scene.background = new THREE.Color(0xdbeafe);
    scene.fog = new THREE.FogExp2(0xd6e5f3, 0.0032);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    sunLight.position.set(80, 140, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -120;
    sunLight.shadow.camera.right = 120;
    sunLight.shadow.camera.top = 120;
    sunLight.shadow.camera.bottom = -120;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x475569, 0.6);
    scene.add(hemiLight);
  }

  // --------------------------------------------------------
  // MAIN TERRAIN (400m x 400m airfield turf)
  // --------------------------------------------------------
  private buildTerrain() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#4a6741";
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = Math.random() * 3 + 1;
        ctx.fillStyle = Math.random() > 0.5 ? "#55774a" : "#3e5737";
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const turfTexture = new THREE.CanvasTexture(canvas);
    turfTexture.wrapS = THREE.RepeatWrapping;
    turfTexture.wrapT = THREE.RepeatWrapping;
    turfTexture.repeat.set(40, 40);

    const turfMat = new THREE.MeshStandardMaterial({
      map: turfTexture,
      roughness: 0.85,
      metalness: 0.05,
    });

    const groundGeo = new THREE.PlaneGeometry(420, 420, 32, 32);
    const ground = new THREE.Mesh(groundGeo, turfMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  // --------------------------------------------------------
  // AREA 1 — CENTER HELIPAD & OPEN TRAINING FIELD
  // --------------------------------------------------------
  private buildArea1Helipad() {
    const padGroup = new THREE.Group();

    // 1. Concrete Launch Pad (Octagonal, radius 10m)
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x33383f,
      roughness: 0.70,
      metalness: 0.15,
    });
    const padGeo = new THREE.CylinderGeometry(10, 10.4, 0.20, 16);
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.y = 0.10;
    padMesh.receiveShadow = true;
    padGroup.add(padMesh);

    // 2. Yellow/Black Safety Border Ring
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const borderRing = new THREE.Mesh(
      new THREE.RingGeometry(9.0, 9.8, 32),
      borderMat
    );
    borderRing.rotation.x = -Math.PI / 2;
    borderRing.position.y = 0.21;
    padGroup.add(borderRing);

    // 3. Central Aviation "H" & Target Circle
    const whiteMarkingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(4.2, 4.6, 32),
      whiteMarkingMat
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.212;
    padGroup.add(innerRing);

    // Letter H Stems
    const hBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 4.2), whiteMarkingMat);
    hBar1.rotation.x = -Math.PI / 2;
    hBar1.position.set(-1.4, 0.214, 0);
    padGroup.add(hBar1);

    const hBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 4.2), whiteMarkingMat);
    hBar2.rotation.x = -Math.PI / 2;
    hBar2.position.set(1.4, 0.214, 0);
    padGroup.add(hBar2);

    const hCross = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), whiteMarkingMat);
    hCross.rotation.x = -Math.PI / 2;
    hCross.position.set(0, 0.214, 0);
    padGroup.add(hCross);

    // 4. Perimeter Runway Guide Lights
    const lightGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.45, 8);
    const lightMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
    const bulbGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const bulbOrange = new THREE.MeshBasicMaterial({ color: 0xff5500 });

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = Math.cos(angle) * 11.2;
      const z = Math.sin(angle) * 11.2;

      const post = new THREE.Mesh(lightGeo, lightMat);
      post.position.set(x, 0.22, z);
      padGroup.add(post);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        i % 2 === 0 ? bulbGreen : bulbOrange
      );
      bulb.position.set(x, 0.48, z);
      padGroup.add(bulb);
    }

    // 5. Aviation Windsock Station
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.5, 8), poleMat);
    pole.position.set(13, 2.25, -12);
    padGroup.add(pole);

    const sockMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.6 });
    const sock = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 12), sockMat);
    sock.rotation.z = Math.PI / 2;
    sock.position.set(13.8, 4.3, -12);
    padGroup.add(sock);

    this.animatedElements.push((elapsed) => {
      sock.rotation.y = Math.sin(elapsed * 0.8) * 0.25;
    });

    this.group.add(padGroup);
  }

  // --------------------------------------------------------
  // AREA 2 — ALPINE FOREST (North-East: Instanced Trees & Rocks)
  // --------------------------------------------------------
  private buildArea2Forest() {
    const treeCount = 90;
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 2.8, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);

    const foliageGeo = new THREE.ConeGeometry(2.4, 6.2, 7);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.8 });
    const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
      const x = 35 + Math.random() * 125;
      const z = -35 - Math.random() * 125;
      const scale = 0.75 + Math.random() * 0.7;

      // Trunk
      dummy.position.set(x, (2.8 * scale) / 2, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      // Foliage Cone
      dummy.position.set(x, (2.8 * scale) + (6.2 * scale) / 2 - 0.5, z);
      dummy.updateMatrix();
      foliageInst.setMatrixAt(i, dummy.matrix);
    }

    trunkInst.receiveShadow = true;
    trunkInst.castShadow = true;
    foliageInst.receiveShadow = true;
    foliageInst.castShadow = true;

    this.group.add(trunkInst);
    this.group.add(foliageInst);

    // Forest Rocks & Granite Boulders (Instanced)
    const rockCount = 45;
    const rockGeo = new THREE.DodecahedronGeometry(1.6, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95 });
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);

    for (let i = 0; i < rockCount; i++) {
      const x = 30 + Math.random() * 135;
      const z = -30 - Math.random() * 135;
      const scaleX = 0.8 + Math.random() * 1.4;
      const scaleY = 0.5 + Math.random() * 0.8;
      const scaleZ = 0.8 + Math.random() * 1.4;

      dummy.position.set(x, scaleY * 1.2, z);
      dummy.scale.set(scaleX, scaleY, scaleZ);
      dummy.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
      dummy.updateMatrix();
      rockInst.setMatrixAt(i, dummy.matrix);
    }
    rockInst.receiveShadow = true;
    rockInst.castShadow = true;
    this.group.add(rockInst);
  }

  // --------------------------------------------------------
  // AREA 3 — MOUNTAIN RANGE (North-West: Peaks & Ridgeline)
  // --------------------------------------------------------
  private buildArea3Mountains() {
    const mountainGroup = new THREE.Group();

    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.92,
      flatShading: true,
    });

    const snowPeakMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.80,
      flatShading: true,
    });

    const peaks = [
      { x: -95, z: -105, radius: 42, height: 38 },
      { x: -140, z: -85, radius: 36, height: 32 },
      { x: -65, z: -130, radius: 34, height: 28 },
      { x: -125, z: -145, radius: 48, height: 44 },
      { x: -50, z: -75, radius: 28, height: 22 },
    ];

    peaks.forEach((peak) => {
      const bodyGeo = new THREE.ConeGeometry(peak.radius, peak.height, 8);
      const bodyMesh = new THREE.Mesh(bodyGeo, mountainMat);
      bodyMesh.position.set(peak.x, peak.height / 2, peak.z);
      bodyMesh.rotation.y = Math.random() * Math.PI;
      bodyMesh.receiveShadow = true;
      bodyMesh.castShadow = true;
      mountainGroup.add(bodyMesh);

      const capHeight = peak.height * 0.32;
      const capGeo = new THREE.ConeGeometry(peak.radius * 0.32, capHeight, 8);
      const capMesh = new THREE.Mesh(capGeo, snowPeakMat);
      capMesh.position.set(peak.x, peak.height - capHeight / 2, peak.z);
      capMesh.rotation.y = bodyMesh.rotation.y;
      mountainGroup.add(capMesh);
    });

    const summitBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 6.0, 6),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 })
    );
    summitBeacon.position.set(-125, 47, -145);
    mountainGroup.add(summitBeacon);

    const summitStrobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    summitStrobe.position.set(-125, 50.2, -145);
    mountainGroup.add(summitStrobe);

    this.animatedElements.push((elapsed) => {
      summitStrobe.visible = Math.floor(elapsed * 2) % 2 === 0;
    });

    this.group.add(mountainGroup);
  }

  // --------------------------------------------------------
  // AREA 4 — INDUSTRIAL CITY & 45m COMMS TOWER (South-East)
  // --------------------------------------------------------
  private buildArea4IndustrialCity() {
    const cityGroup = new THREE.Group();

    const towerMastMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.4,
      metalness: 0.85,
    });
    const towerWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.85,
    });

    const towerX = 75;
    const towerZ = 75;

    for (let i = 0; i < 5; i++) {
      const segHeight = 9.0;
      const lowerR = 2.4 - i * 0.40;
      const upperR = 2.0 - i * 0.40;
      const segMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(upperR, lowerR, segHeight, 4),
        i % 2 === 0 ? towerMastMat : towerWhiteMat
      );
      segMesh.position.set(towerX, i * segHeight + segHeight / 2, towerZ);
      segMesh.rotation.y = Math.PI / 4;
      segMesh.castShadow = true;
      cityGroup.add(segMesh);
    }

    const beaconStrobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    beaconStrobe.position.set(towerX, 46.5, towerZ);
    cityGroup.add(beaconStrobe);

    this.animatedElements.push((elapsed) => {
      beaconStrobe.visible = Math.floor(elapsed * 2.5) % 2 === 0;
    });

    const hangarMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
      metalness: 0.6,
    });
    const hangarRoofMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.7,
    });

    const hangars = [
      { x: 105, z: 50, w: 24, l: 36, h: 10 },
      { x: 105, z: 95, w: 24, l: 36, h: 10 },
      { x: 50, z: 110, w: 32, l: 20, h: 12 },
    ];

    hangars.forEach((h) => {
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(h.w, h.h, h.l), hangarMat);
      bldg.position.set(h.x, h.h / 2, h.z);
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      cityGroup.add(bldg);

      const roof = new THREE.Mesh(
        new THREE.CylinderGeometry(h.w * 0.52, h.w * 0.52, h.l, 12, 1, false, 0, Math.PI),
        hangarRoofMat
      );
      roof.rotation.z = Math.PI / 2;
      roof.rotation.x = Math.PI / 2;
      roof.position.set(h.x, h.h, h.z);
      cityGroup.add(roof);
    });

    const siloMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.3,
      metalness: 0.8,
    });

    [
      { x: 42, z: 45 },
      { x: 54, z: 45 },
      { x: 42, z: 57 },
      { x: 54, z: 57 },
    ].forEach((s) => {
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 14, 16), siloMat);
      silo.position.set(s.x, 7, s.z);
      silo.castShadow = true;
      cityGroup.add(silo);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), siloMat);
      dome.position.set(s.x, 14, s.z);
      cityGroup.add(dome);
    });

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const trainingGate = new THREE.Mesh(
      new THREE.TorusGeometry(3.5, 0.22, 8, 24),
      ringMat
    );
    trainingGate.position.set(65, 12, 60);
    trainingGate.rotation.y = Math.PI / 4;
    cityGroup.add(trainingGate);

    this.group.add(cityGroup);
  }

  // --------------------------------------------------------
  // AREA 5 — COASTAL BAY & OPEN WATER (South-West)
  // --------------------------------------------------------
  private buildArea5WaterBay() {
    const waterGroup = new THREE.Group();

    // 1. Shoreline Embankment / Sandy Shore Rim
    const shoreMat = new THREE.MeshStandardMaterial({
      color: 0xd4b996, // Sandstone shore
      roughness: 0.9,
    });
    const shore = new THREE.Mesh(new THREE.BoxGeometry(136, 0.25, 136), shoreMat);
    shore.position.set(-85, 0.12, 85);
    waterGroup.add(shore);

    // 2. Water Surface
    const waterGeo = new THREE.PlaneGeometry(130, 130);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.10,
      metalness: 0.80,
      transparent: true,
      opacity: 0.92,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(-85, 0.26, 85);
    waterGroup.add(waterMesh);

    // 3. Marina Wooden Pier / Dock extending into water
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const pier = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 32), pierMat);
    pier.position.set(-30, 0.42, 75);
    pier.castShadow = true;
    waterGroup.add(pier);

    // Pier Pilings
    [-2.2, 2.2].forEach((xOff) => {
      [65, 75, 85].forEach((zPos) => {
        const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 1.8, 8), pierMat);
        piling.position.set(-30 + xOff, -0.4, zPos);
        waterGroup.add(piling);
      });
    });

    // 4. Floating Channel Buoys
    [
      { x: -65, z: 65, color: 0xef4444 },
      { x: -105, z: 95, color: 0x22c55e },
      { x: -75, z: 125, color: 0xf59e0b },
    ].forEach((b) => {
      const buoyBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.2, 1.4, 12),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.5 })
      );
      buoyBase.position.set(b.x, 0.7, b.z);
      waterGroup.add(buoyBase);

      const buoyLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshBasicMaterial({ color: b.color })
      );
      buoyLight.position.set(b.x, 1.6, b.z);
      waterGroup.add(buoyLight);
    });

    this.group.add(waterGroup);
  }

  public update(dt: number, elapsed: number) {
    this.animatedElements.forEach((fn) => fn(elapsed));
  }
}