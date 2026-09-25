"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { DroneModel } from "@/types/drone";
import {
  TelemetryState,
  EnvironmentState,
  WeatherPreset,
  FlightAnalysisReport,
  ReplayFrame,
  PhysicsDebugTelemetry,
} from "@/lib/simulation/types";
import { getDroneDefinition } from "@/lib/simulation/drone-definitions";
import { FlightPhysicsEngine } from "@/lib/simulation/flight-physics";
import { InputManager } from "@/lib/simulation/input-manager";
import { FlightRecorder } from "@/lib/simulation/flight-recorder";
import { RemotePlayerState } from "@/lib/multiplayer/multiplayer-types";
import { MultiplayerClient } from "@/lib/multiplayer/multiplayer-client";
import { WorldScene } from "./world-scene";
import { EnvironmentManager } from "./world/environment-manager";
import { ModularDrone } from "./modular-drone";
import { ChaseCameraController, CameraMode } from "./chase-camera";
import { TelemetryHUD } from "./telemetry-hud";
import { FastTravelBase } from "./base-switcher-hud";
import { IslandMapModal } from "./island-map-modal";
import { NavigationWaypoint } from "./minimap-widget";
import { SimulationLoadingScreen } from "./loading/simulation-loading-screen";
import { EnvironmentControlPanel } from "./environment-control-panel";
import { TutorialOverlay } from "./tutorial-overlay";
import { LeftGlassPanel, RightGlassPanel } from "./glass-panels";
import { FlightAnalysisModal } from "./analysis/flight-analysis-modal";
import { FlightReplayModal } from "./replay/flight-replay-modal";
import { PhysicsDebugHUD } from "./debug/physics-debug-hud";
import { CrashReviveOverlay } from "./crash-revive-overlay";
import { RemoteDroneManager } from "./multiplayer/remote-drone-manager";
import { SpawnSystem } from "@/lib/world/spawn-system";
import { SpawnConfiguration } from "@/lib/world/world-types";
import { HELIPADS } from "@/lib/world/helipad-definitions";
import { useAuth } from "@/context/auth-context";
import { AudioManager } from "@/lib/audio/audio-manager";
import { DroneAudio } from "@/lib/audio/drone-audio";
import { WindAudio } from "@/lib/audio/wind-audio";
import { EnvironmentZoneAudio } from "@/lib/audio/environment-zones";
import { SFXEvents } from "@/lib/audio/sfx-events";
import { REGION_LIST } from "@/lib/world/region-definitions";
import {
  DroneDigitalTwinConfiguration,
  DroneDigitalTwinRuntimeState,
} from "@/types/drone-digital-twin";
import {
  getActiveDigitalTwin,
  setActiveDigitalTwin,
} from "@/lib/digital-twin/digital-twin-storage";
import { getDigitalTwinPresetById } from "@/lib/digital-twin/digital-twin-presets";
import {
  digitalTwinToDroneDefinition,
  buildRuntimeStateFromTelemetry,
} from "@/lib/digital-twin/adapter";
import { DigitalTwinHUD } from "./debug/digital-twin-hud";
import { FaultInjectionPanel } from "./fault-injection-panel";
import { EducationalBanner } from "./educational-banner";
import { ScenarioSelectorModal } from "./scenario-selector-modal";
import { EducationalEventEngine } from "@/lib/simulation/educational-event-engine";
import { TrainingScenario } from "@/lib/simulation/scenario-presets";
import { EducationalEvent } from "@/lib/simulation/types";
import { SimulationClock, ClockSnapshot } from "@/lib/simulation/simulation-clock";
import { SimulationAdapter, SimulationAdapterStatus } from "@/lib/simulation/adapters/simulation-adapter";
import { LocalSimulationAdapter } from "@/lib/simulation/adapters/local-simulation-adapter";
import { HardwareControllerAdapter } from "@/lib/simulation/adapters/hardware-controller-adapter";
import { flightInputToNormalized } from "@/lib/simulation/normalized-control";
import { TelemetryBus } from "@/lib/simulation/telemetry-bus";
import { SimulationEventBus, SimulationEvent } from "@/lib/simulation/event-bus";
import { ConnectionStatus } from "@/lib/multiplayer/multiplayer-types";
import { SimulationDiagnosticsOverlay } from "./debug/simulation-diagnostics-overlay";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AircraftControlPanel, ManipulationEvent } from "./aircraft-control-panel";
function getWindExposure(x: number, z: number): number {
  for (const r of REGION_LIST) {
    if (x >= r.bounds.minX && x <= r.bounds.maxX && z >= r.bounds.minZ && z <= r.bounds.maxZ) {
      if (r.category === 'highlands' || r.category === 'maritime' || r.category === 'ocean') return 1.0;
      if (r.category === 'nature') return 0.3;
      if (r.category === 'urban') return 0.2;
    }
  }
  return 0.6;
}

interface FlightSimulatorProps {
  selectedDrone: DroneModel;
  initialDigitalTwin?: DroneDigitalTwinConfiguration;
  onExit: () => void;
}

