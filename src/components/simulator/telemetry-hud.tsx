// ==========================================================
// DRONE PILOT — TELEMETRY HUD & AVIONICS CONTROLS
// Premium, Minimalist, Industry-Grade Flight Interface
// Features: 6-DoF Attitude Horizon, Motor Mix Gauges, Wind Vector,
// Tactical Map, Altitude Control, Direction Pad & Emergency Controls
// ==========================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { TelemetryState, EnvironmentState } from "@/lib/simulation/types";
import { CameraMode } from "./chase-camera";
import { MinimapWidget } from "./minimap-widget";
import {
  Compass,
  Battery,
  Clock,
  Navigation,
  ShieldCheck,
  Eye,
  RotateCcw,
  RotateCw,
  ChevronDown,
  Keyboard,
  ChevronUp,
  Move,
  PlaneLanding,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  X,
  Wind,
  Activity,
  Play,
  FileText,
  CloudSun,
  HelpCircle,
  Zap,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { MultiplayerRosterWidget } from "./multiplayer/multiplayer-roster-widget";
import { RemotePlayerState } from "@/lib/multiplayer/multiplayer-types";

// ----------------------------------------------------------------
// 1. ARTIFICIAL HORIZON / ATTITUDE GYRO INSTRUMENT
// ----------------------------------------------------------------
interface AttitudeIndicatorProps {
  pitchRad: number;
  rollRad: number;
}

function AttitudeIndicator({ pitchRad, rollRad }: AttitudeIndicatorProps) {
  const pitchDeg = (pitchRad * 180) / Math.PI;
  const rollDeg = (rollRad * 180) / Math.PI;

  // Clamp visual pitch deflection to +/- 30 degrees for a clean display
  const clampedPitchDeg = Math.max(-30, Math.min(30, pitchDeg));
  const pitchOffsetY = clampedPitchDeg * 1.0; // 1 pixel per degree

  return (
    <div
      className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-black bg-neutral-900 shadow-md overflow-hidden shrink-0 select-none"
      title={`Attitude: Pitch ${pitchDeg.toFixed(1)}°, Roll ${rollDeg.toFixed(1)}°`}
    >
      {/* Moving Horizon Sphere */}
      <div
        className="absolute inset-[-40px] transition-transform duration-75 ease-out"
        style={{
          transform: `rotate(${-rollDeg}deg) translateY(${pitchOffsetY}px)`,
        }}
      >
        {/* Sky Half */}
        <div className="w-full h-1/2 bg-[#0284c7] relative">
          {/* Pitch Ladder Lines (+10, +20) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-white/80" />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-5 h-[1px] bg-white/70" />
        </div>

        {/* Horizon White Line */}
        <div className="w-full h-[2px] bg-white shadow-xs" />

        {/* Earth / Ground Half */}
        <div className="w-full h-1/2 bg-[#78350f] relative">
          {/* Pitch Ladder Lines (-10, -20) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-white/80" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-5 h-[1px] bg-white/70" />
        </div>
      </div>

      {/* Fixed Aircraft Reticle Indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Left Wing */}
        <div className="w-4 h-[2px] bg-[#FF5500] shadow-xs mr-2" />
        {/* Center Target Dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-[#FF5500] border border-black" />
        {/* Right Wing */}
        <div className="w-4 h-[2px] bg-[#FF5500] shadow-xs ml-2" />
      </div>

      {/* Attitude Numbers Pill */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.2 bg-black/75 rounded text-[8px] font-mono text-white font-bold tracking-tighter pointer-events-none">
        {pitchDeg >= 0 ? "+" : ""}{pitchDeg.toFixed(0)}° / {rollDeg.toFixed(0)}°
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// 2. PER-MOTOR MIXER OUTPUT BARS
// ----------------------------------------------------------------
interface MotorMixerGaugesProps {
  motorOutputs?: number[];
}

function MotorMixerGauges({ motorOutputs }: MotorMixerGaugesProps) {
  if (!motorOutputs || motorOutputs.length === 0) return null;

  return (
    <div
      className="hidden lg:flex flex-col items-center bg-white p-1.5 rounded-xl border-2 border-black shadow-sm shrink-0 select-none"
      title="Individual Motor Commanded Throttle (0-100%)"
    >
      <div className="flex items-center gap-1 text-[8px] font-black text-neutral-600 uppercase tracking-wider mb-1">
        <Zap className="h-2.5 w-2.5 text-[#FF5500]" />
        <span>MTR MIX ({motorOutputs.length})</span>
      </div>
      <div className="flex items-end gap-1 h-7 px-1">
        {motorOutputs.map((val, idx) => {
          const pct = Math.min(100, Math.max(0, Math.round(val * 100)));
          const colorClass =
            pct > 92 ? "bg-rose-500" : pct > 75 ? "bg-[#FF5500]" : "bg-emerald-500";
          return (
            <div key={idx} className="flex flex-col items-center gap-0.5">
              <div className="w-2.5 h-6 bg-neutral-100 rounded-xs overflow-hidden border border-neutral-300 flex items-end">
                <div
                  className={`w-full ${colorClass} transition-all duration-100`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-[7px] text-neutral-400 font-mono font-bold">M{idx + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// 3. DIRECTIONAL JOYSTICK (WASD TOUCH/CLICK & DRAG)
// ----------------------------------------------------------------
interface DirectionalJoystickProps {
  onMove: (pitch: number, roll: number) => void;
  className?: string;
}

function DirectionalJoystick({ onMove, className = "" }: DirectionalJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const maxRadius = 34;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;

    el.setPointerCapture(e.pointerId);
    setIsActive(true);

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;

    setStickPos({ x: clampedX, y: clampedY });
    onMove(-clampedY / maxRadius, clampedX / maxRadius);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;

    setStickPos({ x: clampedX, y: clampedY });
    onMove(-clampedY / maxRadius, clampedX / maxRadius);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();
    const el = containerRef.current;
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
    }
    setIsActive(false);
    setStickPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-2 border-black shadow-xl relative flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: "none" }}
        title="Click & Drag to fly (WASD)"
      >
        {/* Cardinal Key Indicators */}
        <span className="absolute top-1 text-[10px] font-extrabold text-neutral-500 pointer-events-none">
          ▲ W
        </span>
        <span className="absolute bottom-1 text-[10px] font-extrabold text-neutral-500 pointer-events-none">
          ▼ S
        </span>
        <span className="absolute left-1.5 text-[10px] font-extrabold text-neutral-500 pointer-events-none">
          ◀ A
        </span>
        <span className="absolute right-1.5 text-[10px] font-extrabold text-neutral-500 pointer-events-none">
          D ▶
        </span>

        {/* Center Target Ring */}
        <div className="w-8 h-8 rounded-full border border-neutral-200 pointer-events-none" />

        {/* Draggable Thumbstick Puck */}
        <div
          className="absolute w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold shadow-md border-2 border-white pointer-events-none"
          style={{
            transform: `translate3d(${stickPos.x}px, ${stickPos.y}px, 0)`,
            transition: isActive ? "none" : "transform 0.12s ease-out",
          }}
        >
          <Move className="h-4 w-4 text-[#FF5500]" />
        </div>
      </div>
      <span className="text-[9px] font-extrabold text-neutral-700 uppercase tracking-wider mt-1 bg-white/90 px-2 py-0.5 rounded border border-neutral-300 shadow-xs">
        FLIGHT PAD (WASD)
      </span>
    </div>
  );
}

// ----------------------------------------------------------------
// 4. MAIN TELEMETRY HUD PROPS
// ----------------------------------------------------------------
interface TelemetryHUDProps {
  telemetry: TelemetryState;
  droneName: string;
  cameraMode: CameraMode;
  onSelectCameraMode: (mode: CameraMode) => void;
  onReset: () => void;
  onExit: () => void;
  isHoverMode: boolean;
  onToggleHover: () => void;
  onToggleMap: () => void;
  onMoveDirection: (pitch: number, roll: number) => void;
  onYaw: (yaw: number) => void;
  onThrottle: (throttle: number) => void;
  onAutoLand: () => void;
  // Platform additions
  onOpenEnvironment?: () => void;
  onOpenReplay?: () => void;
  onOpenAnalysis?: () => void;
  onToggleDebug?: () => void;
  onToggleTutorial?: () => void;
  environment?: EnvironmentState;
  remotePlayers?: RemotePlayerState[];
  callsign?: string;
}

export function TelemetryHUD({
  telemetry,
  droneName,
  cameraMode,
  onSelectCameraMode,
  onReset,
  onExit,
  isHoverMode,
  onToggleHover,
  onToggleMap,
  onMoveDirection,
  onYaw,
  onThrottle,
  onAutoLand,
  onOpenEnvironment,
  onOpenReplay,
  onOpenAnalysis,
  onToggleDebug,
  onToggleTutorial,
  environment,
  remotePlayers,
  callsign,
}: TelemetryHUDProps) {
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const controlsRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Click outside to dismiss popups automatically
  useEffect(() => {
    if (!isControlsOpen && !isToolsOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isControlsOpen && controlsRef.current && !controlsRef.current.contains(target)) {
        setIsControlsOpen(false);
      }
      if (isToolsOpen && toolsRef.current && !toolsRef.current.contains(target)) {
        setIsToolsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isControlsOpen, isToolsOpen]);

  // Keyboard shortcut: 'M' toggles tactical island map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "m" || e.key === "M") {
        onToggleMap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleMap]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const cameraModeLabels: Record<CameraMode, string> = {
    chase: "Chase",
    fpv: "FPV Nose",
    topdown: "Top-Down",
  };

  // Calculate relative wind direction for arrow
  const windDir = environment?.windDirection ?? 0;
  const relWindAngle = windDir - telemetry.heading;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none flex flex-col justify-between p-3 sm:p-5 font-mono text-neutral-900">
      {/* ---------------------------------------------------- */}
      {/* TOP BAR: INDEPENDENT AIRCRAFT & TELEMETRY CLUSTERS   */}
      {/* ---------------------------------------------------- */}
      <header className="flex items-start justify-between gap-2 sm:gap-4 w-full max-w-full">
        {/* ==================================================== */}
        {/* TOP-LEFT: DASHBOARD CORNER, FLIGHT STATUS & TOOLS    */}
        {/* ==================================================== */}
        <div className="flex flex-col items-start gap-1.5 sm:gap-2 pointer-events-auto shrink-0 z-30">
          {/* Row 1: Dashboard Exit Button (In corner), Flight Mode, Airspace Roster, Tools & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Top-Left Corner Dashboard Button */}
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black text-white hover:bg-neutral-800 border-2 border-black text-xs font-extrabold shadow-md active:scale-95 transition-all cursor-pointer select-none shrink-0"
              title="Return to Drone Hangar / Dashboard"
            >
              <ArrowLeft className="h-4 w-4 text-[#FF5500]" />
              <span>Dashboard</span>
            </button>

            {/* Flight Mode Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border-2 shrink-0 ${
                telemetry.flightMode === "HOVER"
                  ? "bg-amber-50 text-amber-900 border-amber-400"
                  : telemetry.flightMode === "LANDED"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-400"
                  : telemetry.flightMode === "AUTO LAND"
                  ? "bg-purple-50 text-purple-900 border-purple-400"
                  : "bg-blue-50 text-blue-900 border-blue-400"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{telemetry.flightMode}</span>
            </span>

            {/* Multiplayer Airspace Roster Widget */}
            <MultiplayerRosterWidget
              players={remotePlayers || []}
              myCallsign={callsign || "PILOT"}
            />

            {/* Secondary Mission Tools Dropdown */}
            <div ref={toolsRef} className="relative">
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border-2 border-black text-xs font-bold text-neutral-800 shadow-sm hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
                title="Mission Tools: Weather, Replay, Debrief, 6-DoF Debug"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF5500]" />
                <span className="hidden sm:inline">Tools</span>
                <ChevronDown className="h-3 w-3 text-neutral-500" />
              </button>

              {isToolsOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border-2 border-black rounded-2xl shadow-2xl p-2 z-40 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 font-mono">
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-2 py-1">
                    MISSION TOOLS
                  </div>

                  {onOpenEnvironment && (
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenEnvironment(); }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-800 hover:bg-neutral-100 transition-colors text-left cursor-pointer"
                    >
                      <CloudSun className="h-3.5 w-3.5 text-[#FF5500]" />
                      <span>Weather & Wind</span>
                    </button>
                  )}

                  {onOpenReplay && (
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenReplay(); }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-800 hover:bg-neutral-100 transition-colors text-left cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 text-blue-600 fill-current" />
                      <span>Flight Replay</span>
                    </button>
                  )}

                  {onOpenAnalysis && (
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenAnalysis(); }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-800 hover:bg-neutral-100 transition-colors text-left cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Mission Debrief</span>
                    </button>
                  )}

                  {onToggleDebug && (
                    <button
                      onClick={() => { setIsToolsOpen(false); onToggleDebug(); }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-800 hover:bg-neutral-100 transition-colors text-left cursor-pointer"
                    >
                      <Activity className="h-3.5 w-3.5 text-rose-500" />
                      <span>6-DoF Physics Debug</span>
                    </button>
                  )}

                  {onToggleTutorial && (
                    <button
                      onClick={() => { setIsToolsOpen(false); onToggleTutorial(); }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-800 hover:bg-neutral-100 transition-colors text-left cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>Flight Coach Guide</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Flight Controls Button */}
            <div ref={controlsRef} className="relative">
              <button
                onClick={() => setIsControlsOpen(!isControlsOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border-2 border-black text-xs font-bold text-neutral-900 shadow-sm hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
                title="View Keyboard Flight Controls"
              >
                <Keyboard className="h-3.5 w-3.5 text-[#FF5500]" />
                <span className="hidden sm:inline">Controls</span>
                {isControlsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {/* Controls Panel Dropdown */}
              {isControlsOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 p-3.5 rounded-2xl bg-white border-2 border-black shadow-2xl text-xs space-y-2.5 animate-in fade-in zoom-in-95 z-40 pointer-events-auto">
                  <div className="border-b border-neutral-200 pb-2 flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Keyboard className="h-4 w-4 text-[#FF5500]" />
                      <span className="font-heading font-extrabold text-neutral-950 uppercase tracking-wide">
                        Flight Controls
                      </span>
                    </div>
                    <button
                      onClick={() => setIsControlsOpen(false)}
                      className="text-neutral-400 hover:text-black p-0.5 rounded cursor-pointer transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-neutral-800">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Pitch & Roll</span>
                      <span className="font-bold bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded border border-neutral-300">
                        W A S D
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Climb (Throttle Up)</span>
                      <span className="font-bold bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded border border-neutral-300">
                        SPACE
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Descend (Throttle Down)</span>
                      <span className="font-bold bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded border border-neutral-300">
                        SHIFT / C
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Yaw Rotation</span>
                      <span className="font-bold bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded border border-neutral-300">
                        Q / E
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Hover Assist</span>
                      <span className="font-bold bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded border border-neutral-300">
                        H
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Precision Land</span>
                      <span className="font-bold bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded border border-neutral-300">
                        L
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Tactical Map</span>
                      <span className="font-bold bg-[#FF5500] text-white px-2 py-0.5 rounded border border-black">
                        M
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 text-[10px] text-neutral-500 leading-tight">
                    💡 Tip: Click & drag on 3D view to orbit camera 360°.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Timer, Distance, Heading & Wind Speed (Cleanly aligned, zero overlap) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 sm:px-3 py-1 rounded-lg border-2 border-black shadow-sm text-xs font-semibold shrink-0">
              <Clock className="h-3.5 w-3.5 text-[#FF5500]" />
              <span>T+{formatTime(telemetry.flightTimeSeconds)}</span>
              <span className="text-neutral-300">|</span>
              <Navigation className="h-3.5 w-3.5 text-[#FF5500]" />
              <span>{telemetry.distanceFromHome.toFixed(1)}m</span>
            </div>

            {/* Compass Heading Badge */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border-2 border-black shadow-sm text-xs font-bold text-neutral-900 shrink-0">
              <Compass className="h-3.5 w-3.5 text-[#FF5500]" />
              <span>HDG {telemetry.heading.toString().padStart(3, "0")}°</span>
            </div>

            {/* Wind Vector Badge */}
            {environment && (
              <div
                className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border-2 border-black shadow-sm text-xs font-bold text-neutral-900 shrink-0"
                title={`Wind: ${environment.windSpeed.toFixed(1)} m/s at ${environment.windDirection}°`}
              >
                <Wind className="h-3.5 w-3.5 text-[#FF5500]" />
                <span>{environment.windSpeed.toFixed(1)}m/s</span>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* TOP-CENTER: RESPONSIVE FLIGHT AVIONICS INSTRUMENTS    */}
        {/* ==================================================== */}
        {/* Full Expanded Gyro & Tape on xl screens (>= 1280px) */}
        <div className="hidden xl:flex items-center gap-2.5 shrink-0 pointer-events-auto z-20">
          <AttitudeIndicator
            pitchRad={telemetry.rotation.pitch}
            rollRad={telemetry.rotation.roll}
          />

          <div className="flex flex-col items-center bg-white px-3 py-1.5 rounded-xl border-2 border-black shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
              <Compass className="h-3.5 w-3.5 text-[#FF5500]" />
              <span>HDG: {telemetry.heading.toString().padStart(3, "0")}°</span>
            </div>
            <div className="text-[10px] text-neutral-500 tracking-widest pt-0.5">
              {telemetry.heading >= 337 || telemetry.heading < 23
                ? "••• N •••"
                : telemetry.heading < 68
                ? "••• NE •••"
                : telemetry.heading < 113
                ? "••• E •••"
                : telemetry.heading < 158
                ? "••• SE •••"
                : telemetry.heading < 203
                ? "••• S •••"
                : telemetry.heading < 248
                ? "••• SW •••"
                : telemetry.heading < 293
                ? "••• W •••"
                : "••• NW •••"}
            </div>
          </div>

          <MotorMixerGauges motorOutputs={telemetry.motorOutputs} />

          {environment && (
            <div
              className="flex flex-col items-center bg-white p-1 px-2.5 rounded-xl border-2 border-black shadow-sm"
              title={`Wind: ${environment.windSpeed.toFixed(1)} m/s at ${environment.windDirection}°`}
            >
              <div className="flex items-center gap-1 text-[8px] font-black text-neutral-500 uppercase tracking-wider">
                <Wind className="h-2.5 w-2.5 text-[#FF5500]" />
                <span>WIND</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className="w-4 h-4 flex items-center justify-center transition-transform duration-300"
                  style={{ transform: `rotate(${relWindAngle}deg)` }}
                >
                  <ArrowUp className="h-3.5 w-3.5 text-[#FF5500]" />
                </div>
                <span className="text-[10px] font-bold font-mono">
                  {environment.windSpeed.toFixed(1)}m/s
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* TOP-RIGHT: BATTERY, ALTITUDE TAPE & FLIGHT COACH     */}
        {/* ==================================================== */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto shrink-0 z-30">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Battery Indicator */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border-2 border-black shadow-sm text-xs">
              <Battery className="h-3.5 w-3.5 text-[#FF5500]" />
              <span className="font-bold text-xs">{telemetry.batteryLevel}%</span>
              <div className="w-8 sm:w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden border border-neutral-300">
                <div
                  className="h-full bg-[#FF5500] transition-all duration-300"
                  style={{ width: `${telemetry.batteryLevel}%` }}
                />
              </div>
              {telemetry.batteryVoltage ? (
                <span className="text-[9px] text-neutral-600 font-bold hidden sm:inline">
                  {telemetry.batteryVoltage.toFixed(1)}V
                </span>
              ) : null}
            </div>

            {/* Flight Coach Toggle Button */}
            {onToggleTutorial && (
              <button
                onClick={onToggleTutorial}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border-2 border-[#FF5500] text-xs font-bold text-[#FF5500] shadow-sm hover:bg-orange-100 active:scale-95 transition-all cursor-pointer"
                title="Toggle Step-by-Step Flight Coach Guide"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Guide</span>
              </button>
            )}
          </div>

          {/* Altitude & Speed Tape */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-neutral-800 bg-white px-2.5 sm:px-3 py-1 rounded-xl border-2 border-black shadow-sm">
            <div>
              <span className="text-[8px] text-neutral-500 block uppercase font-bold">ALT</span>
              <strong className="text-xs sm:text-sm font-extrabold text-neutral-950 font-heading">
                {telemetry.altitude.toFixed(1)}m
              </strong>
            </div>
            <div className="border-l border-neutral-200 pl-2 sm:pl-3">
              <span className="text-[8px] text-neutral-500 block uppercase font-bold">SPD</span>
              <strong className="text-xs sm:text-sm font-extrabold text-neutral-950 font-heading">
                {telemetry.groundSpeed.toFixed(1)}km/h
              </strong>
            </div>
            <div className="border-l border-neutral-200 pl-2 sm:pl-3 hidden md:block">
              <span className="text-[8px] text-neutral-500 block uppercase font-bold">CLIMB</span>
              <strong className="text-xs sm:text-sm font-extrabold text-neutral-950 font-heading">
                {telemetry.verticalSpeed >= 0 ? "+" : ""}{telemetry.verticalSpeed.toFixed(1)}m/s
              </strong>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* CENTER CROSSHAIR (SUBTLE, NON-INTRUSIVE)             */}
      {/* ---------------------------------------------------- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-black" />
          <div className="w-0.5 h-2.5 bg-black absolute" />
          <div className="w-6 h-6 rounded-full border border-black/70 absolute" />
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM BAR: OPPOSITE CORNERS (ZERO VIEW INTERRUPTION)*/}
      {/* Left: Direction Pad + Altitude Controls              */}
      {/* Right: Compact Utility Dock + Tactical Map Circle    */}
      {/* ---------------------------------------------------- */}
      <footer className="w-full flex items-end justify-between pointer-events-none z-20">
        {/* ==================================================== */}
        {/* BOTTOM-LEFT: DIRECTION PAD (WASD) + ALTITUDE BUTTONS */}
        {/* ==================================================== */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* 1. Virtual Flight Direction Pad (WASD) */}
          <DirectionalJoystick onMove={onMoveDirection} />

          {/* 2. Altitude Control Buttons (SPACE / SHIFT) */}
          <div className="flex flex-col items-center gap-1 select-none">
            <div className="flex flex-col items-center gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-black shadow-xl">
              <span className="text-[8px] font-extrabold text-neutral-500 uppercase tracking-widest px-1">
                ALTITUDE
              </span>

              {/* Climb (SPACE) */}
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); onThrottle(1); }}
                onPointerUp={(e) => { e.preventDefault(); onThrottle(0); }}
                onPointerLeave={(e) => { e.preventDefault(); onThrottle(0); }}
                className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:bg-[#FF5500] active:text-white border border-neutral-300 text-xs font-bold transition-all cursor-pointer select-none shadow-xs active:scale-95 w-full"
                title="Climb / Throttle Up (SPACE)"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                <span className="text-[10px] font-extrabold">SPACE</span>
              </button>

              {/* Descend (SHIFT / C) */}
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); onThrottle(-1); }}
                onPointerUp={(e) => { e.preventDefault(); onThrottle(0); }}
                onPointerLeave={(e) => { e.preventDefault(); onThrottle(0); }}
                className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:bg-[#FF5500] active:text-white border border-neutral-300 text-xs font-bold transition-all cursor-pointer select-none shadow-xs active:scale-95 w-full"
                title="Descend / Throttle Down (SHIFT / C)"
              >
                <ArrowDown className="h-3.5 w-3.5" />
                <span className="text-[10px] font-extrabold">SHIFT</span>
              </button>
            </div>
            <span className="text-[9px] font-extrabold text-neutral-700 uppercase tracking-wider mt-0.5 bg-white/90 px-2 py-0.5 rounded border border-neutral-300 shadow-xs">
              CLIMB / DROP
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* BOTTOM-RIGHT: COMPACT UTILITY DOCK + MINIMAP CIRCLE  */}
        {/* ==================================================== */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Compact Aviation Controls Dock */}
          <div className="flex flex-col items-end gap-2">
            {/* Upper Dock Row: Yaw Rotate (Q / E) & Land Button */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border-2 border-black shadow-lg">
              {/* Yaw Left (↺ Q) */}
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); onYaw(-1); }}
                onPointerUp={(e) => { e.preventDefault(); onYaw(0); }}
                onPointerLeave={(e) => { e.preventDefault(); onYaw(0); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 active:bg-[#FF5500] active:text-white text-xs font-bold text-neutral-900 border border-neutral-300 active:scale-95 transition-all cursor-pointer select-none"
                title="Rotate Left (Q)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="text-[10px]">Q</span>
              </button>

              {/* Yaw Right (E ↻) */}
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); onYaw(1); }}
                onPointerUp={(e) => { e.preventDefault(); onYaw(0); }}
                onPointerLeave={(e) => { e.preventDefault(); onYaw(0); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 active:bg-[#FF5500] active:text-white text-xs font-bold text-neutral-900 border border-neutral-300 active:scale-95 transition-all cursor-pointer select-none"
                title="Rotate Right (E)"
              >
                <span className="text-[10px]">E</span>
                <RotateCw className="h-3.5 w-3.5" />
              </button>

              <div className="h-4 w-px bg-neutral-300 mx-0.5" />

              {/* Land Button */}
              <button
                type="button"
                onClick={onAutoLand}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 shadow-xs ${
                  telemetry.flightMode === "AUTO LAND"
                    ? "bg-[#FF5500] text-white border-black animate-pulse"
                    : "bg-white text-neutral-950 border-neutral-300 hover:bg-neutral-100"
                }`}
                title="Precision Auto-Landing (L)"
              >
                <PlaneLanding className="h-3.5 w-3.5 text-[#FF5500]" />
                <span>{telemetry.flightMode === "AUTO LAND" ? "Landing..." : "Land"}</span>
              </button>
            </div>

            {/* Lower Dock Row: Hover Switch, Camera View, Reset */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border-2 border-black shadow-lg">
              {/* Hover Assist Toggle */}
              <button
                onClick={onToggleHover}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                  isHoverMode
                    ? "bg-neutral-900 text-white border-black"
                    : "bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200"
                }`}
                title="Toggle Hover Assist (H)"
              >
                <span className="text-[10px]">Hover</span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isHoverMode ? "bg-[#FF5500]" : "bg-neutral-400"
                  }`}
                />
              </button>

              {/* View Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-800 border border-neutral-300 transition-all cursor-pointer active:scale-95"
                  title="Switch Camera View Mode (V)"
                >
                  <Eye className="h-3.5 w-3.5 text-[#FF5500]" />
                  <span className="text-[10px] hidden sm:inline">{cameraModeLabels[cameraMode]}</span>
                  <ChevronDown className="h-3 w-3 text-neutral-500" />
                </button>

                {/* Dropdown Options */}
                {isViewDropdownOpen && (
                  <div className="absolute bottom-full mb-2 right-0 w-48 p-1.5 rounded-xl bg-white border-2 border-black shadow-xl text-xs space-y-1 animate-in fade-in zoom-in-95 z-30">
                    <button
                      onClick={() => {
                        onSelectCameraMode("chase");
                        setIsViewDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 text-left font-medium transition-colors cursor-pointer"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${
                          cameraMode === "chase" ? "bg-[#FF5500]" : "bg-white"
                        }`}
                      />
                      <span>Chase View</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectCameraMode("fpv");
                        setIsViewDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 text-left font-medium transition-colors cursor-pointer"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${
                          cameraMode === "fpv" ? "bg-[#FF5500]" : "bg-white"
                        }`}
                      />
                      <span>FPV Nose View</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectCameraMode("topdown");
                        setIsViewDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 text-left font-medium transition-colors cursor-pointer"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${
                          cameraMode === "topdown" ? "bg-[#FF5500]" : "bg-white"
                        }`}
                      />
                      <span>Top-Down View</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Reset Button */}
              <button
                onClick={onReset}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-800 border border-neutral-300 transition-all cursor-pointer active:scale-95"
                title="Reset Aircraft to Helipad (R)"
              >
                <RotateCcw className="h-3.5 w-3.5 text-neutral-600" />
                <span className="text-[10px]">R</span>
              </button>
            </div>
          </div>

          {/* 3. Circular Minimap Radar (Bottom-Right) */}
          <div className="flex flex-col items-center select-none">
            <MinimapWidget
              telemetry={telemetry}
              onClick={onToggleMap}
            />
            <span className="text-[9px] font-extrabold text-neutral-700 uppercase tracking-wider mt-1 bg-white/90 px-2 py-0.5 rounded border border-neutral-300 shadow-xs">
              TACTICAL MAP (M)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
