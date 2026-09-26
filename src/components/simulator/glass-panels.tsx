"use client";

import React from "react";
import { TelemetryState, EnvironmentState, EducationalEvent } from "@/lib/simulation/types";
import { DroneModel } from "@/types/drone";
import { Battery, ShieldAlert, Wind, CloudSun, Map as MapIcon, Settings2, Plane, Thermometer, Droplets, Eye, RotateCcw, Info, CloudRain, AlertTriangle } from "lucide-react";
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
        className="md:hidden fixed top-4 left-4 z-40 bg-neutral-900/80 backdrop-blur border border-white/20 p-2 rounded-lg text-white safe-area-mt"
      >
        <Settings2 className="w-5 h-5 text-[#FF5500]" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed top-0 left-0 bottom-0 md:relative md:w-full md:h-full md:top-auto md:left-auto md:bottom-auto w-80 md:rounded-none bg-neutral-900/95 md:bg-transparent backdrop-blur-xl border-r md:border-r border-white/10 p-5 flex flex-col gap-6 shadow-2xl z-40 text-white font-mono pointer-events-auto transition-transform duration-300 ease-in-out safe-area-padding ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="flex items-center justify-between md:hidden pb-2 border-b border-white/10">
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
  onUpdateEnvironment: (updates: Partial<EnvironmentState>) => void;
  telemetry: TelemetryState;
  activeWaypoint: NavigationWaypoint | null;
  onToggleMap: () => void;
  onResetEnvironment: () => void;
  currentEvent: EducationalEvent | null;
}

