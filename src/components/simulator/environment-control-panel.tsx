"use client";

import React from "react";
import { EnvironmentState, WeatherPreset } from "@/lib/simulation/types";
import { Wind, Thermometer, X, Check } from "lucide-react";

interface EnvironmentControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  environment: EnvironmentState;
  onUpdateEnvironment: (updates: Partial<EnvironmentState>) => void;
  onApplyPreset: (preset: WeatherPreset) => void;
}

export function EnvironmentControlPanel({
  isOpen,
  onClose,
  environment,
  onUpdateEnvironment,
  onApplyPreset,
}: EnvironmentControlPanelProps) {
  if (!isOpen) return null;

  const presets: Array<{ id: WeatherPreset; label: string; desc: string }> = [
    { id: "normal", label: "Calm / Standard", desc: "2.0 m/s breeze, 20°C, clear" },
    { id: "windy", label: "High Crosswinds", desc: "9.5 m/s wind with 4.8 m/s gusts" },
    { id: "hot", label: "Extreme Heat", desc: "38°C hot air, lower air density" },
    { id: "rain", label: "Driving Rain", desc: "Overcast with rain, slick ground" },
    { id: "fog", label: "Dense Fog", desc: "Low visibility (< 50m) IFR flight" },
    { id: "storm", label: "Storm Training", desc: "14.5 m/s gale with heavy turbulence" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-lg bg-white border-2 border-black rounded-2xl shadow-2xl p-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-orange-100 border border-[#FF5500] flex items-center justify-center text-[#FF5500]">
              <Wind className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-black text-neutral-900 uppercase tracking-wide">
                ENVIRONMENT & WEATHER SIMULATOR
              </h3>
              <p className="text-[10px] text-neutral-500">Live dynamic meteorological forces</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block mb-2">
            SIMULATION PRESETS
          </span>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => {
              const active = environment.preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onApplyPreset(p.id)}
                  className={"p-2 text-left rounded-xl border text-xs transition-all cursor-pointer " + (
                    active
                      ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                      : "bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100"
                  )}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{p.label}</span>
                    {active && <Check className="h-3 w-3 text-[#FF5500]" />}
                  </div>
                  <div className={"text-[9px] mt-0.5 line-clamp-1 " + (active ? "text-neutral-300" : "text-neutral-500")}>
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-3.5 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
          <div>
            <div className="flex justify-between text-xs font-bold text-neutral-800 mb-1">
              <span className="flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-[#FF5500]" /> Wind Speed
              </span>
              <span className="text-[#FF5500]">{environment.windSpeed.toFixed(1)} m/s ({(environment.windSpeed * 3.6).toFixed(0)} km/h)</span>
            </div>
            <input
              type="range"
              min="0"
              max="22"
              step="0.5"
              value={environment.windSpeed}
              onChange={(e) => onUpdateEnvironment({ windSpeed: parseFloat(e.target.value) })}
              className="w-full accent-[#FF5500] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-neutral-800 mb-1">
              <span className="flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-neutral-600" /> Direction
              </span>
              <span className="text-neutral-800">{environment.windDirection}° Heading</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              step="5"
              value={environment.windDirection}
              onChange={(e) => onUpdateEnvironment({ windDirection: parseInt(e.target.value) })}
              className="w-full accent-neutral-800 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-neutral-800 mb-1">
              <span className="flex items-center gap-1.5">
                <Thermometer className="h-3.5 w-3.5 text-rose-500" /> Temperature
              </span>
              <span className="text-rose-600">{environment.temperature.toFixed(0)}°C</span>
            </div>
            <input
              type="range"
              min="-10"
              max="45"
              step="1"
              value={environment.temperature}
              onChange={(e) => onUpdateEnvironment({ temperature: parseInt(e.target.value) })}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-neutral-800 mb-1">
              <span className="flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-purple-600" /> Atmospheric Turbulence
              </span>
              <span className="text-purple-600">{Math.round((environment.turbulence || 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={environment.turbulence || 0}
              onChange={(e) => onUpdateEnvironment({ turbulence: parseFloat(e.target.value) })}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] font-bold text-neutral-600 block mb-1">RAIN</span>
              <div className="flex gap-1">
                {(["off", "light", "moderate", "heavy"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => onUpdateEnvironment({ rainIntensity: r })}
                    className={"flex-1 py-1 text-[10px] font-bold rounded border uppercase " + (
                      environment.rainIntensity === r
                        ? "bg-[#FF5500] text-white border-[#FF5500]"
                        : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-neutral-600 block mb-1">VISIBILITY FOG</span>
              <div className="flex gap-1">
                {(["clear", "hazy", "foggy"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => onUpdateEnvironment({ visibility: v })}
                    className={"flex-1 py-1 text-[10px] font-bold rounded border uppercase " + (
                      environment.visibility === v
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] text-neutral-500">Real-time aerodynamic solver sync.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-950 text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
