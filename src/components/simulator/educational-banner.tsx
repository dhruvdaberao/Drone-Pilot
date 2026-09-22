"use client";

import React, { useState } from "react";
import { EducationalEvent } from "@/lib/simulation/types";
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen,
  ArrowRight,
} from "lucide-react";

interface EducationalBannerProps {
  currentEvent: EducationalEvent | null;
  history: EducationalEvent[];
  onDismiss: () => void;
  onClearHistory: () => void;
}

export function EducationalBanner({
  currentEvent,
  history,
  onDismiss,
  onClearHistory,
}: EducationalBannerProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  if (!currentEvent && !isHistoryOpen) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-cyan-400 shrink-0" />;
    }
  };

  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case "error":
        return "border-rose-500/80 bg-rose-950/90 text-rose-100";
      case "warning":
        return "border-amber-500/80 bg-amber-950/90 text-amber-100";
      case "success":
        return "border-emerald-500/80 bg-emerald-950/90 text-emerald-100";
      case "info":
      default:
        return "border-cyan-500/80 bg-neutral-950/90 text-neutral-100";
    }
  };

  return (
    <>
      {/* Top Banner for Active Event */}
      {currentEvent && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-2xl font-mono text-xs select-none animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${getSeverityBorder(
              currentEvent.severity
            )}`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                {getSeverityIcon(currentEvent.severity)}
                <span className="font-bold tracking-wider uppercase text-[11px]">
                  {currentEvent.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen((prev) => !prev)}
                  className="px-2 py-0.5 rounded text-[10px] bg-white/10 hover:bg-white/20 text-white font-bold tracking-wider flex items-center gap-1 transition-colors"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>LOG ({history.length})</span>
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Educational Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] leading-relaxed">
              <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                <div className="text-[9px] uppercase tracking-wider font-bold text-white/50 mb-0.5">
                  WHAT HAPPENED
                </div>
                <div>{currentEvent.whatHappened}</div>
              </div>

              <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                <div className="text-[9px] uppercase tracking-wider font-bold text-white/50 mb-0.5">
                  WHY IT OCCURRED
                </div>
                <div>{currentEvent.whyItHappened}</div>
              </div>

              <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                <div className="text-[9px] uppercase tracking-wider font-bold text-amber-400 mb-0.5">
                  PHYSICAL CONSEQUENCE
                </div>
                <div>{currentEvent.whatEffectItCaused}</div>
              </div>

              <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-400 mb-0.5">
                  RECOMMENDED PILOT ACTION
                </div>
                <div>{currentEvent.recommendedAction}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Drawer Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-mono text-xs select-none">
          <div className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-neutral-950 text-white border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/60">
              <div className="flex items-center gap-2 text-cyan-400">
                <BookOpen className="h-4 w-4" />
                <span className="font-bold tracking-wider text-xs uppercase">
                  AERONAUTICAL CAUSE & EFFECT LOG
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-400 hover:text-white"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  No simulation events recorded yet. Induce a motor fault, increase wind, or deploy heavy payload to inspect cause & effect.
                </div>
              ) : (
                history.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(ev.severity)}
                        <span className="font-bold text-white text-[11px]">{ev.title}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-neutral-300">
                      <div>
                        <span className="font-bold text-neutral-400">WHAT: </span>
                        {ev.whatHappened}
                      </div>
                      <div>
                        <span className="font-bold text-neutral-400">WHY: </span>
                        {ev.whyItHappened}
                      </div>
                      <div>
                        <span className="font-bold text-amber-400">EFFECT: </span>
                        {ev.whatEffectItCaused}
                      </div>
                      <div>
                        <span className="font-bold text-emerald-400">ACTION: </span>
                        {ev.recommendedAction}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
