"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Zap, RotateCcw, BarChart3, ShieldAlert } from "lucide-react";
import { CrashState } from "@/lib/simulation/types";

interface CrashReviveOverlayProps {
  crashState: CrashState | null;
  onReviveHere: () => void;
  onResetToBase: () => void;
  onOpenAnalysis: () => void;
}

export const CrashReviveOverlay: React.FC<CrashReviveOverlayProps> = ({
  crashState,
  onReviveHere,
  onResetToBase,
  onOpenAnalysis,
}) => {
  if (!crashState || !crashState.isCrashed) return null;

  // Keyboard shortcut: Press 'R' or 'Space' to revive immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyR" || e.code === "Space") {
        e.preventDefault();
        onReviveHere();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onReviveHere]);

  const primaryCause = crashState.primaryCause || "You have crashed into an obstacle!";
  const speedKmh = crashState.impactSpeedKmh || 0;

  return (
    <div className="fixed top-4 inset-x-0 z-40 flex justify-center pointer-events-none px-3 select-none">
      {/* Sleek, compact, minimal white card */}
      <div className="relative pointer-events-auto max-w-sm w-full bg-white/98 border border-neutral-200/90 rounded-2xl p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.15)] backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
        {/* Header Row */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-150">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-rose-50 text-rose-600 animate-pulse border border-rose-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-neutral-900 tracking-wide font-mono uppercase">
                Crash Detected
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-mono font-bold border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>{speedKmh} km/h</span>
          </div>
        </div>

        {/* Message */}
        <div className="py-2">
          <p className="text-xs font-medium text-neutral-700 leading-snug line-clamp-2">
            {primaryCause}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5 pt-1">
          {/* PRIMARY: Revive Drone Right Here */}
          <button
            onClick={onReviveHere}
            className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="Revive drone immediately at this location (Space / R)"
          >
            <Zap className="w-3.5 h-3.5 fill-[#FF5500] text-[#FF5500]" />
            <span>REVIVE DRONE HERE</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-white/20 text-neutral-200 rounded ml-1">
              [Space / R]
            </span>
          </button>

          {/* SECONDARY ROW */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onResetToBase}
              className="py-1.5 px-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <RotateCcw className="w-3 h-3 text-neutral-500" />
              <span>Reset at Base</span>
            </button>

            <button
              onClick={onOpenAnalysis}
              className="py-1.5 px-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <BarChart3 className="w-3 h-3 text-[#FF5500]" />
              <span>Analysis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
