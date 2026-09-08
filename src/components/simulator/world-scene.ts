// ==========================================================
// DRONE PILOT — 3D WORLD ENGINE: ARCHIPELAGO ISLAND
// Expansive 900m x 900m Multi-Zone Interactive Island:
// - Surrounding Ocean Expanse (1500m x 1500m water plane)
// - Organic Island Landmass with Sandy Beaches & Shorelines
// - Mountain Lake & Winding Valley River with Arched Bridge
// - Mount Apex Mountain Range (8 Peaks up to 62m + Snow Caps)
// - Metropolis City Skyline (Skyscrapers 25-52m + Windows + Silos)
// - 48m Communications Lattice Tower with Rotating Radar & Beacon
// - Whispering Pines Alpine Forest (180+ Instanced Conifers & Rocks)
// - Central Airfield & Helipad Station with Runway Markings
// - Aerobatic Orange Drone Flight Training Rings
// ==========================================================

import * as THREE from "three";

export class WorldScene {
  public group = new THREE.Group();
  private animatedElements: Array<(elapsed: number) => void> = [];

  constructor(scene: THREE.Scene) {
    this.buildAtmosphere(scene);
    this.buildOcean();
    this.buildIslandTerrain();
    this.buildWaterBodies();
    this.buildCentralAirfield();
    this.buildAlpineForest();
    this.buildMountainMassif();
    this.buildMetropolisCity();
    this.buildFlightHoops();

    scene.add(this.group);
  }

