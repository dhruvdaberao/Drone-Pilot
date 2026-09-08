"use client";

import React, { useState } from "react";
import { TelemetryState } from "@/lib/simulation/types";
import { CameraMode } from "./chase-camera";
import {
  Compass,
  Battery,
  Clock,
  Navigation,
  ShieldCheck,
  Eye,
  RotateCcw,
  ChevronDown,
  Keyboard,
  ChevronUp,
} from "lucide-react";

interface TelemetryHUDProps {
  telemetry: TelemetryState;
  droneName: string;
  cameraMode: CameraMode;
  onSelectCameraMode: (mode: CameraMode) => void;
  onReset: () => void;
  onExit: () => void;
  isHoverMode: boolean;
  onToggleHover: () => void;
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
}: TelemetryHUDProps) {
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);

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

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none flex flex-col justify-between p-3 sm:p-5 font-mono text-neutral-900">
      {/* ---------------------------------------------------- */}
      {/* TOP BAR: CLEAN INDEPENDENT PANELS (NO OVERLAPPING)   */}
      {/* ---------------------------------------------------- */}
      <header className="flex items-start justify-between gap-3 w-full">
        {/* Top Left: Aircraft Callout, Mode & Timer */}
        <div className="flex flex-col items-start gap-2 pointer-events-auto shrink-0">
          {/* Row 1: Drone Name & Flight Mode Badge */}
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase bg-black text-white px-3 py-1 rounded-lg border-2 border-black shadow-md">
              {droneName}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide border-2 ${
                telemetry.flightMode === "HOVER"
                  ? "bg-amber-50 text-amber-900 border-amber-400"
                  : telemetry.flightMode === "LANDED"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-400"
                  : "bg-blue-50 text-blue-900 border-blue-400"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>{telemetry.flightMode}</span>
            </span>
          </div>

          {/* Row 2: Timer, Distance & Controls Button (side-by-side, no stacking collision!) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg border-2 border-black shadow-sm text-xs font-semibold">
              <Clock className="h-3.5 w-3.5 text-[#FF5500]" />
              <span>T+{formatTime(telemetry.flightTimeSeconds)}</span>
              <span className="text-neutral-300">|</span>
              <Navigation className="h-3.5 w-3.5 text-[#FF5500]" />
              <span>{telemetry.distanceFromHome.toFixed(1)}m</span>
            </div>

            {/* Controls Toggle Button */}
            <button
              onClick={() => setIsControlsOpen(!isControlsOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md border-2 border-black text-xs font-bold text-neutral-900 shadow-sm hover:bg-neutral-100 transition-all"
            >
              <Keyboard className="h-3.5 w-3.5 text-[#FF5500]" />
              <span className="hidden sm:inline">Controls</span>
              {isControlsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {/* Controls Dropdown / Drawer (flows neatly below row 2, never overlapping) */}
          {isControlsOpen && (
            <div className="mt-1 w-64 p-3 rounded-xl bg-white/98 backdrop-blur-md border-2 border-black shadow-xl text-xs space-y-2 animate-in fade-in zoom-in-95">
              <div className="border-b border-neutral-200 pb-1 flex justify-between items-center">
                <span className="font-heading font-bold text-neutral-900 uppercase">Flight Controls</span>
                <span className="text-[10px] text-[#FF5500] font-bold">KEYBOARD</span>
              </div>
              <div className="space-y-1.5 text-neutral-700">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Maneuver (Pitch/Roll)</span>
                  <span className="font-bold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">W A S D</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Climb (Throttle Up)</span>
                  <span className="font-bold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">SPACE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Descend (Throttle Down)</span>
                  <span className="font-bold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">SHIFT / C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Yaw Rotate</span>
                  <span className="font-bold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">Q / E</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Toggle Hover Assist</span>
                  <span className="font-bold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">H</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Reset to Helipad</span>
                  <span className="font-bold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">R</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Center: Heading Compass Tape */}
        <div className="hidden md:flex flex-col items-center bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-xl border-2 border-black shadow-sm shrink-0 pointer-events-auto">
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

        {/* Top Right: Battery, Altitude & Airspeed */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto shrink-0">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border-2 border-black shadow-sm text-xs">
            <Battery className="h-3.5 w-3.5 text-[#FF5500]" />
            <span className="font-bold text-xs">{telemetry.batteryLevel}%</span>
            <div className="w-10 sm:w-14 h-2 bg-neutral-200 rounded-full overflow-hidden border border-neutral-300">
              <div
                className="h-full bg-[#FF5500] transition-all duration-300"
                style={{ width: `${telemetry.batteryLevel}%` }}
              />
            </div>
            <span className="text-[9px] text-neutral-500 hidden sm:inline">(SIM)</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-800 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border-2 border-black shadow-sm">
            <div>
              <span className="text-[9px] text-neutral-500 block uppercase font-medium">Altitude</span>
              <strong className="text-xs sm:text-sm font-extrabold text-neutral-950 font-heading">
                {telemetry.altitude.toFixed(1)}m
              </strong>
            </div>
            <div className="border-l border-neutral-200 pl-3">
              <span className="text-[9px] text-neutral-500 block uppercase font-medium">Speed</span>
              <strong className="text-xs sm:text-sm font-extrabold text-neutral-950 font-heading">
                {telemetry.groundSpeed.toFixed(1)}km/h
              </strong>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* CENTER CROSSHAIR                                     */}
      {/* ---------------------------------------------------- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-black" />
          <div className="w-0.5 h-2.5 bg-black absolute" />
          <div className="w-6 h-6 rounded-full border border-black/70 absolute" />
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM CONTROLS: INDEPENDENT FLOATING ON SCREEN      */}
      {/* (No enclosing outer bar! Placed directly on screen!) */}
      {/* ---------------------------------------------------- */}
      <footer className="flex flex-wrap items-center justify-between gap-3 w-full">
        {/* Left: Black "Dashboard" / "Go Back" Button */}
        <button
          onClick={onExit}
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 active:scale-95 transition-all text-xs font-bold border-2 border-black shadow-md"
        >
          <span>← Dashboard</span>
        </button>

        {/* Center/Right: Independent Floating Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* 1. Hover Assist Toggle Button (with real visual toggle switch!) */}
          <button
            onClick={onToggleHover}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border-2 border-black text-xs font-bold transition-all shadow-md active:scale-95 ${
              isHoverMode ? "bg-white text-black" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            <span>Hover Assist</span>
            {/* Visual Toggle Pill */}
            <div
              className={`w-8 h-4 rounded-full p-0.5 transition-colors border ${
                isHoverMode ? "bg-[#FF5500] border-[#FF5500]" : "bg-neutral-300 border-neutral-400"
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                  isHoverMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </button>

          {/* 2. View Dropdown Select with Bullet Circles */}
          <div className="relative">
            <button
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border-2 border-black text-xs font-bold text-neutral-900 hover:bg-neutral-100 active:scale-95 transition-all shadow-md"
            >
              <Eye className="h-3.5 w-3.5 text-[#FF5500]" />
              <span>View: {cameraModeLabels[cameraMode]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
            </button>

            {/* Dropdown with Bullet Circles */}
            {isViewDropdownOpen && (
              <div className="absolute bottom-full mb-2 right-0 sm:left-0 w-52 p-1.5 rounded-xl bg-white border-2 border-black shadow-xl text-xs space-y-1 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    onSelectCameraMode("chase");
                    setIsViewDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 text-left font-medium transition-colors"
                >
                  <span
                    className={`h-3 w-3 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${
                      cameraMode === "chase" ? "bg-[#FF5500]" : "bg-white"
                    }`}
                  />
                  <span>Chase View (3rd Person)</span>
                </button>

                <button
                  onClick={() => {
                    onSelectCameraMode("fpv");
                    setIsViewDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 text-left font-medium transition-colors"
                >
                  <span
                    className={`h-3 w-3 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${
                      cameraMode === "fpv" ? "bg-[#FF5500]" : "bg-white"
                    }`}
                  />
                  <span>FPV Nose View (Gimbal)</span>
                </button>

                <button
                  onClick={() => {
                    onSelectCameraMode("topdown");
                    setIsViewDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 text-left font-medium transition-colors"
                >
                  <span
                    className={`h-3 w-3 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${
                      cameraMode === "topdown" ? "bg-[#FF5500]" : "bg-white"
                    }`}
                  />
                  <span>Top-Down View (Tactical)</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Reset Button (Independent floating) */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border-2 border-black text-xs font-bold text-neutral-900 hover:bg-neutral-100 active:scale-95 transition-all shadow-md"
            title="Reset to Helipad (R)"
          >
            <RotateCcw className="h-3.5 w-3.5 text-neutral-700" />
            <span>Reset (R)</span>
          </button>
        </div>
      </footer>
    </div>
  );
}