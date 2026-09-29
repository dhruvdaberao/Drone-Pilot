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
            <p className="text-xs text-white/60 tracking-widest uppercase">{motorCount} MOTORS • {drone.platformCategory}</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 bg-white/10 rounded-full hover:bg-white/20"><Settings2 className="w-5 h-5 text-white" /></button>
        </div>

        {/* Location Selector */}
          <div className="bg-black/30 p-3 rounded-2xl shrink-0">
            <h3 className="text-[10px] font-bold text-white/60 tracking-widest uppercase mb-2">Location / Region</h3>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none"
              onChange={handleLocationChange}
              defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("region") || "training" : "training"}
            >
              <option value="training">Training Center</option>
              <option value="city">Urban City</option>
              <option value="mountain">Mountain Range</option>
              <option value="forest">Forest Valley</option>
              <option value="river">River & Lake</option>
              <option value="coast">Coastal Area</option>
              <option value="industrial">Industrial Harbor</option>
            </select>
          </div>

          {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          
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
                      <span className="text-[#38bdf8]">{environment.windDirection}°</span>
                    </div>
                    <input type="range" min="0" max="359" step="5" value={environment.windDirection}
                      onChange={(e) => onUpdateEnvironment({ windDirection: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#38bdf8]" />
                  </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                        <span className="text-white/60">Turbulence</span>
                        <span className="text-[#38bdf8]">{Math.round((environment.turbulence || 0) * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05" value={environment.turbulence || 0}
                        onChange={(e) => onUpdateEnvironment({ turbulence: parseFloat(e.target.value) })}
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
                      <span className={environment.temperature > 30 ? "text-rose-400" : "text-emerald-400"}>{environment.temperature.toFixed(0)}°C</span>
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