  // --------------------------------------------------------
  // 1. ATMOSPHERE, SKY & LIGHTING
  // --------------------------------------------------------
  private buildAtmosphere(scene: THREE.Scene) {
    scene.background = new THREE.Color(0xbfe3f7);
    scene.fog = new THREE.FogExp2(0xcde6f7, 0.0018);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.90);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaea, 2.5);
    sunLight.position.set(120, 200, 90);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 650;
    sunLight.shadow.camera.left = -220;
    sunLight.shadow.camera.right = 220;
    sunLight.shadow.camera.top = 220;
    sunLight.shadow.camera.bottom = -220;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x334155, 0.65);
    scene.add(hemiLight);
  }

  // --------------------------------------------------------
  // 2. SURROUNDING OCEAN EXPANSE (1500m x 1500m)
  // --------------------------------------------------------
  private buildOcean() {
    const oceanGeo = new THREE.PlaneGeometry(1600, 1600, 32, 32);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.12,
      metalness: 0.85,
      transparent: true,
      opacity: 0.94,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.05;
    ocean.receiveShadow = true;
    this.group.add(ocean);

    // Subtle undulating wave effect
    const posAttr = oceanGeo.attributes.position;
    const initialY: number[] = [];
    for (let i = 0; i < posAttr.count; i++) {
      initialY.push(posAttr.getY(i));
    }

    this.animatedElements.push((elapsed) => {
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = initialY[i];
        posAttr.setZ(i, Math.sin(elapsed * 1.2 + x * 0.04) * 0.18 + Math.cos(elapsed * 0.9 + y * 0.04) * 0.12);
      }
      posAttr.needsUpdate = true;
    });
  }

  // --------------------------------------------------------
  // 3. ISLAND TERRAIN & COASTLINE (Sandy Beaches & Turf)
  // --------------------------------------------------------
  private buildIslandTerrain() {
    // 1. Sandy Shoreline Bed (Lower elevation, larger diameter: 720m)
    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xe0c598,
      roughness: 0.90,
      metalness: 0.02,
    });
    const sandGeo = new THREE.CylinderGeometry(360, 390, 0.45, 48);
    const sandMesh = new THREE.Mesh(sandGeo, sandMat);
    sandMesh.position.y = 0.12;
    sandMesh.receiveShadow = true;
    this.group.add(sandMesh);

    // 2. Procedural Grassland Turf (Main Island Plateau: diameter 680m)
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#476b3f";
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = Math.random() * 2.8 + 1;
        ctx.fillStyle = Math.random() > 0.5 ? "#537c49" : "#3d5c36";
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const turfTexture = new THREE.CanvasTexture(canvas);
    turfTexture.wrapS = THREE.RepeatWrapping;
    turfTexture.wrapT = THREE.RepeatWrapping;
    turfTexture.repeat.set(60, 60);

    const turfMat = new THREE.MeshStandardMaterial({
      map: turfTexture,
      roughness: 0.85,
      metalness: 0.05,
    });

    const turfGeo = new THREE.CylinderGeometry(340, 360, 0.40, 48);
    const turfMesh = new THREE.Mesh(turfGeo, turfMat);
    turfMesh.position.y = 0.32; // Exact groundLevel for drone landing
    turfMesh.receiveShadow = true;
    this.group.add(turfMesh);

    // 3. Coastal Headland Bluffs & Raised Hills (South & West Coastlines)
    const bluffMat = new THREE.MeshStandardMaterial({
      color: 0x5c7255,
      roughness: 0.92,
      flatShading: true,
    });
    const bluffs = [
      { x: -220, z: 160, r: 55, h: 6.5 },
      { x: -160, z: 240, r: 65, h: 8.0 },
      { x: 180, z: -210, r: 70, h: 9.5 },
      { x: 250, z: -140, r: 60, h: 7.2 },
      { x: -260, z: -120, r: 75, h: 11.0 },
    ];
    bluffs.forEach((b) => {
      const bGeo = new THREE.CylinderGeometry(b.r * 0.75, b.r, b.h, 16);
      const bMesh = new THREE.Mesh(bGeo, bluffMat);
      bMesh.position.set(b.x, b.h / 2 + 0.2, b.z);
      bMesh.receiveShadow = true;
      this.group.add(bMesh);
    });
  }

  // --------------------------------------------------------
  // 4. WATER BODIES: MOUNTAIN LAKE & WINDING RIVER DELTA
  // --------------------------------------------------------
  private buildWaterBodies() {
    const waterGroup = new THREE.Group();

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.08,
      metalness: 0.90,
      transparent: true,
      opacity: 0.95,
    });

    const shorelineMat = new THREE.MeshStandardMaterial({
      color: 0xd4b996,
      roughness: 0.9,
    });

    // --- A. MOUNTAIN LAKE (North-West Foothills: X: -140, Z: -50) ---
    const lakeRim = new THREE.Mesh(
      new THREE.CylinderGeometry(44, 46, 0.45, 32),
      shorelineMat
    );
    lakeRim.position.set(-140, 0.32, -50);
    waterGroup.add(lakeRim);

    const lakeWater = new THREE.Mesh(
      new THREE.CylinderGeometry(42, 42, 0.48, 32),
      waterMat
    );
    lakeWater.position.set(-140, 0.33, -50);
    waterGroup.add(lakeWater);

    // Lake Island Rock
    const lakeRock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(4.5, 1),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 })
    );
    lakeRock.position.set(-142, 1.8, -52);
    waterGroup.add(lakeRock);

    // --- B. WINDING VALLEY RIVER (Lake -> Valley -> Ocean Delta) ---
    // River segments curving from (-140, -50) down through (-45, 30) to (-90, 180)
    const riverSegments = [
      { x: -120, z: -25, w: 16, l: 45, rotY: 0.5 },
      { x: -95, z: 0, w: 18, l: 48, rotY: 0.9 },
      { x: -70, z: 28, w: 20, l: 52, rotY: 1.1 },
      { x: -55, z: 65, w: 22, l: 55, rotY: 0.4 },
      { x: -65, z: 110, w: 25, l: 60, rotY: -0.2 },
      { x: -85, z: 165, w: 32, l: 75, rotY: -0.4 },
      { x: -115, z: 225, w: 45, l: 90, rotY: -0.5 }, // Delta estuary into ocean
    ];

    riverSegments.forEach((seg) => {
      // Riverbed / shoreline
      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(seg.w + 4, 0.25, seg.l + 4),
        shorelineMat
      );
      bed.position.set(seg.x, 0.32, seg.z);
      bed.rotation.y = seg.rotY;
      waterGroup.add(bed);

      // Water surface
      const water = new THREE.Mesh(
        new THREE.BoxGeometry(seg.w, 0.28, seg.l),
        waterMat
      );
      water.position.set(seg.x, 0.33, seg.z);
      water.rotation.y = seg.rotY;
      waterGroup.add(water);
    });

    // --- C. STONE ARCHED RIVER BRIDGE (At X: -60, Z: 65) ---
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.85,
    });
    const bridgeSpan = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1.2, 30),
      bridgeMat
    );
    bridgeSpan.position.set(-55, 1.6, 65);
    bridgeSpan.rotation.y = 0.4;
    bridgeSpan.castShadow = true;
    waterGroup.add(bridgeSpan);

    // Bridge Guardrails
    [-4.5, 4.5].forEach((offset) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.8, 30),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      rail.position.set(-55 + Math.cos(0.4) * offset, 2.5, 65 - Math.sin(0.4) * offset);
      rail.rotation.y = 0.4;
      waterGroup.add(rail);
    });

    // --- D. COASTAL BAY & MARINA DOCK (South-West: X: -140, Z: 180) ---
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const pier = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 45), pierMat);
    pier.position.set(-145, 0.55, 185);
    pier.castShadow = true;
    waterGroup.add(pier);

    // Pier Pilings
    [-2.6, 2.6].forEach((xOff) => {
      [170, 185, 200].forEach((zPos) => {
        const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 2.2, 8), pierMat);
        piling.position.set(-145 + xOff, -0.2, zPos);
        waterGroup.add(piling);
      });
    });

    // Marine Channel Buoys
    [
      { x: -130, z: 235, color: 0xef4444 },
      { x: -165, z: 250, color: 0x22c55e },
      { x: -110, z: 275, color: 0xf59e0b },
    ].forEach((b) => {
      const buoyBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.3, 1.5, 12),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.5 })
      );
      buoyBase.position.set(b.x, 0.7, b.z);
      waterGroup.add(buoyBase);

      const buoyLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: b.color })
      );
      buoyLight.position.set(b.x, 1.7, b.z);
      waterGroup.add(buoyLight);
    });

    this.group.add(waterGroup);
  }

  // --------------------------------------------------------
  // 5. CENTRAL AIRFIELD & HELIPAD (Origin: 0, 0)
  // --------------------------------------------------------
  private buildCentralAirfield() {
    const padGroup = new THREE.Group();

    // 1. Concrete Launch Pad (Octagonal, radius 11m)
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x2e3440,
      roughness: 0.65,
      metalness: 0.18,
    });
    const padGeo = new THREE.CylinderGeometry(11, 11.5, 0.22, 16);
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.y = 0.32;
    padMesh.receiveShadow = true;
    padGroup.add(padMesh);

    // 2. High-Visibility Yellow/Black Perimeter Border
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const borderRing = new THREE.Mesh(
      new THREE.RingGeometry(10.0, 10.8, 32),
      borderMat
    );
    borderRing.rotation.x = -Math.PI / 2;
    borderRing.position.y = 0.44;
    padGroup.add(borderRing);

    // 3. Central Aviation "H" & Inner Ring
    const whiteMarkingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(4.6, 5.1, 32),
      whiteMarkingMat
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.442;
    padGroup.add(innerRing);

    // Letter H Stems
    const hBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4.6), whiteMarkingMat);
    hBar1.rotation.x = -Math.PI / 2;
    hBar1.position.set(-1.6, 0.444, 0);
    padGroup.add(hBar1);

    const hBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4.6), whiteMarkingMat);
    hBar2.rotation.x = -Math.PI / 2;
    hBar2.position.set(1.6, 0.444, 0);
    padGroup.add(hBar2);

    const hCross = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), whiteMarkingMat);
    hCross.rotation.x = -Math.PI / 2;
    hCross.position.set(0, 0.444, 0);
    padGroup.add(hCross);

    // 4. Perimeter Runway Guide Lights
    const lightGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 8);
    const lightMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
    const bulbGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const bulbOrange = new THREE.MeshBasicMaterial({ color: 0xff5500 });

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = Math.cos(angle) * 12.4;
      const z = Math.sin(angle) * 12.4;

      const post = new THREE.Mesh(lightGeo, lightMat);
      post.position.set(x, 0.45, z);
      padGroup.add(post);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        i % 2 === 0 ? bulbGreen : bulbOrange
      );
      bulb.position.set(x, 0.75, z);
      padGroup.add(bulb);
    }

    // 5. Windsock Station
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.8, 8), poleMat);
    pole.position.set(15, 2.6, -14);
    padGroup.add(pole);

    const sockMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.6 });
    const sock = new THREE.Mesh(new THREE.ConeGeometry(0.38, 2.0, 12), sockMat);
    sock.rotation.z = Math.PI / 2;
    sock.position.set(15.9, 4.8, -14);
    padGroup.add(sock);

    this.animatedElements.push((elapsed) => {
      sock.rotation.y = Math.sin(elapsed * 0.8) * 0.28;
    });

    // 6. Secondary Drone Pad Bravo (X: 30, Z: 0)
    const padB = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.8, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0x3f4654, roughness: 0.7 })
    );
    padB.position.set(32, 0.35, 0);
    padGroup.add(padB);

    const padBRing = new THREE.Mesh(
      new THREE.RingGeometry(4.6, 5.1, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    padBRing.rotation.x = -Math.PI / 2;
    padBRing.position.set(32, 0.44, 0);
    padGroup.add(padBRing);

    this.group.add(padGroup);
  }

  // --------------------------------------------------------
  // 6. ALPINE FOREST (North-East: 180+ Instanced Trees)
  // --------------------------------------------------------
  private buildAlpineForest() {
    const treeCount = 180;
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.42, 3.2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);

    const foliageGeo = new THREE.ConeGeometry(2.6, 7.0, 7);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.85 });
    const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
      const radius = 50 + Math.random() * 200;
      const angle = -0.15 - Math.random() * 1.35; // North-East quadrant
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.7 + Math.random() * 0.75;

      // Trunk
      dummy.position.set(x, (3.2 * scale) / 2 + 0.32, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      // Foliage Cone
      dummy.position.set(x, (3.2 * scale) + (7.0 * scale) / 2 - 0.6 + 0.32, z);
      dummy.updateMatrix();
      foliageInst.setMatrixAt(i, dummy.matrix);
    }

    trunkInst.receiveShadow = true;
    trunkInst.castShadow = true;
    foliageInst.receiveShadow = true;
    foliageInst.castShadow = true;

    this.group.add(trunkInst);
    this.group.add(foliageInst);

    // Granite Boulders
    const rockCount = 60;
    const rockGeo = new THREE.DodecahedronGeometry(1.8, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95 });
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);

    for (let i = 0; i < rockCount; i++) {
      const radius = 45 + Math.random() * 210;
      const angle = -0.15 - Math.random() * 1.35;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scaleX = 0.8 + Math.random() * 1.6;
      const scaleY = 0.5 + Math.random() * 1.0;
      const scaleZ = 0.8 + Math.random() * 1.6;

      dummy.position.set(x, scaleY * 1.2 + 0.32, z);
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
  // 7. MOUNTAIN MASSIF (North-West: 8 Majestic Peaks up to 62m)
  // --------------------------------------------------------
  private buildMountainMassif() {
    const mountainGroup = new THREE.Group();

    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.92,
      flatShading: true,
    });

    const snowPeakMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.80,
      flatShading: true,
    });

    // High peaks forming an epic ridgeline
    const peaks = [
      { x: -180, z: -170, radius: 68, height: 62 }, // Mount Apex (Summit)
      { x: -130, z: -195, radius: 56, height: 54 },
      { x: -225, z: -135, radius: 58, height: 50 },
      { x: -95, z: -145, radius: 48, height: 42 },
      { x: -160, z: -105, radius: 42, height: 36 },
      { x: -75, z: -185, radius: 40, height: 32 },
      { x: -245, z: -75, radius: 52, height: 46 },
      { x: -110, z: -90, radius: 36, height: 28 },
    ];

    peaks.forEach((peak) => {
      // Main Mountain Body
      const bodyGeo = new THREE.ConeGeometry(peak.radius, peak.height, 9);
      const bodyMesh = new THREE.Mesh(bodyGeo, mountainMat);
      bodyMesh.position.set(peak.x, peak.height / 2 + 0.32, peak.z);
      bodyMesh.rotation.y = Math.random() * Math.PI;
      bodyMesh.receiveShadow = true;
      bodyMesh.castShadow = true;
      mountainGroup.add(bodyMesh);

      // Snow Cap on tall peaks (> 35m)
      if (peak.height > 35) {
        const capHeight = peak.height * 0.34;
        const capGeo = new THREE.ConeGeometry(peak.radius * 0.34, capHeight, 9);
        const capMesh = new THREE.Mesh(capGeo, snowPeakMat);
        capMesh.position.set(peak.x, peak.height - capHeight / 2 + 0.32, peak.z);
        capMesh.rotation.y = bodyMesh.rotation.y;
        mountainGroup.add(capMesh);
      }
    });

    // Mount Apex Summit Radio Mast & Red Aviation Warning Strobe (Elev 62m)
    const summitMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.25, 7.5, 6),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 })
    );
    summitMast.position.set(-180, 65.5, -170);
    mountainGroup.add(summitMast);

    const summitStrobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    summitStrobe.position.set(-180, 69.5, -170);
    mountainGroup.add(summitStrobe);

    this.animatedElements.push((elapsed) => {
      summitStrobe.visible = Math.floor(elapsed * 2) % 2 === 0;
    });

    this.group.add(mountainGroup);
  }

  // --------------------------------------------------------
  // 8. METROPOLIS CITY & INDUSTRIAL SKYLINE (South-East: 25-52m Towers)
  // --------------------------------------------------------
  private buildMetropolisCity() {
    const cityGroup = new THREE.Group();

    // Road Grid (Asphalt Avenues)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const avenue1 = new THREE.Mesh(new THREE.PlaneGeometry(16, 260), roadMat);
    avenue1.rotation.x = -Math.PI / 2;
    avenue1.position.set(130, 0.33, 130);
    cityGroup.add(avenue1);

    const avenue2 = new THREE.Mesh(new THREE.PlaneGeometry(260, 16), roadMat);
    avenue2.rotation.x = -Math.PI / 2;
    avenue2.position.set(130, 0.33, 130);
    cityGroup.add(avenue2);

    // Downtown Skyscrapers & Commercial Towers
    const bldgColors = [0x334155, 0x1e293b, 0x475569, 0x0f172a];
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
    });

    const buildings = [
      { x: 100, z: 100, w: 22, l: 22, h: 48, name: "Skyline Tower A" },
      { x: 135, z: 95, w: 26, l: 24, h: 54, name: "Nexus Headquarters" },
      { x: 175, z: 105, w: 20, l: 26, h: 42, name: "Vanguard Spire" },
      { x: 95, z: 140, w: 24, l: 24, h: 36, name: "Commerce Plaza" },
      { x: 135, z: 145, w: 30, l: 28, h: 58, name: "Apex Center" },
      { x: 180, z: 145, w: 24, l: 22, h: 38, name: "Horizon Hub" },
      { x: 100, z: 185, w: 26, l: 22, h: 30, name: "East River Lofts" },
      { x: 140, z: 195, w: 28, l: 26, h: 45, name: "Tech Core" },
      { x: 180, z: 185, w: 22, l: 24, h: 34, name: "Harbor View" },
    ];

    buildings.forEach((b, idx) => {
      const bMat = new THREE.MeshStandardMaterial({
        color: bldgColors[idx % bldgColors.length],
        roughness: 0.4,
        metalness: 0.6,
      });
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.l), bMat);
      bMesh.position.set(b.x, b.h / 2 + 0.32, b.z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      cityGroup.add(bMesh);

      // Glass window bands on facade
      const winBands = Math.floor(b.h / 5);
      for (let w = 1; w < winBands; w++) {
        const band = new THREE.Mesh(
          new THREE.BoxGeometry(b.w + 0.2, 1.2, b.l + 0.2),
          glassMat
        );
        band.position.set(b.x, w * 5 + 0.32, b.z);
        cityGroup.add(band);
      }

      // Rooftop Helipad on tall tower
      if (b.h >= 50) {
        const roofH = new THREE.Mesh(
          new THREE.CylinderGeometry(6, 6, 0.4, 16),
          new THREE.MeshStandardMaterial({ color: 0x111827 })
        );
        roofH.position.set(b.x, b.h + 0.5 + 0.32, b.z);
        cityGroup.add(roofH);

        const hRing = new THREE.Mesh(
          new THREE.RingGeometry(4.8, 5.4, 24),
          new THREE.MeshBasicMaterial({ color: 0xff5500 })
        );
        hRing.rotation.x = -Math.PI / 2;
        hRing.position.set(b.x, b.h + 0.72 + 0.32, b.z);
        cityGroup.add(hRing);
      }
    });

    // --- 48m COMMUNICATIONS LATTICE TOWER (X: 75, Z: 80) ---
    const towerX = 75;
    const towerZ = 80;
    const mastOrangeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85 });
    const mastWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.85 });

    for (let i = 0; i < 6; i++) {
      const segH = 8.0;
      const lowerR = 2.6 - i * 0.38;
      const upperR = 2.2 - i * 0.38;
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(upperR, lowerR, segH, 4),
        i % 2 === 0 ? mastOrangeMat : mastWhiteMat
      );
      seg.position.set(towerX, i * segH + segH / 2 + 0.32, towerZ);
      seg.rotation.y = Math.PI / 4;
      seg.castShadow = true;
      cityGroup.add(seg);
    }

    // Rotating Radar Dish on Tower
    const radarDish = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 0.4, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7 })
    );
    radarDish.position.set(towerX, 47 + 0.32, towerZ);
    cityGroup.add(radarDish);

    // Tower Warning Strobe
    const commsStrobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    commsStrobe.position.set(towerX, 49.5 + 0.32, towerZ);
    cityGroup.add(commsStrobe);

    this.animatedElements.push((elapsed) => {
      radarDish.rotation.y = elapsed * 1.5;
      commsStrobe.visible = Math.floor(elapsed * 2.5) % 2 === 0;
    });

    // --- INDUSTRIAL HANGARS & STORAGE SILOS ---
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
    const hangars = [
      { x: 60, z: 125, w: 22, l: 36, h: 9 },
      { x: 60, z: 170, w: 22, l: 36, h: 9 },
    ];
    hangars.forEach((h) => {
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(h.w, h.h, h.l), hangarMat);
      bldg.position.set(h.x, h.h / 2 + 0.32, h.z);
      bldg.castShadow = true;
      cityGroup.add(bldg);

      const roof = new THREE.Mesh(
        new THREE.CylinderGeometry(h.w * 0.52, h.w * 0.52, h.l, 12, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })
      );
      roof.rotation.z = Math.PI / 2;
      roof.rotation.x = Math.PI / 2;
      roof.position.set(h.x, h.h + 0.32, h.z);
      cityGroup.add(roof);
    });

    // Fuel Silos
    const siloMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85 });
    [
      { x: 60, z: 50 },
      { x: 74, z: 50 },
      { x: 60, z: 62 },
      { x: 74, z: 62 },
    ].forEach((s) => {
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 14, 16), siloMat);
      silo.position.set(s.x, 7 + 0.32, s.z);
      silo.castShadow = true;
      cityGroup.add(silo);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), siloMat);
      dome.position.set(s.x, 14 + 0.32, s.z);
      cityGroup.add(dome);
    });

    this.group.add(cityGroup);
  }

  // --------------------------------------------------------
  // 9. AEROBATIC FLIGHT TRAINING HOOPS (Bright Orange Rings)
  // --------------------------------------------------------
  private buildFlightHoops() {
    const hoopGroup = new THREE.Group();
    const hoopMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });

    const rings = [
      { x: 45, y: 12, z: 45, rotY: Math.PI / 4, r: 3.8 },
      { x: 80, y: 22, z: 80, rotY: 0, r: 4.2 },
      { x: -50, y: 15, z: -40, rotY: -Math.PI / 3, r: 4.0 },
      { x: -110, y: 28, z: -80, rotY: Math.PI / 6, r: 4.5 },
      { x: -150, y: 42, z: -130, rotY: -Math.PI / 4, r: 5.0 }, // Mountain Ascent Hoop
      { x: 135, y: 35, z: 120, rotY: Math.PI / 2, r: 4.0 },   // Skyscraper Alley Hoop
    ];

    rings.forEach((ring) => {
      const hoop = new THREE.Mesh(
        new THREE.TorusGeometry(ring.r, 0.28, 8, 28),
        hoopMat
      );
      hoop.position.set(ring.x, ring.y, ring.z);
      hoop.rotation.y = ring.rotY;
      hoopGroup.add(hoop);
    });

    this.group.add(hoopGroup);
  }

  public update(dt: number, elapsed: number) {
    this.animatedElements.forEach((fn) => fn(elapsed));
  }
}