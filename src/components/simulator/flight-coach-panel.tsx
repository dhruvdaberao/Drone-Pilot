"use client";

import React, { useEffect, useState } from "react";
import { FlightCoachInsight } from "@/lib/simulation/flight-coach-types";
import { AlertCircle, Info, ShieldAlert, Zap, CheckCircle2 } from "lucide-react";

interface FlightCoachPanelProps {
  insight: FlightCoachInsight | null;
  history?: FlightCoachInsight[];
  onDismiss: () => void;
  onClearHistory?: () => void;
}

export function FlightCoachPanel({ insight, onDismiss }: FlightCoachPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (insight) {
      setVisible(true);
      // Stays visible until user explicitly clicks the "OK" button
    } else {
      setVisible(false);
    }
  }, [insight?.id]);

  if (!insight) return null;

  const handleAcknowledge = () => {
    setVisible(false);
    setTimeout(onDismiss, 300); // Wait for transition fade out
  };

  const getSeverityStyle = () => {
    switch (insight.severity) {
      case "CRITICAL":
        return {
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
          border: "border-rose-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(244,63,94,0.2)]",
          badge: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
        };
      case "ATTENTION":
        return {
          icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
          border: "border-amber-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.2)]",
          badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        };
      case "OBSERVATION":
        return {
          icon: <Zap className="w-5 h-5 text-emerald-400" />,
          border: "border-emerald-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(16,185,129,0.2)]",
          badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-sky-400" />,
          border: "border-sky-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(56,189,248,0.2)]",
          badge: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
        };
    }
  };

  const style = getSeverityStyle();

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 transition-all duration-300 ease-out pointer-events-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div
        className={`pointer-events-auto bg-gradient-to-b from-[#0e1424]/98 via-[#090d18]/98 to-[#05070e]/98 backdrop-blur-2xl border ${style.border} rounded-2xl p-4 shadow-2xl flex flex-col gap-3 font-sans select-none`}
      >
        {/* Header & Icon */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 shrink-0">
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-mono font-black text-white tracking-wider uppercase truncate">
                {insight.title}
              </h3>
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${style.badge}`}>
                {insight.severity}
              </span>
            </div>
          </div>
        </div>

        {/* Explanation Message Body */}
        <div className="bg-[#04060c]/80 rounded-xl p-3 border border-white/5">
          <p className="text-xs sm:text-sm text-slate-200 font-mono leading-relaxed">
            {insight.explanation.what} {insight.explanation.why}
          </p>
        </div>

        {/* Action Callout + Explicit OK Button */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 text-[#FF5500] min-w-0">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 truncate">
              Action: {insight.explanation.learn}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAcknowledge}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-[#FF5500] to-amber-500 hover:from-[#ff6a1a] hover:to-amber-400 text-black font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(255,85,0,0.4)] hover:shadow-[0_0_24px_rgba(255,85,0,0.6)] cursor-pointer active:scale-95 transition-all shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>OK</span>
          </button>
        </div>
      </div>
    </div>
  );
}
