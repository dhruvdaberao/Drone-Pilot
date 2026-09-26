import * as THREE from "three";

export interface MotorDef {
  index: number;
  position: { x: number; y: number; z: number };
  direction: 1 | -1;
}

export interface AircraftModelParts {
  rootGroup: THREE.Group;
  propellers: { bladeGroup: THREE.Group; direction: 1 | -1; motorIndex: number }[];
  batteryLeds: THREE.Mesh[];
  tailStrobe: THREE.Mesh | null;
  gimbalGroup: THREE.Group | null;
  cameraPitchGroup: THREE.Group | null;
}

// ------------------------------------------------------------------
// CAMERA FRAMING HELPER
// Returns the approximate bounding radius of the aircraft model
// so the chase camera can frame the correct initial distance.
// ------------------------------------------------------------------
export function getAircraftBoundingRadius(type: "quadcopter" | "hexacopter" | "octacopter"): number {
  // These values correspond to the physical motor-tip-to-motor-tip extents
  // derived from the DroneDefinition motor radii + propeller radius allowance.
  // Quad: motors at r≈0.48m + prop ≈ ~0.23m → span ~0.71m → bounding radius ~0.75m
  // Hexa: motors at r≈0.55m + prop ≈ ~0.26m → span ~0.81m → bounding radius ~0.90m
  // Octa: motors at r≈0.65m + prop ≈ ~0.30m → span ~0.95m → bounding radius ~1.05m
  switch (type) {
    case "hexacopter": return 0.90;
    case "octacopter": return 1.10;
    case "quadcopter":
    default:           return 0.75;
  }
}

// ------------------------------------------------------------------
// PROFESSIONAL AEROSPACE MATERIALS (shared, static — created once)
// ------------------------------------------------------------------
const Materials = {
  // Dark structural carbon fibre chassis
  carbonFiber: new THREE.MeshStandardMaterial({
    color: 0x16181d,
    roughness: 0.45,
    metalness: 0.30,
  }),
  // Satin anodized dark alloy (arms, structural tubes)
  darkGraphite: new THREE.MeshStandardMaterial({
    color: 0x22252b,
    roughness: 0.50,
    metalness: 0.40,
  }),
  // Machined / CNC silver alloy (motor bells, connectors, shell)
  silverAlloy: new THREE.MeshStandardMaterial({
    color: 0xbfc4cc,
    roughness: 0.30,
    metalness: 0.75,
  }),
  // Mid-grey machined alloy (motor stators, knuckles)
  machinedAlloy: new THREE.MeshStandardMaterial({
    color: 0x5a6070,
    roughness: 0.28,
    metalness: 0.72,
  }),
  // Optical glass / sensor lens
  opticalGlass: new THREE.MeshPhysicalMaterial({
    color: 0x080a0e,
    metalness: 0.90,
    roughness: 0.04,
    transmission: 0.88,
    thickness: 0.05,
    clearcoat: 1.0,
  }),
  // Safety orange accents (front arm stripe, battery latch, prop cap)
  accentOrange: new THREE.MeshStandardMaterial({
    color: 0xff5500,
    roughness: 0.28,
    metalness: 0.18,
  }),
  // Rubber vibration dampeners / feet
  rubberPad: new THREE.MeshStandardMaterial({
    color: 0x0e0f11,
    roughness: 0.92,
    metalness: 0.04,
  }),
  // Carbon propeller blades
  propeller: new THREE.MeshStandardMaterial({
    color: 0x141618,
    roughness: 0.38,
    metalness: 0.18,
  }),
  // Anti-collision strobe (white)
  strobe: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  // Battery gauge LEDs
  ledGreen:  new THREE.MeshBasicMaterial({ color: 0x00e676 }),
  ledAmber:  new THREE.MeshBasicMaterial({ color: 0xffa000 }),
  ledRed:    new THREE.MeshBasicMaterial({ color: 0xff1744 }),
  ledOff:    new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.8, metalness: 0.1 }),
};

// Export LED materials so ModularDrone can reference them for its battery gauge
export const LedMaterials = {
  green: Materials.ledGreen,
  amber: Materials.ledAmber,
  red:   Materials.ledRed,
  off:   Materials.ledOff,
};

