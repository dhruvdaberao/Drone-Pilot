"use client";

import React, { useState, useEffect, useRef } from "react";
import { TelemetryState } from "@/lib/simulation/types";
import { CheckCircle2, ChevronDown, ChevronUp, Sparkles, X, Award, Navigation, Wind } from "lucide-react";

interface TutorialOverlayProps {
  telemetry: TelemetryState;
  onDismiss: () => void;
}

interface CoachStep {
  id: string;
  stepNum: number;
  title: string;
  badge: string;
  instruction: string;
  keys: string[];
  successMessage: string;
}

const COACH_STEPS: CoachStep[] = [
  {
    id: "takeoff",
    stepNum: 1,
    title: "ENGINE IGNITION & LIFTOFF",
    badge: "TAKEOFF",
    instruction: "Hold SPACE (or tap CLIMB) to spin up the 4 brushless motors and ascend to 4 meters altitude.",
    keys: ["SPACE", "CLIMB"],
    successMessage: "LIFT OFF CONFIRMED! (+4.0m)",
  },
  {
    id: "hover",
    stepNum: 2,
    title: "GPS POSITION & ALTITUDE HOLD",
    badge: "HOVER LOCK",
    instruction: "Release all controls! The flight controller automatically compensates for wind and locks your coordinates in 3D space.",
    keys: ["HANDS OFF STICKS"],
    successMessage: "GPS POSITION LOCKED WITH ZERO DRIFT!",
  },
  {
    id: "forward",
    stepNum: 3,
    title: "FORWARD TRANSLATION & CRUISE",
    badge: "PITCH FORWARD",
    instruction: "Press W (or push the Flight Pad forward) to tilt into forward flight and cruise across the island terrain.",
    keys: ["W"],
    successMessage: "FORWARD VELOCITY ACHIEVED!",
  },
  {
    id: "bank_turn",
    stepNum: 4,
    title: "COORDINATED BANKING & YAW",
    badge: "TURNING DRILLS",
    instruction: "Use A / D to bank roll into turns, and Q / E to rotate your camera heading 360° toward the mountain ridges.",
    keys: ["A", "D", "Q", "E"],
    successMessage: "TURNING MANEUVER MASTERED!",
  },
  {
    id: "high_speed",
    stepNum: 5,
    title: "HIGH-SPEED SPORT CRUISE",
    badge: "SPORT SPEED",
    instruction: "Full throttle forward! Push past 40 km/h and slalom between the tall Whispering Pines trees without colliding.",
    keys: ["W + SPACE"],
    successMessage: "SPORT CRUISE REACHED (45+ KM/H)!",
  },
  {
    id: "tactical_recon",
    stepNum: 6,
    title: "AVIONICS & TACTICAL RECON",
    badge: "RECON MAP",
    instruction: "Press M to open the full Tactical Island Map, or tap C to switch into FPV Cockpit Nose View.",
    keys: ["M", "C"],
    successMessage: "TACTICAL AVIONICS VERIFIED!",
  },
  {
    id: "landing",
    stepNum: 7,
    title: "PRECISION HELIPAD TOUCHDOWN",
    badge: "TOUCHDOWN",
    instruction: "Navigate back over any helipad and tap L (Auto-Land) or hold SHIFT to gently touch down on the tarmac.",
    keys: ["L", "SHIFT"],
    successMessage: "TOUCHDOWN CONFIRMED! SAFE LANDING!",
  },
];

