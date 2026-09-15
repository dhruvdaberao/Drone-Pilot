"use client";

import React, { useState, useEffect } from "react";
import { TutorialStep, TelemetryState } from "@/lib/simulation/types";
import { X, Play } from "lucide-react";

interface TutorialOverlayProps {
  telemetry: TelemetryState;
  onDismiss: () => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    index: 0,
    id: "step_inspect",
    title: "1. PRE-FLIGHT VERIFICATION",
    instruction: "Inspect your aircraft resting on the helipad. Verify battery at 100% and compass heading.",
    actionCallout: "DRONE READY ON HELIPAD",
    completed: false,
  },
  {
    index: 1,
    id: "step_takeoff",
    title: "2. TAKEOFF & LIFT-OFF",
    instruction: "Press SPACE (or tap Climb) to spool up rotors and climb above 2 meters.",
    actionCallout: "HOLD [SPACE] TO ASCEND",
    completed: false,
  },
  {
    index: 2,
    id: "step_hover",
    title: "3. STABILIZE HOVER",
    instruction: "Release controls. The Flight Controller will maintain altitude hold automatically.",
    actionCallout: "RELEASE CONTROLS TO HOVER",
    completed: false,
  },
  {
    index: 3,
    id: "step_forward",
    title: "4. PITCH FORWARD",
    instruction: "Press [W] to tilt forward and fly ahead across the training arena.",
    actionCallout: "PRESS [W] FORWARD",
    completed: false,
  },
  {
    index: 4,
    id: "step_yaw",
    title: "5. ROTATE YAW",
    instruction: "Press [A] or [D] (or Q/E) to rotate your heading 90 degrees.",
    actionCallout: "PRESS [A] OR [D] TO ROTATE",
    completed: false,
  },
  {
    index: 5,
    id: "step_return",
    title: "6. NAVIGATE TO HELIPAD",
    instruction: "Use the tactical radar at bottom-right to guide your aircraft back toward the launch pad.",
    actionCallout: "FLY BACK TO HELIPAD",
    completed: false,
  },
  {
    index: 6,
    id: "step_land",
    title: "7. TOUCHDOWN & LAND",
    instruction: "Press [L] for Auto-Land or hold [SHIFT] to gently descend onto the helipad.",
    actionCallout: "PRESS [L] OR [SHIFT] TO LAND",
    completed: false,
  },
];

export function TutorialOverlay({ telemetry, onDismiss }: TutorialOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (currentStepIndex === 0 && telemetry.altitude > 0.1) {
      setCurrentStepIndex(1);
    } else if (currentStepIndex === 1 && telemetry.altitude > 2.0) {
      setCurrentStepIndex(2);
    } else if (currentStepIndex === 2 && telemetry.groundSpeed > 2.0) {
      setCurrentStepIndex(3);
    } else if (currentStepIndex === 3 && Math.abs(telemetry.rotation.yaw) > 0.4) {
      setCurrentStepIndex(4);
    } else if (currentStepIndex === 4 && telemetry.distanceFromHome > 15) {
      setCurrentStepIndex(5);
    } else if (currentStepIndex === 5 && telemetry.distanceFromHome < 8 && telemetry.altitude < 4.0) {
      setCurrentStepIndex(6);
    }
  }, [telemetry, currentStepIndex]);

  const step = TUTORIAL_STEPS[currentStepIndex] || TUTORIAL_STEPS[0];

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 font-mono select-none pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white border-2 border-black rounded-2xl shadow-2xl p-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#FF5500] animate-ping" />
            <span className="text-[11px] font-bold text-neutral-900 tracking-wider">
              PILOT TUTORIAL • STEP {currentStepIndex + 1} OF 7
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="text-neutral-400 hover:text-neutral-900 text-xs flex items-center gap-1 cursor-pointer"
          >
            <span>Skip</span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-2.5">
          <h4 className="font-heading text-xs font-black text-neutral-950 uppercase">
            {step.title}
          </h4>
          <p className="text-[11px] text-neutral-700 leading-snug mt-1">
            {step.instruction}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[#FF5500] text-[10px] font-bold tracking-wider">
            <Play className="h-2.5 w-2.5 fill-current" />
            <span>{step.actionCallout}</span>
          </div>

          <div className="flex items-center gap-1">
            {TUTORIAL_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={"h-1.5 rounded-full transition-all " + (
                  idx === currentStepIndex
                    ? "w-4 bg-[#FF5500]"
                    : idx < currentStepIndex
                    ? "w-1.5 bg-emerald-500"
                    : "w-1.5 bg-neutral-200"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