// ------------------------------------------------------------------
// GEOMETRY UTILS
// ------------------------------------------------------------------
function createRoundedRectShape(w: number, l: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -l / 2);
  shape.lineTo( w / 2 - r, -l / 2);
  shape.quadraticCurveTo( w / 2, -l / 2,  w / 2, -l / 2 + r);
  shape.lineTo( w / 2,  l / 2 - r);
  shape.quadraticCurveTo( w / 2,  l / 2,  w / 2 - r,  l / 2);
  shape.lineTo(-w / 2 + r,  l / 2);
  shape.quadraticCurveTo(-w / 2,  l / 2, -w / 2,  l / 2 - r);
  shape.lineTo(-w / 2, -l / 2 + r);
  shape.quadraticCurveTo(-w / 2, -l / 2, -w / 2 + r, -l / 2);
  return shape;
}

// ------------------------------------------------------------------
// GIMBAL & CAMERA (Hexa and Octa)
// ------------------------------------------------------------------
function buildGimbalAndCamera(sc: number): { gimbal: THREE.Group; pitch: THREE.Group } {
  const g = new THREE.Group();

  // Gimbal yaw ring / base
  g.add(Object.assign(
    new THREE.Mesh(new THREE.CylinderGeometry(0.022 * sc, 0.028 * sc, 0.016 * sc, 16), Materials.machinedAlloy),
    { position: new THREE.Vector3(0, 0, 0) }
  ));

  // Roll arm
  const rollArm = new THREE.Mesh(new THREE.BoxGeometry(0.05 * sc, 0.009 * sc, 0.009 * sc), Materials.darkGraphite);
  rollArm.position.set(0.02 * sc, -0.018 * sc, 0);
  g.add(rollArm);

  // Roll motor
  const rollMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.013 * sc, 0.013 * sc, 0.01 * sc, 14), Materials.machinedAlloy);
  rollMotor.rotation.z = Math.PI / 2;
  rollMotor.position.set(0.038 * sc, -0.018 * sc, 0);
  g.add(rollMotor);

  // Pitch group (the "camera pod")
  const pitchGroup = new THREE.Group();
  pitchGroup.position.set(0.018 * sc, -0.025 * sc, 0);

  const camBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.038 * sc, 0.028 * sc, 0.050 * sc),
    Materials.darkGraphite
  );
  camBody.position.set(-0.008 * sc, -0.008 * sc, 0.012 * sc);
  pitchGroup.add(camBody);

  const lensBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013 * sc, 0.013 * sc, 0.014 * sc, 16),
    Materials.machinedAlloy
  );
  lensBarrel.rotation.x = Math.PI / 2;
  lensBarrel.position.set(-0.008 * sc, -0.010 * sc, 0.038 * sc);
  pitchGroup.add(lensBarrel);

  const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(0.011 * sc, 16), Materials.opticalGlass);
  lensGlass.position.set(-0.008 * sc, -0.010 * sc, 0.046 * sc);
  pitchGroup.add(lensGlass);

  g.add(pitchGroup);
  return { gimbal: g, pitch: pitchGroup };
}