export function TutorialOverlay({ telemetry, onDismiss }: TutorialOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isStepSuccess, setIsStepSuccess] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasStartedHoverTimer, setHasStartedHoverTimer] = useState(false);

  const initialYawRef = useRef<number | null>(null);
  const hoverStartTimeRef = useRef<number | null>(null);

  const step = COACH_STEPS[currentStepIndex];

  // Initialize initial yaw for turn detection
  useEffect(() => {
    if (initialYawRef.current === null && telemetry.rotation) {
      initialYawRef.current = telemetry.rotation.yaw;
    }
  }, [telemetry.rotation]);

  // Handle auto-advancement with fading success cues
  const advanceStep = (stepIdx: number) => {
    setIsStepSuccess(true);
    const timer = setTimeout(() => {
      setIsStepSuccess(false);
      if (stepIdx + 1 < COACH_STEPS.length) {
        setCurrentStepIndex(stepIdx + 1);
      } else {
        setIsCompleted(true);
      }
    }, 2200);
    return () => clearTimeout(timer);
  };

  // Step trigger conditions
  useEffect(() => {
    if (isStepSuccess || isCompleted) return;

    // STEP 1: Takeoff to > 3.2m
    if (currentStepIndex === 0) {
      if (telemetry.altitude > 2.8) {
        advanceStep(0);
      }
    }

    // STEP 2: Hover hold for 2.5 seconds
    else if (currentStepIndex === 1) {
      const isStill = Math.abs(telemetry.verticalSpeed) < 0.25 && telemetry.groundSpeed < 1.2;
      if (isStill && telemetry.altitude > 2.0) {
        if (!hoverStartTimeRef.current) {
          hoverStartTimeRef.current = Date.now();
        } else if (Date.now() - hoverStartTimeRef.current >= 2400) {
          advanceStep(1);
        }
      } else {
        hoverStartTimeRef.current = null;
      }
    }

    // STEP 3: Forward Translation
    else if (currentStepIndex === 2) {
      if (telemetry.groundSpeed >= 3.2 || telemetry.distanceFromHome >= 16) {
        advanceStep(2);
      }
    }

    // STEP 4: Banking / Yaw rotation
    else if (currentStepIndex === 3) {
      const curYaw = telemetry.rotation.yaw;
      const initialYaw = initialYawRef.current ?? 0;
      const yawDelta = Math.abs(curYaw - initialYaw);
      const isBanking = Math.abs(telemetry.rotation.roll) > 0.12;

      if (yawDelta > 0.4 || isBanking) {
        advanceStep(3);
      }
    }

    // STEP 5: High speed sport cruise (> 10 m/s = 36 km/h)
    else if (currentStepIndex === 4) {
      if (telemetry.groundSpeed >= 9.5) {
        advanceStep(4);
      }
    }

    // STEP 6: Recon Map or Distance
    else if (currentStepIndex === 5) {
      if (telemetry.distanceFromHome > 45) {
        advanceStep(5);
      }
    }

    // STEP 7: Landing
    else if (currentStepIndex === 6) {
      if (telemetry.flightMode === "LANDED" || (telemetry.altitude < 0.4 && telemetry.groundSpeed < 0.4)) {
        advanceStep(6);
      }
    }
  }, [telemetry, currentStepIndex, isStepSuccess, isCompleted]);

  // Graduation Wings Banner
  if (isCompleted) {
    return (
      <div className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 font-mono select-none pointer-events-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-black/95 text-white border-2 border-[#FF5500] rounded-2xl shadow-[0_12px_40px_rgba(255,85,0,0.35)] p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 pointer-events-none" />
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 text-neutral-400 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="w-12 h-12 rounded-full bg-[#FF5500]/20 border border-[#FF5500] flex items-center justify-center mx-auto mb-2 text-[#FF5500]">
            <Award className="h-6 w-6" />
          </div>

          <div className="text-[10px] font-bold text-[#FF5500] tracking-widest uppercase">
            FLIGHT ACADEMY CERTIFIED
          </div>
          <h3 className="font-heading text-base font-black uppercase text-white mt-0.5">
            PILOT WINGS EARNED
          </h3>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            All 7 flight maneuvers passed. You are cleared for unrestricted solo flight across the entire island.
          </p>

          <button
            onClick={onDismiss}
            className="mt-3 px-5 py-1.5 rounded-xl bg-[#FF5500] text-black font-extrabold text-xs tracking-wider uppercase hover:bg-orange-400 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Continue Free Flight
          </button>
        </div>
      </div>
    );
  }

  // Minimized floating pill
  if (isMinimized) {
    return (
      <div className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 font-mono select-none pointer-events-auto animate-in fade-in duration-200">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border-2 border-black shadow-xl text-xs font-bold text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#FF5500] animate-spin" />
          <span>FLIGHT COACH: STEP {step.stepNum}/7</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </div>
    );
  }

  // Active step coach card
  return (
    <div className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 font-mono select-none pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="bg-white border-2 border-black rounded-2xl shadow-2xl p-3.5 sm:p-4 relative transition-all">
        {/* Step Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5500] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF5500]" />
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold text-neutral-900 tracking-wider">
              FLIGHT COACH • STEP {step.stepNum} OF 7
            </span>
            <span className="text-[9px] font-bold bg-orange-100 text-[#FF5500] px-1.5 py-0.5 rounded border border-orange-300">
              {step.badge}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-neutral-400 hover:text-neutral-800 p-1 rounded transition-colors cursor-pointer"
              title="Minimize coach"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDismiss}
              className="text-neutral-400 hover:text-neutral-800 p-1 rounded transition-colors cursor-pointer"
              title="Dismiss flight coach"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Step Body */}
        {isStepSuccess ? (
          <div className="py-2.5 flex items-center gap-3 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 animate-bounce" />
            <div>
              <div className="text-xs font-black text-emerald-600 tracking-wide">
                STEP COMPLETED!
              </div>
              <div className="text-[11px] font-bold text-neutral-800 mt-0.5">
                {step.successMessage}
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <h4 className="font-heading text-xs font-black text-neutral-950 uppercase tracking-wide">
              {step.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-neutral-700 leading-relaxed mt-1">
              {step.instruction}
            </p>

            {/* Key Action Callouts */}
            <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                  ACTION:
                </span>
                {step.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 rounded bg-black text-[#FF5500] font-mono text-[10px] font-extrabold border border-neutral-800 shadow-xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>

              {/* Progress Dots */}
              <div className="flex items-center gap-1 shrink-0">
                {COACH_STEPS.map((s, idx) => (
                  <div
                    key={s.id}
                    className={"h-1.5 rounded-full transition-all " + (
                      idx === currentStepIndex
                        ? "w-4 bg-[#FF5500]"
                        : idx < currentStepIndex
                        ? "w-2 bg-emerald-500"
                        : "w-1.5 bg-neutral-200"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

