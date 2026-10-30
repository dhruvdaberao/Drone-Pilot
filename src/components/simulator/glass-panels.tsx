"use client";

import React, { useState, useEffect } from "react";
import { TelemetryState, EnvironmentState, SwarmFormationType } from "@/lib/simulation/types";
import { DroneModel } from "@/types/drone";
import { Battery, ShieldAlert, Wind, CloudSun, Plane, Thermometer, RotateCcw, Info, CloudRain, Activity, Eye, Menu, X, MapPin, Compass } from "lucide-react";
import { NavigationWaypoint } from "./minimap-widget";
import { FlightCoachInsight } from "@/lib/simulation/flight-coach-types";

interface LeftGlassPanelProps {
  telemetry: TelemetryState;
  drone: DroneModel;
  motorCount: number;
  motorHealths: number[];
  onSetMotorHealth: (idx: number, health: number) => void;
  payloadMassKg: number;
  onUpdatePayload: (mass: number) => void;
  droneQuantity?: number;
  onUpdateDroneQuantity?: (qty: number) => void;
  swarmFormation?: SwarmFormationType;
  onUpdateSwarmFormation?: (fmt: SwarmFormationType) => void;
  swarmSpacing?: number;
  onUpdateSwarmSpacing?: (spacing: number) => void;
  sensorHealth: Record<string, boolean>;
  onToggleSensor: (sensor: string) => void;
  onExit: () => void;
}

