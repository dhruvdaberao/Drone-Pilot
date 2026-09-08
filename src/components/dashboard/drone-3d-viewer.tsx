"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Drone3DViewerProps {
  type: string; // "quadcopter" | "hexacopter" | "octacopter"
  isSelected?: boolean;
  autoRotate?: boolean;
  interactive?: boolean;
  className?: string;
}

export function Drone3DViewer({
  type,
  isSelected = false,
  autoRotate = true,
  interactive = true,
  className = "",
}: Drone3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectedRef = useRef(isSelected);
  const [, setIsInteracting] = useState(false);

  useEffect(() => {
    isSelectedRef.current = isSelected;
  }, [isSelected]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // SCENE & CAMERA
    const scene = new THREE.Scene();

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Framed with generous clearance so all airframes and rotating props fit comfortably with zero clipping
    camera.position.set(0, 3.4, 5.8);
    camera.lookAt(0, -0.05, 0);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    // STUDIO AEROSPACE LIGHTING - High dynamic range and rich specular contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Primary Key Sunlight (warm directional highlight)
    const keyLight = new THREE.DirectionalLight(0xfff6ec, 3.0);
    keyLight.position.set(6, 10, 6);
    scene.add(keyLight);

    // Secondary Fill Light (cool sky tone)
    const fillLight = new THREE.DirectionalLight(0xd2e3fc, 1.3);
    fillLight.position.set(-6, 4, 3);
    scene.add(fillLight);

    // Aerospace Rim Kicker (brilliant edge highlights for carbon curves)
    const rimLight = new THREE.DirectionalLight(0xffeedd, 2.6);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    // Soft Warm Ground Bounce
    const groundBounce = new THREE.DirectionalLight(0xff9944, 0.7);
    groundBounce.position.set(0, -4, 2);
    scene.add(groundBounce);

    // REALISTIC AEROSPACE UAV MATERIALS
    // Real commercial UAV composite body (stealth charcoal / titanium)
    const compositeHullMat = new THREE.MeshStandardMaterial({
      color: 0x1b1e23,
      roughness: 0.30,
      metalness: 0.52,
    });

    // Sleek dark titanium aerospace trim
    const stealthDarkTrim = new THREE.MeshStandardMaterial({
      color: 0x292d34,
      roughness: 0.20,
      metalness: 0.85,
    });

    // Matte 3K carbon-fiber arms & structural tubes
    const carbonArmMat = new THREE.MeshStandardMaterial({
      color: 0x101114,
      roughness: 0.45,
      metalness: 0.35,
    });

    // Brushed CNC aluminum motor bells & clamp bulkheads
    const motorBellMat = new THREE.MeshStandardMaterial({
      color: 0x4c5058,
      roughness: 0.16,
      metalness: 0.90,
    });

    // Precision motor copper coils / accent ring
    const copperRingMat = new THREE.MeshStandardMaterial({
      color: 0xc26928,
      roughness: 0.25,
      metalness: 0.92,
    });

    // Aerodynamic composite propeller blades (high-contrast dark graphite)
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x202226,
      roughness: 0.30,
      metalness: 0.25,
    });

    // Safety tip stripe on propeller tips (FAA aviation standard)
    const bladeTipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Optical glass camera lens
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x001122,
      emissive: 0x00ccee,
      emissiveIntensity: 0.65,
      roughness: 0.05,
      metalness: 0.95,
    });

    // High-impact rubber shock dampers
    const rubberFootMat = new THREE.MeshStandardMaterial({
      color: 0x141518,
      roughness: 0.85,
      metalness: 0.05,
    });

    // FAA standard aviation LEDs
    const ledGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // Starboard (Right)
    const ledRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });   // Port (Left)
    const ledWhite = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Rear Strobe

    // ROOT DRONE HANGAR GROUP
    const droneGroup = new THREE.Group();
    scene.add(droneGroup);

    // Ground Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.32)");
      grad.addColorStop(0.35, "rgba(0, 0, 0, 0.14)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.52;
    scene.add(shadowMesh);

    // ==========================================
    // 1. AERODYNAMIC STREAMLINED FUSELAGE (NOT BOXY)
    // ==========================================
    // Harmonious proportions so all 3 aircraft belong to the same visual scale
    const bodyLength = type === "octacopter" ? 1.05 : type === "hexacopter" ? 1.0 : 0.95;
    const bodyWidth = type === "octacopter" ? 0.72 : type === "hexacopter" ? 0.68 : 0.62;
    const bodyHeight = 0.24;

    // A) Central Contoured Monocoque Hull (Oval Cylindrical with aerodynamic bevels)
    const centerHullGeo = new THREE.CylinderGeometry(
      bodyWidth * 0.46,
      bodyWidth * 0.50,
      bodyHeight,
      24
    );
    const centerHull = new THREE.Mesh(centerHullGeo, compositeHullMat);
    centerHull.scale.set(1, 1, bodyLength / (bodyWidth * 0.5));
    droneGroup.add(centerHull);

    // B) Aerodynamic Streamlined Nose Cone (Smooth curved front)
    const noseGeo = new THREE.SphereGeometry(
      bodyWidth * 0.46,
      20,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.55
    );
    const nose = new THREE.Mesh(noseGeo, compositeHullMat);
    nose.rotation.x = Math.PI / 2;
    nose.scale.set(1, bodyLength * 0.35, 0.52);
    nose.position.set(0, 0, bodyLength * 0.38);
    droneGroup.add(nose);

    // Forward Stereo Obstacle Avoidance Cameras on Nose Cone
    [-0.12, 0.12].forEach((xOffset) => {
      const stereoCam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12),
        motorBellMat
      );
      stereoCam.rotation.x = Math.PI / 2;
      stereoCam.position.set(xOffset, 0.02, bodyLength * 0.48);
      droneGroup.add(stereoCam);

      const stereoLens = new THREE.Mesh(
        new THREE.CircleGeometry(0.025, 12),
        lensMat
      );
      stereoLens.position.set(xOffset, 0.02, bodyLength * 0.48 + 0.022);
      droneGroup.add(stereoLens);
    });

    // C) Tapered Aft Battery Section & Heat Exhaust Gills
    const tailGeo = new THREE.CylinderGeometry(
      bodyWidth * 0.45,
      bodyWidth * 0.32,
      bodyLength * 0.35,
      16
    );
    tailGeo.rotateX(Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, compositeHullMat);
    tail.position.set(0, 0.01, -bodyLength * 0.38);
    tail.scale.set(1, 0.58, 1);
    droneGroup.add(tail);

    // Quick-Release Battery Latch & Handle on Tail
    const latchGeo = new THREE.BoxGeometry(bodyWidth * 0.38, 0.06, 0.08);
    const latch = new THREE.Mesh(latchGeo, stealthDarkTrim);
    latch.position.set(0, 0.06, -bodyLength * 0.50);
    droneGroup.add(latch);

    // Rear Anti-Collision Beacon Strobe
    const rearBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), ledWhite);
    rearBeacon.position.set(0, 0.06, -bodyLength * 0.54);
    droneGroup.add(rearBeacon);

    // D) Dorsal Avionics Spine with Heat Dissipation Gills
    const dorsalSpineGeo = new THREE.CylinderGeometry(
      bodyWidth * 0.22,
      bodyWidth * 0.30,
      bodyLength * 0.75,
      16
    );
    dorsalSpineGeo.rotateX(Math.PI / 2);
    const dorsalSpine = new THREE.Mesh(dorsalSpineGeo, stealthDarkTrim);
    dorsalSpine.scale.set(1, 0.32, 1);
    dorsalSpine.position.set(0, bodyHeight / 2 + 0.03, -bodyLength * 0.04);
    droneGroup.add(dorsalSpine);

    // Dual High-Precision RTK GNSS Antenna Masts
    [-0.14, 0.14].forEach((xOffset) => {
      const gpsMast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8),
        carbonArmMat
      );
      gpsMast.position.set(xOffset, bodyHeight / 2 + 0.12, -bodyLength * 0.20);
      droneGroup.add(gpsMast);

      const gpsPuck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.095, 0.04, 16),
        stealthDarkTrim
      );
      gpsPuck.position.set(xOffset, bodyHeight / 2 + 0.21, -bodyLength * 0.20);
      droneGroup.add(gpsPuck);
    });

    // E) Ventral 3-Axis Stabilized 4K Optical Gimbal Turret
    const gimbalMount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12),
      motorBellMat
    );
    gimbalMount.position.set(0, -bodyHeight / 2 - 0.03, bodyLength * 0.36);
    droneGroup.add(gimbalMount);

    const gimbalArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.10, 8),
      carbonArmMat
    );
    gimbalArm.position.set(0, -bodyHeight / 2 - 0.09, bodyLength * 0.36);
    droneGroup.add(gimbalArm);

    const cameraHousing = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 14),
      compositeHullMat
    );
    cameraHousing.position.set(0, -bodyHeight / 2 - 0.16, bodyLength * 0.38);
    droneGroup.add(cameraHousing);

    const lensBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16),
      motorBellMat
    );
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.set(0, -bodyHeight / 2 - 0.16, bodyLength * 0.38 + 0.09);
    droneGroup.add(lensBarrel);

    const lensElement = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 16),
      lensMat
    );
    lensElement.position.set(0, -bodyHeight / 2 - 0.16, bodyLength * 0.38 + 0.116);
    droneGroup.add(lensElement);

    // ==========================================
    // 2. ROTOR ARMS WITH CNC BULKHEAD SOCKETS
    // ==========================================
    interface PropellerData {
      group: THREE.Group;
      direction: number; // 1 = CW, -1 = CCW
    }
    const propellerList: PropellerData[] = [];

    let armAngles: number[] = [];
    let armLength = 1.4;

    if (type === "quadcopter") {
      // Classic symmetrical 4-rotor X-frame (45°, 135°, 225°, 315°)
      armAngles = [
        Math.PI * 0.25, // Front-Right
        Math.PI * 0.75, // Rear-Right
        Math.PI * 1.25, // Rear-Left
        Math.PI * 1.75, // Front-Left
      ];
      armLength = 1.35;
    } else if (type === "hexacopter") {
      // 6-rotor radial configuration (every 60°)
      armAngles = [0, 1, 2, 3, 4, 5].map((i) => (i * Math.PI) / 3);
      armLength = 1.40;
    } else {
      // Octacopter: 8-rotor heavy lifter (every 45°)
      armAngles = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (i * Math.PI) / 4);
      armLength = 1.45;
    }

    armAngles.forEach((angle, idx) => {
      // Dedicated arm assembly rotated to its specific radial angle
      const armAssembly = new THREE.Group();
      armAssembly.rotation.y = angle;

      // CNC Machined Aluminum Bulkhead Arm Socket (Solid chassis joint)
      const socketGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.20, 12);
      const socket = new THREE.Mesh(socketGeo, motorBellMat);
      socket.rotation.z = Math.PI / 2;
      socket.position.x = bodyWidth * 0.38;
      armAssembly.add(socket);

      // 3K Matte Carbon Fiber Tubular Arm
      const armTubeGeo = new THREE.CylinderGeometry(0.038, 0.042, armLength, 10);
      const armTube = new THREE.Mesh(armTubeGeo, carbonArmMat);
      armTube.rotation.z = Math.PI / 2;
      armTube.position.x = armLength / 2;
      armAssembly.add(armTube);

      // Outer CNC Motor Mount Clamp Bracket
      const clampGeo = new THREE.BoxGeometry(0.16, 0.08, 0.09);
      const clamp = new THREE.Mesh(clampGeo, compositeHullMat);
      clamp.position.set(armLength, 0, 0);
      armAssembly.add(clamp);

      // High-Torque Brushless Outrunner Motor (Bell + Stator)
      const motorBaseGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.10, 16);
      const motorBase = new THREE.Mesh(motorBaseGeo, motorBellMat);
      motorBase.position.set(armLength, 0.07, 0);
      armAssembly.add(motorBase);

      const copperRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.03, 16),
        copperRingMat
      );
      copperRing.position.set(armLength, 0.04, 0);
      armAssembly.add(copperRing);

      // Motor Shaft Spindle
      const spindleGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.09, 8);
      const spindle = new THREE.Mesh(spindleGeo, motorBellMat);
      spindle.position.set(armLength, 0.15, 0);
      armAssembly.add(spindle);

      // Navigation LED on arm tip (Green on Right / Starboard, Red on Left / Port)
      const isRightSide = angle >= 0 && angle < Math.PI;
      const navLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        isRightSide ? ledGreen : ledRed
      );
      navLed.position.set(armLength + 0.12, 0.01, 0);
      armAssembly.add(navLed);

      // ==============================================
      // PROPELLER ATTACHED DIRECTLY TO THIS ARM
      // ==============================================
      const propGroup = new THREE.Group();
      propGroup.position.set(armLength, 0.16, 0);

      // Streamlined Propeller Hub Spinner Nut
      const hubNutGeo = new THREE.ConeGeometry(0.05, 0.08, 12);
      const hubNut = new THREE.Mesh(hubNutGeo, stealthDarkTrim);
      hubNut.position.y = 0.04;
      propGroup.add(hubNut);

      // 2 Aerodynamic Folding Carbon Blades
      const bladeRadius = type === "octacopter" ? 0.45 : type === "hexacopter" ? 0.50 : 0.55;

      [-1, 1].forEach((dir) => {
        const bladeHalfGeo = new THREE.BoxGeometry(bladeRadius * 0.9, 0.012, 0.07);
        const bladeMesh = new THREE.Mesh(bladeHalfGeo, bladeMat);
        bladeMesh.position.x = (dir * bladeRadius * 0.9) / 2;
        bladeMesh.rotation.x = dir * 0.14; // Aerodynamic pitch
        propGroup.add(bladeMesh);

        // High-contrast white safety tip band on blade edge
        const tipGeo = new THREE.BoxGeometry(bladeRadius * 0.16, 0.014, 0.072);
        const tipMesh = new THREE.Mesh(tipGeo, bladeTipMat);
        tipMesh.position.x = dir * (bladeRadius * 0.9 - (bladeRadius * 0.16) / 2);
        tipMesh.rotation.x = dir * 0.14;
        propGroup.add(tipMesh);
      });

      armAssembly.add(propGroup);

      // Alternating CW and CCW rotation to cancel aerodynamic torque
      const direction = idx % 2 === 0 ? 1 : -1;
      propellerList.push({ group: propGroup, direction });

      droneGroup.add(armAssembly);
    });

    // ==========================================
    // 3. INDUSTRIAL HEAVY-DUTY LANDING SKIDS
    // ==========================================
    // Unified industrial dual tubular landing skids mounted to chassis belly
    const landingGear = new THREE.Group();
    const skidSpacing = bodyWidth * 0.70;
    const skidLength = 1.35;

    [-skidSpacing, skidSpacing].forEach((zPos) => {
      // Horizontal carbon runner pipe
      const pipeGeo = new THREE.CylinderGeometry(0.03, 0.03, skidLength, 10);
      const pipe = new THREE.Mesh(pipeGeo, carbonArmMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(0, -0.46, zPos);
      landingGear.add(pipe);

      // Silicone rubber bumper end-caps on runner tips
      [-skidLength / 2, skidLength / 2].forEach((tipZ) => {
        const tipEnd = new THREE.Mesh(
          new THREE.SphereGeometry(0.038, 8, 8),
          rubberFootMat
        );
        tipEnd.position.set(0, -0.46, zPos + tipZ);
        landingGear.add(tipEnd);
      });

      // Structural carbon upright struts connecting runner directly to lower chassis
      [-bodyLength * 0.28, bodyLength * 0.28].forEach((xPos) => {
        const strutGeo = new THREE.CylinderGeometry(0.026, 0.028, 0.40, 8);
        const strut = new THREE.Mesh(strutGeo, carbonArmMat);
        strut.position.set(xPos, -0.23, zPos);
        strut.rotation.z = (xPos > 0 ? -1 : 1) * 0.10;
        landingGear.add(strut);

        // CNC chassis attachment bracket
        const bracket = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.04, 0.06),
          motorBellMat
        );
        bracket.position.set(xPos, -0.05, zPos * 0.85);
        landingGear.add(bracket);
      });
    });

    droneGroup.add(landingGear);

    // Initial cinematic pitch and yaw
    droneGroup.rotation.x = 0.28;
    droneGroup.rotation.y = -0.65;

    // ==========================================
    // 4. TOUCH & MOUSE INTERACTION (360° ORBIT)
    // ==========================================
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let rotVelocityX = 0;
    let rotVelocityY = 0;
    const friction = 0.94;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      isDragging = true;
      setIsInteracting(true);
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevPointerX = clientX;
      prevPointerY = clientY;
      rotVelocityX = 0;
      rotVelocityY = 0;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevPointerX;
      const deltaY = clientY - prevPointerY;

      droneGroup.rotation.y += deltaX * 0.012;
      droneGroup.rotation.x += deltaY * 0.008;
      // Bounded pitch limits so model stays in full view at all times
      droneGroup.rotation.x = Math.max(-0.45, Math.min(0.65, droneGroup.rotation.x));

      rotVelocityY = deltaX * 0.008;
      rotVelocityX = deltaY * 0.005;

      prevPointerX = clientX;
      prevPointerY = clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
      setIsInteracting(false);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    domEl.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // RESIZE OBSERVER
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ==========================================
    // 5. ANIMATION LOOP & SELECTION FLIGHT DYNAMICS
    // ==========================================
    let animationId: number;
    const clock = new THREE.Clock();

    let currentElevY = 0;
    let currentPosZ = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Dynamic game-style vehicle selection elevation & forward glide
      const isCurrentSelected = isSelectedRef.current;
      const targetScale = isCurrentSelected ? 1.05 : 0.92;
      const targetElevY = isCurrentSelected ? 0.28 : 0;
      const targetPosZ = isCurrentSelected ? 0.20 : 0;

      droneGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);

      // Smooth mechanical elevation into the spotlight
      currentElevY += (targetElevY - currentElevY) * 0.08;
      currentPosZ += (targetPosZ - currentPosZ) * 0.08;
      droneGroup.position.z = currentPosZ;
      droneGroup.position.y = currentElevY + Math.sin(elapsed * 2.2) * (isCurrentSelected ? 0.03 : 0.015);

      // Propellers spool up to flight speed upon selection (like an engine spooling up!)
      const propSpeed = isCurrentSelected ? 34 : 22;
      propellerList.forEach((prop) => {
        prop.group.rotation.y += prop.direction * propSpeed * delta;
      });

      // Ground shadow expands and softens when the aircraft lifts off
      if (shadowMesh) {
        const shadowTargetScale = isCurrentSelected ? 1.25 : 1.0;
        shadowMesh.scale.lerp(new THREE.Vector3(shadowTargetScale, shadowTargetScale, 1), 0.08);
      }

      // Handle Damped Rotation or Auto-Turntable
      if (!isDragging) {
        if (Math.abs(rotVelocityY) > 0.0001) {
          droneGroup.rotation.y += rotVelocityY;
          rotVelocityY *= friction;
        } else if (autoRotate) {
          droneGroup.rotation.y += 0.005;
        }

        if (Math.abs(rotVelocityX) > 0.0001) {
          droneGroup.rotation.x = Math.max(-0.45, Math.min(0.65, droneGroup.rotation.x + rotVelocityX));
          rotVelocityX *= friction;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();

      domEl.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);

      domEl.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);

      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }

      renderer.dispose();
    };
  }, [type, autoRotate, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden ${className}`}
    />
  );
}
