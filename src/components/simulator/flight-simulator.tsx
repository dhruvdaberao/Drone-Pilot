"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { DroneModel } from "@/types/drone";
import { getDroneDefinition } from "@/lib/simulation/drone-definitions";
import { FlightPhysicsEngine } from "@/lib/simulation/flight-physics";
import { InputManager } from "@/lib/simulation/input-manager";
import { WorldScene } from "./world-scene";
import { ModularDrone } from "./modular-drone";
import { ChaseCameraController, CameraMode } from "./chase-camera";
import { TelemetryHUD } from "./telemetry-hud";
import { ControlsOverlay } from "./controls-overlay";
import { MobileTouchControls } from "./mobile-touch-controls";
import { EducationalAdvisory } from "./educational-advisory";
import { TelemetryState } from "@/lib/simulation/types";

interface FlightSimulatorProps {
  selectedDrone: DroneModel;
  onExit: () => void;
}

export function FlightSimulator({ selectedDrone, onExit }: FlightSimulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const cameraControllerRef = useRef<ChaseCameraController | null>(null);
  const physicsEngineRef = useRef<FlightPhysicsEngine | null>(null);

  const [cameraMode, setCameraMode] = useState<CameraMode>("chase");
  const [isHoverMode, setIsHoverMode] = useState(true);

  // Real-time telemetry state for HUD
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    position: { x: 0, y: 0.32, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { pitch: 0, roll: 0, yaw: 0 },
    altitude: 0,
    groundSpeed: 0,
    verticalSpeed: 0,
    heading: 0,
    batteryLevel: 100,
    flightTimeSeconds: 0,
    flightMode: "LANDED",
    isArmed: false,
    rotorRpmPercent: 0,
    distanceFromHome: 0,
  });

  // Cycle camera
  const handleToggleCamera = useCallback(() => {
    if (cameraControllerRef.current) {
      const nextMode = cameraControllerRef.current.cycleMode();
      setCameraMode(nextMode);
    }
  }, []);

  // Reset to Helipad
  const handleReset = useCallback(() => {
    if (physicsEngineRef.current) {
      physicsEngineRef.current.reset();
    }
  }, []);

  // Toggle Hover Mode
  const handleToggleHover = useCallback(() => {
    if (physicsEngineRef.current && inputManagerRef.current) {
      inputManagerRef.current.toggleHoverAssist();
      const current = inputManagerRef.current.isHoverAssist();
      physicsEngineRef.current.isHoverMode = current;
      setIsHoverMode(current);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({
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

    // 3. 3D WORLD SCENE
    const worldScene = new WorldScene(scene);

    // 4. MODULAR DRONE
    const droneDef = getDroneDefinition(selectedDrone.id);
    const droneMesh = new ModularDrone(droneDef);
    scene.add(droneMesh.group);

    // 5. PHYSICS ENGINE
    const physics = new FlightPhysicsEngine(droneDef);
    physicsEngineRef.current = physics;

    // 6. CHASE CAMERA
    const chaseCam = new ChaseCameraController(55, width / height);
    cameraControllerRef.current = chaseCam;

    // 7. INPUT MANAGER
    const inputManager = new InputManager();
    inputManager.attach();
    inputManagerRef.current = inputManager;

    // 8. RESIZE OBSERVER
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      chaseCam.setAspect(w / h);
      renderer.setSize(w, h, false);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 9. MOUSE DRAG 360 ORBIT CONTROLS
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest(".pointer-events-auto")) return;
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      chaseCam.setOrbitDelta(dx, dy);
    };

    const onMouseUp = () => {
      isDragging = false;
      chaseCam.resetOrbit();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // 10. ANIMATION & SIMULATION LOOP
    let animationId: number;
    const clock = new THREE.Clock();
    let telemetryThrottleTimer = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Read Input
      const input = inputManager.getInput();

      if (input.cameraToggle) {
        setCameraMode(chaseCam.cycleMode());
      }

      // Step Physics
      const curTelemetry = physics.update(input, dt);

      // Update 3D Drone Transform & Props
      droneMesh.update(curTelemetry, dt);

      // Update Follow Camera
      chaseCam.update(curTelemetry, dt);

      // Update World Animations (Waves, Windsock, Beacon strobes)
      worldScene.update(dt, elapsed);

      // Render 3D Frame
      renderer.render(scene, chaseCam.camera);

      // Sync React Telemetry State at ~20Hz to keep UI smooth and CPU light
      telemetryThrottleTimer += dt;
      if (telemetryThrottleTimer >= 0.05) {
        telemetryThrottleTimer = 0;
        setTelemetry({ ...curTelemetry });
      }
    };

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      inputManager.detach();

      domEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }

      renderer.dispose();
    };
  }, [selectedDrone]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-sky-200 select-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Avionics Telemetry HUD */}
      <TelemetryHUD
        telemetry={telemetry}
        droneName={selectedDrone.name}
        cameraMode={cameraMode}
        onToggleCamera={handleToggleCamera}
        onReset={handleReset}
        onExit={onExit}
        isHoverMode={isHoverMode}
        onToggleHover={handleToggleHover}
      />

      {/* Collapsible Keyboard Controls Overlay */}
      <ControlsOverlay />

      {/* Mobile / Touch Screen Virtual Joysticks */}
      {inputManagerRef.current && (
        <MobileTouchControls inputManager={inputManagerRef.current} />
      )}

      {/* Educational Advisory Messaging */}
      <EducationalAdvisory telemetry={telemetry} />
    </div>
  );
}