export function LeftGlassPanel({
  telemetry,
  drone,
  motorCount,
  motorHealths,
  onSetMotorHealth,
  payloadMassKg,
  onUpdatePayload,
  droneQuantity = 1,
  onUpdateDroneQuantity,
  swarmFormation = "GRID",
  onUpdateSwarmFormation,
  swarmSpacing = 1.0,
  onUpdateSwarmSpacing,
  sensorHealth,
  onToggleSensor,
  onExit,
}: LeftGlassPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "motors">("status");
  const avgMotorOutput = telemetry.motorOutputs ? telemetry.motorOutputs.reduce((a,b)=>a+b,0) / Math.max(1, telemetry.motorOutputs.length) : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Sandwich Bar Toggle Button (Fades completely when drawer is open) */}
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed top-[76px] left-5 z-30 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border backdrop-blur-2xl shadow-xl transition-all duration-300 select-none group cursor-pointer ${
          isOpen
            ? "opacity-0 pointer-events-none scale-75 -translate-x-4 invisible"
            : "opacity-100 pointer-events-auto scale-100 translate-x-0 visible bg-gradient-to-r from-[#0d1320]/95 to-[#131a2b]/95 hover:from-[#131a2b] hover:to-[#1a233a] border-[#FF5500]/30 hover:border-[#FF5500] text-white hover:shadow-[0_0_22px_rgba(255,85,0,0.3)] hover:scale-105 active:scale-95"
        }`}
        title="Toggle Aircraft Systems & Swarm Controls [Hotkey: F to cycle]"
        aria-label="Toggle Aircraft Systems"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5500] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5500]"></span>
          </span>
          <Menu className="w-4 h-4 text-white group-hover:text-[#FF5500] transition-colors" />
        </div>
        <span className="text-xs font-mono font-bold tracking-[0.14em] uppercase text-white/95">
          Aircraft & Swarm
        </span>
        {droneQuantity > 1 && (
          <span className="px-2 py-0.5 text-[10px] font-mono font-black bg-[#FF5500] text-black rounded-md shadow-xs">
            {droneQuantity}x
          </span>
        )}
      </button>

      {/* Backdrop (Click outside to dismiss drawer) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-40 transition-opacity animate-in fade-in duration-200" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sleek, Professional Aerospace Glassmorphism Drawer Card */}
      <div className={`fixed top-[76px] bottom-5 left-5 w-[360px] sm:w-[380px] max-w-[calc(100vw-32px)] p-4 flex flex-col gap-3.5 z-50 bg-gradient-to-b from-[#111726]/98 via-[#0c101c]/98 to-[#06080f]/98 backdrop-blur-3xl border border-[#FF5500]/25 hover:border-[#FF5500]/40 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.9),0_0_25px_rgba(255,85,0,0.12)] text-white font-sans transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-[120%] opacity-0 pointer-events-none"
      }`}>
        
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5500]/20 border border-[#FF5500]/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,85,0,0.3)]">
              <Plane className="w-5 h-5 text-[#FF5500]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-mono font-black text-sm tracking-wider uppercase text-white truncate leading-tight flex items-center gap-2">
                {drone.name}
                <span className="inline-block w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
              </h2>
              <p className="text-xs text-orange-200/70 font-mono font-semibold tracking-wider uppercase">
                {motorCount} Motors • {drone.platformCategory}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/80 hover:text-rose-300 transition-all text-xs font-mono font-bold tracking-wider cursor-pointer border border-white/15 hover:border-rose-500/40 shrink-0 active:scale-95"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
            <span>CLOSE</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-black/50 p-1.5 rounded-2xl shrink-0 border border-white/10">
          <button 
            onClick={() => setActiveTab("status")} 
            className={`flex-1 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all ${
              activeTab === "status" 
                ? "bg-gradient-to-r from-[#FF5500] to-amber-500 text-black font-black shadow-[0_0_15px_rgba(255,85,0,0.3)] border-transparent" 
                : "text-white/60 hover:text-white"
            }`}
          >
            Status
          </button>
          <button 
            onClick={() => setActiveTab("motors")} 
            className={`flex-1 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all ${
              activeTab === "motors" 
                ? "bg-gradient-to-r from-[#FF5500] to-amber-500 text-black font-black shadow-[0_0_15px_rgba(255,85,0,0.3)] border-transparent" 
                : "text-white/60 hover:text-white"
            }`}
          >
            Motors
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-[#FF5500]/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {activeTab === "status" && (
            <div className="space-y-3.5">
              
              {/* Battery Tile */}
              <div className="bg-gradient-to-b from-[#151c2e]/85 to-[#0e1423]/95 rounded-2xl p-3.5 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">Battery State</span>
                  </div>
                  <span className={`text-base font-mono font-black ${telemetry.batteryLevel > 20 ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                    {telemetry.batteryLevel.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${telemetry.batteryLevel > 20 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-rose-500'}`} 
                    style={{ width: `${Math.max(0, Math.min(100, telemetry.batteryLevel))}%` }} 
                  />
                </div>
              </div>

              {/* Avionics Metrics Strip */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-gradient-to-b from-[#151c2e]/85 to-[#0e1423]/95 rounded-2xl p-3 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Altitude</span>
                  <span className="text-lg font-mono font-black text-white">{telemetry.altitude.toFixed(1)} <span className="text-xs font-normal text-slate-400">m</span></span>
                </div>
                <div className="bg-gradient-to-b from-[#151c2e]/85 to-[#0e1423]/95 rounded-2xl p-3 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Groundspeed</span>
                  <span className="text-lg font-mono font-black text-white">{telemetry.groundSpeed.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span></span>
                </div>
                <div className="bg-gradient-to-b from-[#151c2e]/85 to-[#0e1423]/95 rounded-2xl p-3 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] col-span-2 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" /> Attitude (Pitch / Roll)
                  </span>
                  {sensorHealth['imu'] !== false ? (
                    <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
                      {((telemetry.rotation?.pitch || 0) * (180/Math.PI)).toFixed(1)}° P • {((telemetry.rotation?.roll || 0) * (180/Math.PI)).toFixed(1)}° R
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-rose-500 animate-pulse px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/25">IMU OFFLINE</span>
                  )}
                </div>
              </div>

              {/* Payload & Swarm Controls */}
              <div className="bg-gradient-to-b from-[#151c2e]/85 to-[#0e1423]/95 rounded-2xl p-3.5 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-mono font-bold mb-1.5 uppercase">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-amber-400" /> Payload Mass
                    </span>
                    <span className="text-amber-300 font-extrabold text-sm">+{payloadMassKg.toFixed(1)} kg</span>
                  </div>
                  <input 
                    type="range" min="0" max="25" step="0.5" value={payloadMassKg}
                    onChange={(e) => onUpdatePayload(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 border border-white/5" 
                  />
                </div>

                {onUpdateDroneQuantity && (
                  <div className="pt-2.5 border-t border-white/10">
                    <div className="flex justify-between text-xs font-mono font-bold mb-1.5 uppercase">
                      <span className="text-slate-300">Fleet Quantity</span>
                      <span className="text-[#FF5500] font-black text-sm">{droneQuantity} Drones</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" step="1" value={droneQuantity}
                      onChange={(e) => onUpdateDroneQuantity(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FF5500] border border-white/5" 
                    />
                  </div>
                )}

                {/* Swarm Formations */}
                {droneQuantity > 1 && (
                  <div className="pt-2.5 border-t border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono font-bold uppercase">
                      <span className="text-slate-300">Formation</span>
                      <span className="text-[#FF5500] font-black">
                        {swarmFormation === "GRID" && "Tactical Grid"}
                        {swarmFormation === "V_WEDGE" && "V-Wedge"}
                        {swarmFormation === "LINE_ABEAM" && "Line"}
                        {swarmFormation === "DIAMOND" && "Diamond"}
                        {swarmFormation === "TRAIL" && "Trail"}
                        {swarmFormation === "ORBIT" && "Orbit"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "GRID" as const, label: "Grid" },
                        { id: "V_WEDGE" as const, label: "Wedge" },
                        { id: "LINE_ABEAM" as const, label: "Line" },
                        { id: "DIAMOND" as const, label: "Diamond" },
                        { id: "TRAIL" as const, label: "Trail" },
                        { id: "ORBIT" as const, label: "Orbit" },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => onUpdateSwarmFormation && onUpdateSwarmFormation(fmt.id)}
                          className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer font-mono text-[11px] font-bold uppercase ${
                            swarmFormation === fmt.id
                              ? "bg-[#FF5500] text-black border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.4)] font-black"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                    {onUpdateSwarmSpacing && (
                      <div className="pt-1.5 flex items-center gap-2.5">
                        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase shrink-0">Spread</span>
                        <input
                          type="range" min="0.5" max="2.5" step="0.1" value={swarmSpacing || 1.0}
                          onChange={(e) => onUpdateSwarmSpacing(parseFloat(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 border border-white/5"
                        />
                        <span className="text-xs font-mono font-bold text-amber-300 w-8 text-right">{(swarmSpacing || 1.0).toFixed(1)}x</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sensor Diagnostics */}
              <div className="bg-gradient-to-b from-[#151c2e]/85 to-[#0e1423]/95 rounded-2xl p-3.5 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] space-y-2.5">
                <span className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase block">
                  Sensor Health
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(sensorHealth).map(([key, isHealthy]) => (
                    <button
                      key={key}
                      onClick={() => onToggleSensor(key)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                        isHealthy
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                      }`}
                    >
                      <span className="uppercase">{key}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-black">{isHealthy ? 'ONLINE' : 'OFFLINE'}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === "motors" && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-bold text-white tracking-wider uppercase">Motor Diagnostics</h3>
              </div>

              {/* Compact SVG Diagram */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl">
                    <rect x="50" y="45" width="20" height="30" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                    <circle cx="60" cy="60" r="4" fill="#f59e0b" className="animate-pulse" />
                    {Array.from({ length: motorCount }).map((_, i) => {
                      const angle = (i * (360 / motorCount) + (motorCount === 4 ? 45 : 0)) * (Math.PI / 180);
                      const x = 60 + Math.cos(angle) * 45;
                      const y = 60 + Math.sin(angle) * 45;
                      const output = (telemetry.motorOutputs && telemetry.motorOutputs[i] !== undefined)
                        ? telemetry.motorOutputs[i]
                        : 0;
                      
                      let color = '#6b7280';
                      if (telemetry.isArmed && output > 0.05) {
                        if (output > avgMotorOutput + 0.01) color = '#f59e0b';
                        else if (output < avgMotorOutput - 0.01) color = '#ef4444';
                        else color = '#10b981';
                      }
                      return (
                        <g key={i}>
                          <line x1="60" y1="60" x2={x} y2={y} stroke="#374151" strokeWidth="2.5" />
                          <circle cx={x} cy={y} r={motorCount > 4 ? "7" : "10"} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
                          <circle cx={x} cy={y} r="3" fill={color} />
                          <text x={x} y={y + 1} textAnchor="middle" alignmentBaseline="middle" fill="#fff" fontSize={motorCount > 4 ? "4" : "5"} fontWeight="bold" className="pointer-events-none">M{i+1}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Motor Health Grid */}
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: motorCount }).map((_, i) => {
                  const liveOutput = (telemetry.motorOutputs && telemetry.motorOutputs[i] !== undefined)
                    ? telemetry.motorOutputs[i]
                    : 0;
                  const outputPct = Math.round(liveOutput * 100);
                  
                  let outputColorClass = 'text-neutral-500';
                  let barColorClass = 'bg-neutral-600';
                  if (telemetry.isArmed && liveOutput > 0.05) {
                    if (liveOutput > avgMotorOutput + 0.01) {
                      outputColorClass = 'text-amber-400';
                      barColorClass = 'bg-amber-500';
                    } else if (liveOutput < avgMotorOutput - 0.01) {
                      outputColorClass = 'text-rose-400';
                      barColorClass = 'bg-rose-500';
                    } else {
                      outputColorClass = 'text-emerald-400';
                      barColorClass = 'bg-emerald-500';
                    }
                  }
                  return (
                    <div key={i} className="bg-gradient-to-b from-[#151c2e]/85 to-[#0e1423]/95 rounded-2xl p-3 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <div className="flex justify-between text-xs font-mono font-bold mb-1">
                        <span className="text-white uppercase">M{i + 1}</span>
                        <span className={outputColorClass}>{outputPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-100 ${barColorClass}`}
                          style={{ width: `${outputPct}%` }}
                        />
                      </div>
                      <div className="border-t border-white/5 pt-1.5">
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                          Health {Math.round(motorHealths[i] * 100)}%
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={motorHealths[i]}
                          onChange={(e) => onSetMotorHealth(i, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FF5500] border border-white/5"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reset Drone Button */}
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              window.location.href = url.toString();
            }
          }}
          className="w-full shrink-0 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500]/15 via-amber-500/15 to-[#FF5500]/15 hover:from-[#FF5500] hover:to-amber-500 border border-[#FF5500]/30 hover:border-[#FF5500] text-xs font-mono font-bold text-amber-300 hover:text-black shadow-lg hover:shadow-[0_0_20px_rgba(255,85,0,0.35)] uppercase tracking-wider transition-all cursor-pointer mt-auto active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Drone</span>
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Sandwich Bar Toggle Button (Fades completely when drawer is open) */}
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed top-[76px] right-5 z-30 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border backdrop-blur-2xl shadow-xl transition-all duration-300 select-none group cursor-pointer ${
          isOpen
            ? "opacity-0 pointer-events-none scale-75 translate-x-4 invisible"
            : "opacity-100 pointer-events-auto scale-100 translate-x-0 visible bg-gradient-to-r from-[#0d1320]/95 to-[#131a2b]/95 hover:from-[#131a2b] hover:to-[#1a233a] border-cyan-500/30 hover:border-cyan-400 text-white hover:shadow-[0_0_22px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95"
        }`}
        title="Toggle Weather Environment & Island Minimap"
        aria-label="Toggle Environment Panel"
      >
        <span className="text-xs font-mono font-bold tracking-[0.14em] uppercase text-white/95">
          Weather & Radar
        </span>
        <div className="flex items-center gap-1.5">
          <CloudSun className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <Menu className="w-4 h-4 text-white group-hover:text-cyan-400 transition-colors" />
        </div>
      </button>

      {/* Backdrop (Click outside to dismiss drawer) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-40 transition-opacity animate-in fade-in duration-200" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sleek, Professional Aerospace Glassmorphism Drawer Card */}
      <div className={`fixed top-[76px] bottom-5 right-5 w-[360px] sm:w-[380px] max-w-[calc(100vw-32px)] p-4 flex flex-col gap-3.5 z-50 bg-gradient-to-b from-[#0e1424]/98 via-[#0a0f1b]/98 to-[#060911]/98 backdrop-blur-3xl border border-cyan-500/25 hover:border-cyan-500/40 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.9),0_0_25px_rgba(6,182,212,0.12)] text-white font-sans transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-[120%] opacity-0 pointer-events-none"
      }`}>
        
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <CloudSun className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <h2 className="font-mono font-black text-sm tracking-wider uppercase text-white truncate leading-tight flex items-center gap-2">
                Environment
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </h2>
              <p className="text-xs text-cyan-200/70 font-mono font-semibold tracking-wider uppercase">Atmospheric Digital Twin</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/80 hover:text-rose-300 transition-all text-xs font-mono font-bold tracking-wider cursor-pointer border border-white/15 hover:border-rose-500/40 shrink-0 active:scale-95"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
            <span>CLOSE</span>
          </button>
        </div>

        {/* Location Dropdown */}
        <div className="bg-gradient-to-b from-[#141d30]/85 to-[#0e1424]/95 p-3.5 rounded-2xl border border-cyan-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Airspace Dropzone
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-400/80 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25">
              SECTOR ACTIVE
            </span>
          </div>
          <select
            className="w-full bg-[#070b14] border border-cyan-500/30 hover:border-cyan-400 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-cyan-200 font-mono font-bold outline-none uppercase tracking-wider cursor-pointer shadow-inner transition-colors"
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("region", e.target.value);
              window.location.href = url.toString();
            }}
            defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("region") || "training" : "training"}
          >
            <option className="bg-neutral-900 text-white py-1" value="training">Training Center</option>
            <option className="bg-neutral-900 text-white py-1" value="city">Urban City</option>
            <option className="bg-neutral-900 text-white py-1" value="mountain">Mountain Range</option>
            <option className="bg-neutral-900 text-white py-1" value="forest">Forest Valley</option>
            <option className="bg-neutral-900 text-white py-1" value="river">River &amp; Lake</option>
            <option className="bg-neutral-900 text-white py-1" value="coast">Coastal Area</option>
            <option className="bg-neutral-900 text-white py-1" value="industrial">Industrial Harbor</option>
          </select>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            
          {/* WIND PHYSICS */}
          <div className="bg-gradient-to-b from-[#141d30]/85 to-[#0e1424]/95 rounded-2xl p-3.5 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-white/5">
              <h3 className="text-xs font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" /> Wind Dynamics
              </h3>
              <span className="text-[10px] font-mono text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20">AERODYNAMICS</span>
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-mono font-bold mb-1 uppercase">
                  <span className="text-slate-300">Speed</span>
                  <span className="text-cyan-300 font-extrabold text-sm">{environment.windSpeed.toFixed(1)} <span className="text-[11px] font-normal text-cyan-400/70">m/s</span></span>
                </div>
                <input type="range" min="0" max="25" step="0.5" value={environment.windSpeed}
                  onChange={(e) => {
                    const speed = parseFloat(e.target.value);
                    const autoTurbulence = Math.min(1.0, speed * 0.04);
                    onUpdateEnvironment({ windSpeed: speed, turbulence: autoTurbulence });
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-white/5" 
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono font-bold mb-1 uppercase">
                  <span className="text-slate-300">Direction</span>
                  <span className="text-cyan-300 font-extrabold text-sm">{environment.windDirection}°</span>
                </div>
                <input type="range" min="0" max="359" step="5" value={environment.windDirection}
                  onChange={(e) => onUpdateEnvironment({ windDirection: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-white/5" 
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono font-bold mb-1 uppercase">
                  <span className="text-slate-300">Turbulence</span>
                  <span className="text-cyan-300 font-extrabold text-sm">{(environment.turbulence || 0).toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={environment.turbulence || 0}
                  onChange={(e) => onUpdateEnvironment({ turbulence: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-white/5"
                />
              </div>
            </div>
          </div>

          {/* PRECIPITATION & VISIBILITY */}
          <div className="bg-gradient-to-b from-[#141d30]/85 to-[#0e1424]/95 rounded-2xl p-3.5 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-white/5">
              <h3 className="text-xs font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-400" /> Weather & Atmosphere
              </h3>
              <span className="text-[10px] font-mono text-blue-300 font-bold px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/20">CONDITIONS</span>
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-mono font-bold mb-1 uppercase">
                  <span className="text-slate-300">Rain Intensity</span>
                  <span className="text-blue-300 font-extrabold text-sm">{Math.round((environment.rainIntensity || 0) * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={environment.rainIntensity || 0}
                  onChange={(e) => onUpdateEnvironment({ rainIntensity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400 border border-white/5"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono font-bold mb-1 uppercase">
                  <span className="text-slate-300">Visibility</span>
                  <span className="text-white font-extrabold text-sm">{Math.round((environment.visibility || 0) * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={environment.visibility || 0}
                  onChange={(e) => onUpdateEnvironment({ visibility: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white border border-white/5"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono font-bold mb-1 uppercase">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-rose-400" /> Temperature
                  </span>
                  <span className="text-rose-400 font-extrabold text-sm">{environment.temperature}°C</span>
                </div>
                <input 
                  type="range" min="-15" max="45" step="1" value={environment.temperature}
                  onChange={(e) => onUpdateEnvironment({ temperature: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400 border border-white/5" 
                />
              </div>
            </div>
          </div>

          {/* Environmental Insight Banner */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-[#0f192b]/80 to-[#0a101d]/90 rounded-2xl p-3.5 border-l-2 border-l-cyan-400 border border-cyan-500/25 shadow-md space-y-1.5">
            <h4 className="text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" /> Atmosphere Impact
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
              {currentInsight ? currentInsight.explanation.what : "Dynamic wind introduces drag and drift; temperature shifts change air density affecting motor thrust efficiency."}
            </p>
          </div>
        </div>

        {/* Reset Environment Button */}
        <button 
          onClick={onResetEnvironment} 
          className="w-full shrink-0 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-cyan-500/15 hover:from-cyan-500 hover:to-blue-500 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 hover:text-black shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] uppercase tracking-wider transition-all cursor-pointer mt-auto active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Atmosphere</span>
        </button>

      </div>
    </>
  );
}

