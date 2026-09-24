"use client";

import React from "react";
import { TelemetryState, EnvironmentState } from "@/lib/simulation/types";
import { DroneModel } from "@/types/drone";
import { Battery, ShieldAlert, Wind, CloudSun, Map as MapIcon, Settings2, Plane } from "lucide-react";
import { MinimapWidget } from "./minimap-widget";
import { NavigationWaypoint } from "./minimap-widget";

interface LeftGlassPanelProps {
  telemetry: TelemetryState;
  drone: DroneModel;
  motorCount: number;
  motorHealths: number[];
  onSetMotorHealth: (idx: number, health: number) => void;
  onExit: () => void;
}

export function LeftGlassPanel({
  telemetry,
  drone,
  motorCount,
  motorHealths,
  onSetMotorHealth,
  onExit,
}: LeftGlassPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-neutral-900/80 backdrop-blur border border-white/20 p-2 rounded-lg text-white safe-area-mt"
      >
        <Settings2 className="w-5 h-5 text-[#FF5500]" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed top-0 left-0 bottom-0 lg:relative lg:w-full lg:h-full lg:top-auto lg:left-auto lg:bottom-auto w-80 lg:rounded-none bg-neutral-900/95 lg:bg-transparent backdrop-blur-xl border-r lg:border-r border-white/10 p-5 flex flex-col gap-6 shadow-2xl z-40 text-white font-mono pointer-events-auto transition-transform duration-300 ease-in-out safe-area-padding ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-white/10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/50">Aircraft Status</h2>
          <button onClick={() => setIsOpen(false)} className="p-1"><Settings2 className="w-4 h-4 text-white/50" /></button>
        </div>

        {/* Dashboard Exit Button */}
        <button
          onClick={onExit}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-xs font-bold transition-all text-white/80 hover:text-white"
        >
          <Plane className="w-3.5 h-3.5" />
          <span>Exit to Dashboard</span>
        </button>

        {/* Aircraft Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-white" />
            <h2 className="font-heading font-extrabold text-lg uppercase tracking-wider">{drone.name}</h2>
          </div>
          <p className="text-xs text-white/60 tracking-widest uppercase">{drone.platformId === "quadcopter" ? 4 : drone.platformId === "hexacopter" ? 6 : 8} MOTORS • {drone.platformCategory}</p>
        </div>

        {/* Primary Status */}
        <div className="bg-black/20 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-[#FF5500]" />
              <span className="text-xs font-bold tracking-widest uppercase">Battery</span>
            </div>
            <span className="text-sm font-bold">{telemetry.batteryLevel}%</span>
          </div>
          
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#FF5500] transition-all" style={{ width: `${telemetry.batteryLevel}%` }} />
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <div>
              <span className="text-[10px] text-white/50 block uppercase tracking-widest">Altitude</span>
              <span className="text-sm font-bold">{telemetry.altitude.toFixed(1)}m</span>
            </div>
            <div>
              <span className="text-[10px] text-white/50 block uppercase tracking-widest">Speed</span>
              <span className="text-sm font-bold">{telemetry.groundSpeed.toFixed(1)}km/h</span>
            </div>
          </div>
        </div>

        {/* Fault Injection Sliders (Compact) */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-white/50" />
            <h3 className="text-[10px] font-bold text-white/50 tracking-widest uppercase">System Health</h3>
          </div>
          
          <div className="space-y-3">
            {Array.from({ length: motorCount }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span>Motor {i + 1}</span>
                  <span className={motorHealths[i] < 1 ? "text-rose-400" : "text-emerald-400"}>
                    {Math.round(motorHealths[i] * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={motorHealths[i]}
                  onChange={(e) => onSetMotorHealth(i, parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF5500]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

interface RightGlassPanelProps {
  environment: EnvironmentState;
  onUpdateWind: (speed: number) => void;
  telemetry: TelemetryState;
  activeWaypoint: NavigationWaypoint | null;
  onToggleMap: () => void;
}

export function RightGlassPanel({
  environment,
  onUpdateWind,
  telemetry,
  activeWaypoint,
  onToggleMap,
}: RightGlassPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-40 bg-neutral-900/80 backdrop-blur border border-white/20 p-2 rounded-lg text-white safe-area-mt"
      >
        <CloudSun className="w-5 h-5 text-[#FF5500]" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed top-0 right-0 bottom-0 lg:relative lg:w-full lg:h-full lg:top-auto lg:right-auto lg:bottom-auto w-80 lg:rounded-none bg-neutral-900/95 lg:bg-transparent backdrop-blur-xl border-l lg:border-l border-white/10 p-5 flex flex-col gap-6 shadow-2xl z-40 text-white font-mono pointer-events-auto transition-transform duration-300 ease-in-out safe-area-padding ${
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      }`}>
        
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-white/10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/50">Environment & Map</h2>
          <button onClick={() => setIsOpen(false)} className="p-1"><CloudSun className="w-4 h-4 text-white/50" /></button>
        </div>

        {/* Environment Controls */}
        <div>
          <div className="flex items-center gap-2 mb-4 hidden lg:flex">
            <CloudSun className="w-5 h-5 text-white" />
            <h2 className="font-heading font-extrabold text-sm uppercase tracking-wider">Environment</h2>
          </div>
          
          <div className="bg-black/20 rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] tracking-widest uppercase">
                <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-[#FF5500]"/> Wind</span>
                <span>{environment.windSpeed.toFixed(1)} m/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="0.1"
                value={environment.windSpeed}
                onChange={(e) => onUpdateWind(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF5500]"
              />
            </div>
          </div>
        </div>

        {/* Live Minimap embedded in the right panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-white/50" />
              <h3 className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Tactical Radar</h3>
            </div>
          </div>
          <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
            {/* We reuse the MinimapWidget, but style it to fit the container or rely on its own styles */}
            <div className="absolute inset-0 flex items-center justify-center transform scale-90">
               <MinimapWidget
                  telemetry={telemetry}
                  onClick={onToggleMap}
                  activeWaypoint={activeWaypoint}
                />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
