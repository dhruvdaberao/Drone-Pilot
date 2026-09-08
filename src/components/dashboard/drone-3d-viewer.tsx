"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { DroneType } from "@/types/drone";
import { RotateCw } from "lucide-react";

interface Drone3DViewerProps {
  type: DroneType;
  isSelected?: boolean;
  className?: string;
  autoRotate?: boolean;
  interactive?: boolean;
}

export function Drone3DViewer({
  type,
  isSelected = false,
  className = "",
  autoRotate = true,
  interactive = true,
}: Drone3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectedRef = useRef(isSelected);
  isSelectedRef.current = isSelected;
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // SCENE & CAMERA
    const scene = new THREE.Scene();

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Position camera for cinematic three-quarter aerial cockpit view
    camera.position.set(0, 2.8, 4.4);
    camera.lookAt(0, 0, 0);

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

    // STUDIO AEROSPACE LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    // Key directional sunlight
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    // Cool fill light for carbon fiber specular highlights
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.4);
    fillLight.position.set(-5, 3, 2);
    scene.add(fillLight);

    // Aerospace rim backlight
    const rimLight = new THREE.DirectionalLight(0xffedd5, 2.0);
    rimLight.position.set(0, 4, -6);
    scene.add(rimLight);

    // REALISTIC AEROSPACE UAV MATERIALS
    // Real commercial UAV composite body (stealth charcoal / titanium)
    const compositeHullMat = new THREE.MeshStandardMaterial({
      color: 0x1f2328,
      roughness: 0.38,
      metalness: 0.45,
    });

    // Sleek dark titanium aerospace trim
    const stealthDarkTrim = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.28,
      metalness: 0.8,
    });

    // Matte 3K carbon-fiber arms
    const carbonArmMat = new THREE.MeshStandardMaterial({
      color: 0x111214,
      roughness: 0.65,
      metalness: 0.25,
    });

    // Brushed CNC aluminum motor bells
    const motorBellMat = new THREE.MeshStandardMaterial({
      color: 0x4a4d52,
      roughness: 0.2,
      metalness: 0.85,
    });

    // Precision motor copper coils / accent ring
    const copperRingMat = new THREE.MeshStandardMaterial({
      color: 0xc26928,
      roughness: 0.3,
      metalness: 0.9,
    });

    // Aerodynamic composite propeller blades (high-contrast dark graphite)
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.35,
      metalness: 0.2,
    });

    // Safety tip stripe on propeller tips (like real aeronautical props)
    const bladeTipMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f7 });

    // Optical glass camera lens
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x001122,
      emissive: 0x00bbcc,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9,
    });

    // FAA standard aviation LEDs
    const ledGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // Starboard (Right)
    const ledRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });   // Port (Left)
    const ledWhite = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Rear Strobe

    // ROOT DRONE HANGAR GROUP
    const droneGroup = new THREE.Group();
    scene.add(droneGroup);

    // Ground Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.28)");
      grad.addColorStop(0.35, "rgba(0, 0, 0, 0.12)");
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
    shadowMesh.position.y = -0.85;
    scene.add(shadowMesh);

    // ==========================================
    // 1. AERODYNAMIC FUSELAGE / CHASSIS
    // ==========================================
    const bodyLength = type === "octacopter" ? 1.3 : type === "hexacopter" ? 1.15 : 1.0;
    const bodyWidth = type === "octacopter" ? 0.9 : type === "hexacopter" ? 0.8 : 0.68;
    const bodyHeight = 0.28;

    // Main composite central canopy (streamlined, modern UAV shape)
    const canopyGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
    const canopy = new THREE.Mesh(canopyGeo, compositeHullMat);
    droneGroup.add(canopy);

    // Top aerodynamic hood cover with aerospace orange racing stripe
    const topHoodGeo = new THREE.BoxGeometry(bodyWidth * 0.75, 0.08, bodyLength * 0.85);
    const topHood = new THREE.Mesh(topHoodGeo, compositeHullMat);
    topHood.position.y = bodyHeight / 2 + 0.04;
    droneGroup.add(topHood);

    const stripeGeo = new THREE.BoxGeometry(bodyWidth * 0.25, 0.09, bodyLength * 0.86);
    const stripe = new THREE.Mesh(stripeGeo, stealthDarkTrim);
    stripe.position.y = bodyHeight / 2 + 0.045;
    droneGroup.add(stripe);

    // GPS/GNSS Navigation Puck on central mast
    const gpsMastGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8);
    const gpsMast = new THREE.Mesh(gpsMastGeo, carbonArmMat);
    gpsMast.position.set(0, bodyHeight / 2 + 0.15, -bodyLength * 0.22);
    droneGroup.add(gpsMast);

    const gpsPuckGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.05, 16);
    const gpsPuck = new THREE.Mesh(gpsPuckGeo, compositeHullMat);
    gpsPuck.position.set(0, bodyHeight / 2 + 0.26, -bodyLength * 0.22);
    droneGroup.add(gpsPuck);

    // Front 3-Axis Stabilized Gimbal & Optical Camera
    const gimbalArmGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8);
    const gimbalArm = new THREE.Mesh(gimbalArmGeo, carbonArmMat);
    gimbalArm.position.set(0, -bodyHeight / 2 - 0.06, bodyLength * 0.42);
    droneGroup.add(gimbalArm);

    const cameraHousingGeo = new THREE.SphereGeometry(0.14, 16, 14);
    const cameraHousing = new THREE.Mesh(cameraHousingGeo, compositeHullMat);
    cameraHousing.position.set(0, -bodyHeight / 2 - 0.14, bodyLength * 0.44);
    droneGroup.add(cameraHousing);

    const lensBarrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
    const lensBarrel = new THREE.Mesh(lensBarrelGeo, motorBellMat);
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.set(0, -bodyHeight / 2 - 0.14, bodyLength * 0.44 + 0.11);
    droneGroup.add(lensBarrel);

    const lensElement = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 16),
      lensMat
    );
    lensElement.position.set(0, -bodyHeight / 2 - 0.14, bodyLength * 0.44 + 0.142);
    droneGroup.add(lensElement);

    // Rear Battery Bay & Cooling Exhaust Gills
    const exhaustGeo = new THREE.BoxGeometry(bodyWidth * 0.5, 0.12, 0.08);
    const exhaust = new THREE.Mesh(exhaustGeo, motorBellMat);
    exhaust.position.set(0, 0, -bodyLength / 2 - 0.03);
    droneGroup.add(exhaust);

    // Rear Anti-Collision Beacon LED
    const rearBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), ledWhite);
    rearBeacon.position.set(0, 0.08, -bodyLength / 2 - 0.06);
    droneGroup.add(rearBeacon);

    // ==========================================
    // 2. ROTOR ARMS, MOTORS & PROPELLERS
    // ==========================================
    interface PropellerData {
      group: THREE.Group;
      direction: number; // 1 = CW, -1 = CCW
    }
    const propellerList: PropellerData[] = [];

    let armAngles: number[] = [];
    let armLength = 1.6;

    if (type === "quadcopter") {
      // Classic symmetrical 4-rotor X-frame (45°, 135°, 225°, 315°)
      armAngles = [
        Math.PI * 0.25, // Front-Right
        Math.PI * 0.75, // Rear-Right
        Math.PI * 1.25, // Rear-Left
        Math.PI * 1.75, // Front-Left
      ];
      armLength = 1.65;
    } else if (type === "hexacopter") {
      // 6-rotor radial configuration (every 60°)
      armAngles = [0, 1, 2, 3, 4, 5].map((i) => (i * Math.PI) / 3);
      armLength = 1.8;
    } else {
      // Octacopter: 8-rotor heavy lifter (every 45°)
      armAngles = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (i * Math.PI) / 4);
      armLength = 1.95;
    }

    armAngles.forEach((angle, idx) => {
      // Dedicated arm assembly rotated to its specific radial angle
      const armAssembly = new THREE.Group();
      armAssembly.rotation.y = angle;

      // 3K Matte Carbon Fiber Arm Tube
      const armTubeGeo = new THREE.CylinderGeometry(0.04, 0.045, armLength, 10);
      const armTube = new THREE.Mesh(armTubeGeo, carbonArmMat);
      armTube.rotation.z = Math.PI / 2;
      armTube.position.x = armLength / 2;
      armAssembly.add(armTube);

      // CNC Motor Mount Clamp Bracket
      const clampGeo = new THREE.BoxGeometry(0.18, 0.09, 0.1);
      const clamp = new THREE.Mesh(clampGeo, compositeHullMat);
      clamp.position.set(armLength, 0, 0);
      armAssembly.add(clamp);

      // High-Torque Brushless Outrunner Motor
      const motorBaseGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.12, 16);
      const motorBase = new THREE.Mesh(motorBaseGeo, motorBellMat);
      motorBase.position.set(armLength, 0.08, 0);
      armAssembly.add(motorBase);

      const copperRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.135, 0.135, 0.03, 16),
        copperRingMat
      );
      copperRing.position.set(armLength, 0.05, 0);
      armAssembly.add(copperRing);

      // Motor Shaft Spindle
      const spindleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8);
      const spindle = new THREE.Mesh(spindleGeo, motorBellMat);
      spindle.position.set(armLength, 0.17, 0);
      armAssembly.add(spindle);

      // Navigation LED on arm tip (Green on Right / Starboard, Red on Left / Port)
      const isRightSide = angle >= 0 && angle < Math.PI;
      const navLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 8),
        isRightSide ? ledGreen : ledRed
      );
      navLed.position.set(armLength + 0.14, 0.01, 0);
      armAssembly.add(navLed);

      // ==============================================
      // PROPELLER ATTACHED DIRECTLY TO THIS ARM!
      // ==============================================
      const propGroup = new THREE.Group();
      propGroup.position.set(armLength, 0.18, 0);

      // Streamlined Propeller Hub Spinner Nut
      const hubNutGeo = new THREE.ConeGeometry(0.06, 0.09, 12);
      const hubNut = new THREE.Mesh(hubNutGeo, stealthDarkTrim);
      hubNut.position.y = 0.04;
      propGroup.add(hubNut);

      // 2 Realistic Aerodynamic Twisted Propeller Blades
      const bladeRadius = type === "octacopter" ? 0.75 : type === "hexacopter" ? 0.85 : 0.95;

      [-1, 1].forEach((dir) => {
        const bladeHalfGeo = new THREE.BoxGeometry(bladeRadius * 0.9, 0.012, 0.08);
        const bladeMesh = new THREE.Mesh(bladeHalfGeo, bladeMat);
        bladeMesh.position.x = (dir * bladeRadius * 0.9) / 2;
        // Aerodynamic pitch angle
        bladeMesh.rotation.x = dir * 0.14;
        propGroup.add(bladeMesh);

        // High-contrast white safety tip band on blade edge
        const tipGeo = new THREE.BoxGeometry(bladeRadius * 0.16, 0.014, 0.082);
        const tipMesh = new THREE.Mesh(tipGeo, bladeTipMat);
        tipMesh.position.x = dir * (bladeRadius * 0.9 - (bladeRadius * 0.16) / 2);
        tipMesh.rotation.x = dir * 0.14;
        propGroup.add(tipMesh);
      });

      // Add propeller to the armAssembly so it is locked to this arm's exact angle & location
      armAssembly.add(propGroup);

      // Register propeller with alternating counter-rotation (CW vs CCW)
      const rotationDir = idx % 2 === 0 ? 1 : -1;
      propellerList.push({ group: propGroup, direction: rotationDir });

      // Add the complete arm assembly to the drone
      droneGroup.add(armAssembly);
    });

    // ==========================================
    // 3. LANDING GEAR / SKIDS
    // ==========================================
    const landingGear = new THREE.Group();

    if (type === "quadcopter") {
      // 4 Individual Aerodynamic Carbon Landing Struts
      armAngles.forEach((angle) => {
        const strutArm = new THREE.Group();
        strutArm.rotation.y = angle;

        const legGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.48, 6);
        const leg = new THREE.Mesh(legGeo, carbonArmMat);
        leg.position.set(armLength * 0.65, -0.25, 0);
        leg.rotation.z = -0.28;
        strutArm.add(leg);

        // Rubber shock-absorbing foot pad
        const footGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const foot = new THREE.Mesh(footGeo, compositeHullMat);
        foot.position.set(armLength * 0.72, -0.48, 0);
        strutArm.add(foot);

        landingGear.add(strutArm);
      });
    } else {
      // Heavy-Duty Industrial Dual Landing Skids (DJI Matrice / Agras Style)
      const skidSpacing = bodyWidth * 0.85;
      const skidLength = armLength * 1.35;

      [-skidSpacing, skidSpacing].forEach((zPos) => {
        // Horizontal carbon skid pipe
        const pipeGeo = new THREE.CylinderGeometry(0.035, 0.035, skidLength, 8);
        const pipe = new THREE.Mesh(pipeGeo, carbonArmMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(0, -0.48, zPos);
        landingGear.add(pipe);

        // Curved bumper tip ends
        [-skidLength / 2, skidLength / 2].forEach((tipZ) => {
          const tipEnd = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            stealthDarkTrim
          );
          tipEnd.position.set(0, -0.48, zPos + tipZ);
          landingGear.add(tipEnd);
        });

        // Vertical strut leg supports
        [-bodyLength * 0.3, bodyLength * 0.3].forEach((xPos) => {
          const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.44, 6);
          const leg = new THREE.Mesh(legGeo, compositeHullMat);
          leg.position.set(xPos, -0.24, zPos);
          leg.rotation.z = (xPos > 0 ? -1 : 1) * 0.12;
          landingGear.add(leg);
        });
      });
    }
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
    const friction = 0.92;

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
      if (!isDragging || !interactive) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevPointerX;
      const deltaY = clientY - prevPointerY;

      droneGroup.rotation.y += deltaX * 0.012;
      droneGroup.rotation.x = Math.max(-0.6, Math.min(0.8, droneGroup.rotation.x + deltaY * 0.008));

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
    // 5. ANIMATION LOOP
    // ==========================================
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Spin EVERY propeller realistically on its own motor hub!
      const propSpeed = 26;
      propellerList.forEach((prop) => {
        prop.group.rotation.y += prop.direction * propSpeed * delta;
      });

      // Dynamic game-style elevation & scale when selected (drone comes closer & lifts up)
      const isCurrentSelected = isSelectedRef.current;
      const targetScale = isCurrentSelected ? 1.15 : 0.98;
      const targetElevY = isCurrentSelected ? 0.22 : 0;
      droneGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);

      // Subtle aerodynamic hover breathing combined with selection elevation
      droneGroup.position.y = targetElevY + Math.sin(elapsed * 2.2) * 0.04;

      // Handle Damped Rotation or Auto-Turntable
      if (!isDragging) {
        if (Math.abs(rotVelocityY) > 0.0001) {
          droneGroup.rotation.y += rotVelocityY;
          rotVelocityY *= friction;
        } else if (autoRotate) {
          droneGroup.rotation.y += 0.005;
        }

        if (Math.abs(rotVelocityX) > 0.0001) {
          droneGroup.rotation.x = Math.max(-0.6, Math.min(0.8, droneGroup.rotation.x + rotVelocityX));
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
