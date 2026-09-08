"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { DroneType } from "@/types/drone";
import { RotateCw } from "lucide-react";

interface Drone3DViewerProps {
  type: DroneType;
  className?: string;
  autoRotate?: boolean;
  interactive?: boolean;
}

export function Drone3DViewer({
  type,
  className = "",
  autoRotate = true,
  interactive = true,
}: Drone3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 4.5);
    camera.lookAt(0, 0, 0);

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

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Key directional light (warm top-front)
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    // Rim light (aerospace orange accent on edges)
    const rimLight = new THREE.DirectionalLight(0xff5500, 2.5);
    rimLight.position.set(-5, 2, -4);
    scene.add(rimLight);

    // Fill light (subtle cool blue-gray for metallic depth)
    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 1.2);
    fillLight.position.set(0, -3, 2);
    scene.add(fillLight);

    // MATERIALS
    const orangeMetal = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      metalness: 0.75,
      roughness: 0.25,
    });

    const carbonDark = new THREE.MeshStandardMaterial({
      color: 0x1c1c1e,
      metalness: 0.4,
      roughness: 0.4,
    });

    const brushedAlloy = new THREE.MeshStandardMaterial({
      color: 0x8e8e93,
      metalness: 0.9,
      roughness: 0.15,
    });

    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c2c2e,
      metalness: 0.2,
      roughness: 0.5,
      transparent: true,
      opacity: 0.9,
    });

    const ledOrange = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const ledGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // ROOT DRONE GROUP
    const droneGroup = new THREE.Group();
    scene.add(droneGroup);

    // Shadow plane beneath
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(255, 85, 0, 0.25)");
      grad.addColorStop(0.4, "rgba(0, 0, 0, 0.15)");
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
    shadowMesh.position.y = -0.9;
    scene.add(shadowMesh);

    // BUILD AIRFRAME GEOMETRY BY TYPE
    const propellers: THREE.Group[] = [];

    // Central Pod
    const podRadius = type === "octacopter" ? 0.75 : type === "hexacopter" ? 0.65 : 0.55;
    const podGeo = new THREE.CylinderGeometry(podRadius * 0.9, podRadius, 0.35, type === "octacopter" ? 8 : type === "hexacopter" ? 6 : 16);
    const pod = new THREE.Mesh(podGeo, orangeMetal);
    droneGroup.add(pod);

    // Avionics Top Cap
    const capGeo = new THREE.CylinderGeometry(podRadius * 0.6, podRadius * 0.75, 0.12, 16);
    const cap = new THREE.Mesh(capGeo, carbonDark);
    cap.position.y = 0.22;
    droneGroup.add(cap);

    // Center Status Dome
    const domeGeo = new THREE.SphereGeometry(podRadius * 0.28, 16, 12);
    const dome = new THREE.Mesh(domeGeo, orangeMetal);
    dome.position.y = 0.28;
    droneGroup.add(dome);

    // Front Camera / Sensor Gimbal
    const gimbalGeo = new THREE.SphereGeometry(0.18, 12, 10);
    const gimbal = new THREE.Mesh(gimbalGeo, carbonDark);
    gimbal.position.set(0, -0.12, podRadius * 0.95);
    droneGroup.add(gimbal);

    const lensGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, -0.12, podRadius * 0.95 + 0.12);
    droneGroup.add(lens);

    // Configure Rotor Arms
    let armAngles: number[] = [];
    let armLength = 1.7;

    if (type === "quadcopter") {
      armAngles = [
        Math.PI * 0.25,
        Math.PI * 0.75,
        Math.PI * 1.25,
        Math.PI * 1.75,
      ];
      armLength = 1.75;
    } else if (type === "hexacopter") {
      armAngles = [0, 1, 2, 3, 4, 5].map((i) => (i * Math.PI) / 3);
      armLength = 1.85;
    } else {
      // Octacopter
      armAngles = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (i * Math.PI) / 4);
      armLength = 2.0;
    }

    // Build Arms, Motor Mounts, and Propellers
    armAngles.forEach((angle, idx) => {
      const armGroup = new THREE.Group();
      armGroup.rotation.y = angle;

      // Carbon Arm Tube
      const armGeo = new THREE.CylinderGeometry(0.045, 0.05, armLength, 8);
      const arm = new THREE.Mesh(armGeo, carbonDark);
      arm.rotation.z = Math.PI / 2;
      arm.position.x = armLength / 2;
      armGroup.add(arm);

      // Motor Mount Bell
      const motorBellGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.2, 14);
      const motorBell = new THREE.Mesh(motorBellGeo, brushedAlloy);
      motorBell.position.set(armLength, 0.08, 0);
      armGroup.add(motorBell);

      const motorRingGeo = new THREE.CylinderGeometry(0.145, 0.145, 0.05, 14);
      const motorRing = new THREE.Mesh(motorRingGeo, orangeMetal);
      motorRing.position.set(armLength, 0.05, 0);
      armGroup.add(motorRing);

      // Navigation LED
      const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const isFront = angle > 0 && angle < Math.PI;
      const led = new THREE.Mesh(ledGeo, idx === 0 ? ledGreen : isFront ? ledOrange : ledRed);
      led.position.set(armLength + 0.15, 0.02, 0);
      armGroup.add(led);

      // Rotating Propeller Group
      const propGroup = new THREE.Group();
      propGroup.position.set(armLength, 0.22, 0);

      // Propeller Hub
      const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8);
      const hub = new THREE.Mesh(hubGeo, carbonDark);
      propGroup.add(hub);

      // Blades (2-blade aerodynamic twist)
      const bladeLength = type === "octacopter" ? 0.8 : type === "hexacopter" ? 0.9 : 1.0;
      const bladeGeo = new THREE.BoxGeometry(bladeLength, 0.015, 0.09);
      const blade = new THREE.Mesh(bladeGeo, bladeMaterial);
      propGroup.add(blade);

      droneGroup.add(armGroup);
      droneGroup.add(propGroup);
      propellers.push(propGroup);
    });

    // Landing Gear / Skids
    const skidGroup = new THREE.Group();
    const skidMat = carbonDark;

    if (type === "quadcopter") {
      // 4 individual curved landing feet
      armAngles.forEach((angle) => {
        const legGroup = new THREE.Group();
        legGroup.rotation.y = angle;
        const legGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.45, 6);
        const leg = new THREE.Mesh(legGeo, skidMat);
        leg.position.set(armLength * 0.75, -0.22, 0);
        leg.rotation.z = -0.3;
        legGroup.add(leg);
        skidGroup.add(legGroup);
      });
    } else {
      // Dual longitudinal landing skids (aerospace style)
      [-0.55, 0.55].forEach((zPos) => {
        const skidTubeGeo = new THREE.CylinderGeometry(0.035, 0.035, armLength * 1.3, 8);
        const skidTube = new THREE.Mesh(skidTubeGeo, skidMat);
        skidTube.rotation.x = Math.PI / 2;
        skidTube.position.set(0, -0.45, zPos);
        skidGroup.add(skidTube);

        // Vertical strut connectors
        [-0.45, 0.45].forEach((xPos) => {
          const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6);
          const strut = new THREE.Mesh(strutGeo, orangeMetal);
          strut.position.set(xPos, -0.22, zPos);
          strut.rotation.z = (xPos > 0 ? -1 : 1) * 0.15;
          skidGroup.add(strut);
        });
      });
    }
    droneGroup.add(skidGroup);

    // Set initial drone pose
    droneGroup.rotation.x = 0.28;
    droneGroup.rotation.y = -0.65;

    // ROTATION & INTERACTION STATE
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let rotVelocityX = 0;
    let rotVelocityY = 0;
    const friction = 0.93;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      isDragging = true;
      setIsInteracting(true);
      setHasInteracted(true);
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

    // ANIMATION LOOP
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Spin Propellers (realistic flight spin with alternating directions)
      const propSpeed = 28;
      propellers.forEach((prop, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        prop.rotation.y += dir * propSpeed * delta;
      });

      // Subtle Hover Breathing
      droneGroup.position.y = Math.sin(elapsed * 2.2) * 0.05;

      // Handle Damped Rotation or Auto-Rotation
      if (!isDragging) {
        if (Math.abs(rotVelocityY) > 0.0001) {
          droneGroup.rotation.y += rotVelocityY;
          rotVelocityY *= friction;
        } else if (autoRotate) {
          droneGroup.rotation.y += 0.006;
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
    >
      {/* 360 Rotation Hint Badge */}
      <div
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-300 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-950/75 backdrop-blur-sm border border-orange-400/40 text-[9px] font-mono text-white tracking-wider uppercase ${
          hasInteracted && !isInteracting ? "opacity-40" : "opacity-90"
        }`}
      >
        <RotateCw className="h-2.5 w-2.5 text-[#FF5500] animate-spin [animation-duration:6s]" />
        <span>360° TOUCH / DRAG</span>
      </div>
    </div>
  );
}
