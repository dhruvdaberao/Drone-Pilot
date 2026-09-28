"use client";

import React, { useState } from "react";
import { TelemetryState, EnvironmentState } from "@/lib/simulation/types";
import { DroneModel } from "@/types/drone";
import { Battery, ShieldAlert, Wind, CloudSun, Map as MapIcon, Settings2, Plane, Thermometer, Droplets, RotateCcw, Info, CloudRain, AlertTriangle, Activity } from "lucide-react";
import { MinimapWidget, NavigationWaypoint } from "./minimap-widget";
import { FlightCoachInsight } from "@/lib/simulation/flight-coach-types";

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
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "motors">("status");

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-20 left-4 z-40 bg-neutral-900/80 backdrop-blur border border-white/5 p-3 rounded-2xl text-white shadow-xl"
      >
        <Settings2 className="w-6 h-6 text-[#FF5500]" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Premium Glassmorphism Card */}
      <div className={`fixed top-20 bottom-4 left-4 md:w-[380px] w-[calc(100vw-32px)] rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/5 p-6 flex flex-col gap-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-40 text-white font-sans pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
        isOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
      }`}>
        
        {/* Header & Exit */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="space-y-1">
            <h2 className="font-bold text-xl uppercase tracking-wider flex items-center gap-2">
              <Plane className="w-6 h-6 text-[#FF5500]" />
              {drone.name}
            </h2>
            <p className="text-xs text-white/60 tracking-widest uppercase">{motorCount} MOTORS â€¢ {drone.platformCategory}</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 bg-white/10 rounded-full hover:bg-white/20"><Settings2 className="w-5 h-5 text-white" /></button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-black/30 p-1 rounded-2xl shrink-0">
          <button 
            onClick={() => setActiveTab("status")} 
            className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-xl transition-all ${activeTab === "status" ? "bg-white/20 text-white shadow-lg" : "text-white/50 hover:text-white/80"}`}
          >
            Status
          </button>
          <button 
            onClick={() => setActiveTab("motors")} 
            className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-xl transition-all ${activeTab === "motors" ? "bg-white/20 text-white shadow-lg" : "text-white/50 hover:text-white/80"}`}
          >
            Motors
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          {activeTab === "status" && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Battery className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold tracking-widest uppercase text-white/80">Battery Level</span>
                  </div>
                  <span className="text-xl font-bold">{telemetry.batteryLevel.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full transition-all duration-500 rounded-full ${telemetry.batteryLevel > 20 ? 'bg-emerald-400' : 'bg-rose-500'}`} style={{ width: `${telemetry.batteryLevel}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <span className="text-xs text-white/50 block uppercase tracking-widest mb-1">Altitude</span>
                  <span className="text-2xl font-bold">{telemetry.altitude.toFixed(1)}<span className="text-sm text-white/50 ml-1">m</span></span>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <span className="text-xs text-white/50 block uppercase tracking-widest mb-1">Speed</span>
                  <span className="text-2xl font-bold">{telemetry.groundSpeed.toFixed(1)}<span className="text-sm text-white/50 ml-1">km/h</span></span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "motors" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase">Motor Diagnostics</h3>
              </div>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-48 h-48 mb-6">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                    <rect x="40" y="35" width="20" height="30" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                    <circle cx="50" cy="50" r="4" fill="#FF5500" className="animate-pulse" />
                    {Array.from({ length: motorCount }).map((_, i) => {
                      const angle = (i * (360 / motorCount) + (motorCount === 4 ? 45 : 0)) * (Math.PI / 180);
                      const x = 50 + Math.cos(angle) * 35;
                      const y = 50 + Math.sin(angle) * 35;
                      const health = motorHealths[i] || 0;
                      const color = health > 0.8 ? '#10b981' : health > 0.3 ? '#f59e0b' : '#ef4444';
                      return (
                        <g key={i}>
                          <line x1="50" y1="50" x2={x} y2={y} stroke="#374151" strokeWidth="3" />
                          <circle cx={x} cy={y} r="12" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
                          <circle cx={x} cy={y} r="4" fill={color} />
                          <text x={x} y={y + 1} textAnchor="middle" alignmentBaseline="middle" fill="#fff" fontSize="5" fontWeight="bold" className="pointer-events-none">M{i+1}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: motorCount }).map((_, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex justify-between text-xs font-bold mb-3">
                      <span className="text-white/80 uppercase">M{i + 1}</span>
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
                      className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#FF5500]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Exit Button */}
        <button
          onClick={onExit}
          className="w-full shrink-0 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-sm font-bold transition-all text-white mt-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Exit to Dashboard</span>
        </button>
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
  currentInsight: FlightCoachInsight | null;
}

export function RightGlassPanel({
  environment,
  onUpdateEnvironment,
  telemetry,
  activeWaypoint,
  onToggleMap,
  onResetEnvironment,
  currentInsight
}: RightGlassPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"weather" | "map">("weather");

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-20 right-4 z-40 bg-neutral-900/80 backdrop-blur border border-white/5 p-3 rounded-2xl text-white shadow-xl"
      >
        <CloudSun className="w-6 h-6 text-[#38bdf8]" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Premium Glassmorphism Card */}
      <div className={`fixed top-20 bottom-4 right-4 md:w-[380px] w-[calc(100vw-32px)] rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/5 p-6 flex flex-col gap-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-40 text-white font-sans pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
        isOpen ? "translate-x-0" : "translate-x-[120%] md:translate-x-0"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="space-y-1">
            <h2 className="font-bold text-xl uppercase tracking-wider flex items-center gap-2">
              <CloudSun className="w-6 h-6 text-[#38bdf8]" />
              Environment
            </h2>
            <p className="text-xs text-white/60 tracking-widest uppercase">Atmospheric Digital Twin</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 bg-white/10 rounded-full hover:bg-white/20"><CloudSun className="w-5 h-5 text-white" /></button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-black/30 p-1 rounded-2xl shrink-0">
          <button 
            onClick={() => setActiveTab("weather")} 
            className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-xl transition-all ${activeTab === "weather" ? "bg-white/20 text-white shadow-lg" : "text-white/50 hover:text-white/80"}`}
          >
            Weather
          </button>
          <button 
            onClick={() => setActiveTab("map")} 
            className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-xl transition-all ${activeTab === "map" ? "bg-white/20 text-white shadow-lg" : "text-white/50 hover:text-white/80"}`}
          >
            Map & Radar
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          {activeTab === "weather" && (
            <>
              {/* WIND */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-5">
                <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase flex items-center gap-2">
                  <Wind className="w-4 h-4 text-[#38bdf8]" /> Wind Physics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                      <span className="text-white/60">Speed</span>
                      <span className="text-[#38bdf8]">{environment.windSpeed.toFixed(1)} m/s</span>
                    </div>
                    <input type="range" min="0" max="25" step="0.5" value={environment.windSpeed}
                      onChange={(e) => onUpdateEnvironment({ windSpeed: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#38bdf8]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                      <span className="text-white/60">Direction</span>
                      <span className="text-[#38bdf8]">{environment.windDirection}Â°</span>
                    </div>
                    <input type="range" min="0" max="359" step="5" value={environment.windDirection}
                      onChange={(e) => onUpdateEnvironment({ windDirection: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#38bdf8]" />
                  </div>
                </div>
              </div>

              {/* ATMOSPHERE */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-5">
                <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-rose-400" /> Atmosphere
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                      <span className="text-white/60">Temperature</span>
                      <span className={environment.temperature > 30 ? "text-rose-400" : "text-emerald-400"}>{environment.temperature.toFixed(0)}Â°C</span>
                    </div>
                    <input type="range" min="-10" max="45" step="1" value={environment.temperature}
                      onChange={(e) => onUpdateEnvironment({ temperature: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                  </div>
                  
                  <div>
                    <span className="text-xs font-bold uppercase text-white/60 block mb-2">Precipitation (Visual)</span>
                    <div className="flex gap-2">
                      {(["off", "light", "moderate", "heavy"] as const).map((r) => (
                        <button key={r} onClick={() => onUpdateEnvironment({ rainIntensity: r })}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-lg border uppercase transition-all ${environment.rainIntensity === r ? "bg-[#38bdf8] text-white border-[#38bdf8] shadow-md" : "bg-black/20 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase text-white/60 block mb-2">Visibility (Visual)</span>
                    <div className="flex gap-2">
                      {(["clear", "hazy", "foggy"] as const).map((v) => (
                        <button key={v} onClick={() => onUpdateEnvironment({ visibility: v })}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-lg border uppercase transition-all ${environment.visibility === v ? "bg-neutral-600 text-white border-neutral-600 shadow-md" : "bg-black/20 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* WHAT'S HAPPENING */}
              <div className="bg-[#38bdf8]/10 rounded-2xl p-5 border border-[#38bdf8]/30 space-y-2">
                <h3 className="text-xs font-bold text-[#38bdf8] tracking-widest uppercase flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" /> Environmental Impact
                </h3>
                <p className="text-sm text-white/90 leading-relaxed font-medium">
                  {currentInsight ? currentInsight.explanation.what : "Adjust environment sliders to observe real-time aerodynamic and visual effects on the simulation. High winds will induce lateral drift, while temperature affects air density."}
                </p>
              </div>
            </>
          )}

          {activeTab === "map" && (
            <div className="h-full flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase">Tactical Radar</h3>
                </div>
              </div>
              <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-center">
                   <MinimapWidget
                      telemetry={telemetry}
                      onClick={onToggleMap}
                      activeWaypoint={activeWaypoint}
                    />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reset Environment */}
        <button onClick={onResetEnvironment} className="w-full mt-auto shrink-0 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold uppercase transition-all text-white">
          <RotateCcw className="w-4 h-4" />
          <span>Reset Environment</span>
        </button>

      </div>
    </>
  );
}


