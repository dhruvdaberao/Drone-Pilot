"use client";

import React from "react";
import { FlightAnalysisReport } from "@/lib/simulation/types";
import { Award, AlertTriangle, CheckCircle2, RotateCcw, Home, Play } from "lucide-react";

interface FlightAnalysisModalProps {
  isOpen: boolean;
  report: FlightAnalysisReport;
  onFlyAgain: () => void;
  onOpenReplay: () => void;
  onExitToDashboard: () => void;
}

export function FlightAnalysisModal({
  isOpen,
  report,
  onFlyAgain,
  onOpenReplay,
  onExitToDashboard,
}: FlightAnalysisModalProps) {
  if (!isOpen) return null;

  const isCrash = report.landingQuality === "CRASH";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono select-none overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border-2 border-black rounded-3xl shadow-2xl p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div
              className={"h-12 w-12 rounded-2xl flex items-center justify-center border-2 " + (
                isCrash
                  ? "bg-rose-50 border-rose-600 text-rose-600"
                  : "bg-emerald-50 border-emerald-600 text-emerald-600"
              )}
            >
              {isCrash ? <AlertTriangle className="h-6 w-6" /> : <Award className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={"text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border " + (
                    isCrash
                      ? "bg-rose-100 text-rose-700 border-rose-300"
                      : "bg-emerald-100 text-emerald-700 border-emerald-300"
                  )}
                >
                  {report.landingQuality} TOUCHDOWN
                </span>
                <span className="text-xs text-neutral-400">•</span>
                <span className="text-xs font-bold text-neutral-600">{report.droneName}</span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-neutral-950 uppercase mt-0.5">
                {isCrash ? "FLIGHT INCIDENT DEBRIEF" : "POST-FLIGHT MISSION ANALYSIS"}
              </h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block">DURATION</span>
            <span className="text-base font-black text-neutral-900">
              {Math.floor(report.flightDurationSeconds / 60)}m {report.flightDurationSeconds % 60}s
            </span>
          </div>
          <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block">MAX ALTITUDE</span>
            <span className="text-base font-black text-neutral-900">{report.maxAltitudeMeters.toFixed(1)}m</span>
          </div>
          <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block">TOP SPEED</span>
            <span className="text-base font-black text-neutral-900">{report.maxSpeedKmh.toFixed(1)} km/h</span>
          </div>
          <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block">BATTERY USED</span>
            <span className="text-base font-black text-neutral-900">{report.batteryConsumedPercent}%</span>
          </div>
        </div>

        {report.crashDetails && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 mb-4 space-y-1 text-xs text-rose-900">
            <div className="font-bold flex items-center justify-between">
              <span>IMPACT SPEED: {report.crashDetails.impactSpeedKmh} km/h ({report.crashDetails.impactSpeedMs} m/s)</span>
              <span>KINETIC ENERGY: {report.crashDetails.kineticEnergyJoules} Joules</span>
            </div>
            <p className="text-rose-700 text-[11px] leading-relaxed mt-1">
              Primary Cause: {report.crashDetails.primaryCause}
            </p>
          </div>
        )}

        <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs">
          <div>
            <h4 className="font-heading font-bold text-neutral-900 uppercase text-[11px] text-[#FF5500]">
              1. WHAT HAPPENED?
            </h4>
            <p className="text-neutral-700 leading-relaxed mt-0.5">{report.whatHappened}</p>
          </div>

          <div className="pt-2 border-t border-neutral-200/60">
            <h4 className="font-heading font-bold text-neutral-900 uppercase text-[11px] text-neutral-800">
              2. WHY DID IT HAPPEN?
            </h4>
            <p className="text-neutral-700 leading-relaxed mt-0.5">{report.whyItHappened}</p>
          </div>

          <div className="pt-2 border-t border-neutral-200/60">
            <h4 className="font-heading font-bold text-neutral-900 uppercase text-[11px] text-emerald-700">
              3. HOW TO IMPROVE NEXT FLIGHT:
            </h4>
            <ul className="mt-1 space-y-1">
              {report.howToImprove.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-neutral-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onOpenReplay}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-800 text-xs font-bold hover:bg-neutral-100 hover:border-black transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 text-[#FF5500]" />
            <span>Watch Flight Replay</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onExitToDashboard}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Hangar</span>
            </button>

            <button
              onClick={onFlyAgain}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Fly Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
