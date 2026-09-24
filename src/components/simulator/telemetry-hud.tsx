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
import { MinimapWidget, NavigationWaypoint } from "./minimap-widget";
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
  AlertTriangle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { MultiplayerRosterWidget } from "./multiplayer/multiplayer-roster-widget";
import { RemotePlayerState } from "@/lib/multiplayer/multiplayer-types";
import { BaseSwitcherHUD, FastTravelBase } from "./base-switcher-hud";

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

  const maxRadius = 22;

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

  const isUpActive = stickPos.y < -5;
  const isDownActive = stickPos.y > 5;
  const isLeftActive = stickPos.x < -5;
  const isRightActive = stickPos.x > 5;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-24 h-24 sm:w-26 sm:h-26 rounded-full bg-white/95 border border-neutral-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.1)] relative flex items-center justify-center cursor-grab active:cursor-grabbing touch-none backdrop-blur-md"
        style={{ touchAction: "none" }}
        title="Flight Direction Pad (WASD)"
      >
        {/* Cardinal Key Indicators - cleanly positioned around the perimeter */}
        <span
          className={`absolute top-1.5 text-[10px] font-extrabold font-mono transition-colors pointer-events-none ${
            isUpActive ? "text-[#FF5500] scale-110" : "text-neutral-400"
          }`}
        >
          W
        </span>
        <span
          className={`absolute bottom-1.5 text-[10px] font-extrabold font-mono transition-colors pointer-events-none ${
            isDownActive ? "text-[#FF5500] scale-110" : "text-neutral-400"
          }`}
        >
          S
        </span>
        <span
          className={`absolute left-2 text-[10px] font-extrabold font-mono transition-colors pointer-events-none ${
            isLeftActive ? "text-[#FF5500] scale-110" : "text-neutral-400"
          }`}
        >
          A
        </span>
        <span
          className={`absolute right-2 text-[10px] font-extrabold font-mono transition-colors pointer-events-none ${
            isRightActive ? "text-[#FF5500] scale-110" : "text-neutral-400"
          }`}
        >
          D
        </span>

        {/* Minimalist guide ring */}
        <div className="w-14 h-14 rounded-full border border-dashed border-neutral-200 pointer-events-none" />

        {/* Draggable Thumbstick Puck */}
        <div
          className="absolute w-8 h-8 rounded-full bg-white border border-neutral-300 flex items-center justify-center shadow-md pointer-events-none"
          style={{
            transform: `translate3d(${stickPos.x}px, ${stickPos.y}px, 0)`,
            transition: isActive ? "none" : "transform 0.12s ease-out",
          }}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              isActive ? "bg-[#FF5500] shadow-[0_0_8px_#FF5500] scale-110" : "bg-[#FF5500]"
            }`}
          />
        </div>
      </div>
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
  activeWaypoint?: NavigationWaypoint | null;
  onTeleportBase?: (base: FastTravelBase) => void;
  autoMoveLocked?: string;
  onCancelAutoMove?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
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
  activeWaypoint,
  onTeleportBase,
  autoMoveLocked,
  onCancelAutoMove,
  isMuted,
  onToggleMute,
}: TelemetryHUDProps) {
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
      {/* Top Bar removed in favor of Left/Right Glass Panels */}

      {/* ---------------------------------------------------- */}
      {/* ALTITUDE RESTRICTION & SURFACE CONTACT POPUP NOTICES  */}
      {/* ---------------------------------------------------- */}
      {telemetry.isCeilingLimitReached && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/95 text-neutral-950 font-bold font-mono text-xs shadow-[0_4px_24px_rgba(245,158,11,0.5)] backdrop-blur-md border-2 border-neutral-950">
            <AlertTriangle className="w-4 h-4 text-neutral-950 shrink-0" />
            <span>MAXIMUM FLIGHT CEILING REACHED (250m) — You are already at the highest altitude!</span>
          </div>
        </div>
      )}

      {telemetry.isGroundLimitReached && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/95 text-neutral-950 font-bold font-mono text-xs shadow-[0_4px_24px_rgba(6,182,212,0.5)] backdrop-blur-md border-2 border-neutral-950">
            <ArrowDown className="w-4 h-4 text-neutral-950 shrink-0" />
            <span>SURFACE TOUCHDOWN — You are on the ground/water, cannot descend deeper!</span>
          </div>
        </div>
      )}

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
      <footer className="w-full flex items-end justify-between pointer-events-none z-20 gap-2 pb-1 sm:pb-2 px-1 sm:px-2 safe-area-padding">
        {/* ==================================================== */}
        {/* BOTTOM-LEFT: DIRECTION PAD (WASD) + ALTITUDE BUTTONS */}
        {/* ==================================================== */}
        <div className="flex items-end gap-1.5 sm:gap-3 pointer-events-auto shrink-0">
          {/* 1. Virtual Flight Direction Pad (WASD) */}
          <DirectionalJoystick onMove={onMoveDirection} />

          {/* 2. Altitude Control Buttons (SPACE / SHIFT) */}
          <div className="flex flex-col items-center gap-1 select-none">
            <div className="flex flex-col items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border border-neutral-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <span className="text-[8px] font-extrabold text-neutral-500 uppercase tracking-widest px-1">
                ALTITUDE
              </span>

              {/* Climb (SPACE) */}
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); onThrottle(1); }}
                onPointerUp={(e) => { e.preventDefault(); onThrottle(0); }}
                onPointerLeave={(e) => { e.preventDefault(); onThrottle(0); }}
                className="flex items-center justify-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 active:bg-[#FF5500] active:text-white border border-neutral-200/90 text-neutral-800 text-xs font-bold transition-all cursor-pointer select-none shadow-xs active:scale-95 w-full"
                title="Climb / Throttle Up (SPACE)"
              >
                <ArrowUp className="h-3.5 w-3.5 text-[#FF5500]" />
                <span className="text-[10px] font-extrabold font-mono">SPACE</span>
              </button>

              {/* Descend (SHIFT / C) */}
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); onThrottle(-1); }}
                onPointerUp={(e) => { e.preventDefault(); onThrottle(0); }}
                onPointerLeave={(e) => { e.preventDefault(); onThrottle(0); }}
                className="flex items-center justify-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 active:bg-[#FF5500] active:text-white border border-neutral-200/90 text-neutral-800 text-xs font-bold transition-all cursor-pointer select-none shadow-xs active:scale-95 w-full"
                title="Descend / Throttle Down (SHIFT / C)"
              >
                <ArrowDown className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-[10px] font-extrabold font-mono">SHIFT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Auto-Move Active Indicator Badge */}
        {autoMoveLocked && (
          <div className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border-2 border-[#FF5500] shadow-md backdrop-blur-md text-xs font-mono font-bold text-neutral-900 animate-pulse select-none pointer-events-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5500]" />
            <span>AUTO-MOVE: {autoMoveLocked} [LOCKED]</span>
            {onCancelAutoMove && (
              <button
                type="button"
                onClick={onCancelAutoMove}
                className="ml-1 px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-[10px] text-neutral-600 active:scale-95 cursor-pointer font-sans"
                title="Cancel Auto-Move"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* BOTTOM-RIGHT: COMPACT UTILITY DOCK + MINIMAP CIRCLE  */}
        {/* ==================================================== */}
        <div className="flex items-end gap-1.5 sm:gap-3 pointer-events-auto shrink-0">
          {/* Mobile Collapsible Toggle on small screens (<640px) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
            className="sm:hidden flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/95 border border-neutral-200 shadow-md text-[10px] font-bold text-neutral-800 cursor-pointer active:scale-95 mb-1"
            title="Toggle Secondary Controls Drawer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF5500]" />
            <span>{isMobileDrawerOpen ? "Hide" : "Dock"}</span>
          </button>

          {/* Compact Aviation Controls Dock (Collapsible on mobile <640px) */}
          <div className={`flex-col items-end gap-2 ${isMobileDrawerOpen ? "flex" : "hidden sm:flex"}`}>
            {/* Upper Dock Row: Yaw Rotate (Q / E) & Land Button */}
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-neutral-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              {/* Yaw Left (↺ Q) */}
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); onYaw(-1); }}
                onPointerUp={(e) => { e.preventDefault(); onYaw(0); }}
                onPointerLeave={(e) => { e.preventDefault(); onYaw(0); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 active:bg-[#FF5500] active:text-white text-xs font-bold text-neutral-800 border border-neutral-200/90 active:scale-95 transition-all cursor-pointer select-none font-mono"
                title="Rotate Left (Q)"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#FF5500]" />
                <span className="text-[10px]">Q</span>
              </button>

              {/* Yaw Right (E ↻) */}
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); onYaw(1); }}
                onPointerUp={(e) => { e.preventDefault(); onYaw(0); }}
                onPointerLeave={(e) => { e.preventDefault(); onYaw(0); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 active:bg-[#FF5500] active:text-white text-xs font-bold text-neutral-800 border border-neutral-200/90 active:scale-95 transition-all cursor-pointer select-none font-mono"
                title="Rotate Right (E)"
              >
                <span className="text-[10px]">E</span>
                <RotateCw className="h-3.5 w-3.5 text-[#FF5500]" />
              </button>

              <div className="h-4 w-px bg-neutral-200 mx-0.5" />

              {/* Land Button */}
              <button
                type="button"
                onClick={onAutoLand}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer active:scale-95 shadow-xs ${
                  telemetry.flightMode === "AUTO LAND"
                    ? "bg-[#FF5500] text-white border-black animate-pulse"
                    : "bg-neutral-50 text-neutral-800 border-neutral-200/90 hover:bg-neutral-100 hover:text-neutral-950"
                }`}
                title="Precision Auto-Landing (L)"
              >
                <PlaneLanding className="h-3.5 w-3.5 text-[#FF5500]" />
                <span>{telemetry.flightMode === "AUTO LAND" ? "Landing..." : "Land"}</span>
              </button>
            </div>

            {/* Lower Dock Row: Hover Switch, Camera View, Reset */}
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-neutral-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              {/* Hover Assist Toggle */}
              <button
                onClick={onToggleHover}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer active:scale-95 ${
                  isHoverMode
                    ? "bg-neutral-100 text-neutral-900 border-neutral-300"
                    : "bg-neutral-50 text-neutral-600 border-neutral-200/90 hover:bg-neutral-100"
                }`}
                title="Toggle Hover Assist (H)"
              >
                <span className="text-[10px]">Hover</span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isHoverMode ? "bg-[#FF5500] shadow-[0_0_6px_#FF5500]" : "bg-neutral-300"
                  }`}
                />
              </button>

              {/* View Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-800 border border-neutral-200/90 transition-all cursor-pointer active:scale-95 font-mono"
                  title="Switch Camera View Mode (V)"
                >
                  <Eye className="h-3.5 w-3.5 text-[#FF5500]" />
                  <span className="text-[10px] hidden sm:inline">{cameraModeLabels[cameraMode]}</span>
                  <ChevronDown className="h-3 w-3 text-neutral-500" />
                </button>

                {/* Dropdown Options */}
                {isViewDropdownOpen && (
                  <div className="absolute bottom-full mb-2 right-0 w-48 p-1.5 rounded-xl bg-white/98 backdrop-blur-md border border-neutral-200/90 shadow-2xl text-xs space-y-1 animate-in fade-in zoom-in-95 z-30 font-mono">
                    <button
                      onClick={() => {
                        onSelectCameraMode("chase");
                        setIsViewDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 text-neutral-800 text-left font-medium transition-colors cursor-pointer"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full border border-neutral-300 flex items-center justify-center shrink-0 ${
                          cameraMode === "chase" ? "bg-[#FF5500]" : "bg-transparent"
                        }`}
                      />
                      <span>Chase View</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectCameraMode("fpv");
                        setIsViewDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 text-neutral-800 text-left font-medium transition-colors cursor-pointer"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full border border-neutral-300 flex items-center justify-center shrink-0 ${
                          cameraMode === "fpv" ? "bg-[#FF5500]" : "bg-transparent"
                        }`}
                      />
                      <span>FPV Nose View</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectCameraMode("topdown");
                        setIsViewDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 text-neutral-800 text-left font-medium transition-colors cursor-pointer"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full border border-neutral-300 flex items-center justify-center shrink-0 ${
                          cameraMode === "topdown" ? "bg-[#FF5500]" : "bg-transparent"
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
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-800 border border-neutral-200/90 transition-all cursor-pointer active:scale-95 font-mono"
                title="Reset Aircraft to Helipad (R)"
              >
                <RotateCcw className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-[10px]">R</span>
              </button>
            </div>
          </div>

          {/* 3. Circular Minimap Radar (Bottom-Right) */}
          <div className="flex flex-col items-center select-none">
            <MinimapWidget
              telemetry={telemetry}
              onClick={onToggleMap}
              activeWaypoint={activeWaypoint}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