// ------------------------------------------------------------------
// UNIFIED FUSELAGE FAMILY BUILDER
// ------------------------------------------------------------------
function buildUnifiedFuselage(
  type: "quadcopter" | "hexacopter" | "octacopter",
  root: THREE.Group
): AircraftModelParts {
  const parts: AircraftModelParts = {
    batteryLeds: [],
    tailStrobe: null,
    gimbalGroup: null,
    cameraPitchGroup: null,
    propellers: [],
    rootGroup: root,
  };

  // Scale factor: Quad = 1.0, Hexa = 1.35, Octa = 1.70
  const sc = type === "quadcopter" ? 1.0 : type === "hexacopter" ? 1.35 : 1.70;

  const fuselage = new THREE.Group();

  // ── Body dimensions ──────────────────────────────────────────────
  const bodyW = 0.17 * sc;   // width (X)
  const bodyL = 0.24 * sc;   // length (Z)
  const bodyH = 0.085 * sc;  // height (Y)
  const cR    = 0.022 * sc;  // corner radius

  // 1. STRUCTURAL CHASSIS (carbon fibre box)
  const chassisShape = createRoundedRectShape(bodyW, bodyL, cR);
  const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, {
    depth: bodyH, bevelEnabled: true,
    bevelSegments: 2, steps: 1,
    bevelSize: 0.005 * sc, bevelThickness: 0.005 * sc,
  });
  chassisGeo.center();
  chassisGeo.rotateX(Math.PI / 2);
  const chassis = new THREE.Mesh(chassisGeo, Materials.carbonFiber);
  fuselage.add(chassis);

  // 2. TOP EQUIPMENT SHELL (silver alloy canopy)
  const shellW = bodyW * 0.88;
  const shellL = bodyL * 0.82;
  const shellH = 0.032 * sc;
  const shellShape = createRoundedRectShape(shellW, shellL, cR);
  const shellGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: shellH, bevelEnabled: true,
    bevelSegments: 3, steps: 1,
    bevelSize: 0.009 * sc, bevelThickness: 0.009 * sc,
  });
  shellGeo.center();
  shellGeo.rotateX(Math.PI / 2);
  const shell = new THREE.Mesh(shellGeo, Materials.silverAlloy);
  shell.position.y = bodyH / 2 + shellH / 2 - 0.002;
  shell.castShadow = true;
  fuselage.add(shell);

  // Heat sink vents in silver shell
  for (let i = -1; i <= 1; i++) {
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(shellW * 0.38, 0.005 * sc, 0.011 * sc),
      Materials.machinedAlloy
    );
    vent.position.set(0, bodyH / 2 + shellH, i * 0.022 * sc);
    fuselage.add(vent);
  }

  // 3. BOTTOM SENSOR / PAYLOAD INTERFACE BAY
  const bayW = bodyW * 0.58;
  const bayL = bodyL * 0.58;
  const bayH = 0.018 * sc;
  const bay = new THREE.Mesh(new THREE.BoxGeometry(bayW, bayH, bayL), Materials.darkGraphite);
  bay.position.y = -bodyH / 2 - bayH / 2;
  fuselage.add(bay);

  // 4. PAYLOAD / CAMERA SYSTEM (type-differentiated)
  if (type === "octacopter") {
    // Heavy payload rail mount (industrial)
    const railW = bodyW * 0.72;
    const railH = 0.018 * sc;
    const railL = bodyL * 0.55;
    const payloadRail = new THREE.Mesh(new THREE.BoxGeometry(railW, railH, railL), Materials.machinedAlloy);
    payloadRail.position.set(0, -bodyH / 2 - bayH - railH / 2, bodyL * 0.05);
    fuselage.add(payloadRail);
    // Payload vibration isolator pucks (4 corners)
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
      const puck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012 * sc, 0.012 * sc, 0.022 * sc, 12),
        Materials.rubberPad
      );
      puck.position.set(sx * railW * 0.38, -bodyH / 2 - bayH - railH - 0.011 * sc, sz * railL * 0.38);
      fuselage.add(puck);
    });
    // 3-axis gimbal
    const { gimbal, pitch } = buildGimbalAndCamera(sc * 0.85);
    gimbal.position.set(0, -bodyH / 2 - bayH - railH - 0.06 * sc, bodyL * 0.12);
    fuselage.add(gimbal);
    parts.gimbalGroup = gimbal;
    parts.cameraPitchGroup = pitch;
  } else if (type === "hexacopter") {
    // Mapping/survey gimbal
    const { gimbal, pitch } = buildGimbalAndCamera(sc * 0.75);
    gimbal.position.set(0, -bodyH / 2 - bayH - 0.01 * sc, bodyL * 0.10);
    fuselage.add(gimbal);
    parts.gimbalGroup = gimbal;
    parts.cameraPitchGroup = pitch;
  } else {
    // Quadcopter: small fixed FPV nose camera
    const fpvMount = new THREE.Mesh(
      new THREE.BoxGeometry(0.028 * sc, 0.028 * sc, 0.026 * sc),
      Materials.darkGraphite
    );
    fpvMount.position.set(0, -bodyH / 2, bodyL / 2 + 0.002);
    fuselage.add(fpvMount);
    const fpvLens = new THREE.Mesh(new THREE.CircleGeometry(0.009 * sc, 16), Materials.opticalGlass);
    fpvLens.position.set(0, -bodyH / 2, bodyL / 2 + 0.015 * sc);
    fuselage.add(fpvLens);
    // Quad has front orange accent stripe on nose
    const noseTip = new THREE.Mesh(
      new THREE.BoxGeometry(0.030 * sc, 0.006 * sc, 0.008 * sc),
      Materials.accentOrange
    );
    noseTip.position.set(0, -bodyH / 2 + 0.015 * sc, bodyL / 2 - 0.002 * sc);
    fuselage.add(noseTip);
  }

  // 5. REAR BATTERY CARTRIDGE
  const batW = bodyW * 0.68;
  const batL = 0.085 * sc;
  const batH = bodyH * 0.82;
  const batteryPack = new THREE.Mesh(new THREE.BoxGeometry(batW, batH, batL), Materials.darkGraphite);
  batteryPack.position.set(0, 0, -bodyL / 2 - batL / 2 + 0.018 * sc);
  fuselage.add(batteryPack);

  // Battery latch (orange accent)
  const latch = new THREE.Mesh(new THREE.BoxGeometry(batW * 0.38, 0.010 * sc, 0.022 * sc), Materials.accentOrange);
  latch.position.set(0, batH / 2, -bodyL / 2 - batL / 2 + 0.008 * sc);
  fuselage.add(latch);

  // 4-LED Battery Status Gauge
  for (let i = 0; i < 4; i++) {
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.014 * sc, 0.005 * sc, 0.007 * sc),
      Materials.ledGreen  // initial state: full green
    );
    led.position.set((-0.028 + i * 0.019) * sc, batH / 2 + 0.002, -bodyL / 2 - batL / 2 + 0.028 * sc);
    fuselage.add(led);
    parts.batteryLeds.push(led);
  }

  // 6. RTK GPS MODULE(S) on top
  const numRtk = type === "quadcopter" ? 1 : 2;
  const rtkPositions = type === "quadcopter"
    ? [{ x: 0 }]
    : [{ x: -0.048 * sc }, { x: 0.048 * sc }];

  rtkPositions.forEach(({ x }) => {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005 * sc, 0.005 * sc, 0.038 * sc, 8),
      Materials.darkGraphite
    );
    mast.position.set(x, bodyH / 2 + shellH + 0.019 * sc, -bodyL * 0.18);
    fuselage.add(mast);

    const puck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028 * sc, 0.028 * sc, 0.009 * sc, 16),
      Materials.silverAlloy
    );
    puck.position.set(x, bodyH / 2 + shellH + 0.038 * sc, -bodyL * 0.18);
    fuselage.add(puck);
  });

  // 7. TAIL ANTI-COLLISION STROBE
  const strobeMount = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005 * sc, 0.005 * sc, 0.018 * sc, 8),
    Materials.machinedAlloy
  );
  strobeMount.position.set(0, batH / 2 + 0.009 * sc, -bodyL / 2 - batL / 2);
  fuselage.add(strobeMount);

  const strobeLight = new THREE.Mesh(new THREE.SphereGeometry(0.009 * sc, 8, 8), Materials.strobe);
  strobeLight.position.set(0, batH / 2 + 0.020 * sc, -bodyL / 2 - batL / 2);
  fuselage.add(strobeLight);
  parts.tailStrobe = strobeLight;

  // 8. LANDING GEAR — professional skid design
  // Legs attach under the body at ±X. Struts angle outward, skids run fore-aft.
  const gearSpread = bodyW / 2 + 0.005 * sc;
  [-1, 1].forEach((side) => {
    const gearGroup = new THREE.Group();
    gearGroup.position.set(side * gearSpread, -bodyH / 2, 0);

    const strutH = 0.135 * sc;
    const strutR  = 0.008 * sc;
    const leanAngle = side * 0.18; // outward lean

    // Main strut (slightly angled outward)
    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(strutR * 0.75, strutR, strutH, 10),
      Materials.carbonFiber
    );
    strut.rotation.z = leanAngle;
    strut.position.set(side * strutH * Math.sin(Math.abs(leanAngle)) * 0.5, -strutH / 2, 0);
    gearGroup.add(strut);

    // Skid tube (fore-aft, ~1.5× body length)
    const skidLength = bodyL * 1.55;
    const skidGeo = new THREE.CylinderGeometry(strutR, strutR, skidLength, 10);
    skidGeo.rotateX(Math.PI / 2);
    const skid = new THREE.Mesh(skidGeo, Materials.darkGraphite);
    skid.position.set(side * strutH * Math.sin(Math.abs(leanAngle)), -strutH, 0);
    gearGroup.add(skid);

    // Rubber contact feet (front + rear of skid)
    [-skidLength * 0.42, skidLength * 0.42].forEach((zOffset) => {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(strutR * 1.35, strutR * 1.35, 0.018 * sc, 10),
        Materials.rubberPad
      );
      foot.rotation.x = Math.PI / 2;
      foot.position.set(side * strutH * Math.sin(Math.abs(leanAngle)), -strutH, zOffset);
      gearGroup.add(foot);
    });

    fuselage.add(gearGroup);
  });

  root.add(fuselage);
  return parts;
}

