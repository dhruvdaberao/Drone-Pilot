"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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
  const isInteractingRef = useRef(false);
  const setIsInteracting = (val: boolean) => {
    isInteractingRef.current = val;
  };
  
  // Track internal state for smooth switching between platforms
  const currentTypeRef = useRef(type);
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

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);

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

    const rimLight = new THREE.DirectionalLight(0xffffff, 3.0);
    rimLight.position.set(0, 5, -8);
    scene.add(rimLight);

    // ==============================================
    // PREMIUM MATERIALS
    // ==============================================
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
    scene.add(masterGroup);
    
    let currentDroneGroup: THREE.Group | null = null;
    const propellers: { group: THREE.Group; direction: number }[] = [];

    // Helper for chamfered box (basic structural components)
    // Using BoxGeometry and applying bevel manually is complex, 
    // so we will build realistic blocky shapes
    const createBox = (w: number, h: number, d: number, mat: THREE.Material) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      return new THREE.Mesh(geo, mat);
    };
    const createCylinder = (rt: number, rb: number, h: number, s: number, mat: THREE.Material) => {
      const geo = new THREE.CylinderGeometry(rt, rb, h, s);
      return new THREE.Mesh(geo, mat);
    };

    // Factory function to build the drone based on type
    const buildDrone = (platformType: string) => {
      const droneGroup = new THREE.Group();
      propellers.length = 0; // reset

      const rotors = platformType === "quadcopter" ? 4 : platformType === "hexacopter" ? 6 : 8;
      const armLength = platformType === "quadcopter" ? 0.35 : platformType === "hexacopter" ? 0.55 : 0.75;
      const bodyScale = platformType === "quadcopter" ? 1.0 : platformType === "hexacopter" ? 1.4 : 1.8;

      // ----------------------------------------------
      // 1. ADVANCED AERODYNAMIC FUSELAGE
      // ----------------------------------------------
      const bodyGroup = new THREE.Group();
      droneGroup.add(bodyGroup);

      if (platformType === "quadcopter") {
        // Quadcopter: Sleek engineered shell
        // Main structural core (graphite)
        const core = createBox(0.18, 0.05, 0.24, satinBlack);
        bodyGroup.add(core);

        // Upper aerodynamic shell (silver)
        const topShellGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 24);
        topShellGeo.rotateZ(Math.PI / 2);
        topShellGeo.scale(1, 0.4, 1);
        const topShell = new THREE.Mesh(topShellGeo, silverAlloy);
        topShell.position.set(0, 0.035, 0);
        topShell.castShadow = true;
        bodyGroup.add(topShell);
        
        // Lower belly shell
        const bottomShellGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 24);
        bottomShellGeo.rotateZ(Math.PI / 2);
        bottomShellGeo.scale(1, 0.5, 1);
        const bottomShell = new THREE.Mesh(bottomShellGeo, matteComposite);
        bottomShell.position.set(0, -0.03, 0);
        bottomShell.castShadow = true;
        bodyGroup.add(bottomShell);

        // Side cooling vents
        const ventLeft = createBox(0.12, 0.02, 0.1, machinedAlloy);
        ventLeft.position.set(0, 0, 0.08);
        bodyGroup.add(ventLeft);
        
        const ventRight = createBox(0.12, 0.02, 0.1, machinedAlloy);
        ventRight.position.set(0, 0, -0.08);
        bodyGroup.add(ventRight);
        
      } else if (platformType === "hexacopter") {
        // Hexacopter: Multi-layered central hub
        const upperDeck = createCylinder(0.16, 0.18, 0.04, 12, silverAlloy);
        upperDeck.position.set(0, 0.05, 0);
        upperDeck.castShadow = true;
        bodyGroup.add(upperDeck);

        const midDeck = createCylinder(0.17, 0.17, 0.06, 12, satinBlack);
        midDeck.position.set(0, 0, 0);
        bodyGroup.add(midDeck);

        const lowerDeck = createCylinder(0.15, 0.14, 0.05, 12, matteComposite);
        lowerDeck.position.set(0, -0.05, 0);
        lowerDeck.castShadow = true;
        bodyGroup.add(lowerDeck);
        
        // Electronics dome
        const domeGeo = new THREE.SphereGeometry(0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        domeGeo.scale(1, 0.5, 1);
        const dome = new THREE.Mesh(domeGeo, silverAlloy);
        dome.position.set(0, 0.07, 0);
        bodyGroup.add(dome);

      } else {
        // Octacopter: Heavy industrial folded-metal look
        const upperDeckGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.06, 8);
        const upperDeck = new THREE.Mesh(upperDeckGeo, silverAlloy);
        upperDeck.position.set(0, 0.06, 0);
        upperDeck.castShadow = true;
        bodyGroup.add(upperDeck);

        const lowerDeckGeo = new THREE.CylinderGeometry(0.21, 0.24, 0.08, 8);
        const lowerDeck = new THREE.Mesh(lowerDeckGeo, satinBlack);
        lowerDeck.position.set(0, -0.01, 0);
        lowerDeck.castShadow = true;
        bodyGroup.add(lowerDeck);
        
        // Heat sinks / avionics ridges
        for(let i=0; i<4; i++) {
          const ridge = createBox(0.35, 0.02, 0.05, machinedAlloy);
          ridge.rotation.y = (Math.PI / 4) * i;
          ridge.position.set(0, 0.09, 0);
          bodyGroup.add(ridge);
        }
      }

      // Battery Bay (Rear)
      const batW = 0.12 * bodyScale, batH = 0.08 * bodyScale, batD = 0.16 * bodyScale;
      const batteryGroup = new THREE.Group();
      batteryGroup.position.set(0, 0, -0.15 * bodyScale);
      
      const batBody = createBox(batW, batH, batD, matteComposite);
      batteryGroup.add(batBody);
      
      const batCap = createBox(batW * 0.9, batH * 0.9, 0.02, satinBlack);
      batCap.position.set(0, 0, batD / 2 + 0.01);
      batteryGroup.add(batCap);
      
      const batRelease = createBox(batW * 0.5, 0.01, 0.03, neonOrange);
      batRelease.position.set(0, batH / 2 + 0.005, batD / 2 - 0.02);
      batteryGroup.add(batRelease);
      
      bodyGroup.add(batteryGroup);

      // GPS / RTK Antenna (Top)
      const gpsGroup = new THREE.Group();
      gpsGroup.position.set(0, 0.1 * bodyScale, -0.05);
      
      const gpsMast = createCylinder(0.006, 0.006, 0.08, 8, satinBlack);
      gpsMast.position.set(0, 0.04, 0);
      gpsGroup.add(gpsMast);
      
      const gpsPuckGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.015, 16);
      gpsPuckGeo.translate(0, 0.08, 0);
      const gpsPuck = new THREE.Mesh(gpsPuckGeo, silverAlloy);
      gpsGroup.add(gpsPuck);
      
      const gpsLight = createCylinder(0.032, 0.032, 0.005, 16, neonOrange);
      gpsLight.position.set(0, 0.09, 0);
      gpsGroup.add(gpsLight);
      
      bodyGroup.add(gpsGroup);

      // Camera / Sensor Module (Front)
      const gimbalGroup = new THREE.Group();
      gimbalGroup.position.set(0, -0.06 * bodyScale, 0.12 * bodyScale);
      
      const gimbalMount = createBox(0.06, 0.02, 0.06, satinBlack);
      gimbalGroup.add(gimbalMount);
      
      const gimbalArm = createBox(0.015, 0.06, 0.02, machinedAlloy);
      gimbalArm.position.set(0.03, -0.03, 0);
      gimbalGroup.add(gimbalArm);

      const cameraHousing = createCylinder(0.03, 0.03, 0.05, 16, machinedAlloy);
      cameraHousing.rotation.z = Math.PI / 2;
      cameraHousing.position.set(0, -0.05, 0.02);
      gimbalGroup.add(cameraHousing);

      const cameraLens = createCylinder(0.02, 0.02, 0.01, 16, glassMat);
      cameraLens.rotation.x = Math.PI / 2;
      cameraLens.position.set(0, -0.05, 0.045);
      gimbalGroup.add(cameraLens);
      
      bodyGroup.add(gimbalGroup);

      // ----------------------------------------------
      // 2. STRUCTURAL ARMS & MOTOR PODS
      // ----------------------------------------------
      for (let i = 0; i < rotors; i++) {
        const angle = (i * Math.PI * 2) / rotors + (platformType === "quadcopter" ? Math.PI / 4 : (platformType === "hexacopter" ? Math.PI / 6 : Math.PI / 8));
        const armGroup = new THREE.Group();
        armGroup.rotation.y = angle;

        // Root Joint / Hinge (Industrial mechanism)
        const rootJoint = createCylinder(0.03, 0.03, 0.06, 12, satinBlack);
        rootJoint.rotation.x = Math.PI / 2;
        rootJoint.position.set(0.12 * bodyScale, 0, 0);
        armGroup.add(rootJoint);

        // Carbon Fiber Arm (Tubular for industrial look)
        const armRadius = platformType === "quadcopter" ? 0.012 : 0.018;
        const armGeo = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 12);
        armGeo.rotateZ(Math.PI / 2);
        const armMesh = new THREE.Mesh(armGeo, matteComposite);
        armMesh.position.set(0.12 * bodyScale + armLength / 2, 0, 0);
        armMesh.castShadow = true;
        armGroup.add(armMesh);
        
        // Arm locking collar
        const collar = createCylinder(armRadius * 1.3, armRadius * 1.3, 0.03, 12, neonOrange);
        collar.rotation.z = Math.PI / 2;
        collar.position.set(0.12 * bodyScale + 0.04, 0, 0);
        armGroup.add(collar);

        const motorCenter = 0.12 * bodyScale + armLength;

        // Motor Mounting Bracket
        const mountBracket = createBox(0.06, 0.015, 0.05, machinedAlloy);
        mountBracket.position.set(motorCenter, 0, 0);
        armGroup.add(mountBracket);
        
        const mountClamp = createBox(0.03, 0.03, 0.03, satinBlack);
        mountClamp.position.set(motorCenter - 0.01, 0, 0);
        armGroup.add(mountClamp);

        // Motor Base / Stator
        const motorStator = createCylinder(0.035, 0.035, 0.02, 24, satinBlack);
        motorStator.position.set(motorCenter, 0.015, 0);
        armGroup.add(motorStator);

        // Motor Bell (Rotor)
        const motorBell = createCylinder(0.034, 0.034, 0.025, 24, silverAlloy);
        motorBell.position.set(motorCenter, 0.04, 0);
        armGroup.add(motorBell);
        
        // Motor Ventilation accents
        const ventRing = createCylinder(0.0345, 0.0345, 0.005, 24, satinBlack);
        ventRing.position.set(motorCenter, 0.045, 0);
        armGroup.add(ventRing);
        
        // Motor Shaft
        const motorShaft = createCylinder(0.005, 0.005, 0.02, 8, machinedAlloy);
        motorShaft.position.set(motorCenter, 0.06, 0);
        armGroup.add(motorShaft);

        // ----------------------------------------------
        // 3. PROPELLERS
        // ----------------------------------------------
        const propGroup = new THREE.Group();
        propGroup.position.set(motorCenter, 0.065, 0);
        
        const propHub = createCylinder(0.012, 0.012, 0.012, 16, satinBlack);
        propGroup.add(propHub);
        
        const hubCap = createCylinder(0.008, 0.008, 0.003, 16, neonOrange);
        hubCap.position.set(0, 0.006, 0);
        propGroup.add(hubCap);

        // Realistic 2-blade Propeller
        const bladeRadius = platformType === "quadcopter" ? 0.22 : platformType === "hexacopter" ? 0.28 : 0.34;
        
        // Create an aerodynamic blade shape
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, 0.008);
        bladeShape.quadraticCurveTo(bladeRadius * 0.3, 0.025, bladeRadius, 0.003);
        bladeShape.lineTo(bladeRadius, -0.003);
        bladeShape.quadraticCurveTo(bladeRadius * 0.3, -0.015, 0, -0.008);
        
        const extrudeSettings = { depth: 0.002, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.001, bevelThickness: 0.001 };
        const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
        bladeGeo.center();
        
        const blade1 = new THREE.Mesh(bladeGeo, propellerMat);
        blade1.position.set(bladeRadius / 2, 0, 0);
        blade1.rotation.x = 0.15; // Pitch
        blade1.castShadow = true;
        propGroup.add(blade1);
        
        const blade2 = new THREE.Mesh(bladeGeo, propellerMat);
        blade2.position.set(-bladeRadius / 2, 0, 0);
        blade2.rotation.z = Math.PI;
        blade2.rotation.x = 0.15;
        blade2.castShadow = true;
        propGroup.add(blade2);
        
        armGroup.add(propGroup);
        propellers.push({ group: propGroup, direction: i % 2 === 0 ? 1 : -1 });

        // ----------------------------------------------
        // 4. LANDING GEAR
        // ----------------------------------------------
        // Add landing gear based on type
        const needsGear = platformType === "quadcopter" ? true : (platformType === "hexacopter" ? i % 3 === 0 : i % 2 === 0);
        if (needsGear) {
          const gearGroup = new THREE.Group();
          gearGroup.position.set(0.12 * bodyScale + armLength * 0.3, 0, 0);
          
          const strutHeight = platformType === "quadcopter" ? 0.18 : 0.25;
          const strut = createCylinder(0.008, 0.006, strutHeight, 8, matteComposite);
          strut.rotation.z = -0.15; 
          strut.position.set(0, -strutHeight / 2, 0);
          strut.castShadow = true;
          gearGroup.add(strut);

          // T-shaped structural skid
          const skidLen = platformType === "quadcopter" ? 0.22 : 0.35;
          const skid = createCylinder(0.01, 0.01, skidLen, 8, satinBlack);
          skid.rotation.x = Math.PI / 2;
          skid.position.set(strutHeight * Math.sin(0.15), -strutHeight, 0);
          skid.castShadow = true;
          gearGroup.add(skid);
          
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
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.2 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.3; 
    plane.receiveShadow = true;
    scene.add(plane);

    // ==============================================
    // INTERACTION & CONTROLS
    // ==============================================
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true; 
    controls.enablePan = false;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controls.enabled = interactive;

    // A helper to automatically frame the drone based on its bounding sphere
    const frameDrone = (droneObj: THREE.Group, aspect: number) => {
      // Calculate Bounding Sphere
      const box = new THREE.Box3().setFromObject(droneObj);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      
      const center = sphere.center;
      const radius = sphere.radius;

      // Adjust target to visual center
      controls.target.copy(center);

      // Distance calculation based on FOV and Aspect Ratio
      const fovRad = camera.fov * (Math.PI / 180);
      let distance = radius / Math.sin(fovRad / 2);
      
      // If mobile landscape or tall narrow screen, adjust distance to ensure fit
      if (aspect < 1) {
          distance /= aspect; // narrow screen, move camera back
      }

      // Add a framing margin
      distance *= 1.4;

      // Update Camera Position (keep current rotation angle but update distance/target)
      const direction = new THREE.Vector3().subVectors(camera.position, center).normalize();
      // If camera was exactly overlapping or uninitialized, give it a nice starting angle
      if (direction.lengthSq() < 0.1 || direction.y === 0) {
          direction.set(0.5, 0.6, 1).normalize();
      }
      camera.position.copy(direction.multiplyScalar(distance).add(center));
      
      // Set zoom limits to prevent getting lost
      controls.minDistance = radius * 1.2;
      controls.maxDistance = radius * 4.0;
      
      camera.updateProjectionMatrix();
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);

      if (currentDroneGroup) {
          frameDrone(currentDroneGroup, aspect);
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ==============================================
    // ANIMATION LOOP
    // ==============================================
    let animationId: number;
    const clock = new THREE.Clock();
    
    // Initial mount
    currentDroneGroup = buildDrone(targetTypeRef.current);
    masterGroup.add(currentDroneGroup);
    
    // Initial framing
    // Need to trigger a layout calculation
    setTimeout(() => handleResize(), 0);

    let transitionProgress = 1.0;
    let oldDroneGroup: THREE.Group | null = null;
    let transitionStartCameraTarget = new THREE.Vector3();
    let transitionEndCameraTarget = new THREE.Vector3();
    let transitionStartCameraPos = new THREE.Vector3();
    let transitionEndCameraPos = new THREE.Vector3();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Handle Smooth Switching
      if (currentTypeRef.current !== targetTypeRef.current) {
        currentTypeRef.current = targetTypeRef.current;
        transitionProgress = 0.0;
        
        oldDroneGroup = currentDroneGroup;
        currentDroneGroup = buildDrone(targetTypeRef.current);
        masterGroup.add(currentDroneGroup);
        
        // Calculate new bounding sphere for smooth camera transition
        const box = new THREE.Box3().setFromObject(currentDroneGroup);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        const center = sphere.center;
        const radius = sphere.radius;

        const fovRad = camera.fov * (Math.PI / 180);
        const aspect = camera.aspect;
        let distance = radius / Math.sin(fovRad / 2);
        if (aspect < 1) distance /= aspect;
        distance *= 1.4;

        transitionStartCameraTarget.copy(controls.target);
        transitionEndCameraTarget.copy(center);

        // Keep current angle, just change distance
        const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
        if (direction.lengthSq() < 0.1) direction.set(0.5, 0.6, 1).normalize();
        
        transitionStartCameraPos.copy(camera.position);
        transitionEndCameraPos.copy(direction.multiplyScalar(distance).add(center));
        
        // Set new bounds
        controls.minDistance = radius * 1.2;
        controls.maxDistance = radius * 4.0;
        
        if (oldDroneGroup) {
           oldDroneGroup.visible = true;
        }
      }

      if (transitionProgress < 1.0) {
        transitionProgress += delta * 2.0; // ~500ms transition
        if (transitionProgress > 1.0) transitionProgress = 1.0;

        const ease = 1 - Math.pow(1 - transitionProgress, 3); // easeOutCubic

        // Lerp Camera
        if (!isInteractingRef.current) {
            controls.target.lerpVectors(transitionStartCameraTarget, transitionEndCameraTarget, ease);
            camera.position.lerpVectors(transitionStartCameraPos, transitionEndCameraPos, ease);
        }

        if (oldDroneGroup) {
          oldDroneGroup.position.y = -ease * 2; // sink down
          if (transitionProgress === 1.0) {
            masterGroup.remove(oldDroneGroup);
            oldDroneGroup = null;
          }
        }

        if (currentDroneGroup) {
          currentDroneGroup.position.y = 2 - ease * 2; // rise up
        }
      } else {
        if (currentDroneGroup) {
          currentDroneGroup.position.y = 0;
        }
      }

      if (currentDroneGroup) {
        // Propeller Rotation (Linked to Motor RPM Concept)
        const baseRPM = isSelectedRef.current ? 25 : 5; // Fast if selected, slow idle if not
        propellers.forEach((prop) => {
          prop.group.rotation.y -= prop.direction * baseRPM * delta;
        });
      }

      // AutoRotate behavior - pause if user interacts
      controls.autoRotate = autoRotate && !isInteractingRef.current;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [autoRotate, interactive]); // Removed isInteracting from dep array to avoid re-running effect on every hover

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none outline-none touch-none cursor-grab active:cursor-grabbing ${className}`}
      onPointerDown={() => setIsInteracting(true)}
      onPointerUp={() => setIsInteracting(false)}
      onPointerLeave={() => setIsInteracting(false)}
    />
  );
}
