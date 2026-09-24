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
// PROFESSIONAL AEROSPACE MATERIALS
// ------------------------------------------------------------------
const Materials = {
  silverAlloy: new THREE.MeshStandardMaterial({
    color: 0xcccccc, // Bright satin silver
    roughness: 0.35,
    metalness: 0.7,
  }),
  darkGraphite: new THREE.MeshStandardMaterial({
    color: 0x222428, // Dark graphite structural
    roughness: 0.5,
    metalness: 0.4,
  }),
  carbonFiber: new THREE.MeshStandardMaterial({
    color: 0x181a1f, // Carbon structural chassis
    roughness: 0.4,
    metalness: 0.3,
  }),
  machinedAlloy: new THREE.MeshStandardMaterial({
    color: 0x6b7280, // Darker titanium/alloy
    roughness: 0.3,
    metalness: 0.7,
  }),
  opticalGlass: new THREE.MeshPhysicalMaterial({
    color: 0x0a0c10,
    metalness: 0.9,
    roughness: 0.05,
    transmission: 0.9,
    thickness: 0.05,
    clearcoat: 1.0,
  }),
  accentOrange: new THREE.MeshStandardMaterial({
    color: 0xff5500, // Minimal orange accents
    roughness: 0.3,
    metalness: 0.2,
  }),
  rubberPad: new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.05,
  }),
  propeller: new THREE.MeshStandardMaterial({
    color: 0x151515,
    roughness: 0.35,
    metalness: 0.15,
  }),
  strobe: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  ledGreen: new THREE.MeshBasicMaterial({ color: 0x00e676 }),
};

// ------------------------------------------------------------------
// GEOMETRY UTILS
// ------------------------------------------------------------------
function createRoundedRectShape(w: number, l: number, r: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-w/2 + r, -l/2);
  shape.lineTo(w/2 - r, -l/2);
  shape.quadraticCurveTo(w/2, -l/2, w/2, -l/2 + r);
  shape.lineTo(w/2, l/2 - r);
  shape.quadraticCurveTo(w/2, l/2, w/2 - r, l/2);
  shape.lineTo(-w/2 + r, l/2);
  shape.quadraticCurveTo(-w/2, l/2, -w/2, l/2 - r);
  shape.lineTo(-w/2, -l/2 + r);
  shape.quadraticCurveTo(-w/2, -l/2, -w/2 + r, -l/2);
  return shape;
}

function buildGimbalAndCamera(scale: number): { gimbal: THREE.Group, pitch: THREE.Group } {
  const gimbalGroup = new THREE.Group();
  
  const baseMount = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * scale, 0.025 * scale, 0.015 * scale, 16), Materials.machinedAlloy);
  gimbalGroup.add(baseMount);

  const yawMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * scale, 0.018 * scale, 0.012 * scale, 16), Materials.darkGraphite);
  yawMotor.position.y = -0.012 * scale;
  gimbalGroup.add(yawMotor);

  const rollArm = new THREE.Mesh(new THREE.BoxGeometry(0.04 * scale, 0.01 * scale, 0.01 * scale), Materials.machinedAlloy);
  rollArm.position.set(0.015 * scale, -0.025 * scale, 0);
  gimbalGroup.add(rollArm);

  const rollMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.015 * scale, 0.015 * scale, 0.01 * scale, 16), Materials.darkGraphite);
  rollMotor.rotation.z = Math.PI / 2;
  rollMotor.position.set(0.035 * scale, -0.025 * scale, 0);
  gimbalGroup.add(rollMotor);

  const pitchGroup = new THREE.Group();
  pitchGroup.position.set(0.02 * scale, -0.025 * scale, 0);

  const cameraBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.035 * scale, 0.025 * scale, 0.045 * scale), 
    Materials.darkGraphite
  );
  cameraBody.position.set(-0.01 * scale, -0.01 * scale, 0.01 * scale);
  pitchGroup.add(cameraBody);

  const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014 * scale, 0.014 * scale, 0.015 * scale, 16), Materials.machinedAlloy);
  lensBarrel.rotation.x = Math.PI / 2;
  lensBarrel.position.set(-0.01 * scale, -0.01 * scale, 0.035 * scale);
  pitchGroup.add(lensBarrel);

  const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(0.012 * scale, 16), Materials.opticalGlass);
  lensGlass.position.set(-0.01 * scale, -0.01 * scale, 0.043 * scale);
  pitchGroup.add(lensGlass);

  gimbalGroup.add(pitchGroup);

  return { gimbal: gimbalGroup, pitch: pitchGroup };
}