// ------------------------------------------------------------------
// ARMS, MOTORS & PROPELLERS
// ------------------------------------------------------------------
function buildArmsAndMotors(
  root: THREE.Group,
  motorsDef: MotorDef[],
  type: "quadcopter" | "hexacopter" | "octacopter",
  parts: AircraftModelParts
) {
  const sc = type === "quadcopter" ? 1.0 : type === "hexacopter" ? 1.35 : 1.70;

  // Arm cross-section — flat rectangular tubes (aerodynamic / structural)
  const armW  = 0.018 * sc;  // width (narrow edge)
  const armH  = 0.022 * sc;  // height (tall edge — stiffer in bending)
  const motorR = 0.042 * sc; // motor bell radius

  // Compute propeller radius = half inter-motor distance minus 5% safety gap
  let minMotorDistance = Infinity;
  for (let i = 0; i < motorsDef.length; i++) {
    for (let j = i + 1; j < motorsDef.length; j++) {
      const dx = motorsDef[i].position.x - motorsDef[j].position.x;
      const dz = motorsDef[i].position.z - motorsDef[j].position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minMotorDistance) minMotorDistance = dist;
    }
  }
  const propRadius = minMotorDistance * 0.46;  // 4% clearance on each side

  // Identify the two front-most motors for orange safety stripes
  const sortedByZ = [...motorsDef].sort((a, b) => b.position.z - a.position.z);
  const frontIndices = new Set([sortedByZ[0].index, sortedByZ[1 < motorsDef.length ? 1 : 0].index]);

  motorsDef.forEach((motor) => {
    const armGroup = new THREE.Group();

    const vec = new THREE.Vector3(motor.position.x, 0, motor.position.z);
    const armLength = vec.length();
    const angle = Math.atan2(vec.x, vec.z);

    armGroup.position.y = motor.position.y || 0;
    armGroup.rotation.y = angle;

    // ── Arm root reinforcement knuckle ───────────────────────────
    // Visual start of arm: slight distance from body centre
    const knuckleZ = 0.055 * sc;
    const knuckle = new THREE.Mesh(
      new THREE.BoxGeometry(armW * 1.6, armH * 1.5, 0.038 * sc),
      Materials.machinedAlloy
    );
    knuckle.position.z = knuckleZ;
    armGroup.add(knuckle);

    // ── Main arm tube ─────────────────────────────────────────────
    const usableLength = armLength - knuckleZ - motorR * 1.1;
    const armMesh = new THREE.Mesh(
      new THREE.BoxGeometry(armW, armH, usableLength),
      Materials.carbonFiber
    );
    armMesh.position.z = knuckleZ + usableLength / 2;
    armMesh.castShadow = true;
    armGroup.add(armMesh);

    // Arm mid-section reinforcement band (dark detail ring)
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(armW * 1.08, armH * 1.08, 0.018 * sc),
      Materials.darkGraphite
    );
    band.position.z = knuckleZ + usableLength * 0.78;
    armGroup.add(band);

    // Front arms: safety orange stripe near tip
    if (frontIndices.has(motor.index)) {
      const orange = new THREE.Mesh(
        new THREE.BoxGeometry(armW * 1.10, armH * 1.10, 0.013 * sc),
        Materials.accentOrange
      );
      orange.position.z = knuckleZ + usableLength * 0.83;
      armGroup.add(orange);
    }

    // ── Motor mount plate ─────────────────────────────────────────
    const motorMountPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(motorR * 1.15, motorR * 0.92, 0.018 * sc, 18),
      Materials.machinedAlloy
    );
    motorMountPlate.position.set(0, armH / 2 + 0.009 * sc, armLength);
    armGroup.add(motorMountPlate);

    // Stator (lower fixed part of brushless motor)
    const stator = new THREE.Mesh(
      new THREE.CylinderGeometry(motorR * 0.75, motorR * 0.75, 0.018 * sc, 22),
      Materials.darkGraphite
    );
    stator.position.set(0, armH / 2 + 0.022 * sc, armLength);
    armGroup.add(stator);

    // Motor bell (rotating outer can — silver)
    const bell = new THREE.Mesh(
      new THREE.CylinderGeometry(motorR, motorR, 0.024 * sc, 22),
      Materials.silverAlloy
    );
    bell.position.set(0, armH / 2 + 0.038 * sc, armLength);
    armGroup.add(bell);

    // Motor shaft stub
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004 * sc, 0.004 * sc, 0.018 * sc, 8),
      Materials.machinedAlloy
    );
    shaft.position.set(0, armH / 2 + 0.056 * sc, armLength);
    armGroup.add(shaft);

    // ── Propeller assembly ────────────────────────────────────────
    const propGroup = new THREE.Group();
    propGroup.position.set(0, armH / 2 + 0.062 * sc, armLength);

    // Prop hub
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010 * sc, 0.010 * sc, 0.009 * sc, 14),
      Materials.darkGraphite
    );
    propGroup.add(hub);

    // Prop spinner cap (orange accent)
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005 * sc, 0.005 * sc, 0.005 * sc, 10),
      Materials.accentOrange
    );
    cap.position.y = 0.007 * sc;
    propGroup.add(cap);

    // Aerodynamic two-blade propeller
    // Blade: tapers from thick root to thin tip, slight twist
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0.009 * sc);
    bladeShape.quadraticCurveTo(propRadius * 0.35, 0.028 * sc, propRadius, 0.006 * sc);
    bladeShape.lineTo(propRadius, -0.006 * sc);
    bladeShape.quadraticCurveTo(propRadius * 0.35, -0.018 * sc, 0, -0.009 * sc);

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.003 * sc, bevelEnabled: true,
      bevelSize: 0.001 * sc, bevelThickness: 0.001 * sc,
      bevelSegments: 2, steps: 1,
    });
    bladeGeo.center();

    const blade1 = new THREE.Mesh(bladeGeo, Materials.propeller);
    blade1.position.x = propRadius / 2;
    blade1.rotation.x = 0.16;  // aerodynamic pitch angle
    blade1.castShadow = true;
    propGroup.add(blade1);

    const blade2 = new THREE.Mesh(bladeGeo, Materials.propeller);
    blade2.position.x = -propRadius / 2;
    blade2.rotation.z = Math.PI;
    blade2.rotation.x = 0.16;
    blade2.castShadow = true;
    propGroup.add(blade2);

    armGroup.add(propGroup);

    parts.propellers.push({
      bladeGroup: propGroup,
      direction:  motor.direction,
      motorIndex: motor.index,
    });

    root.add(armGroup);
  });
}

