"use client";

import React, { useState } from "react";
import { TelemetryState, EnvironmentState } from "@/lib/simulation/types";
import { DroneModel } from "@/types/drone";
import { Battery, ShieldAlert, Wind, CloudSun, Map as MapIcon, Settings2, Plane, Thermometer, Droplets, RotateCcw, Info, CloudRain, AlertTriangle, Activity, Eye } from "lucide-react";
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
            <p className="text-xs text-white/60 tracking-widest uppercase">{motorCount} MOTORS • {drone.platformCategory}</p>
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

              {/* SVG Diagram — colors driven by live motor outputs */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-48 h-48 mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                    <rect x="40" y="35" width="20" height="30" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                    <circle cx="50" cy="50" r="4" fill="#FF5500" className="animate-pulse" />
                    {Array.from({ length: motorCount }).map((_, i) => {
                      const angle = (i * (360 / motorCount) + (motorCount === 4 ? 45 : 0)) * (Math.PI / 180);
                      const x = 50 + Math.cos(angle) * 35;
                      const y = 50 + Math.sin(angle) * 35;
                      const output = (telemetry.motorOutputs && telemetry.motorOutputs[i] !== undefined)
                        ? telemetry.motorOutputs[i]
                        : 0;
                      const color = output > 0.6 ? '#10b981' : output > 0.25 ? '#f59e0b' : '#ef4444';
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

              {/* Motor Cards */}
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: motorCount }).map((_, i) => {
                  const liveOutput = (telemetry.motorOutputs && telemetry.motorOutputs[i] !== undefined)
                    ? telemetry.motorOutputs[i]
                    : 0;
                  const outputPct = Math.round(liveOutput * 100);
                  const outputColorClass = liveOutput > 0.6 ? 'text-emerald-400' : liveOutput > 0.25 ? 'text-amber-400' : 'text-rose-400';
                  const barColorClass = liveOutput > 0.6 ? 'bg-emerald-400' : liveOutput > 0.25 ? 'bg-amber-400' : 'bg-rose-500';
                  return (
                    <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      {/* M label + live output % */}
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-white/80 uppercase">M{i + 1}</span>
                        <span className={outputColorClass}>{outputPct}%</span>
                      </div>
                      {/* Live output progress bar (read-only) */}
                      <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full rounded-full transition-all duration-100 ${barColorClass}`}
                          style={{ width: `${outputPct}%` }}
                        />
                      </div>
                      {/* HEALTH setter slider */}
                      <div className="border-t border-white/10 pt-2">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">
                          Health {Math.round(motorHealths[i] * 100)}%
                        </span>
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
                    </div>
                  );
                })}
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
  payloadMassKg: number;
  onUpdatePayload: (mass: number) => void;
}

export function RightGlassPanel({
  environment,
  onUpdateEnvironment,
  telemetry,
  activeWaypoint,
  onToggleMap,
  onResetEnvironment,
  currentInsight, payloadMassKg, onUpdatePayload }: RightGlassPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

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
      <div className={`fixed top-20 bottom-4 right-4 md:w-[380px] w-[calc(100vw-32px)] rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/5 p-6 flex flex-col gap-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-40 text-white font-sans pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${isOpen ? "translate-x-0" : "translate-x-[120%] md:translate-x-0"}`}>
        
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

        {/* Location Selector */}
        <div className="bg-black/30 p-3 rounded-2xl shrink-0">
          <h3 className="text-[10px] font-bold text-white/60 tracking-widest uppercase mb-2">Location / Region</h3>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none uppercase tracking-widest"
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
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
            
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
                  onChange={(e) => {
                  const speed = parseFloat(e.target.value);
                  const autoTurbulence = Math.min(1.0, speed * 0.04);
                  onUpdateEnvironment({ windSpeed: speed, turbulence: autoTurbulence });
                }}
                  className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#38bdf8]" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                  <span className="text-white/60">Direction</span>
                  <span className="text-[#38bdf8]">{environment.windDirection}</span>
                </div>
                <input type="range" min="0" max="359" step="5" value={environment.windDirection}
                  onChange={(e) => onUpdateEnvironment({ windDirection: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#38bdf8]" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase mt-4">
                  <span className="text-white/60">Turbulence Intensity</span>
                  <span className="text-[#38bdf8]">{(environment.turbulence || 0).toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={environment.turbulence || 0}
                  onChange={(e) => onUpdateEnvironment({ turbulence: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#38bdf8] [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>
          </div>

          {/* PRECIPITATION & VISIBILITY */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-5">
            <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-400" /> Precipitation &amp; Visibility
            </h3>
            <div className="space-y-4">
              {/* Rain intensity */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                  <span className="text-white/60">Rain Intensity</span>
                  <span className="text-blue-400 capitalize">{environment.rainIntensity}</span>
                </div>
                <select
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none"
                  value={environment.rainIntensity}
                  onChange={(e) => onUpdateEnvironment({ rainIntensity: e.target.value as EnvironmentState["rainIntensity"] })}
                >
                  <option className="bg-neutral-900" value="off">Off</option>
                  <option className="bg-neutral-900" value="light">Light</option>
                  <option className="bg-neutral-900" value="moderate">Moderate</option>
                  <option className="bg-neutral-900" value="heavy">Heavy</option>
                </select>
              </div>
              {/* Fog / visibility */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                  <span className="text-white/60 flex items-center gap-1"><Eye className="w-3 h-3" /> Visibility</span>
                  <span className="text-blue-400 capitalize">{environment.visibility}</span>
                </div>
                <select
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none"
                  value={environment.visibility}
                  onChange={(e) => onUpdateEnvironment({ visibility: e.target.value as EnvironmentState["visibility"] })}
                >
                  <option className="bg-neutral-900" value="clear">Clear</option>
                  <option className="bg-neutral-900" value="hazy">Hazy</option>
                  <option className="bg-neutral-900" value="foggy">Foggy</option>
                </select>
              </div>
            </div>
          </div>

          {/* PAYLOAD CONFIG */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-5">
            <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#facc15]" /> Payload Mass
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                  <span className="text-white/60">Additional Weight</span>
                  <span className="text-[#facc15]">{payloadMassKg.toFixed(1)} kg</span>
                </div>
                <input type="range" min="0" max="25" step="0.5" value={payloadMassKg}
                  onChange={(e) => onUpdatePayload(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#facc15]" />
              </div>
            </div>
          </div>

          {/* ATMOSPHERE */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-5">
            <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-rose-400" /> Atmosphere
            </h3>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                  <span className="text-white/60">Temperature</span>
                  <span className="text-rose-400">{environment.temperature}</span>
                </div>
                <input type="range" min="-15" max="45" step="1" value={environment.temperature}
                  onChange={(e) => onUpdateEnvironment({ temperature: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-rose-400" />
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
