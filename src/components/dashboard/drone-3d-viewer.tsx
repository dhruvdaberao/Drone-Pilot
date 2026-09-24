"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

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
  const [isInteracting, setIsInteracting] = useState(false);
  
  // Track target rotation for smooth transitioning and parallax
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.15, y: -Math.PI / 6 });
  
  // Track internal state for smooth switching between platforms
  const currentTypeRef = useRef(type);
  const droneGroupRef = useRef<THREE.Group | null>(null);
  const targetTypeRef = useRef(type);

  useEffect(() => {
    isSelectedRef.current = isSelected;
  }, [isSelected]);

  useEffect(() => {
    targetTypeRef.current = type;
  }, [type]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // SCENE & CAMERA
    const scene = new THREE.Scene();
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    // Cinematic hero angle setup (slightly above, 3/4 front view)
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    // User requested the massive framing back, even if extreme angles clip slightly
    camera.position.set(0, 1.8, 5.5); 
    camera.lookAt(0, -0.2, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    // ==============================================
    // LIGHTING (Aerospace Product Presentation)
    // ==============================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0eeff, 1.8);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Sharp rim light for highlights on the composite edges
    const rimLight = new THREE.DirectionalLight(0xffffff, 3.0);
    rimLight.position.set(0, 5, -8);
    scene.add(rimLight);

    // ==============================================
    // PREMIUM MATERIALS
    // ==============================================
    
    // The sleek, premium silver body requested by the user
    const silverAlloy = new THREE.MeshStandardMaterial({
      color: 0xd1d5db, 
      roughness: 0.35,
      metalness: 0.85,
    });

    const matteComposite = new THREE.MeshStandardMaterial({
      color: 0x24262a, 
      roughness: 0.65,
      metalness: 0.3,
    });

    const satinBlack = new THREE.MeshStandardMaterial({
      color: 0x111112,
      roughness: 0.4,
      metalness: 0.4,
    });

    const machinedAlloy = new THREE.MeshStandardMaterial({
      color: 0x6b7280,
      roughness: 0.25,
      metalness: 0.75,
    });

    const propellerMat = new THREE.MeshStandardMaterial({
      color: 0x18181a,
      roughness: 0.5,
      metalness: 0.15,
    });

    const neonOrange = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xff5500,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.2,
    });
    
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x050505,
      metalness: 0.9,
      roughness: 0.05,
      transmission: 0.9,
      thickness: 0.05,
    });

    // ==============================================
    // MASTER DRONE GROUP
    // ==============================================
    const masterGroup = new THREE.Group();
    masterGroup.position.set(-0.5, 0, 0); // Shift left slightly to make room for stats
    masterGroup.scale.set(0.75, 0.75, 0.75);
    scene.add(masterGroup);
    
    let currentDroneGroup: THREE.Group | null = null;
    let gimbalGroup: THREE.Group | null = null;
    const propellers: { group: THREE.Group; direction: number }[] = [];

    // Factory function to build the drone based on type
    const buildDrone = (platformType: string) => {
      const droneGroup = new THREE.Group();
      propellers.length = 0; // reset
      gimbalGroup = null;

      const rotors = platformType === "quadcopter" ? 4 : platformType === "hexacopter" ? 6 : 8;
      const armLength = platformType === "quadcopter" ? 0.75 : platformType === "hexacopter" ? 1.0 : 1.25;

      // ----------------------------------------------
      // 1. ADVANCED AERODYNAMIC FUSELAGE
      // ----------------------------------------------
      const bodyGroup = new THREE.Group();
      droneGroup.add(bodyGroup);

      // Upper Shell Shape (XZ plane projection)
      const bodyShape = new THREE.Shape();
      bodyShape.moveTo(0, 0.55); // Nose
      bodyShape.lineTo(0.06, 0.48); // Nose right taper
      bodyShape.bezierCurveTo(0.18, 0.4, 0.25, 0.2, 0.24, 0); // Front right
      bodyShape.lineTo(0.18, -0.4); // Mid right
      bodyShape.bezierCurveTo(0.15, -0.55, 0.08, -0.6, 0, -0.65); // Tail right
      bodyShape.bezierCurveTo(-0.08, -0.6, -0.15, -0.55, -0.18, -0.4); // Tail left
      bodyShape.lineTo(-0.24, 0); // Mid left
      bodyShape.bezierCurveTo(-0.25, 0.2, -0.18, 0.4, -0.06, 0.48); // Front left
      bodyShape.lineTo(0, 0.55); // Nose left

      // Silver Metallic Top Shell
      const topExtrude = { depth: 0.05, bevelEnabled: true, bevelSegments: 6, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
      const topShellGeo = new THREE.ExtrudeGeometry(bodyShape, topExtrude);
      topShellGeo.rotateX(Math.PI / 2); // Lay flat
      const topShell = new THREE.Mesh(topShellGeo, silverAlloy);
      topShell.position.set(0, 0.08, 0);
      topShell.castShadow = true;
      topShell.receiveShadow = true;
      bodyGroup.add(topShell);

      // Dark Graphite Lower Structural Shell
      const bottomExtrude = { depth: 0.08, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
      const bottomShellGeo = new THREE.ExtrudeGeometry(bodyShape, bottomExtrude);
      bottomShellGeo.rotateX(Math.PI / 2);
      const bottomShell = new THREE.Mesh(bottomShellGeo, satinBlack);
      bottomShell.scale.set(0.92, 1, 0.92);
      bottomShell.position.set(0, 0.0, 0.02);
      bottomShell.castShadow = true;
      bodyGroup.add(bottomShell);

      // Side Heat Sinks / Avionics Vents
      [-0.24, 0.24].forEach((xOff, i) => {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.25), machinedAlloy);
        vent.position.set(xOff, 0.0, 0);
        vent.rotation.y = i === 0 ? -0.05 : 0.05;
        bodyGroup.add(vent);
      });

      // Top Sensor Array (GNSS / Compass)
      const gnssBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 32), satinBlack);
      gnssBase.position.set(0, 0.15, -0.2);
      bodyGroup.add(gnssBase);
      
      const gnssDome = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), matteComposite);
      gnssDome.position.set(0, 0.16, -0.2);
      bodyGroup.add(gnssDome);

      // Minimal Orange Accent Strip
      const stripeGeo = new THREE.BoxGeometry(0.02, 0.02, 0.15);
      const stripe = new THREE.Mesh(stripeGeo, neonOrange);
      stripe.position.set(0, 0.14, 0.1);
      stripe.rotation.x = -0.05;
      bodyGroup.add(stripe);

      // Battery Access Panel Seam
      const seamGeo = new THREE.BoxGeometry(0.18, 0.005, 0.25);
      const seam = new THREE.Mesh(seamGeo, satinBlack);
      seam.position.set(0, 0.08, -0.05);
      bodyGroup.add(seam);

      // ----------------------------------------------
      // 2. PROFESSIONAL GIMBAL & PAYLOAD
      // ----------------------------------------------
      gimbalGroup = new THREE.Group();
      gimbalGroup.position.set(0, -0.2, 0.25);
      bodyGroup.add(gimbalGroup);

      // Vibration Damper
      const damper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 24), satinBlack);
      gimbalGroup.add(damper);

      // Gimbal Base
      const gBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 24), machinedAlloy);
      gBase.position.set(0, -0.03, 0);
      gimbalGroup.add(gBase);

      // Gimbal Yoke (Yaw and Pitch Arms)
      const yokeGroup = new THREE.Group();
      yokeGroup.position.set(0, -0.05, 0);
      gimbalGroup.add(yokeGroup);
      
      const yokeArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 16), machinedAlloy);
      yokeArm.rotation.x = Math.PI / 2;
      yokeArm.position.set(0.06, -0.05, 0);
      yokeGroup.add(yokeArm);
      
      const yokeVertical = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 16), machinedAlloy);
      yokeVertical.position.set(0.06, 0, 0);
      yokeGroup.add(yokeVertical);

      // Payload Camera Pod (Compact Spherical/Cylindrical Hybrid)
      const camPod = new THREE.Mesh(new THREE.SphereGeometry(0.045, 32, 32), satinBlack);
      camPod.position.set(0, -0.04, 0);
      yokeGroup.add(camPod);

      // Primary Lens
      const lensRim = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 32), machinedAlloy);
      lensRim.rotation.x = Math.PI / 2;
      lensRim.position.set(0, -0.05, 0.07);
      yokeGroup.add(lensRim);

      const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 32), glassMat);
      lensGlass.rotation.x = Math.PI / 2;
      lensGlass.position.set(0, -0.05, 0.08);
      yokeGroup.add(lensGlass);

      // ----------------------------------------------
      // 3. STRUCTURAL ARMS & MOTOR PODS
      // ----------------------------------------------
      for (let i = 0; i < rotors; i++) {
        const angle = (i * Math.PI * 2) / rotors + (platformType === "quadcopter" ? Math.PI / 4 : 0);
        const armGroup = new THREE.Group();
        armGroup.rotation.y = angle;

        // Integrated Fuselage Root Joint (Housing)
        const rootJoint = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.07, 0.14), satinBlack);
        rootJoint.position.set(0.18, 0, 0);
        armGroup.add(rootJoint);

        // Tapered Structural Arm (Flatter profile)
        const armMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.05, armLength, 8), 
          matteComposite
        );
        armMesh.rotation.z = -Math.PI / 2;
        armMesh.position.set(0.18 + armLength / 2, 0, 0);
        armMesh.scale.set(1, 1, 0.6); // Flatter aerodynamic profile
        armMesh.castShadow = true;
        armGroup.add(armMesh);

        const motorCenter = 0.18 + armLength;

        // Motor Mounting Plate
        const mountPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 16), matteComposite);
        mountPlate.position.set(motorCenter, 0.01, 0);
        armGroup.add(mountPlate);

        // Lower Motor Housing / Stator base
        const motorPod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.05, 0.05, 24),
          satinBlack
        );
        motorPod.position.set(motorCenter, 0.04, 0);
        armGroup.add(motorPod);

        // Upper Brushless Motor Bell / Cap (Metallic)
        const motorBell = new THREE.Mesh(
          new THREE.CylinderGeometry(0.052, 0.052, 0.03, 24),
          machinedAlloy
        );
        motorBell.position.set(motorCenter, 0.08, 0);
        armGroup.add(motorBell);

        // Motor Shaft
        const motorShaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.006, 0.04, 12),
          silverAlloy
        );
        motorShaft.position.set(motorCenter, 0.10, 0);
        armGroup.add(motorShaft);

        // ----------------------------------------------
        // 4. AERODYNAMIC PROPELLERS
        // ----------------------------------------------
        const propGroup = new THREE.Group();
        propGroup.position.set(motorCenter, 0.11, 0);
        
        const propHub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.015, 16), satinBlack);
        propGroup.add(propHub);

        // Aerodynamic Blade Profile (Thick root, tapered tip, curved leading edge)
        const bladeLength = platformType === "quadcopter" ? 0.48 : 0.42;
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, 0.015);
        bladeShape.quadraticCurveTo(bladeLength * 0.4, 0.04, bladeLength, 0.01); // Leading edge
        bladeShape.lineTo(bladeLength, -0.01); // Tip
        bladeShape.quadraticCurveTo(bladeLength * 0.4, -0.03, 0, -0.015); // Trailing edge

        const bladeExtrude = { depth: 0.004, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.002, bevelThickness: 0.002 };
        const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, bladeExtrude);
        bladeGeo.center();
        
        // Blade 1
        const blade1 = new THREE.Mesh(bladeGeo, propellerMat);
        blade1.position.set(bladeLength / 2, 0, 0);
        blade1.rotation.x = 0.15; // Realistic pitch angle
        blade1.castShadow = true;
        propGroup.add(blade1);

        // Blade 2
        const blade2 = new THREE.Mesh(bladeGeo, propellerMat);
        blade2.position.set(-bladeLength / 2, 0, 0);
        blade2.rotation.z = Math.PI;
        blade2.rotation.x = 0.15;
        blade2.castShadow = true;
        propGroup.add(blade2);

        // Orange Tip Accents for visibility
        const tipGeo = new THREE.BoxGeometry(0.04, 0.01, 0.03);
        const tip1 = new THREE.Mesh(tipGeo, neonOrange);
        tip1.position.set(bladeLength * 0.85, 0, 0);
        propGroup.add(tip1);
        const tip2 = new THREE.Mesh(tipGeo, neonOrange);
        tip2.position.set(-bladeLength * 0.85, 0, 0);
        propGroup.add(tip2);

        armGroup.add(propGroup);
        // Correct rotational direction mapping
        propellers.push({ group: propGroup, direction: i % 2 === 0 ? 1 : -1 });

        // ----------------------------------------------
        // 5. ENGINEERED LANDING GEAR
        // ----------------------------------------------
        // For larger hex/octa frames, we skip some arms so it isn't cluttered
        const needsGear = platformType === "quadcopter" || (platformType === "hexacopter" ? i % 3 === 0 : i % 2 === 0);
        if (needsGear) {
          const gearGroup = new THREE.Group();
          gearGroup.position.set(0.18 + armLength * 0.7, -0.04, 0);
          
          // Angled structural strut (carbon fiber style)
          const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.012, 0.35, 12), matteComposite);
          strut.rotation.z = -0.15; // Sweep outward
          strut.position.set(0, -0.15, 0);
          strut.castShadow = true;
          gearGroup.add(strut);

          // Horizontal ground skid
          const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 12), satinBlack);
          skid.rotation.x = Math.PI / 2;
          skid.position.set(0.03, -0.32, 0);
          skid.castShadow = true;
          gearGroup.add(skid);

          // Shock-absorbing rubber boots
          [-0.1, 0.1].forEach((zOff) => {
            const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12), matteComposite);
            boot.rotation.x = Math.PI / 2;
            boot.position.set(0.03, -0.32, zOff);
            boot.castShadow = true;
            gearGroup.add(boot);
          });

          armGroup.add(gearGroup);
        }

        droneGroup.add(armGroup);
      }

      return droneGroup;
    };

    // ==============================================
    // GROUND SHADOW
    // ==============================================
    const planeGeo = new THREE.PlaneGeometry(15, 15);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.6; 
    plane.receiveShadow = true;
    scene.add(plane);

    // ==============================================
    // INTERACTION & CONTROLS
    // ==============================================
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; 
    controls.enablePan = false;
    controls.enabled = interactive;

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      // Map mouse to a subtle parallax rotation
      targetRotationRef.current = { x: y * 0.1 + 0.15, y: x * 0.2 - Math.PI / 6 };
    };
    container.addEventListener("mousemove", handleMouseMove);

    // ==============================================
    // ANIMATION LOOP
    // ==============================================
    let animationId: number;
    const clock = new THREE.Clock();
    
    // Initial mount
    currentDroneGroup = buildDrone(targetTypeRef.current);
    masterGroup.add(currentDroneGroup);
    currentDroneGroup.rotation.y = -Math.PI / 6; // Initial angle

    let transitionProgress = 1.0;
    let oldDroneGroup: THREE.Group | null = null;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Handle Smooth Switching
      if (currentTypeRef.current !== targetTypeRef.current) {
        currentTypeRef.current = targetTypeRef.current;
        transitionProgress = 0.0;
        
        oldDroneGroup = currentDroneGroup;
        currentDroneGroup = buildDrone(targetTypeRef.current);
        currentDroneGroup.position.x = 5; // Start offset to the right
        masterGroup.add(currentDroneGroup);
      }

      if (transitionProgress < 1.0) {
        transitionProgress += delta * 1.5; // ~660ms transition
        if (transitionProgress > 1.0) transitionProgress = 1.0;

        // Easing function (easeInOutCubic)
        const ease = transitionProgress < 0.5 
          ? 4 * transitionProgress * transitionProgress * transitionProgress 
          : 1 - Math.pow(-2 * transitionProgress + 2, 3) / 2;

        if (oldDroneGroup) {
          oldDroneGroup.position.x = -ease * 5;
          oldDroneGroup.rotation.y -= delta * 2;
          if (transitionProgress === 1.0) {
            masterGroup.remove(oldDroneGroup);
            oldDroneGroup = null;
          }
        }

        if (currentDroneGroup) {
          currentDroneGroup.position.x = 5 - ease * 5;
        }
      }

      if (currentDroneGroup) {
        // Idle Hover Bobbing
        const hoverY = Math.sin(elapsed * 2.0) * 0.04;
        currentDroneGroup.position.y = hoverY;

        // Extremely slow presentation rotation if not interacting
        if (autoRotate && !isInteracting) {
          targetRotationRef.current.y -= 0.1 * delta;
        }

        // Smooth orientation spring to target
        currentDroneGroup.rotation.x += (targetRotationRef.current.x - currentDroneGroup.rotation.x) * 0.05;
        currentDroneGroup.rotation.y += (targetRotationRef.current.y - currentDroneGroup.rotation.y) * 0.05;

        // Gimbal Independent Stabilization
        if (gimbalGroup) {
          gimbalGroup.rotation.x = -currentDroneGroup.rotation.x + 0.15; // +0.15 is baseline offset
          gimbalGroup.rotation.z = -currentDroneGroup.rotation.z;
        }

        // Propeller Rotation (Linked to Motor RPM Concept)
        const baseRPM = isSelectedRef.current ? 18 : 4; // Fast if selected, slow idle if not
        propellers.forEach((prop) => {
          prop.group.rotation.y -= prop.direction * baseRPM * delta;
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [autoRotate, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none outline-none touch-none ${className}`}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => {
        setIsInteracting(false);
        targetRotationRef.current = { x: 0.15, y: -Math.PI / 6 };
      }}
    />
  );
}
