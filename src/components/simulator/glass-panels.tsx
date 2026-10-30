"use client";

import React, { useState, useEffect } from "react";
import { TelemetryState, EnvironmentState, SwarmFormationType } from "@/lib/simulation/types";
import { DroneModel } from "@/types/drone";
import { Battery, ShieldAlert, Wind, CloudSun, Plane, Thermometer, RotateCcw, Info, CloudRain, Activity, Eye, Menu, X } from "lucide-react";
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
        className={`fixed top-[76px] left-5 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border backdrop-blur-2xl shadow-xl transition-all duration-300 select-none group cursor-pointer ${
          isOpen
            ? "opacity-0 pointer-events-none scale-75 -translate-x-4 invisible"
            : "opacity-100 pointer-events-auto scale-100 translate-x-0 visible bg-[#0b0f17]/95 hover:bg-[#121824] border-white/20 text-white hover:border-[#FF5500]/70 hover:shadow-[0_0_20px_rgba(255,85,0,0.25)] hover:scale-105 active:scale-95"
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
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-[#FF5500] text-black rounded-md shadow-xs">
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

      {/* Sleek, Compact Glassmorphism Drawer Card */}
      <div className={`fixed top-[76px] bottom-5 left-5 w-[340px] sm:w-[350px] max-w-[calc(100vw-32px)] p-4 flex flex-col gap-3.5 z-50 bg-[#090c12]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl shadow-black/90 text-white font-sans transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-[120%] opacity-0 pointer-events-none"
      }`}>
        
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center shrink-0">
              <Plane className="w-4 h-4 text-[#FF5500]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-mono font-bold text-xs tracking-wider uppercase text-white truncate leading-tight">
                {drone.name}
              </h2>
              <p className="text-[9px] text-white/50 tracking-widest uppercase font-mono">
                {motorCount} Motors • {drone.platformCategory}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all text-[10px] font-mono font-bold tracking-wider cursor-pointer border border-white/10 shrink-0"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
            <span>CLOSE</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl shrink-0 border border-white/5">
          <button 
            onClick={() => setActiveTab("status")} 
            className={`flex-1 py-1.5 text-[11px] font-mono font-bold tracking-wider uppercase rounded-lg transition-all ${
              activeTab === "status" 
                ? "bg-white/15 text-white shadow-xs border border-white/10" 
                : "text-white/40 hover:text-white/80"
            }`}
          >
            Status
          </button>
          <button 
            onClick={() => setActiveTab("motors")} 
            className={`flex-1 py-1.5 text-[11px] font-mono font-bold tracking-wider uppercase rounded-lg transition-all ${
              activeTab === "motors" 
                ? "bg-white/15 text-white shadow-xs border border-white/10" 
                : "text-white/40 hover:text-white/80"
            }`}
          >
            Motors
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-thumb]:rounded-full">
          {activeTab === "status" && (
            <div className="space-y-3">
              
              {/* Battery Tile */}
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-white/70">Battery State</span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${telemetry.batteryLevel > 20 ? 'text-white' : 'text-rose-400 animate-pulse'}`}>
                    {telemetry.batteryLevel.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${telemetry.batteryLevel > 20 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-rose-500'}`} 
                    style={{ width: `${Math.max(0, Math.min(100, telemetry.batteryLevel))}%` }} 
                  />
                </div>
              </div>

              {/* Avionics Metrics Strip */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.08]">
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-0.5">Altitude</span>
                  <span className="text-base font-mono font-bold text-white">{telemetry.altitude.toFixed(1)} <span className="text-[10px] font-normal text-white/50">m</span></span>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.08]">
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-0.5">Speed</span>
                  <span className="text-base font-mono font-bold text-white">{telemetry.groundSpeed.toFixed(1)} <span className="text-[10px] font-normal text-white/50">km/h</span></span>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.08] col-span-2 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Attitude (P / R)</span>
                  {sensorHealth['imu'] !== false ? (
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {((telemetry.rotation?.pitch || 0) * (180/Math.PI)).toFixed(1)}° P • {((telemetry.rotation?.roll || 0) * (180/Math.PI)).toFixed(1)}° R
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-rose-500 animate-pulse">IMU OFFLINE</span>
                  )}
                </div>
              </div>

              {/* Payload & Swarm Controls */}
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.08] space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] font-mono font-bold mb-1.5 uppercase">
                    <span className="text-white/60 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" /> Payload Mass
                    </span>
                    <span className="text-amber-300">+{payloadMassKg.toFixed(1)} kg</span>
                  </div>
                  <input 
                    type="range" min="0" max="25" step="0.5" value={payloadMassKg}
                    onChange={(e) => onUpdatePayload(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400" 
                  />
                </div>

                {onUpdateDroneQuantity && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex justify-between text-[10px] font-mono font-bold mb-1.5 uppercase">
                      <span className="text-white/60">Fleet Quantity</span>
                      <span className="text-[#FF5500] font-black">{droneQuantity} Drones</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" step="1" value={droneQuantity}
                      onChange={(e) => onUpdateDroneQuantity(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF5500]" 
                    />
                  </div>
                )}

                {/* Swarm Formations */}
                {droneQuantity > 1 && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase">
                      <span className="text-white/50">Formation</span>
                      <span className="text-[#FF5500]">
                        {swarmFormation === "GRID" && "Tactical Grid"}
                        {swarmFormation === "V_WEDGE" && "V-Wedge"}
                        {swarmFormation === "LINE_ABEAM" && "Line"}
                        {swarmFormation === "DIAMOND" && "Diamond"}
                        {swarmFormation === "TRAIL" && "Trail"}
                        {swarmFormation === "ORBIT" && "Orbit"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
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
                          className={`py-1 px-1 rounded-lg border text-center transition-all cursor-pointer font-mono text-[9px] font-bold uppercase ${
                            swarmFormation === fmt.id
                              ? "bg-[#FF5500] text-black border-[#FF5500] shadow-xs font-black"
                              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                    {onUpdateSwarmSpacing && (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[8px] font-mono text-white/40 uppercase shrink-0">Spread</span>
                        <input
                          type="range" min="0.5" max="2.5" step="0.1" value={swarmSpacing || 1.0}
                          onChange={(e) => onUpdateSwarmSpacing(parseFloat(e.target.value))}
                          className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-amber-400"
                        />
                        <span className="text-[9px] font-mono text-white/70 w-7 text-right">{(swarmSpacing || 1.0).toFixed(1)}x</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sensor Diagnostics */}
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.08] space-y-2">
                <span className="text-[10px] font-mono font-bold text-white/60 tracking-wider uppercase block">
                  Sensor Health
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(sensorHealth).map(([key, isHealthy]) => (
                    <button
                      key={key}
                      onClick={() => onToggleSensor(key)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        isHealthy
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                      }`}
                    >
                      <span className="uppercase">{key}</span>
                      <span className="text-[9px]">{isHealthy ? 'ONLINE' : 'OFFLINE'}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === "motors" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-bold text-white/80 tracking-widest uppercase">Motor Diagnostics</h3>
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
                    <div key={i} className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.08]">
                      <div className="flex justify-between text-[11px] font-mono font-bold mb-1">
                        <span className="text-white/80 uppercase">M{i + 1}</span>
                        <span className={outputColorClass}>{outputPct}%</span>
                      </div>
                      <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-100 ${barColorClass}`}
                          style={{ width: `${outputPct}%` }}
                        />
                      </div>
                      <div className="border-t border-white/5 pt-1.5">
                        <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-0.5">
                          Health {Math.round(motorHealths[i] * 100)}%
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={motorHealths[i]}
                          onChange={(e) => onSetMotorHealth(i, parseFloat(e.target.value))}
                          className="w-full h-1 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#FF5500]"
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
          className="w-full shrink-0 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-xs font-mono font-bold text-amber-300 hover:text-black shadow-xs transition-all mt-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="uppercase tracking-widest">Reset Drone</span>
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
        className={`fixed top-[76px] right-5 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border backdrop-blur-2xl shadow-xl transition-all duration-300 select-none group cursor-pointer ${
          isOpen
            ? "opacity-0 pointer-events-none scale-75 translate-x-4 invisible"
            : "opacity-100 pointer-events-auto scale-100 translate-x-0 visible bg-[#0b0f17]/95 hover:bg-[#121824] border-white/20 text-white hover:border-cyan-400/70 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:scale-105 active:scale-95"
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

      {/* Sleek, Compact Glassmorphism Drawer Card */}
      <div className={`fixed top-[76px] bottom-5 right-5 w-[340px] sm:w-[350px] max-w-[calc(100vw-32px)] p-4 flex flex-col gap-3.5 z-50 bg-[#090c12]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl shadow-black/90 text-white font-sans transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-[120%] opacity-0 pointer-events-none"
      }`}>
        
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <CloudSun className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h2 className="font-mono font-bold text-xs tracking-wider uppercase text-white truncate leading-tight">
                Environment
              </h2>
              <p className="text-[9px] text-white/50 tracking-widest uppercase font-mono">Atmospheric Digital Twin</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all text-[10px] font-mono font-bold tracking-wider cursor-pointer border border-white/10 shrink-0"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
            <span>CLOSE</span>
          </button>
        </div>

        {/* Location Dropdown */}
        <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.08] shrink-0">
          <h3 className="text-[9px] font-mono font-bold text-white/50 tracking-widest uppercase mb-1.5">Airspace Dropzone</h3>
          <select
            className="w-full bg-[#05070a] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold outline-none uppercase tracking-wider cursor-pointer"
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("region", e.target.value);
              window.location.href = url.toString();
            }}
            defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("region") || "training" : "training"}
          >
            <option className="bg-neutral-900 text-white" value="training">Training Center</option>
            <option className="bg-neutral-900 text-white" value="city">Urban City</option>
            <option className="bg-neutral-900 text-white" value="mountain">Mountain Range</option>
            <option className="bg-neutral-900 text-white" value="forest">Forest Valley</option>
            <option className="bg-neutral-900 text-white" value="river">River &amp; Lake</option>
            <option className="bg-neutral-900 text-white" value="coast">Coastal Area</option>
            <option className="bg-neutral-900 text-white" value="industrial">Industrial Harbor</option>
          </select>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-thumb]:rounded-full">
            
          {/* WIND PHYSICS */}
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.08] space-y-2.5">
            <h3 className="text-[10px] font-mono font-bold text-white/80 tracking-widest uppercase flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" /> Wind Dynamics
            </h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] font-mono font-bold mb-1 uppercase">
                  <span className="text-white/50">Speed</span>
                  <span className="text-cyan-300">{environment.windSpeed.toFixed(1)} m/s</span>
                </div>
                <input type="range" min="0" max="25" step="0.5" value={environment.windSpeed}
                  onChange={(e) => {
                    const speed = parseFloat(e.target.value);
                    const autoTurbulence = Math.min(1.0, speed * 0.04);
                    onUpdateEnvironment({ windSpeed: speed, turbulence: autoTurbulence });
                  }}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono font-bold mb-1 uppercase">
                  <span className="text-white/50">Direction</span>
                  <span className="text-cyan-300">{environment.windDirection}°</span>
                </div>
                <input type="range" min="0" max="359" step="5" value={environment.windDirection}
                  onChange={(e) => onUpdateEnvironment({ windDirection: parseInt(e.target.value) })}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono font-bold mb-1 uppercase">
                  <span className="text-white/50">Turbulence</span>
                  <span className="text-cyan-300">{(environment.turbulence || 0).toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={environment.turbulence || 0}
                  onChange={(e) => onUpdateEnvironment({ turbulence: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* PRECIPITATION & VISIBILITY */}
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.08] space-y-2.5">
            <h3 className="text-[10px] font-mono font-bold text-white/80 tracking-widest uppercase flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Weather & Atmosphere
            </h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] font-mono font-bold mb-1 uppercase">
                  <span className="text-white/50">Rain Intensity</span>
                  <span className="text-blue-300">{Math.round((environment.rainIntensity || 0) * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={environment.rainIntensity || 0}
                  onChange={(e) => onUpdateEnvironment({ rainIntensity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono font-bold mb-1 uppercase">
                  <span className="text-white/50">Visibility</span>
                  <span className="text-white">{Math.round((environment.visibility || 0) * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={environment.visibility || 0}
                  onChange={(e) => onUpdateEnvironment({ visibility: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono font-bold mb-1 uppercase">
                  <span className="text-white/50 flex items-center gap-1"><Thermometer className="w-3 h-3 text-rose-400" /> Temperature</span>
                  <span className="text-rose-400">{environment.temperature}°C</span>
                </div>
                <input 
                  type="range" min="-15" max="45" step="1" value={environment.temperature}
                  onChange={(e) => onUpdateEnvironment({ temperature: parseInt(e.target.value) })}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-400" 
                />
              </div>
            </div>
          </div>

          {/* Environmental Insight Banner */}
          <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.06] space-y-1">
            <h4 className="text-[9px] font-mono font-bold text-white/50 tracking-widest uppercase flex items-center gap-1.5">
              <Info className="w-3 h-3 text-cyan-400" /> Atmosphere Impact
            </h4>
            <p className="text-[11px] text-white/70 leading-relaxed font-sans">
              {currentInsight ? currentInsight.explanation.what : "Dynamic wind introduces drag and drift; temperature shifts change air density affecting motor thrust efficiency."}
            </p>
          </div>
        </div>

        {/* Reset Environment Button */}
        <button 
          onClick={onResetEnvironment} 
          className="w-full shrink-0 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white hover:text-black border border-white/20 text-xs font-mono font-bold text-white shadow-xs uppercase tracking-widest transition-all cursor-pointer mt-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Atmosphere</span>
        </button>

      </div>
    </>
  );
}

