// ==========================================================
// DRONE PILOT — MASTER ROAD NETWORK & HIGHWAY SYSTEM (PHASE 1)
// Realistic asphalt highways, regional connectors, mountain switchbacks,
// river canyon bridges, streetlights & traffic waypoints
// ==========================================================

import * as THREE from "three";
import { WORLD_DEFINITION } from "@/lib/world/world-definition";
import { RoadPolyline, Vector3D } from "@/lib/world/world-types";
import { evaluateIslandElevation } from "@/lib/world/terrain-math";
import { queryHydrology } from "@/lib/world/hydrology-mask";

export class RoadNetwork {
  public group = new THREE.Group();

  // Navigation waypoints for traffic simulation
  public waypoints: THREE.Vector3[] = [];

  private roadMat: THREE.MeshStandardMaterial;
  private markingMat: THREE.MeshStandardMaterial;
  private whiteLineMat: THREE.MeshStandardMaterial;
  private bridgeMat: THREE.MeshStandardMaterial;

  constructor() {
    this.roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e242b, // Dark fresh asphalt
      roughness: 0.86,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });

    this.markingMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Aviation / highway yellow
      roughness: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });

    this.whiteLineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });

    this.bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Reinforced concrete slate
      roughness: 0.7,
      metalness: 0.3,
    });

    this.buildMasterNetwork();
    this.buildDowntownGrid();
    this.buildStreetlights();
  }

  /**
   * Builds all continuous road ribbons from canonical WORLD_DEFINITION.roads
   */
  private buildMasterNetwork() {
    // 1. Primary Highways (Metropolis -> Industrial -> Port)
    WORLD_DEFINITION.roads.primaryHighways.forEach((road) => {
      this.buildRoadRibbon(road, true);
    });

    // 2. Arterial Connectors (Academy -> City, Academy -> Forest, Pelican Spur)
    WORLD_DEFINITION.roads.connectors.forEach((road) => {
      this.buildRoadRibbon(road, true);
    });

    // 3. Southern Coastal Connector (Pelican Cove -> Estuary -> Harbor Port)
    // Cleanly split at bridge abutments so no road ribbon is rendered underwater
    const coastalConnectorWest: RoadPolyline = {
      id: "road-southern-coastal-west",
      name: "Southern Coastal Highway West",
      type: "highway",
      widthMeters: 10,
      points: [
        { x: -720, y: 2.0, z: 560 },
        { x: -580, y: 2.2, z: 660 },
        { x: -400, y: 2.4, z: 740 },
        { x: -260, y: 2.6, z: 800 },
        { x: -140, y: 3.2, z: 840 }, // West bridge abutment
      ],
    };
    this.buildRoadRibbon(coastalConnectorWest, true);

    const coastalConnectorEast: RoadPolyline = {
      id: "road-southern-coastal-east",
      name: "Southern Coastal Highway East",
      type: "highway",
      widthMeters: 10,
      points: [
        { x: -40, y: 3.2, z: 860 },  // East bridge abutment
        { x: 60, y: 1.3, z: 880 },   // Connect to harbor highway
      ],
    };
    this.buildRoadRibbon(coastalConnectorEast, true);

    // 4. Mountain Switchback Pass
    WORLD_DEFINITION.roads.mountainPasses.forEach((road) => {
      this.buildRoadRibbon(road, false);
    });

    // 5. Canyon & Estuary Bridges
    WORLD_DEFINITION.roads.bridges.forEach((bridge) => {
      this.buildBridgeStructure(bridge);
    });

    // Estuary Delta Bridge spanning the lower river mouth
    this.buildBridgeStructure({
      id: "bridge-estuary",
      name: "Southern Estuary Maritime Bridge",
      type: "bridge",
      widthMeters: 12,
      points: [
        { x: -140, y: 3.2, z: 840 },
        { x: -40, y: 3.2, z: 860 },
      ],
      hasBridge: false, // Marine viaduct causeway
    });

    // 6. Terminus Loops & Cul-de-Sacs (Ensures roads never end abruptly into grass)
    this.buildTurnaroundApron(-620, -40, 18, "Forest Ranger Station Turnaround");
    this.buildTurnaroundApron(-720, 560, 22, "Pelican Cove Coastal Overlook");
    this.buildTurnaroundApron(-580, -560, 16, "Mount Apex Weather Station Overlook");
    this.buildTurnaroundApron(-50, 0, 16, "Academy Flightline Access Loop");
  }

  /**
   * Paved circular turnaround apron / cul-de-sac with asphalt finish and concrete curb
   */
  private buildTurnaroundApron(cx: number, cz: number, radius: number, _name: string) {
    const sample = evaluateIslandElevation(cx, cz);
    const y = Math.max(1.35, sample.elevation + 0.18);

    // Reinforced concrete curb foundation so terrain never bleeds through
    const curbGeo = new THREE.CylinderGeometry(radius * 1.01, radius * 1.03, 0.40, 32);
    const curbMesh = new THREE.Mesh(curbGeo, this.bridgeMat);
    curbMesh.position.set(cx, y - 0.20, cz);
    curbMesh.receiveShadow = true;
    this.group.add(curbMesh);

    // Asphalt surface disc
    const circleGeo = new THREE.CircleGeometry(radius, 32);
    circleGeo.rotateX(-Math.PI / 2);
    const circleMesh = new THREE.Mesh(circleGeo, this.roadMat);
    circleMesh.position.set(cx, y + 0.01, cz);
    circleMesh.receiveShadow = true;
    this.group.add(circleMesh);

    // Circular white marking ring
    const ringGeo = new THREE.RingGeometry(radius - 2.5, radius - 2.0, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, this.whiteLineMat);
    ringMesh.position.set(cx, y + 0.025, cz);
    ringMesh.receiveShadow = true;
    this.group.add(ringMesh);
  }

  /**
   * Generates a smooth, continuous asphalt ribbon conforming to terrain elevation
   * with strict water clearance guarantees (roads never plunge underwater)
   */
  private buildRoadRibbon(road: RoadPolyline, withCenterline = true) {
    const rawPoints = road.points;
    if (rawPoints.length < 2) return;

    // Subdivide polyline into evenly spaced 10m intervals for smooth curvature
    const sampleStep = 10;
    const sampledPoints: THREE.Vector3[] = [];

    const getRoadElevation = (x: number, z: number): number => {
      const terrainY = evaluateIslandElevation(x, z).elevation;
      const hydro = queryHydrology(x, z, terrainY);
      if (hydro.isWater) {
        // Enforce road elevation stays safely above water level
        return Math.max(terrainY + 0.22, hydro.waterElevation + 1.2);
      }
      return Math.max(terrainY + 0.22, 1.35);
    };

    for (let i = 0; i < rawPoints.length - 1; i++) {
      const p1 = new THREE.Vector3(rawPoints[i].x, rawPoints[i].y, rawPoints[i].z);
      const p2 = new THREE.Vector3(rawPoints[i + 1].x, rawPoints[i + 1].y, rawPoints[i + 1].z);
      const segLen = p1.distanceTo(p2);
      const steps = Math.max(1, Math.round(segLen / sampleStep));

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const x = p1.x + (p2.x - p1.x) * t;
        const z = p1.z + (p2.z - p1.z) * t;
        const roadY = getRoadElevation(x, z);
        sampledPoints.push(new THREE.Vector3(x, roadY, z));
      }
    }
    const last = rawPoints[rawPoints.length - 1];
    sampledPoints.push(
      new THREE.Vector3(last.x, getRoadElevation(last.x, last.z), last.z)
    );

    if (sampledPoints.length < 2) return;

    const halfWidth = road.widthMeters / 2;
    const vertices: number[] = [];
    const uvs: number[] = [];
    const lineVerts: number[] = [];

    for (let i = 0; i < sampledPoints.length; i++) {
      const curr = sampledPoints[i];
      let tangent = new THREE.Vector3();

      if (i === 0) {
        tangent.subVectors(sampledPoints[1], curr).normalize();
      } else if (i === sampledPoints.length - 1) {
        tangent.subVectors(curr, sampledPoints[i - 1]).normalize();
      } else {
        tangent.subVectors(sampledPoints[i + 1], sampledPoints[i - 1]).normalize();
      }

      // Normal perpendicular vector in XZ plane
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = new THREE.Vector3().copy(curr).addScaledVector(perp, -halfWidth);
      const right = new THREE.Vector3().copy(curr).addScaledVector(perp, halfWidth);

      if (i > 0) {
        const prevIdx = (i - 1) * 2;
        const currIdx = i * 2;

        // Quad triangles
        // Triangle 1: prevLeft, prevRight, currLeft
        // Triangle 2: currLeft, prevRight, currRight
      }

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      const vProgress = i / (sampledPoints.length - 1);
      uvs.push(0, vProgress * 20);
      uvs.push(1, vProgress * 20);

      // Yellow Centerline
      if (withCenterline) {
        const cLeft = new THREE.Vector3().copy(curr).addScaledVector(perp, -0.18);
        const cRight = new THREE.Vector3().copy(curr).addScaledVector(perp, 0.18);
        lineVerts.push(cLeft.x, cLeft.y + 0.015, cLeft.z);
        lineVerts.push(cRight.x, cRight.y + 0.015, cRight.z);
      }
    }

    // Index buffer for road quad strip
    const indices: number[] = [];
    for (let i = 0; i < sampledPoints.length - 1; i++) {
      const pL = i * 2;
      const pR = i * 2 + 1;
      const cL = (i + 1) * 2;
      const cR = (i + 1) * 2 + 1;

      indices.push(pL, pR, cL);
      indices.push(cL, pR, cR);
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
    roadMesh.receiveShadow = true;
    this.group.add(roadMesh);

    // Centerline strip
    if (withCenterline && lineVerts.length >= 6) {
      const lineIndices: number[] = [];
      for (let i = 0; i < sampledPoints.length - 1; i++) {
        const pL = i * 2;
        const pR = i * 2 + 1;
        const cL = (i + 1) * 2;
        const cR = (i + 1) * 2 + 1;
        lineIndices.push(pL, pR, cL);
        lineIndices.push(cL, pR, cR);
      }

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lineVerts, 3));
      lineGeo.setIndex(lineIndices);
      lineGeo.computeVertexNormals();

      const lineMesh = new THREE.Mesh(lineGeo, this.markingMat);
      lineMesh.receiveShadow = true;
      this.group.add(lineMesh);
    }
  }

  /**
   * Builds an elevated bridge deck spanning the river canyon with concrete arches & safety railings
   */
  private buildBridgeStructure(bridge: RoadPolyline) {
    if (bridge.points.length < 2) return;
    const p1 = bridge.points[0];
    const p2 = bridge.points[1];

    const start = new THREE.Vector3(p1.x, p1.y, p1.z);
    const end = new THREE.Vector3(p2.x, p2.y, p2.z);
    const length = start.distanceTo(end);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const angle = Math.atan2(end.z - start.z, end.x - start.x);

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.copy(mid);
    bridgeGroup.rotation.y = -angle;

    const w = bridge.widthMeters;
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Weathered structural steel
      roughness: 0.4,
      metalness: 0.8,
    });
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Galvanized high-tensile steel cable
      roughness: 0.25,
      metalness: 0.9,
    });
    const strobeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // 1. Reinforced Deck Slab (thickness: 1.4m)
    const deckGeo = new THREE.BoxGeometry(length, 1.4, w);
    const deck = new THREE.Mesh(deckGeo, this.bridgeMat);
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    // 2. Asphalt Roadway with Markings
    const surfaceGeo = new THREE.PlaneGeometry(length, w - 1.2);
    surfaceGeo.rotateX(-Math.PI / 2);
    const surface = new THREE.Mesh(surfaceGeo, this.roadMat);
    surface.position.y = 0.71;
    bridgeGroup.add(surface);

    // Double Yellow Centerline
    const yellowLineGeo = new THREE.PlaneGeometry(length, 0.35);
    yellowLineGeo.rotateX(-Math.PI / 2);
    const yellowLine = new THREE.Mesh(yellowLineGeo, this.markingMat);
    yellowLine.position.y = 0.72;
    bridgeGroup.add(yellowLine);

    // White Edge Lines
    [-w / 2 + 1.2, w / 2 - 1.2].forEach((side) => {
      const whiteLineGeo = new THREE.PlaneGeometry(length, 0.2);
      whiteLineGeo.rotateX(-Math.PI / 2);
      const whiteLine = new THREE.Mesh(whiteLineGeo, this.whiteLineMat);
      whiteLine.position.set(0, 0.72, side);
      bridgeGroup.add(whiteLine);
    });

    // 3. Safety Barrier Guardrails with Reflectors
    [-w / 2 + 0.4, w / 2 - 0.4].forEach((side) => {
      const railGeo = new THREE.BoxGeometry(length, 1.1, 0.35);
      const rail = new THREE.Mesh(railGeo, this.bridgeMat);
      rail.position.set(0, 0.7 + 0.55, side);
      rail.castShadow = true;
      bridgeGroup.add(rail);

      // Steel top cap on railing
      const capGeo = new THREE.BoxGeometry(length, 0.12, 0.45);
      const cap = new THREE.Mesh(capGeo, steelMat);
      cap.position.set(0, 0.7 + 1.15, side);
      bridgeGroup.add(cap);
    });

    // Solid concrete abutment anchorage blocks embedded into canyon terrain rims
    [-length / 2, length / 2].forEach((ax) => {
      const abutmentGeo = new THREE.BoxGeometry(6.0, 5.5, w + 1.6);
      const abutment = new THREE.Mesh(abutmentGeo, this.bridgeMat);
      abutment.position.set(ax, -2.0, 0);
      abutment.receiveShadow = true;
      abutment.castShadow = true;
      bridgeGroup.add(abutment);
    });

    // 4. Specific Bridge Engineering Typologies (Cable-stayed / Suspension)
    if (bridge.id === "bridge-valley") {
      // ----------------------------------------------------
      // GRAND RIVER CANYON SUSPENSION / CABLE-STAYED BRIDGE
      // ----------------------------------------------------
      const towerDist = length * 0.28;
      const towerHeight = 22.0; // Rises 22m above road deck
      const towerBaseDepth = 14.0; // Extends down to canyon bed

      // Steel Truss Undercarriage beneath the deck
      const trussHeight = 2.4;
      const trussGeo = new THREE.BoxGeometry(length * 0.94, trussHeight, w * 0.9);
      const truss = new THREE.Mesh(trussGeo, steelMat);
      truss.position.set(0, -0.7 - trussHeight / 2, 0);
      bridgeGroup.add(truss);

      // Twin H-Frame Concrete Pylon Towers
      [-towerDist, towerDist].forEach((tx) => {
        // Pylon legs on each side of the deck
        [-w / 2 - 0.8, w / 2 + 0.8].forEach((tz) => {
          const legGeo = new THREE.BoxGeometry(2.4, towerHeight + towerBaseDepth, 1.8);
          const leg = new THREE.Mesh(legGeo, this.bridgeMat);
          leg.position.set(tx, (towerHeight - towerBaseDepth) / 2, tz);
          leg.castShadow = true;
          bridgeGroup.add(leg);

          // Tower Apex Aviation Beacon
          const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), strobeMat);
          beacon.position.set(tx, towerHeight + 0.3, tz);
          bridgeGroup.add(beacon);
        });

        // Horizontal Portal Cross-Beam connecting legs above traffic
        const beamGeo = new THREE.BoxGeometry(2.4, 1.6, w + 3.4);
        const beam = new THREE.Mesh(beamGeo, this.bridgeMat);
        beam.position.set(tx, 7.5, 0);
        bridgeGroup.add(beam);

        // Upper Crown Cross-Beam
        const crownBeam = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 1.4, w + 3.4),
          this.bridgeMat
        );
        crownBeam.position.set(tx, towerHeight - 1.2, 0);
        bridgeGroup.add(crownBeam);
      });

      // Parabolic Main Suspension Cables and Vertical Hanger Suspenders
      [-w / 2 - 0.7, w / 2 + 0.7].forEach((cableZ) => {
        const cableSteps = 24;
        const cablePoints: THREE.Vector3[] = [];

        for (let i = 0; i <= cableSteps; i++) {
          const t = i / cableSteps;
          const x = -length / 2 + t * length;
          let y = 0.7;

          if (x < -towerDist) {
            // Anchor backspan: slopes from deck anchor up to tower saddle
            const p = (x - (-length / 2)) / (-towerDist - (-length / 2));
            y = 1.0 + p * (towerHeight - 1.0);
          } else if (x > towerDist) {
            // Far anchor backspan
            const p = (length / 2 - x) / (length / 2 - towerDist);
            y = 1.0 + p * (towerHeight - 1.0);
          } else {
            // Main span catenary sag: tower apex (21m) -> midspan dip (2.8m) -> tower apex
            const midP = (x + towerDist) / (towerDist * 2); // 0 to 1
            const sag = Math.sin(midP * Math.PI);
            y = towerHeight - sag * (towerHeight - 2.8);
          }
          cablePoints.push(new THREE.Vector3(x, y, cableZ));

          // Vertical wire suspender hangers in main span
          if (x >= -towerDist + 2 && x <= towerDist - 2 && i % 2 === 0) {
            const hangerHeight = y - 0.7;
            if (hangerHeight > 0.8) {
              const hangerGeo = new THREE.CylinderGeometry(0.04, 0.04, hangerHeight, 4);
              const hanger = new THREE.Mesh(hangerGeo, cableMat);
              hanger.position.set(x, 0.7 + hangerHeight / 2, cableZ);
              bridgeGroup.add(hanger);
            }
          }
        }

        // Main Suspension Cable Tube
        const curve = new THREE.CatmullRomCurve3(cablePoints);
        const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.18, 6, false);
        const tube = new THREE.Mesh(tubeGeo, cableMat);
        bridgeGroup.add(tube);
      });

      // Bridge Deck Streetlights along both sides
      for (let lx = -length * 0.42; lx <= length * 0.42; lx += 18) {
        [-w / 2 + 0.4, w / 2 - 0.4].forEach((lz) => {
          const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.12, 5.0, 5),
            steelMat
          );
          pole.position.set(lx, 0.7 + 2.5, lz);
          bridgeGroup.add(pole);

          const fixture = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.15, 0.4),
            lampGlowMat
          );
          fixture.position.set(lx, 0.7 + 5.0, lz + (lz > 0 ? -0.4 : 0.4));
          bridgeGroup.add(fixture);
        });
      }
    } else {
      // ----------------------------------------------------
      // ESTUARY CAUSEWAY PRESTRESSED CONCRETE VIADUCT BRIDGE
      // ----------------------------------------------------
      // Heavy deep-water marine pier bents with protective dolphin fenders
      const numPiers = 4;
      const pierSpacing = length / (numPiers + 1);

      for (let p = 1; p <= numPiers; p++) {
        const px = -length / 2 + p * pierSpacing;

        // Pier Bent Cap (hammerhead beam)
        const capGeo = new THREE.BoxGeometry(3.2, 1.4, w + 1.2);
        const cap = new THREE.Mesh(capGeo, this.bridgeMat);
        cap.position.set(px, -1.4, 0);
        cap.castShadow = true;
        bridgeGroup.add(cap);

        // Dual cylindrical marine piles extending deep underwater
        [-w / 3, w / 3].forEach((pz) => {
          const pileGeo = new THREE.CylinderGeometry(1.4, 1.6, 9.0, 8);
          const pile = new THREE.Mesh(pileGeo, this.bridgeMat);
          pile.position.set(px, -5.9, pz);
          pile.castShadow = true;
          bridgeGroup.add(pile);
        });
      }

      // Longitudinal concrete support girders underneath the road slab
      [-w / 3, 0, w / 3].forEach((gz) => {
        const girderGeo = new THREE.BoxGeometry(length, 1.2, 0.8);
        const girder = new THREE.Mesh(girderGeo, this.bridgeMat);
        girder.position.set(0, -0.7 - 0.6, gz);
        bridgeGroup.add(girder);
      });

      // Marine fairway navigation lights centered under midspan
      const greenNav = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      greenNav.position.set(0, -2.2, 0);
      bridgeGroup.add(greenNav);

      // Coastal barrier lighting
      for (let lx = -length * 0.4; lx <= length * 0.4; lx += 22) {
        [-w / 2 + 0.4, w / 2 - 0.4].forEach((lz) => {
          const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.1, 4.5, 4),
            steelMat
          );
          pole.position.set(lx, 0.7 + 2.25, lz);
          bridgeGroup.add(pole);

          const fixture = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.12, 0.35),
            lampGlowMat
          );
          fixture.position.set(lx, 0.7 + 4.5, lz);
          bridgeGroup.add(fixture);
        });
      }
    }

    this.group.add(bridgeGroup);
  }

  /**
   * Downtown Metropolis street grid with double avenues, cross streets, and traffic circuit
   */
  private buildDowntownGrid() {
    const yElevation = 2.53;
    const roadWidth = 14;

    // North-South Avenues
    const avenues = [
      { x: 640, z: 320, length: 260 },
      { x: 780, z: 320, length: 260 },
    ];

    // East-West Cross Streets
    const crossStreets = [
      { x: 710, z: 240, length: 220 },
      { x: 710, z: 400, length: 220 },
    ];

    avenues.forEach((ave) => {
      const geo = new THREE.PlaneGeometry(roadWidth, ave.length);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, this.roadMat);
      mesh.position.set(ave.x, yElevation, ave.z);
      mesh.receiveShadow = true;
      this.group.add(mesh);
    });

    crossStreets.forEach((street) => {
      const geo = new THREE.PlaneGeometry(street.length, roadWidth);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, this.roadMat);
      mesh.position.set(street.x, yElevation, street.z);
      mesh.receiveShadow = true;
      this.group.add(mesh);
    });

    // Autonomous traffic circuit waypoints connecting the entire island road network:
    // City -> Harbor -> Estuary Bridge -> Pelican Coast -> Forest -> Academy -> City
    this.waypoints = [
      // 1. Downtown City Grid
      new THREE.Vector3(640, 2.53, 240),
      new THREE.Vector3(780, 2.53, 240),
      new THREE.Vector3(780, 2.53, 400),
      new THREE.Vector3(640, 2.53, 400),
      // 2. City-to-Harbor Parkway
      new THREE.Vector3(580, 2.3, 540),
      new THREE.Vector3(460, 2.0, 680),
      new THREE.Vector3(380, 1.8, 780),
      new THREE.Vector3(260, 1.5, 860),
      new THREE.Vector3(60, 1.4, 880),
      // 3. Estuary Maritime Bridge & Southern Coastal Highway
      new THREE.Vector3(-40, 3.2, 860),
      new THREE.Vector3(-140, 3.2, 840),
      new THREE.Vector3(-260, 2.6, 800),
      new THREE.Vector3(-400, 2.4, 740),
      new THREE.Vector3(-580, 2.2, 660),
      new THREE.Vector3(-720, 2.0, 560), // Pelican Cove Overlook
      // 4. Southern Coastal Highway to West Bridge Abutment
      new THREE.Vector3(-540, 2.8, 480),
      new THREE.Vector3(-320, 4.5, 340),
      new THREE.Vector3(-180, 9.8, 140), // West Bridge Abutment
      // 5. Forest Ranger Station Loop
      new THREE.Vector3(-300, 5.5, 70),
      new THREE.Vector3(-440, 4.8, 10),
      new THREE.Vector3(-620, 5.5, -40), // Forest Ranger Station Turnaround
      new THREE.Vector3(-440, 4.8, 10),
      new THREE.Vector3(-300, 5.5, 70),
      new THREE.Vector3(-180, 9.8, 140), // West Bridge Abutment
      // 6. Grand Valley Suspension Bridge Crossing (High above river canyon)
      new THREE.Vector3(-140, 9.8, 160), // Mid-span above river
      new THREE.Vector3(-100, 9.8, 180), // East Bridge Abutment
      // 7. Bridge-to-Academy Approach
      new THREE.Vector3(-75, 4.2, 120),
      new THREE.Vector3(-50, 1.2, 60),
      new THREE.Vector3(-50, 1.2, 0),    // Academy Airfield Loop
      // 8. Academy-to-City Expressway
      new THREE.Vector3(180, 1.4, 60),
      new THREE.Vector3(360, 1.8, 160),
      new THREE.Vector3(540, 2.2, 240),
      new THREE.Vector3(640, 2.53, 240),
    ];
  }

  /**
   * Installs modern curved LED streetlights along city avenues
   */
  private buildStreetlights() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      emissive: 0xffeedd,
      emissiveIntensity: 2.2,
    });

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 6);
    armGeo.rotateZ(Math.PI / 3);
    const headGeo = new THREE.SphereGeometry(0.35, 8, 8);

    const lampPositions = [
      { x: 632, z: 240 },
      { x: 632, z: 320 },
      { x: 632, z: 400 },
      { x: 788, z: 240 },
      { x: 788, z: 320 },
      { x: 788, z: 400 },
      { x: 710, z: 232 },
      { x: 710, z: 408 },
    ];

    lampPositions.forEach((pos) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 2.52, pos.z);

      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 3.75;
      pole.castShadow = true;
      group.add(pole);

      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(0.8, 7.0, 0);
      group.add(arm);

      const head = new THREE.Mesh(headGeo, lampMat);
      head.position.set(1.8, 7.8, 0);
      group.add(head);

      this.group.add(group);
    });
  }
}
