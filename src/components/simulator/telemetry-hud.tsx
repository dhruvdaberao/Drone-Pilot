"use client";

import React from "react";
import { TelemetryState } from "@/lib/simulation/types";
import { Compass, Battery, Clock, Navigation, ShieldCheck, Eye, RotateCcw } from "lucide-react";

interface TelemetryHUDProps {
  telemetry: TelemetryState;
  droneName: string;
  cameraMode: "chase" | "fpv" | "topdown";
  onToggleCamera: () => void;
  onReset: () => void;
  onExit: () => void;
  isHoverMode: boolean;
  onToggleHover: () => void;
}

export function TelemetryHUD({
  telemetry,
  droneName,
  cameraMode,
  onToggleCamera,
  onReset,
  onExit,
  isHoverMode,
  onToggleHover,
}: TelemetryHUDProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none flex flex-col justify-between p-2.5 sm:p-5 font-mono text-neutral-900">
      {/* ---------------------------------------------------- */}
      {/* TOP AVIONICS BAR                                     */}
      {/* ---------------------------------------------------- */}
      <header className="flex items-start justify-between gap-2 sm:gap-4 w-full">
        {/* Top Left: Aircraft Callout & Flight Mode */}
        <div className="space-y-1 pointer-events-auto shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-heading font-extrabold text-xs sm:text-base tracking-wider uppercase bg-black text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded shadow-sm border border-black">
              {droneName}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-semibold tracking-wide border ${
                telemetry.flightMode === "HOVER"
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : telemetry.flightMode === "LANDED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-blue-50 text-blue-800 border-blue-300"
              }`}
            >
              <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>{telemetry.flightMode}</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-700 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border-2 border-black shadow-sm">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#FF5500]" />
              <span>T+{formatTime(telemetry.flightTimeSeconds)}</span>
            </span>
            <span className="text-neutral-300">|</span>
            <span className="flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5 text-[#FF5500]" />
              <span>DIST: {telemetry.distanceFromHome.toFixed(1)}m</span>
            </span>
          </div>
        </div>

        {/* Top Center: Heading Tape (Desktop & Tablet) */}
        <div className="hidden md:flex flex-col items-center bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-xl border-2 border-black shadow-sm shrink-0">
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

        {/* Top Right: Telemetry Tapes & Battery */}
        <div className="space-y-1 flex flex-col items-end pointer-events-auto shrink-0">
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border-2 border-black shadow-sm text-xs">
            <Battery className="h-3.5 w-3.5 text-[#FF5500]" />
            <span className="font-bold text-[11px] sm:text-xs">{telemetry.batteryLevel}%</span>
            <div className="w-8 sm:w-12 h-1.5 sm:h-2 bg-neutral-200 rounded-full overflow-hidden border border-neutral-300">
              <div
                className="h-full bg-[#FF5500] transition-all duration-300"
                style={{ width: `${telemetry.batteryLevel}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs text-neutral-800 bg-white/95 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border-2 border-black shadow-sm">
            <div>
              <span className="text-[9px] text-neutral-500 block uppercase">ALT</span>
              <strong className="text-xs sm:text-sm font-extrabold text-neutral-950 font-heading">
                {telemetry.altitude.toFixed(1)}m
              </strong>
            </div>
            <div className="border-l border-neutral-200 pl-2">
              <span className="text-[9px] text-neutral-500 block uppercase">SPD</span>
              <strong className="text-xs sm:text-sm font-extrabold text-neutral-950 font-heading">
                {telemetry.groundSpeed.toFixed(1)}km/h
              </strong>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* CENTER FLIGHT CROSSHAIR                              */}
      {/* ---------------------------------------------------- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-black" />
          <div className="w-0.5 h-2.5 bg-black absolute" />
          <div className="w-6 h-6 rounded-full border border-black/70 absolute" />
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM ACTION & CONTROLS TOOLBAR                     */}
      {/* ---------------------------------------------------- */}
      <footer className="flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Exit to Hangar */}
        <button
          onClick={onExit}
          className="pointer-events-auto flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white border-2 border-black text-xs font-bold text-neutral-900 hover:bg-neutral-100 active:scale-95 transition-all shadow-sm"
        >
          <span>← Hangar</span>
        </button>

        {/* Center Flight Controls Quick Action Toggles */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 bg-white/95 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border-2 border-black shadow-md">
          <button
            onClick={onToggleHover}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
              isHoverMode
                ? "bg-[#FF5500] text-white shadow-sm"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            <span>Hover</span>
          </button>

          <button
            onClick={onToggleCamera}
            className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1"
          >
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="uppercase">{cameraMode}</span>
          </button>

          <button
            onClick={onReset}
            className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1"
            title="Reset to Helipad (R)"
          >
            <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Desktop Controls Tip Badge */}
        <div className="hidden lg:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border-2 border-black text-[11px] text-neutral-600 shadow-sm">
          <span><strong>WASD</strong> Maneuver • <strong>SPACE</strong> Lift • <strong>QE</strong> Yaw</span>
        </div>
      </footer>
    </div>
  );
}