export function RightGlassPanel({
  environment,
  onUpdateEnvironment,
  telemetry,
  activeWaypoint,
  onToggleMap,
  onResetEnvironment,
  currentEvent
}: RightGlassPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-40 bg-neutral-900/80 backdrop-blur border border-white/20 p-2 rounded-lg text-white safe-area-mt"
      >
        <CloudSun className="w-5 h-5 text-[#FF5500]" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed top-0 right-0 bottom-0 md:relative md:w-full md:h-full md:top-auto md:right-auto md:bottom-auto w-80 md:rounded-none bg-neutral-900/95 md:bg-transparent backdrop-blur-xl border-l md:border-l border-white/10 p-5 flex flex-col gap-5 shadow-2xl z-40 text-white font-mono pointer-events-auto transition-transform duration-300 ease-in-out safe-area-padding custom-scrollbar overflow-y-auto ${
        isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
      }`}>
        
        <div className="flex items-center justify-between md:hidden pb-2 border-b border-white/10 shrink-0">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/50">Environment</h2>
          <button onClick={() => setIsOpen(false)} className="p-1"><CloudSun className="w-4 h-4 text-white/50" /></button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 shrink-0 hidden md:flex">
          <CloudSun className="w-5 h-5 text-white" />
          <h2 className="font-heading font-extrabold text-sm uppercase tracking-wider">Environment</h2>
        </div>

        {/* ------------------------------------------------ */}
        {/* WIND */}
        <div className="bg-black/20 rounded-2xl p-4 space-y-4 shrink-0">
          <h3 className="text-[10px] font-bold text-white/50 tracking-widest uppercase flex items-center gap-2 border-b border-white/10 pb-2">
            <Wind className="w-3 h-3" /> WIND
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-[10px] tracking-widest uppercase mb-1">
                <span>Speed</span>
                <span className="text-[#FF5500]">{environment.windSpeed.toFixed(1)} m/s</span>
              </div>
              <input type="range" min="0" max="25" step="0.5" value={environment.windSpeed}
                onChange={(e) => onUpdateEnvironment({ windSpeed: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF5500]" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] tracking-widest uppercase mb-1">
                <span>Direction</span>
                <span className="text-[#FF5500]">{environment.windDirection}°</span>
              </div>
              <input type="range" min="0" max="359" step="5" value={environment.windDirection}
                onChange={(e) => onUpdateEnvironment({ windDirection: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF5500]" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] tracking-widest uppercase mb-1">
                <span>Turbulence</span>
                <span className="text-[#FF5500]">{Math.round((environment.turbulence || 0) * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={environment.turbulence || 0}
                onChange={(e) => onUpdateEnvironment({ turbulence: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF5500]" />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ */}
        {/* ATMOSPHERE & PRECIPITATION */}
        <div className="bg-black/20 rounded-2xl p-4 space-y-4 shrink-0">
          <h3 className="text-[10px] font-bold text-white/50 tracking-widest uppercase flex items-center gap-2 border-b border-white/10 pb-2">
            <Thermometer className="w-3 h-3" /> ATMOSPHERE
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-[10px] tracking-widest uppercase mb-1">
                <span>Temperature</span>
                <span className="text-rose-400">{environment.temperature.toFixed(0)}°C</span>
              </div>
              <input type="range" min="-10" max="45" step="1" value={environment.temperature}
                onChange={(e) => onUpdateEnvironment({ temperature: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500" />
            </div>
            
            <div>
              <span className="text-[10px] tracking-widest uppercase text-white/70 block mb-2">Precipitation (Visual)</span>
              <div className="flex gap-1">
                {(["off", "light", "moderate", "heavy"] as const).map((r) => (
                  <button key={r} onClick={() => onUpdateEnvironment({ rainIntensity: r })}
                    className={`flex-1 py-1 text-[9px] font-bold rounded border uppercase ${environment.rainIntensity === r ? "bg-[#FF5500] text-white border-[#FF5500]" : "bg-transparent text-white/60 border-white/20 hover:bg-white/10"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] tracking-widest uppercase text-white/70 block mb-2">Visibility (Visual)</span>
              <div className="flex gap-1">
                {(["clear", "hazy", "foggy"] as const).map((v) => (
                  <button key={v} onClick={() => onUpdateEnvironment({ visibility: v })}
                    className={`flex-1 py-1 text-[9px] font-bold rounded border uppercase ${environment.visibility === v ? "bg-neutral-700 text-white border-neutral-700" : "bg-transparent text-white/60 border-white/20 hover:bg-white/10"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ */}
        {/* EFFECTS STATUS */}
        <div className="bg-black/20 rounded-2xl p-4 space-y-2 shrink-0">
          <h3 className="text-[10px] font-bold text-white/50 tracking-widest uppercase flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
            <AlertTriangle className="w-3 h-3" /> EFFECTS STATUS
          </h3>
          <div className="grid grid-cols-2 gap-y-2 text-[9px] tracking-widest uppercase">
            <span className="text-white/50">WIND</span>
            <span className={environment.windSpeed > 5 ? "text-amber-400" : "text-emerald-400"}>{environment.windSpeed > 5 ? "ACTIVE" : "NORMAL"}</span>
            <span className="text-white/50">RAIN</span>
            <span className={environment.rainIntensity !== "off" ? "text-amber-400" : "text-emerald-400"}>{environment.rainIntensity !== "off" ? "ACTIVE" : "OFF"}</span>
            <span className="text-white/50">VISIBILITY</span>
            <span className={environment.visibility !== "clear" ? "text-amber-400" : "text-emerald-400"}>{environment.visibility === "clear" ? "NORMAL" : "REDUCED"}</span>
            <span className="text-white/50">TEMPERATURE</span>
            <span className={environment.temperature < 0 || environment.temperature > 35 ? "text-amber-400" : "text-emerald-400"}>{environment.temperature < 0 || environment.temperature > 35 ? "EXTREME" : "NORMAL"}</span>
          </div>
        </div>

        {/* ------------------------------------------------ */}
        {/* WHAT'S HAPPENING */}
        <div className="bg-black/20 rounded-2xl p-4 space-y-2 shrink-0">
          <h3 className="text-[10px] font-bold text-[#FF5500] tracking-widest uppercase flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
            <Info className="w-3 h-3" /> WHAT'S HAPPENING
          </h3>
          <p className="text-[10px] text-white/80 leading-relaxed">
            {currentEvent ? currentEvent.message : "The aircraft is operating in baseline conditions. Adjust environment sliders to observe real-time aerodynamic and visual effects on the simulation."}
          </p>
        </div>

        {/* ------------------------------------------------ */}
        {/* RESET ENVIRONMENT */}
        <button onClick={onResetEnvironment} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-[10px] font-bold tracking-widest uppercase transition-all text-white/80 hover:text-white shrink-0">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Environment</span>
        </button>

        {/* Live Minimap embedded in the right panel */}
        <div className="flex-1 flex flex-col min-h-[160px] shrink-0 mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-white/50" />
              <h3 className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Tactical Radar</h3>
            </div>
          </div>
          <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
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