// ------------------------------------------------------------------
// UNIFIED FUSELAGE FAMILY BUILDER
// ------------------------------------------------------------------
function buildUnifiedFuselage(type: "quadcopter" | "hexacopter" | "octacopter", root: THREE.Group): AircraftModelParts {
  const parts = { 
    batteryLeds: [] as THREE.Mesh[], 
    tailStrobe: null as THREE.Mesh|null, 
    gimbalGroup: null as THREE.Group|null, 
    cameraPitchGroup: null as THREE.Group|null, 
    propellers: [], 
    rootGroup: root 
  };
  
  const scale = type === "quadcopter" ? 1.0 : type === "hexacopter" ? 1.4 : 1.8;
  
  const fuselage = new THREE.Group();

  // Core dimensions (substantial, rectangular, heavy volume)
  const bodyW = 0.16 * scale;
  const bodyL = 0.22 * scale;
  const bodyH = 0.08 * scale;
  const cornerR = 0.02 * scale;

  // 1. MIDDLE: Dark Structural Chassis
  const chassisShape = createRoundedRectShape(bodyW, bodyL, cornerR);
  const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, { 
    depth: bodyH, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.005*scale, bevelThickness: 0.005*scale 
  });
  chassisGeo.center();
  chassisGeo.rotateX(Math.PI / 2); // Lay flat
  const chassis = new THREE.Mesh(chassisGeo, Materials.carbonFiber);
  fuselage.add(chassis);

  // 2. TOP: Smooth Silver Equipment Shell
  const shellW = bodyW * 0.9;
  const shellL = bodyL * 0.85;
  const shellH = 0.03 * scale;
  const shellShape = createRoundedRectShape(shellW, shellL, cornerR);
  const shellGeo = new THREE.ExtrudeGeometry(shellShape, { 
    depth: shellH, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.008*scale, bevelThickness: 0.008*scale 
  });
  shellGeo.center();
  shellGeo.rotateX(Math.PI / 2);
  const shell = new THREE.Mesh(shellGeo, Materials.silverAlloy);
  shell.position.y = bodyH/2 + shellH/2 - 0.002; 
  shell.castShadow = true;
  fuselage.add(shell);

  // Heat sink vents embedded in silver shell
  for (let i = -1; i <= 1; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(shellW * 0.4, 0.005 * scale, 0.01 * scale), Materials.machinedAlloy);
    vent.position.set(0, bodyH/2 + shellH, (i * 0.02) * scale);
    fuselage.add(vent);
  }

  // 3. BOTTOM: Payload & Sensor Interface Bay
  const bayW = bodyW * 0.6;
  const bayL = bodyL * 0.6;
  const bayH = 0.02 * scale;
  const bay = new THREE.Mesh(new THREE.BoxGeometry(bayW, bayH, bayL), Materials.darkGraphite);
  bay.position.y = -bodyH/2 - bayH/2;
  fuselage.add(bay);

  // Payload: Gimbal or Fixed Sensors
  if (type === "hexacopter" || type === "octacopter") {
    const { gimbal, pitch } = buildGimbalAndCamera(scale * 0.8);
    gimbal.position.set(0, -bodyH/2 - bayH, bodyL * 0.1);
    fuselage.add(gimbal);
    parts.gimbalGroup = gimbal;
    parts.cameraPitchGroup = pitch;
  } else {
    // Quad uses smaller fixed nose FPV
    const fpvMount = new THREE.Mesh(new THREE.BoxGeometry(0.03*scale, 0.03*scale, 0.03*scale), Materials.darkGraphite);
    fpvMount.position.set(0, -bodyH/2, bodyL/2);
    fuselage.add(fpvMount);
    const fpvLens = new THREE.Mesh(new THREE.CircleGeometry(0.01*scale, 16), Materials.opticalGlass);
    fpvLens.position.set(0, -bodyH/2, bodyL/2 + 0.016*scale);
    fuselage.add(fpvLens);
  }

  // 4. REAR: Heavy Battery Cartridge
  const batW = bodyW * 0.7;
  const batL = 0.08 * scale;
  const batH = bodyH * 0.8;
  const batteryPack = new THREE.Mesh(new THREE.BoxGeometry(batW, batH, batL), Materials.darkGraphite);
  batteryPack.position.set(0, 0, -bodyL/2 - batL/2 + 0.02*scale);
  fuselage.add(batteryPack);

  const latch = new THREE.Mesh(new THREE.BoxGeometry(batW * 0.4, 0.01*scale, 0.02*scale), Materials.accentOrange);
  latch.position.set(0, batH/2, -bodyL/2 - batL/2 + 0.01*scale);
  fuselage.add(latch);

  // 4-LED Battery Gauge
  for (let i = 0; i < 4; i++) {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.015*scale, 0.005*scale, 0.008*scale), Materials.ledGreen);
    led.position.set((-0.03 + i*0.02)*scale, batH/2 + 0.002, -bodyL/2 - batL/2 + 0.03*scale);
    fuselage.add(led);
    parts.batteryLeds.push(led);
  }

  // 5. TOP: RTK GPS Modules
  const numRtk = type === "quadcopter" ? 1 : 2;
  const rtkX = type === "quadcopter" ? [0] : [-0.05 * scale, 0.05 * scale];
  rtkX.forEach(x => {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.006*scale, 0.006*scale, 0.04*scale, 8), Materials.darkGraphite);
    mast.position.set(x, bodyH/2 + shellH + 0.02*scale, -bodyL*0.2);
    fuselage.add(mast);
    
    const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.03*scale, 0.03*scale, 0.01*scale, 16), Materials.silverAlloy);
    puck.position.set(x, bodyH/2 + shellH + 0.04*scale, -bodyL*0.2);
    fuselage.add(puck);
  });

  // 6. TAIL STROBE (Mounted on top of battery)
  const strobeMount = new THREE.Mesh(new THREE.CylinderGeometry(0.006*scale, 0.006*scale, 0.02*scale, 8), Materials.machinedAlloy);
  strobeMount.position.set(0, batH/2 + 0.01*scale, -bodyL/2 - batL/2);
  fuselage.add(strobeMount);

  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.01*scale, 8, 8), Materials.strobe);
  strobe.position.set(0, batH/2 + 0.02*scale, -bodyL/2 - batL/2);
  fuselage.add(strobe);
  parts.tailStrobe = strobe;

  // 7. LANDING GEAR (Consistent structural family)
  // Legs attach to the sides of the lower chassis
  [-bodyW/2 + 0.01*scale, bodyW/2 - 0.01*scale].forEach(x => {
    const isLeft = x < 0;
    const gearGroup = new THREE.Group();
    gearGroup.position.set(x, -bodyH/2, 0);

    const strutH = 0.12 * scale; // Shortened landing gear for realistic proportions
    const strutThick = 0.015 * scale;
    const strutGeo = new THREE.CylinderGeometry(strutThick*0.8, strutThick, strutH, 12);
    const strut = new THREE.Mesh(strutGeo, Materials.carbonFiber);
    // Angle outwards
    strut.rotation.z = isLeft ? -0.15 : 0.15;
    strut.position.set(isLeft ? -strutH*0.075 : strutH*0.075, -strutH/2, 0);
    gearGroup.add(strut);

    // Thick Carbon Skids
    const skidL = bodyL * 1.5;
    const skidGeo = new THREE.CylinderGeometry(strutThick, strutThick, skidL, 12);
    skidGeo.rotateX(Math.PI / 2);
    const skid = new THREE.Mesh(skidGeo, Materials.darkGraphite);
    skid.position.set(isLeft ? -strutH*0.15 : strutH*0.15, -strutH, 0);
    gearGroup.add(skid);

    // Rubber Feet
    [-skidL*0.4, skidL*0.4].forEach(z => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(strutThick*1.2, strutThick*1.2, 0.02*scale, 12), Materials.rubberPad);
      foot.rotation.x = Math.PI/2;
      foot.position.set(isLeft ? -strutH*0.15 : strutH*0.15, -strutH, z);
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
  const scale = type === "quadcopter" ? 1.0 : type === "hexacopter" ? 1.4 : 1.8;
  // Significantly thinner, structural arms
  const armW = 0.02 * scale;
  const armH = 0.025 * scale;
  const motorRadius = 0.045 * scale;

  // 1. Calculate minimum distance between any two motors to ensure props NEVER overlap
  let minDistance = Infinity;
  for (let i = 0; i < motorsDef.length; i++) {
    for (let j = i + 1; j < motorsDef.length; j++) {
      const dx = motorsDef[i].position.x - motorsDef[j].position.x;
      const dz = motorsDef[i].position.z - motorsDef[j].position.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < minDistance) minDistance = dist;
    }
  }
  // Max prop radius is half the distance, minus a larger 5% safety gap for visual separation
  const propRadius = minDistance * 0.47; 

  // 2. Identify the TWO front-most motors for the orange safety stripes
  const sortedMotors = [...motorsDef].sort((a, b) => b.position.z - a.position.z);
  const frontMotorIndices = new Set([sortedMotors[0].index, sortedMotors[1].index]);

  motorsDef.forEach(motor => {
    const armGroup = new THREE.Group();
    const vec = new THREE.Vector3(motor.position.x, motor.position.y, motor.position.z);
    
    armGroup.position.y = vec.y;
    vec.y = 0; 
    const length = vec.length();
    const angle = Math.atan2(vec.x, vec.z);
    armGroup.rotation.y = angle;

    // Body Mount Point (Thick reinforced knuckle)
    const knuckleRadius = 0.06 * scale; // How far from center the arm starts visually
    const knuckle = new THREE.Mesh(new THREE.BoxGeometry(armW*1.4, armH*1.2, 0.04*scale), Materials.machinedAlloy);
    knuckle.position.z = knuckleRadius;
    armGroup.add(knuckle);

    // Carbon Fiber Arm (Rectangular / Aerodynamic)
    const armLen = length - knuckleRadius;
    const armGeo = new THREE.BoxGeometry(armW, armH, armLen);
    const arm = new THREE.Mesh(armGeo, Materials.carbonFiber);
    arm.position.z = knuckleRadius + armLen / 2;
    arm.castShadow = true;
    armGroup.add(arm);

    // Fasteners / Details on arm
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(armW*1.05, armH*1.05, 0.02*scale), Materials.darkGraphite);
    stripe.position.z = knuckleRadius + armLen * 0.8;
    armGroup.add(stripe);

    if (frontMotorIndices.has(motor.index)) { // Strictly the front two arms
      const orangeStripe = new THREE.Mesh(new THREE.BoxGeometry(armW*1.06, armH*1.06, 0.015*scale), Materials.accentOrange);
      orangeStripe.position.z = knuckleRadius + armLen * 0.84;
      armGroup.add(orangeStripe);
    }

    // Motor Mount / Base
    const motorMount = new THREE.Mesh(new THREE.CylinderGeometry(motorRadius * 1.1, motorRadius * 0.9, 0.02*scale, 16), Materials.machinedAlloy);
    motorMount.position.set(0, armH/2, length);
    armGroup.add(motorMount);

    // Professional Brushless Motor
    const stator = new THREE.Mesh(new THREE.CylinderGeometry(motorRadius * 0.8, motorRadius * 0.8, 0.02*scale, 24), Materials.darkGraphite);
    stator.position.set(0, armH/2 + 0.02*scale, length);
    armGroup.add(stator);

    const bell = new THREE.Mesh(new THREE.CylinderGeometry(motorRadius, motorRadius, 0.025*scale, 24), Materials.silverAlloy);
    bell.position.set(0, armH/2 + 0.04*scale, length);
    armGroup.add(bell);

    // Motor Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.005*scale, 0.005*scale, 0.02*scale, 8), Materials.machinedAlloy);
    shaft.position.set(0, armH/2 + 0.06*scale, length);
    armGroup.add(shaft);

    // Propeller Assembly
    const propGroup = new THREE.Group();
    propGroup.position.set(0, armH/2 + 0.065*scale, length);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.012*scale, 0.012*scale, 0.01*scale, 16), Materials.darkGraphite);
    propGroup.add(hub);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.006*scale, 0.006*scale, 0.005*scale, 12), Materials.accentOrange);
    cap.position.y = 0.006*scale;
    propGroup.add(cap);

    // Aerodynamic Blades (Realistic two-blade)
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0.008*scale);
    bladeShape.quadraticCurveTo(propRadius * 0.4, 0.025*scale, propRadius, 0.005*scale);
    bladeShape.lineTo(propRadius, -0.005*scale);
    bladeShape.quadraticCurveTo(propRadius * 0.4, -0.015*scale, 0, -0.008*scale);

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.002*scale, bevelEnabled: true, bevelSize: 0.001*scale, bevelThickness: 0.001*scale, bevelSegments: 2, steps: 1 });
    bladeGeo.center();

    const blade1 = new THREE.Mesh(bladeGeo, Materials.propeller);
    blade1.position.x = propRadius / 2;
    blade1.rotation.x = 0.15; // pitch
    blade1.castShadow = true;
    propGroup.add(blade1);

    const blade2 = new THREE.Mesh(bladeGeo, Materials.propeller);
    blade2.position.x = -propRadius / 2;
    blade2.rotation.z = Math.PI;
    blade2.rotation.x = 0.15;
    blade2.castShadow = true;
    propGroup.add(blade2);

    armGroup.add(propGroup);
    
    parts.propellers.push({
      bladeGroup: propGroup,
      direction: motor.direction,
      motorIndex: motor.index
    });

    root.add(armGroup);
  });
}

// ------------------------------------------------------------------
// MAIN BUILDER FUNCTION
// ------------------------------------------------------------------
export function buildProfessionalUAV(
  type: "quadcopter" | "hexacopter" | "octacopter", 
  customMotors?: MotorDef[]
): AircraftModelParts {
  const rootGroup = new THREE.Group();
  
  const parts = buildUnifiedFuselage(type, rootGroup);

  let motors = customMotors;
  if (!motors) {
    motors = [];
    const count = type === "quadcopter" ? 4 : type === "hexacopter" ? 6 : 8;
    // Set realistic arm length to ensure a massive industrial footprint
    const radius = type === "quadcopter" ? 0.45 : type === "hexacopter" ? 0.75 : 1.10;
    const offset = type === "quadcopter" ? Math.PI/4 : type === "hexacopter" ? Math.PI/6 : Math.PI/8;
    
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + offset;
      motors.push({
        index: i,
        position: { x: Math.sin(angle) * radius, y: 0, z: Math.cos(angle) * radius },
        direction: i % 2 === 0 ? 1 : -1
      });
    }
  }

  buildArmsAndMotors(rootGroup, motors, type, parts);

  return parts;
}