export function FlightSimulator({ selectedDrone, initialDigitalTwin, onExit }: FlightSimulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const cameraControllerRef = useRef<ChaseCameraController | null>(null);
  const physicsEngineRef = useRef<FlightPhysicsEngine | null>(null);
  const simulationAdapterRef = useRef<SimulationAdapter | null>(null);
  const hardwareAdapterRef = useRef<HardwareControllerAdapter>(new HardwareControllerAdapter());
  const simClockRef = useRef<SimulationClock>(new SimulationClock(1 / 60));
  const droneMeshRef = useRef<ModularDrone | null>(null);
  const flightRecorderRef = useRef<FlightRecorder>(new FlightRecorder());
  const multiplayerClientRef = useRef<MultiplayerClient | null>(null);
  const remoteDroneManagerRef = useRef<RemoteDroneManager | null>(null);
  const crashTriggeredRef = useRef<boolean>(false);
  const remotePlayersRef = useRef<RemotePlayerState[]>([]);

  // Authenticated pilot username
  const { user } = useAuth();

  const pilotName = React.useMemo(() => {
    return (
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "PILOT-" + Math.floor(100 + Math.random() * 900)
    );
  }, [user]);

  // Resolve initial spawn point from URL parameters
  const initialSpawn = React.useMemo(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return SpawnSystem.resolveSpawn(
        params.get("region"),
        params.get("helipad") || params.get("spawn")
      );
    }
    return SpawnSystem.resolveSpawn();
  }, []);

  const spawnConfigRef = useRef<SpawnConfiguration>(initialSpawn);

  // Audio Refs
  const audioManagerRef = useRef<AudioManager | null>(null);
  const droneAudioRef = useRef<DroneAudio | null>(null);
  const windAudioRef = useRef<WindAudio | null>(null);
  const envZoneAudioRef = useRef<EnvironmentZoneAudio | null>(null);
  const sfxEventsRef = useRef<SFXEvents | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const hasInitAudioRef = useRef(false);

  const initAudio = useCallback(() => {
    if (hasInitAudioRef.current) return;
    hasInitAudioRef.current = true;
    
    const am = AudioManager.getInstance();
    am.init();
    const ctx = am.getContext();
    if (!ctx) return;
    audioManagerRef.current = am;

    const droneGain = am.getChannel('drone');
    if (droneGain) droneAudioRef.current = new DroneAudio(ctx, droneGain);

    const envGain = am.getChannel('environment');
    if (envGain) {
      windAudioRef.current = new WindAudio(ctx, envGain);
      envZoneAudioRef.current = new EnvironmentZoneAudio(ctx, envGain);
    }

    const sfxGain = am.getChannel('sfx');
    if (sfxGain) sfxEventsRef.current = new SFXEvents(ctx, sfxGain);

    droneAudioRef.current?.start();
    windAudioRef.current?.start();
    envZoneAudioRef.current?.start();
    sfxEventsRef.current?.playMotorStart();
    
    setIsMuted(am.isMuted);
  }, []);

  const toggleMute = useCallback(() => {
    const am = AudioManager.getInstance();
    setIsMuted(am.toggleMute());
  }, []);

  useEffect(() => {
    const handleUserGesture = () => {
      initAudio();
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('keydown', handleUserGesture);
    };
    document.addEventListener('click', handleUserGesture);
    document.addEventListener('keydown', handleUserGesture);
    return () => {
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('keydown', handleUserGesture);
    };
  }, [initAudio]);

  // Callsign for multiplayer matches authenticated pilot name
  const callsign = pilotName;

  // UI Modal States
  const [isLoading, setIsLoading] = useState(true);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [activeWaypoint, setActiveWaypoint] = useState<NavigationWaypoint | null>(null);
  const [isEnvironmentOpen, setIsEnvironmentOpen] = useState(false);
  // Flight Coach only opens automatically for first-time pilots
  const [isTutorialOpen, setIsTutorialOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const hasCompleted = localStorage.getItem("drone_pilot_flight_coach_completed");
      return !hasCompleted;
    }
    return false;
  });
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("debug") === "true";
    }
    return false;
  });

  // Simulation Data States
  const [cameraMode, setCameraMode] = useState<CameraMode>("chase");
  const [isHoverMode, setIsHoverMode] = useState(true);
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayerState[]>([]);
  const [replayFrames, setReplayFrames] = useState<ReplayFrame[]>([]);
  const [analysisReport, setAnalysisReport] = useState<FlightAnalysisReport | null>(null);
  const [physicsDebug, setPhysicsDebug] = useState<PhysicsDebugTelemetry | null>(null);

  // Environment State
  const [envState, setEnvState] = useState<EnvironmentState>({
    weather: "clear",
    preset: "normal",
    windSpeed: 2.0,
    windDirection: 45,
    windGust: 0.8,
    temperature: 20,
    rainIntensity: "off",
    visibility: "clear",
    timeOfDay: "noon",
  });

  // Telemetry state for HUD
  const [telemetry, setTelemetry] = useState<TelemetryState>(() => ({
    position: {
      x: initialSpawn.position.x,
      y: initialSpawn.position.y,
      z: initialSpawn.position.z,
    },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: {
      pitch: initialSpawn.rotation.pitch,
      roll: initialSpawn.rotation.roll,
      yaw: initialSpawn.rotation.yaw,
    },
    altitude: 0,
    altitudeMsl: initialSpawn.position.y,
    groundSpeed: 0,
    verticalSpeed: 0,
    heading: Math.round((((initialSpawn.rotation.yaw * 180) / Math.PI) % 360 + 360) % 360),
    batteryLevel: 100,
    batteryVoltage: 16.8,
    batteryCurrentAmps: 0.8,
    flightTimeSeconds: 0,
    flightMode: "LANDED",
    isArmed: false,
    rotorRpmPercent: 0,
    motorOutputs: [0, 0, 0, 0],
    distanceFromHome: 0,
    flightPath: [{ x: initialSpawn.position.x, z: initialSpawn.position.z }],
  }));

  // Tactical Dropzone Briefing state
  const [showDropBriefing, setShowDropBriefing] = useState(false);
  const [autoMoveLocked, setAutoMoveLocked] = useState("");
  const autoMoveLockedRef = useRef("");

  // Digital Twin state for HUD & live telemetry
  const [activeDigitalTwin, setActiveDigitalTwinState] = useState<DroneDigitalTwinConfiguration | null>(null);
  const [digitalTwinRuntime, setDigitalTwinRuntime] = useState<DroneDigitalTwinRuntimeState | null>(null);
  const [isDigitalTwinHUDOpen, setIsDigitalTwinHUDOpen] = useState(false);
  const activeDtRef = useRef<DroneDigitalTwinConfiguration | null>(null);

  // Phase 5: Fault Injection, Scenarios & Educational Event System
  const [isFaultPanelOpen, setIsFaultPanelOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [motorHealths, setMotorHealths] = useState<number[]>([1, 1, 1, 1, 1, 1, 1, 1]);
  const [sensorHealth, setSensorHealth] = useState({
    gps: true,
    imu: true,
    baro: true,
    compass: true,
  });
  const [payloadMassKg, setPayloadMassKg] = useState(0.0);
  const [motorOverrides, setMotorOverrides] = useState<number[]>([1, 1, 1, 1, 1, 1, 1, 1]);
  const [manipulationEvents, setManipulationEvents] = useState<ManipulationEvent[]>([]);
  const baselineExperimentRef = useRef({ payloadKg: 0, batteryPercent: 100 });
  const [activeScenarioId, setActiveScenarioId] = useState<string>("normal-cruise");

  // Educational Event Engine
  const [currentEduEvent, setCurrentEduEvent] = useState<EducationalEvent | null>(null);
  const [eduEventHistory, setEduEventHistory] = useState<EducationalEvent[]>([]);
  const eduEngineRef = useRef<EducationalEventEngine>(
    new EducationalEventEngine((event) => {
      setCurrentEduEvent(event);
      setEduEventHistory((prev) => [event, ...prev.slice(0, 29)]);
      SimulationEventBus.getInstance().emit({
        timestamp: event.timestamp,
        simTime: simClockRef.current.getSimTime(),
        type: "BATTERY_LOW",
        severity: event.severity === "error" ? "CRITICAL" : event.severity === "warning" ? "WARNING" : "INFO",
        source: "PHYSICS",
        title: event.title,
        message: event.whatHappened || event.message || "",
      });
    })
  );

  // Phase 7: Diagnostics, Simulation Clock & Network Status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("LOCAL");
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [clockSnapshot, setClockSnapshot] = useState<ClockSnapshot>(simClockRef.current.getSnapshot());
  const [fps, setFps] = useState(60);
  const [eventCount, setEventCount] = useState(0);
  const [lastEventTitle, setLastEventTitle] = useState<string | undefined>();
  const [adapterStatus, setAdapterStatus] = useState<SimulationAdapterStatus>({
    name: "Built-in Browser 6-DoF Physics",
    type: "local",
    isConnected: true,
    isLiveHardware: false,
    latencyMs: 0.1,
    packetsSent: 0,
    packetsReceived: 0,
    statusMessage: "Operational",
  });

  // Simulation Event Bus Subscription for real-time observability
  useEffect(() => {
    const unsub = SimulationEventBus.getInstance().subscribe((evt) => {
      setEventCount((prev) => prev + 1);
      setLastEventTitle(evt.title);
    });
    return unsub;
  }, []);


  // Stable loading ready callback
  const handleLoadingReady = useCallback(() => {
    setIsLoading(false);
    setShowDropBriefing(true);
    const timer = setTimeout(() => {
      setShowDropBriefing(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Toggle Camera

  const handleToggleCamera = useCallback(() => {
    if (cameraControllerRef.current) {
      const nextMode = cameraControllerRef.current.cycleMode();
      setCameraMode(nextMode);
    }
  }, []);

  // In-Place Drone Revive & Field Repair
  const handleReviveHere = useCallback(() => {
    crashTriggeredRef.current = false;
    if (physicsEngineRef.current) {
      const newTelem = physicsEngineRef.current.revive();
      droneMeshRef.current?.setDamaged(false);
      setTelemetry({ ...newTelem });
    }
  }, []);

  // Reset to Selected Spawn Helipad
  const handleReset = useCallback(() => {
    crashTriggeredRef.current = false;
    if (physicsEngineRef.current) {
      physicsEngineRef.current.resetCrash();
      const sp = spawnConfigRef.current;
      physicsEngineRef.current.reset(
        sp.position.x,
        sp.position.y,
        sp.position.z,
        sp.rotation.yaw
      );
      droneMeshRef.current?.setDamaged(false);
      setTelemetry({ ...physicsEngineRef.current.generateTelemetry() });
    }
  }, []);

  // Fast Travel Teleport to any Island Base — cleanly flies over helipad at current altitude
  const handleTeleportBase = useCallback((base: FastTravelBase) => {
    crashTriggeredRef.current = false;
    setIsAnalysisOpen(false);
    if (physicsEngineRef.current) {
      const pe = physicsEngineRef.current;
      pe.resetCrash();
      pe.crashState = null;

      const groundElev = pe.elevationQueryFn
        ? pe.elevationQueryFn(base.position.x, base.position.z)
        : base.position.y;
      const safeFloor = Math.max(base.position.y, groundElev + 0.25);

      // Maintain current altitude AGL (at least 6.0m safe overhead hover)
      const currentAgl = Math.max(6.0, pe.posY - pe.groundLevel);
      const targetHoverY = safeFloor + currentAgl;

      pe.posX = base.position.x;
      pe.posY = targetHoverY;
      pe.posZ = base.position.z;
      pe.groundLevel = safeFloor;
      pe.yaw = (base.headingDeg * Math.PI) / 180;
      pe.pitch = 0;
      pe.roll = 0;
      pe.pitchRate = 0;
      pe.rollRate = 0;
      pe.yawRate = 0;
      pe.velX = 0;
      pe.velY = 0;
      pe.velZ = 0;
      pe.accelX = 0;
      pe.accelY = 0;
      pe.accelZ = 0;
      pe.isArmed = true;
      pe.isHoverMode = true;
      pe.targetAltitude = targetHoverY;
      pe.rotorRpm = 4200;
      pe.motorOutputs = pe.motorOutputs.map(() => 0.60);
      pe.isCeilingLimitReached = false;
      pe.isGroundLimitReached = false;

      droneMeshRef.current?.setDamaged(false);
      setTelemetry({ ...pe.generateTelemetry() });
    }
  }, []);

  // Toggle Hover Mode
  const handleToggleHover = useCallback(() => {
    if (physicsEngineRef.current && inputManagerRef.current) {
      inputManagerRef.current.toggleHoverAssist();
      const current = inputManagerRef.current.isHoverAssist();
      physicsEngineRef.current.isHoverMode = current;
      if (current) {
        physicsEngineRef.current.targetAltitude = physicsEngineRef.current.posY;
      }
      setIsHoverMode(current);
    }
  }, []);

  // Controls input delegation
  const handleMoveDirection = useCallback((pitch: number, roll: number) => {
    inputManagerRef.current?.setDirection(pitch, roll);
  }, []);

  const handleYaw = useCallback((yaw: number) => {
    inputManagerRef.current?.setYaw(yaw);
  }, []);

  const handleThrottle = useCallback((throttle: number) => {
    inputManagerRef.current?.setThrottle(throttle);
  }, []);

  const handleAutoLand = useCallback(() => {
    physicsEngineRef.current?.triggerAutoLand();
  }, []);

  // Camera selection
  const handleSelectCameraMode = useCallback((mode: CameraMode) => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setMode(mode);
      setCameraMode(mode);
    }
  }, []);

  const handleUpdateEnvironment = useCallback((updates: Partial<EnvironmentState>) => {
    if (physicsEngineRef.current) {
      const prevEnv = physicsEngineRef.current.environment.getState();
      physicsEngineRef.current.environment.setState(updates);
      const newEnv = physicsEngineRef.current.environment.getState();
      setEnvState({ ...newEnv });

      EnvironmentManager.getInstance().setWind(newEnv.windSpeed, newEnv.windDirection);

      let title = "";
      let message = "";
      let type: SimulationEvent["type"] | null = null;
      let severity: "INFO" | "WARNING" = "INFO";

      if (updates.windSpeed !== undefined && updates.windSpeed !== prevEnv.windSpeed) {
        type = "WIND_SPEED_CHANGED";
        const dir = updates.windSpeed > prevEnv.windSpeed ? "increased" : "decreased";
        title = `WIND ${dir.toUpperCase()}`;
        message = `Wind speed has ${dir} from ${prevEnv.windSpeed.toFixed(1)} m/s to ${newEnv.windSpeed.toFixed(1)} m/s. The aircraft is experiencing ${dir === "increased" ? "greater" : "less"} environmental disturbance.`;
        if (updates.windSpeed > 0) message += " The aircraft is drifting laterally relative to its previous state.";
      } else if (updates.windDirection !== undefined && updates.windDirection !== prevEnv.windDirection) {
        type = "WIND_DIRECTION_CHANGED";
        title = `WIND DIRECTION CHANGED`;
        message = `Wind direction changed from ${prevEnv.windDirection}° to ${newEnv.windDirection}°. The direction of the environmental aerodynamic force acting on the aircraft has shifted.`;
      } else if (updates.turbulence !== undefined && updates.turbulence !== prevEnv.turbulence) {
        type = "TURBULENCE_CHANGED";
        const dir = updates.turbulence > (prevEnv.turbulence || 0) ? "increased" : "decreased";
        title = `TURBULENCE ${dir.toUpperCase()}`;
        message = `Turbulence intensity ${dir}. The aircraft is experiencing ${dir === "increased" ? "additional" : "reduced"} environmental disturbance.`;
      } else if (updates.temperature !== undefined && updates.temperature !== prevEnv.temperature) {
        type = "TEMPERATURE_CHANGED";
        title = `TEMPERATURE CHANGED`;
        message = `Air temperature changed to ${newEnv.temperature}°C. Air density changes inversely with temperature, affecting aerodynamic drag and motor thrust efficiency slightly.`;
      } else if (updates.rainIntensity !== undefined && updates.rainIntensity !== prevEnv.rainIntensity) {
        type = "RAIN_CHANGED";
        title = `RAIN INTENSITY CHANGED`;
        message = `Rain intensity changed to ${newEnv.rainIntensity.toUpperCase()}. Rain is currently affecting the environment visually. No aerodynamic rain effect is modeled by the current physics engine.`;
      } else if (updates.visibility !== undefined && updates.visibility !== prevEnv.visibility) {
        type = "VISIBILITY_CHANGED";
        title = `VISIBILITY CHANGED`;
        message = `Visibility changed to ${newEnv.visibility.toUpperCase()}. Visual environment perception is reduced. No navigation or sensor degradation is currently modeled by the physics engine for this condition.`;
      }

      if (type && title && message) {
        const eduEvent: EducationalEvent = {
          id: `env-${Date.now()}`,
          title,
          message,
          severity: "info",
          timestamp: Date.now(),
        };
        setCurrentEduEvent(eduEvent);
        setEduEventHistory((prev) => [eduEvent, ...prev].slice(0, 30));
        
        SimulationEventBus.getInstance().emit({
          timestamp: Date.now(),
          simTime: simClockRef.current.getSimTime(),
          type: type as any,
          severity: severity,
          source: "ENVIRONMENT",
          title,
          message
        });
      }
    }
  }, []);

  const handleApplyWeatherPreset = useCallback((preset: WeatherPreset) => {
    if (physicsEngineRef.current) {
      physicsEngineRef.current.environment.applyPreset(preset);
      setEnvState({ ...physicsEngineRef.current.environment.getState() });
    }
  }, []);

  // Phase 5: Fault Injection & Manipulation Handlers
  const recordManipulation = useCallback((type: string, title: string) => {
    const event = { id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, title, timestamp: Date.now() };
    setManipulationEvents((previous) => [event, ...previous].slice(0, 12));
    SimulationEventBus.getInstance().emit({ timestamp: event.timestamp, simTime: simClockRef.current.getSimTime(), type: type as SimulationEvent["type"], severity: "INFO", source: "PILOT", title, message: title });
  }, []);

  const handleSetMotorOverride = useCallback((index: number, percent: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= (physicsEngineRef.current?.def.motorCount || 0) || !Number.isFinite(percent)) return;
    const multiplier = Math.max(0, Math.min(1, percent / 100));
    const previous = motorOverrides[index] ?? 1;
    setMotorOverrides((values) => { const next = [...values]; next[index] = multiplier; return next; });
    physicsEngineRef.current?.setMotorOverride(index, multiplier === 1 ? null : multiplier);
    if (Math.abs(previous - multiplier) > 0.001) recordManipulation("MOTOR_RPM_CHANGED", `Motor ${index + 1} command set to ${Math.round(multiplier * 100)}%`);
  }, [motorOverrides, recordManipulation]);

  const handleMotorFailure = useCallback((index: number, failed: boolean) => {
    if (!Number.isInteger(index) || index < 0 || index >= (physicsEngineRef.current?.def.motorCount || 0)) return;
    const health = failed ? 0 : 1;
    setMotorHealths((values) => { const next = [...values]; next[index] = health; return next; });
    physicsEngineRef.current?.setMotorHealth(index, health);
    recordManipulation("MOTOR_FAILURE", failed ? `Motor ${index + 1} failed` : `Motor ${index + 1} restored`);
  }, [recordManipulation]);

  const handleSetBatteryState = useCallback((percent: number) => {
    if (!Number.isFinite(percent)) return;
    const value = Math.max(0, Math.min(100, percent));
    physicsEngineRef.current?.battery.reset(value);
    setTelemetry((previous) => ({ ...previous, batteryLevel: value }));
    recordManipulation("BATTERY_CHANGED", `Battery state set to ${value}%`);
  }, [recordManipulation]);

  const handleResetExperiment = useCallback(() => {
    const physics = physicsEngineRef.current;
    if (!physics) return;
    const baseline = baselineExperimentRef.current;
    physics.motorHealth.fill(1); physics.motorOverrides.fill(null); physics.setPayloadMass(baseline.payloadKg); physics.battery.reset(baseline.batteryPercent); physics.resetCrash();
    setMotorHealths(new Array(8).fill(1)); setMotorOverrides(new Array(8).fill(1)); setPayloadMassKg(baseline.payloadKg); setManipulationEvents([]);
    recordManipulation("ATTITUDE_CHANGED", "Simulation experiment reset to saved Digital Twin baseline");
  }, [recordManipulation]);

  const handleSetMotorHealth = useCallback((index: number, health: number) => {
    setMotorHealths((prev) => {
      const next = [...prev];
      next[index] = health;
      return next;
    });
    physicsEngineRef.current?.setMotorHealth(index, health);
  }, []);

  const handleToggleSensor = useCallback((sensor: "gps" | "imu" | "baro" | "compass") => {
    setSensorHealth((prev) => {
      const next = { ...prev, [sensor]: !prev[sensor] };
      physicsEngineRef.current?.setSensorHealth({ [sensor]: next[sensor] });
      return next;
    });
  }, []);

  const handleSetPayloadMass = useCallback((massKg: number) => {
    setPayloadMassKg(massKg);
    physicsEngineRef.current?.setPayloadMass(massKg);
  }, []);

  const handleResetAllFaults = useCallback(() => {
    const nominal = [1, 1, 1, 1, 1, 1, 1, 1];
    setMotorHealths(nominal);
    const nominalSensors = { gps: true, imu: true, baro: true, compass: true };
    setSensorHealth(nominalSensors);
    setPayloadMassKg(0.0);
    if (physicsEngineRef.current) {
      physicsEngineRef.current.motorHealth.fill(1.0);
      physicsEngineRef.current.motorOverrides.fill(null);
      physicsEngineRef.current.setSensorHealth(nominalSensors);
      physicsEngineRef.current.setPayloadMass(0.0);
      physicsEngineRef.current.setTurbulence(0.0);
    }
  }, []);

  const handleSelectScenario = useCallback(
    (scenario: TrainingScenario) => {
      setActiveScenarioId(scenario.id);
      handleResetAllFaults();

      if (scenario.environment) {
        handleUpdateEnvironment(scenario.environment);
        if (scenario.environment.preset) {
          handleApplyWeatherPreset(scenario.environment.preset);
        }
      }

      if (scenario.faults.motorHealth) {
        Object.entries(scenario.faults.motorHealth).forEach(([idxStr, h]) => {
          handleSetMotorHealth(Number(idxStr), h);
        });
      }

      if (scenario.faults.sensorHealth) {
        Object.entries(scenario.faults.sensorHealth).forEach(([sensor, healthy]) => {
          setSensorHealth((prev) => ({ ...prev, [sensor]: healthy }));
          physicsEngineRef.current?.setSensorHealth({ [sensor]: healthy });
        });
      }

      if (scenario.faults.payloadMassKg !== undefined) {
        handleSetPayloadMass(scenario.faults.payloadMassKg);
      }

      if (scenario.faults.batteryInitialSocPercent !== undefined && physicsEngineRef.current) {
        physicsEngineRef.current.battery.reset(scenario.faults.batteryInitialSocPercent);
      }
    },
    [
      handleResetAllFaults,
      handleUpdateEnvironment,
      handleApplyWeatherPreset,
      handleSetMotorHealth,
      handleSetPayloadMass,
    ]
  );

  // Post-Flight Analysis Handlers
  const handleManualDebrief = useCallback(() => {
    const report = flightRecorderRef.current.generateAnalysis(
      selectedDrone.name,
      physicsEngineRef.current?.crashState || null
    );
    setAnalysisReport(report);
    setIsAnalysisOpen(true);
  }, [selectedDrone.name]);

  // Demonstration Mode Trigger (Requirement 39: CDAC / Live Demo)
  const handleTriggerDemoMode = useCallback(() => {
    setIsDigitalTwinHUDOpen(true);
    handleUpdateEnvironment({
      windSpeed: 12, // 12 m/s (~43 km/h)
      windDirection: 120,
      windGust: 18,
      temperature: 32,
      turbulence: 0.65,
    });
    handleSetPayloadMass(3.5);
    SimulationEventBus.getInstance().emit({
      timestamp: Date.now(),
      simTime: simClockRef.current.getSimTime(),
      type: "SCENARIO_STARTED",
      severity: "INFO",
      source: "SCENARIO",
      title: "CDAC Demonstration Mode Activated",
      message: "High Wind (12 m/s, 18 m/s gusts) + 3.5kg Payload injected. Observe motor RPM, asymmetric torques, and battery voltage sag.",
    });
  }, [handleUpdateEnvironment, handleSetPayloadMass]);

  const handleOpenReplay = useCallback(() => {
    setReplayFrames(flightRecorderRef.current.getFrames());
    setIsReplayOpen(true);
  }, []);


  const handleFlyAgain = useCallback(() => {
    setIsAnalysisOpen(false);
    handleReset();
  }, [handleReset]);

  const handleDismissTutorial = useCallback(() => {
    setIsTutorialOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("drone_pilot_flight_coach_completed", "true");
    }
  }, []);

  // Keybindings for Debug & Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "F3" || e.key === "\x60" || e.key === "~") {
        setIsDebugOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Main 3D Three.js Lifecycle
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
      preserveDrawingBuffer: true,
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

    // 3. 3D WORLD SCENE (Irregular Island World Root)
    const worldScene = new WorldScene(scene);
    scene.add(worldScene.group);

    // 4. DYNAMIC SPAWN RESOLUTION & CONFIGURATION
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const reqRegion = urlParams?.get("region");
    const reqHelipad = urlParams?.get("helipad") || urlParams?.get("spawn");
    const spawnConfig = SpawnSystem.resolveSpawn(reqRegion, reqHelipad);
    spawnConfigRef.current = spawnConfig;

    // 5. MODULAR DRONE & CANONICAL DIGITAL TWIN RESOLUTION
    let dtConfig = initialDigitalTwin || getActiveDigitalTwin(null);
    const dtParam = urlParams?.get("dt");
    if (dtParam) {
      dtConfig = getDigitalTwinPresetById(dtParam);
    } else if (dtConfig.identity.category !== selectedDrone.platformId) {
      dtConfig = getDigitalTwinPresetById(selectedDrone.id);
    }
    setActiveDigitalTwin(null, dtConfig);
    setActiveDigitalTwinState(dtConfig);
    activeDtRef.current = dtConfig;

    const droneDef = digitalTwinToDroneDefinition(dtConfig);
    const droneMesh = new ModularDrone(droneDef, pilotName);
    scene.add(droneMesh.group);
    scene.add(droneMesh.groundShadowMesh);
    droneMeshRef.current = droneMesh;

    // 6. MULTIPLAYER REMOTE DRONES LAYER
    const remoteDroneMgr = new RemoteDroneManager();
    scene.add(remoteDroneMgr.group);
    remoteDroneManagerRef.current = remoteDroneMgr;

    // Connect to room network with connection status tracking
    const mpClient = new MultiplayerClient(
      callsign,
      spawnConfig.regionId,
      (players) => {
        remotePlayersRef.current = players;
        setRemotePlayers(players);
      },
      (status) => {
        setConnectionStatus(status);
      }
    );
    mpClient.connect();
    multiplayerClientRef.current = mpClient;

    // 7. SIMULATION ADAPTER & 6-DoF SOLVER (PHASE 7 ARCHITECTURE)
    const localAdapter = new LocalSimulationAdapter(droneDef);
    localAdapter.setElevationQueryFn((x, z) => worldScene.getGroundElevation(x, z));
    simulationAdapterRef.current = localAdapter;
    const physics = localAdapter.getPhysicsEngine();

    // Configure payload mass based on digital twin (plus override if specified in URL)
    const payloadParam = parseFloat(urlParams?.get("payload") || "0");
    const dtPayload = dtConfig.massProperties.payloadMassKg + dtConfig.massProperties.cameraMassKg;
    const baselinePayload = !isNaN(payloadParam) && payloadParam > 0 ? Math.min(droneDef.payloadCapacity * 1.5, payloadParam) : Math.max(0, dtPayload);
    physics.setPayloadMass(baselinePayload);
    baselineExperimentRef.current = { payloadKg: baselinePayload, batteryPercent: 100 };
    setPayloadMassKg(baselinePayload);
    setMotorOverrides(new Array(droneDef.motorCount).fill(1));
    setMotorHealths(new Array(droneDef.motorCount).fill(1));

    // Configure initial weather preset if requested
    const weatherParam = (urlParams?.get("weather") as WeatherPreset) || "normal";
    physics.environment.applyPreset(weatherParam);
    setEnvState({ ...physics.environment.getState() });

    physics.reset(
      spawnConfig.position.x,
      spawnConfig.position.y,
      spawnConfig.position.z,
      spawnConfig.rotation.yaw
    );
    physicsEngineRef.current = physics;
    simClockRef.current.reset();
    simClockRef.current.start();


    // 8. CHASE CAMERA
    const chaseCam = new ChaseCameraController(55, width / height);
    cameraControllerRef.current = chaseCam;

    // 9. INPUT MANAGER
    const inputManager = new InputManager();
    inputManager.attach();
    inputManagerRef.current = inputManager;

    // 10. RESIZE OBSERVER
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

    // 11. MOUSE DRAG 360 ORBIT CONTROLS
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

      // Mouse-aim flight steering: dragging cursor horizontally turns drone heading (Yaw)
      physics.yaw -= dx * 0.006;
      if (physics.yaw > Math.PI * 2) physics.yaw -= Math.PI * 2;
      if (physics.yaw < 0) physics.yaw += Math.PI * 2;

      // Vertical mouse movement tilts camera viewing pitch only (not up/down drone altitude)
      chaseCam.setOrbitDelta(0, dy);
    };

    const onMouseUp = () => {
      isDragging = false;
      chaseCam.stopOrbiting();
    };

    const onDblClick = () => {
      chaseCam.resetOrbit();
    };

    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.code === "KeyL") {
        physics.triggerAutoLand();
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domEl.addEventListener("dblclick", onDblClick);
    window.addEventListener("keydown", onGlobalKeyDown);

    // 12. ANIMATION & SIMULATION LOOP
    let animationId: number;
    const clock = new THREE.Clock();
    let telemetryThrottleTimer = 0;
    let framesCount = 0;
    let fpsTimer = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // FPS Calculation
      fpsTimer += dt;
      framesCount++;
      if (fpsTimer >= 0.5) {
        setFps(Math.round(framesCount / fpsTimer));
        framesCount = 0;
        fpsTimer = 0;
      }

      // Read Input & Poll Hardware Controller (Gamepad / RC Mode 2)
      const input = inputManager.getInput(dt);
      const hwInput = hardwareAdapterRef.current.pollInput();
      if (hwInput) {
        if (hwInput.throttle !== undefined && Math.abs(hwInput.throttle) > 0.05) input.throttle = hwInput.throttle;
        if (hwInput.pitch !== undefined && Math.abs(hwInput.pitch) > 0.05) input.pitch = hwInput.pitch;
        if (hwInput.roll !== undefined && Math.abs(hwInput.roll) > 0.05) input.roll = hwInput.roll;
        if (hwInput.yaw !== undefined && Math.abs(hwInput.yaw) > 0.05) input.yaw = hwInput.yaw;
        if (hwInput.isArmed) physics.isArmed = true;
      }

      const lockedDir = inputManager.getLockedDirection();
      if (lockedDir !== autoMoveLockedRef.current) {
        autoMoveLockedRef.current = lockedDir;
        setAutoMoveLocked(lockedDir);
      }

      if (input.cameraToggle) {
        setCameraMode(chaseCam.cycleMode());
      }

      // Step Physics via Canonical Simulation Clock (Fixed-Timestep Accumulator)
      let curTelemetry = physics.generateTelemetry();
      simClockRef.current.tick((fixedDt) => {
        curTelemetry = physics.update(input, fixedDt);
        TelemetryBus.getInstance().publish(curTelemetry, fixedDt);
      });

      // Record telemetry frame for recorder & replay
      flightRecorderRef.current.record(curTelemetry);

      // Check for impact / crash incident
      if (curTelemetry.isCrashed && !crashTriggeredRef.current) {
        crashTriggeredRef.current = true;
        sfxEventsRef.current?.playCrash();
        const report = flightRecorderRef.current.generateAnalysis(
          selectedDrone.name,
          physics.crashState
        );
        setAnalysisReport(report);
        // Sync telemetry immediately so the CrashReviveOverlay displays without delay
        setTelemetry({ ...curTelemetry });
      }

      // Update 3D Drone Transform & Props
      droneMesh.update(curTelemetry, dt);
      droneMesh.setNameTagVisible(chaseCam.mode !== "fpv");

      // Update Remote Drones in Airspace (with Dead Reckoning)
      remoteDroneMgr.update(remotePlayersRef.current, dt);

      // Update World Environment animations (grass, NPCs, traffic, etc.)
      const dPos = new THREE.Vector3(curTelemetry.position.x, curTelemetry.position.y, curTelemetry.position.z);
      worldScene.update(dt, elapsed, dPos, (curTelemetry.rotorRpmPercent || 0) / 100);

      // Update Follow Camera
      chaseCam.update(curTelemetry, dt);

      // Update Audio
      if (droneAudioRef.current) {
        const throttleValue = (curTelemetry.rotorRpmPercent || 0) / 100;
        droneAudioRef.current.update(
          throttleValue,
          throttleValue * 5000,
          curTelemetry.groundSpeed,
          curTelemetry.isArmed,
          curTelemetry.flightMode
        );
      }
      if (windAudioRef.current) {
        windAudioRef.current.update(curTelemetry.altitudeMsl || curTelemetry.altitude, curTelemetry.groundSpeed, getWindExposure(curTelemetry.position.x, curTelemetry.position.z));
      }
      if (envZoneAudioRef.current) {
        envZoneAudioRef.current.update(
          curTelemetry.position.x,
          curTelemetry.position.z,
          curTelemetry.position.y
        );
      }
      if (audioManagerRef.current) {
        audioManagerRef.current.update(dt, elapsed, chaseCam.camera.position);
      }

      // Update World Animations (Waves, Windsock, Beacon strobes, traffic, grass wind, downwash)
      const droneWorldPos = new THREE.Vector3(
        curTelemetry.position.x,
        curTelemetry.position.y,
        curTelemetry.position.z
      );
      worldScene.update(
        dt,
        elapsed,
        droneWorldPos,
        curTelemetry.rotorRpmPercent ? curTelemetry.rotorRpmPercent / 100 : 0.8
      );

      // Render 3D Frame
      renderer.render(scene, chaseCam.camera);

      // Broadcast telemetry to peer pilots
      mpClient.sendTelemetry(curTelemetry);

      // Sync React Telemetry State at ~20Hz to keep UI responsive and light
      telemetryThrottleTimer += dt;
      if (telemetryThrottleTimer >= 0.05) {
        telemetryThrottleTimer = 0;
        setTelemetry({ ...curTelemetry });
        setClockSnapshot(simClockRef.current.getSnapshot());
        if (simulationAdapterRef.current) {
          setAdapterStatus(simulationAdapterRef.current.getStatus());
        }
        if (isDebugOpen) {
          setPhysicsDebug(physics.getDebugTelemetry());
        }
        if (activeDtRef.current) {
          setDigitalTwinRuntime(
            buildRuntimeStateFromTelemetry(activeDtRef.current, curTelemetry, physics.motorOutputs)
          );
        }

        // Phase 5: Educational Event Detection
        eduEngineRef.current.evaluate(
          curTelemetry,
          physics.environment.getState(),
          physics.motorHealth,
          physics.sensorHealth,
          physics.payloadMass
        );
      }
    };

    animate();


    // CLEANUP
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      inputManager.detach();
      mpClient.disconnect();

      domEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domEl.removeEventListener("dblclick", onDblClick);
      window.removeEventListener("keydown", onGlobalKeyDown);

      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }

      scene.remove(droneMesh.group);
      scene.remove(droneMesh.groundShadowMesh);
      scene.remove(remoteDroneMgr.group);
      renderer.dispose();
    };
  }, [selectedDrone, callsign]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#08090a] overflow-hidden select-none">
      {/* Top Navigation */}
      <div className="h-16 shrink-0 z-50 relative">
        <DashboardHeader />
      </div>

      <div className="flex flex-1 w-full relative overflow-hidden">
        {/* Left Panel (Desktop) */}
        <div className="w-[340px] shrink-0 border-r border-white/10 hidden lg:block bg-neutral-900/40 backdrop-blur-md relative z-20 overflow-y-auto">
          <AircraftControlPanel
            droneName={activeDigitalTwin?.identity.name || selectedDrone.name}
            telemetry={telemetry}
            motorCount={physicsEngineRef.current?.def.motorCount || 4}
            motorOverrides={motorOverrides}
            motorHealths={motorHealths}
            payloadKg={payloadMassKg}
            maxPayloadKg={physicsEngineRef.current?.def.payloadCapacity || 4}
            sensors={sensorHealth}
            events={manipulationEvents}
            onMotorOverride={handleSetMotorOverride}
            onMotorFailure={handleMotorFailure}
            onBattery={handleSetBatteryState}
            onPayload={(kg) => { handleSetPayloadMass(kg); recordManipulation("PAYLOAD_CHANGED", `Payload set to ${kg.toFixed(1)} kg`); }}
            onReset={handleResetExperiment}
            onExit={onExit}
          />
        </div>

        {/* Center 3D World */}
        <div className="flex-1 relative z-0">
          <div ref={containerRef} className="w-full h-full cursor-crosshair bg-sky-200" />
          
          {/* Loading Screen Overlay */}
          {isLoading && <SimulationLoadingScreen onReady={handleLoadingReady} />}

          {/* Tactical Dropzone Deployment Briefing Banner */}
          {!isLoading && showDropBriefing && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-white/95 backdrop-blur-md text-neutral-900 border border-neutral-200/90 px-4 py-2 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-3 font-mono select-none">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-ping shrink-0" />
                <div className="text-xs">
                  <span className="text-[#FF5500] font-black uppercase tracking-wider">DROPZONE DEPLOYMENT: </span>
                  <span className="font-bold text-neutral-900">
                    {HELIPADS[initialSpawn.helipadId]?.name || "Island Helipad"}
                  </span>
                  <span className="text-neutral-500 text-[10px] ml-2 hidden sm:inline">
                    [{initialSpawn.regionId.toUpperCase()} • ELEV {initialSpawn.groundElevation.toFixed(1)}m]
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Avionics Telemetry HUD */}
          <TelemetryHUD
            telemetry={telemetry}
            droneName={selectedDrone.name}
            cameraMode={cameraMode}
            onSelectCameraMode={handleSelectCameraMode}
            onReset={handleReset}
            onExit={onExit}
            isHoverMode={isHoverMode}
            onToggleHover={handleToggleHover}
            onToggleMap={() => setIsMapModalOpen((prev) => !prev)}
            onMoveDirection={handleMoveDirection}
            onYaw={handleYaw}
            onThrottle={handleThrottle}
            onAutoLand={handleAutoLand}
            onOpenEnvironment={() => setIsEnvironmentOpen(true)}
            onOpenReplay={handleOpenReplay}
            onOpenAnalysis={handleManualDebrief}
            onToggleDebug={() => setIsDebugOpen((prev) => !prev)}
            onToggleTutorial={() => setIsTutorialOpen((prev) => !prev)}
            environment={envState}
            remotePlayers={remotePlayers}
            callsign={callsign}
            activeWaypoint={activeWaypoint}
            onTeleportBase={handleTeleportBase}
            autoMoveLocked={autoMoveLocked}
            onCancelAutoMove={() => {
              inputManagerRef.current?.cancelMovementLock();
              setAutoMoveLocked("");
            }}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        </div>

        {/* Right Panel (Desktop) */}
        <div className="w-[340px] shrink-0 border-l border-white/10 hidden lg:block bg-neutral-900/40 backdrop-blur-md relative z-20 overflow-y-auto">
          <RightGlassPanel
            environment={envState}
            onUpdateEnvironment={handleUpdateEnvironment}
            telemetry={telemetry}
            activeWaypoint={activeWaypoint}
            onToggleMap={() => setIsMapModalOpen(true)}
            onResetEnvironment={() => handleApplyWeatherPreset("normal")}
            currentEvent={currentEduEvent}
          />
        </div>

        {/* Mobile Hidden Panels (rendered but hidden by css on desktop) */}
        <div className="lg:hidden">
          <AircraftControlPanel
            droneName={activeDigitalTwin?.identity.name || selectedDrone.name}
            telemetry={telemetry}
            motorCount={physicsEngineRef.current?.def.motorCount || 4}
            motorOverrides={motorOverrides}
            motorHealths={motorHealths}
            payloadKg={payloadMassKg}
            maxPayloadKg={physicsEngineRef.current?.def.payloadCapacity || 4}
            sensors={sensorHealth}
            events={manipulationEvents}
            onMotorOverride={handleSetMotorOverride}
            onMotorFailure={handleMotorFailure}
            onBattery={handleSetBatteryState}
            onPayload={(kg) => { handleSetPayloadMass(kg); recordManipulation("PAYLOAD_CHANGED", `Payload set to ${kg.toFixed(1)} kg`); }}
            onReset={handleResetExperiment}
            onExit={onExit}
          />
          <RightGlassPanel
            environment={envState}
            onUpdateEnvironment={handleUpdateEnvironment}
            telemetry={telemetry}
            activeWaypoint={activeWaypoint}
            onToggleMap={() => setIsMapModalOpen(true)}
            onResetEnvironment={() => handleApplyWeatherPreset("normal")}
            currentEvent={currentEduEvent}
          />
        </div>
      </div>

      {/* Live Tutorial Overlay */}
      {isTutorialOpen && (
        <TutorialOverlay
          telemetry={telemetry}
          onDismiss={handleDismissTutorial}
        />
      )}

      {/* Developer Physics 6-DoF Debug HUD */}
      <PhysicsDebugHUD
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        telemetry={physicsDebug}
      />

      {/* Environment & Weather Control Panel Modal */}
      <EnvironmentControlPanel
        isOpen={isEnvironmentOpen}
        onClose={() => setIsEnvironmentOpen(false)}
        environment={envState}
        onUpdateEnvironment={handleUpdateEnvironment}
        onApplyPreset={handleApplyWeatherPreset}
      />

      {/* Full Tactical Island Map Modal */}
      <IslandMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        telemetry={telemetry}
        droneName={selectedDrone.name}
        activeWaypoint={activeWaypoint}
        onSelectWaypoint={setActiveWaypoint}
      />

      {/* Tactical Crash Notification & In-Place Revive HUD */}
      {telemetry.isCrashed && (
        <CrashReviveOverlay
          crashState={physicsEngineRef.current?.crashState || null}
          onReviveHere={handleReviveHere}
          onResetToBase={handleReset}
          onOpenAnalysis={handleManualDebrief}
        />
      )}

      {/* Post-Flight Debrief & Incident Analysis Modal */}
      {analysisReport && (
        <FlightAnalysisModal
          isOpen={isAnalysisOpen}
          report={analysisReport}
          onFlyAgain={handleFlyAgain}
          onOpenReplay={() => {
            setIsAnalysisOpen(false);
            handleOpenReplay();
          }}
          onExitToDashboard={onExit}
        />
      )}

      {/* Telemetry Stream Replay Modal */}
      <FlightReplayModal
        isOpen={isReplayOpen}
        onClose={() => setIsReplayOpen(false)}
        frames={replayFrames}
      />

      {/* Floating toolbar removed to migrate to new clean glassmorphism panels */}

      {/* Simulation Diagnostics Overlay */}
      <SimulationDiagnosticsOverlay
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        clockSnapshot={clockSnapshot}
        adapterStatus={adapterStatus}
        connectionStatus={connectionStatus}
        remotePlayerCount={remotePlayers.length}
        eventCount={eventCount}
        lastEventTitle={lastEventTitle}
        fps={fps}
      />

      {/* Real-Time Aeronautical Cause & Effect Banner */}
      <EducationalBanner
        currentEvent={currentEduEvent}
        history={eduEventHistory}
        onDismiss={() => setCurrentEduEvent(null)}
        onClearHistory={() => setEduEventHistory([])}
      />

      {/* Fault Injection Benchmark Panel */}
      <FaultInjectionPanel
        isOpen={isFaultPanelOpen}
        onClose={() => setIsFaultPanelOpen(false)}
        motorCount={physicsEngineRef.current?.def.motorCount || 4}
        motorHealths={motorHealths}
        onSetMotorHealth={handleSetMotorHealth}
        sensorHealth={sensorHealth}
        onToggleSensor={handleToggleSensor}
        payloadMassKg={payloadMassKg}
        maxPayloadKg={physicsEngineRef.current?.def.payloadCapacity || 4.0}
        onSetPayloadMass={handleSetPayloadMass}
        onResetAllFaults={handleResetAllFaults}
      />

      {/* Preset Training Scenarios Modal */}
      <ScenarioSelectorModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSelectScenario={handleSelectScenario}
        activeScenarioId={activeScenarioId}
      />

      {/* Digital Twin Live Telemetry Drawer */}
      {activeDigitalTwin && digitalTwinRuntime && (
        <DigitalTwinHUD
          isOpen={isDigitalTwinHUDOpen}
          onClose={() => setIsDigitalTwinHUDOpen(false)}
          config={activeDigitalTwin}
          runtimeState={digitalTwinRuntime}
        />
      )}
    </div>
  );
}
