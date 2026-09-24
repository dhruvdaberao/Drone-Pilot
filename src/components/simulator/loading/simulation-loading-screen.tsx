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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090a] font-mono select-none">
      <div className="w-full max-w-md p-8 bg-[#0c0d0e] border border-white/10 rounded-2xl shadow-2xl space-y-6 text-center">
        <div className="flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-[#FF5500]/5 border border-[#FF5500]/20 flex items-center justify-center text-[#FF5500]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>

        <div>
          <h2 className="font-sans text-xl font-black text-white uppercase tracking-widest">
            DRONE PILOT SIMULATOR
          </h2>
          <p className="text-[10px] text-[#FF5500] font-bold tracking-[0.2em] mt-2 uppercase">Aeronautical Environment Initialization</p>
        </div>

        <div className="space-y-3 text-left bg-black/50 p-5 rounded-xl border border-white/5">
          {PHASES.map((phase, idx) => {
            const isDone = idx < currentPhase;
            const isCurrent = idx === currentPhase;
            return (
              <div
                key={idx}
                className={"flex items-center gap-3 text-[10px] md:text-[11px] font-bold tracking-wider uppercase " + (
                  isDone
                    ? "text-emerald-500"
                    : isCurrent
                    ? "text-white"
                    : "text-neutral-700"
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ml-1.5 ${isCurrent ? "bg-[#FF5500]" : "bg-neutral-800"}`} />
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