// ------------------------------------------------------------------
// MAIN BUILDER ENTRY POINT
// ------------------------------------------------------------------
export function buildProfessionalUAV(
  type: "quadcopter" | "hexacopter" | "octacopter",
  customMotors?: MotorDef[]
): AircraftModelParts {
  const rootGroup = new THREE.Group();

  const parts = buildUnifiedFuselage(type, rootGroup);

  // Use provided motor positions (from Digital Twin) or sensible defaults
  let motors = customMotors;
  if (!motors || motors.length === 0) {
    const count  = type === "quadcopter" ? 4 : type === "hexacopter" ? 6 : 8;
    // Motor radius matches drone-definitions.ts: Quad=0.48, Hexa=0.55, Octa=0.65
    const radius = type === "quadcopter" ? 0.48 : type === "hexacopter" ? 0.55 : 0.65;
    // Angular offset for X-configuration (Quad: 45°, Hexa: 30°, Octa: 22.5°)
    const offset = type === "quadcopter" ? Math.PI / 4 : type === "hexacopter" ? Math.PI / 6 : Math.PI / 8;

    motors = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + offset;
      motors.push({
        index:     i,
        position:  { x: Math.sin(angle) * radius, y: 0.12, z: Math.cos(angle) * radius },
        direction: i % 2 === 0 ? 1 : -1,
      });
    }
  }

  buildArmsAndMotors(rootGroup, motors, type, parts);

  return parts;
}
