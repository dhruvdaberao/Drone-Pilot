"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Check } from "lucide-react";

interface SimulationLoadingScreenProps {
  onReady: () => void;
}

const PHASES = [
  "INITIALIZING THREE.JS WEBGL CONTEXT",
  "GENERATING 2000m x 1800m TERRAIN HEIGHTFIELD",
  "LOADING PROCEDURAL WATER & OCEAN WAVES",
  "SPAWNING REGIONAL BIOMES & RUNWAY ASSETS",
  "CALIBRATING 6-DoF FLIGHT CONTROLLER & IMU",
  "ACQUIRING RTK GNSS SATELLITE LOCK",
  "READY FOR TAKEOFF",
];

export function SimulationLoadingScreen({ onReady }: SimulationLoadingScreenProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhase((prev) => {
        if (prev >= PHASES.length - 1) {
          clearInterval(timer);
          setTimeout(() => onReadyRef.current(), 250);
          return prev;
        }
        return prev + 1;
      });
    }, 140);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF7F2] font-mono select-none">
      <div className="w-full max-w-md p-6 bg-white border-2 border-black rounded-3xl shadow-2xl space-y-4 text-center">
        <div className="flex items-center justify-center">
          <div className="h-14 w-14 rounded-2xl bg-orange-100 border-2 border-[#FF5500] flex items-center justify-center text-[#FF5500]">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg font-black text-neutral-950 uppercase tracking-wide">
            DRONE PILOT SIMULATOR
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">Aeronautical Environment Initialization</p>
        </div>

        <div className="space-y-1.5 text-left bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
          {PHASES.map((phase, idx) => {
            const isDone = idx < currentPhase;
            const isCurrent = idx === currentPhase;
            return (
              <div
                key={idx}
                className={"flex items-center gap-2 text-[11px] " + (
                  isDone
                    ? "text-emerald-700 font-semibold"
                    : isCurrent
                    ? "text-[#FF5500] font-bold animate-pulse"
                    : "text-neutral-400"
                )}
              >
                {isDone ? (
                  <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 shrink-0 ml-0.5" />
                )}
                <span className="truncate">{phase}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
