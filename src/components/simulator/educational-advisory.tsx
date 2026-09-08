"use client";

import React, { useEffect, useState } from "react";
import { EducationalEvent, TelemetryState } from "@/lib/simulation/types";
import { Info, AlertTriangle, CheckCircle2, X } from "lucide-react";

interface EducationalAdvisoryProps {
  telemetry: TelemetryState;
}

export function EducationalAdvisory({ telemetry }: EducationalAdvisoryProps) {
  const [currentEvent, setCurrentEvent] = useState<EducationalEvent | null>({
    id: "init",
    title: "FLIGHT SYSTEMS ARMED",
    message: "Standing by on helipad. Press SPACE to ascend or use WASD to fly.",
    severity: "info",
    timestamp: Date.now(),
  });

  const [hasTakenOff, setHasTakenOff] = useState(false);
  const [reachedAltitude, setReachedAltitude] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!hasTakenOff && telemetry.altitude > 1.2) {
      setHasTakenOff(true);
      setDismissed(false);
      setCurrentEvent({
        id: "takeoff",
        title: "AIRBORNE • HOVER ACTIVE",
        message: "Lift-off confirmed. Hover assist maintaining altitude equilibrium.",
        severity: "success",
        timestamp: Date.now(),
      });
    }

    if (hasTakenOff && !reachedAltitude && telemetry.altitude > 10.0) {
      setReachedAltitude(true);
      setDismissed(false);
      setCurrentEvent({
        id: "altitude_10m",
        title: "10m AIRSPACE REACHED",
        message: "Open training arena. Try forward pitch (W) or banking turns (A/D).",
        severity: "info",
        timestamp: Date.now(),
      });
    }
  }, [telemetry.altitude, hasTakenOff, reachedAltitude]);

  if (!currentEvent || dismissed) return null;

  return (
    <div className="absolute top-28 sm:top-32 right-3 sm:right-5 z-20 pointer-events-auto max-w-[280px] sm:max-w-xs animate-in fade-in slide-in-from-top-2 duration-300 font-mono">
      {/* Translucent frosted container */}
      <div className="p-3 rounded-xl bg-white/80 backdrop-blur-md border-2 border-black shadow-lg flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2">
          {currentEvent.severity === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : currentEvent.severity === "warning" ? (
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 text-[#FF5500] shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <h4 className="font-heading text-xs font-bold text-neutral-950 uppercase tracking-wide">
              {currentEvent.title}
            </h4>
            <p className="text-[10px] sm:text-[11px] text-neutral-700 leading-snug">
              {currentEvent.message}
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-neutral-500 hover:text-neutral-900 p-0.5 rounded transition-colors shrink-0"
          title="Dismiss advisory"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}