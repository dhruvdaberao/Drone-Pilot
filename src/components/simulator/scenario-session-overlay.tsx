import React from "react";
import { TrainingScenario } from "@/lib/simulation/scenario-presets";
import { SessionState } from "@/lib/simulation/scenario-engine";
import { Check, X, AlertTriangle, Wind, Battery, Activity, ArrowRight, Play } from "lucide-react";

interface Props {
  scenario: TrainingScenario | null;
  session: SessionState | null;
  onStart: () => void;
  onClose: () => void;
  onReset: () => void;
}

export function ScenarioSessionOverlay({ scenario, session, onStart, onClose, onReset }: Props) {
  if (!scenario) return null;

  // 1. BRIEFING UI
  if (!session || session.status === "NOT_STARTED") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md font-mono text-xs select-none p-4">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-[#FF5500]" />
            <h2 className="text-xl font-bold uppercase tracking-widest text-[#FF5500]">{scenario.name}</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-neutral-500 font-bold tracking-widest mb-2 text-[10px]">LEARNING OBJECTIVE</h3>
              <p className="text-neutral-200 leading-relaxed text-sm">{scenario.learningObjective}</p>
            </div>

            <div>
              <h3 className="text-neutral-500 font-bold tracking-widest mb-2 text-[10px]">CONDITIONS</h3>
              <div className="grid grid-cols-2 gap-3 text-neutral-300">
                <div className="bg-black/30 p-2.5 rounded border border-white/5 flex flex-col">
                  <span className="text-neutral-500 text-[10px] mb-1">WIND</span>
                  <span className="font-bold">{scenario.environment.windSpeed?.toFixed(1)} m/s</span>
                </div>
                <div className="bg-black/30 p-2.5 rounded border border-white/5 flex flex-col">
                  <span className="text-neutral-500 text-[10px] mb-1">DIRECTION</span>
                  <span className="font-bold">{scenario.environment.windDirection}°</span>
                </div>
                <div className="bg-black/30 p-2.5 rounded border border-white/5 flex flex-col">
                  <span className="text-neutral-500 text-[10px] mb-1">BATTERY</span>
                  <span className="font-bold">{scenario.faults.batteryInitialSocPercent}%</span>
                </div>
                <div className="bg-black/30 p-2.5 rounded border border-white/5 flex flex-col">
                  <span className="text-neutral-500 text-[10px] mb-1">PAYLOAD</span>
                  <span className="font-bold">{scenario.faults.payloadMassKg?.toFixed(1)} kg</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-neutral-500 font-bold tracking-widest mb-2 text-[10px]">TASK</h3>
              <p className="text-neutral-200">{scenario.recommendedOperatorAction}</p>
            </div>

            <div>
              <h3 className="text-neutral-500 font-bold tracking-widest mb-2 text-[10px]">OBSERVE</h3>
              <ul className="text-neutral-300 space-y-1.5 list-disc list-inside">
                {scenario.objectives?.map((obj) => (
                  <li key={obj.id}>{obj.description}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-4 border-t border-white/10">
            <button onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white transition-colors uppercase tracking-widest font-bold">
              CANCEL
            </button>
            <button onClick={onStart} className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#ff7733] text-white rounded font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
              <Play className="w-4 h-4" />
              START SIMULATION
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. IN-SIMULATION GUIDANCE
  if (session.status === "IN_PROGRESS") {
    return (
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-sm">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col font-mono text-xs text-white">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <span className="text-[#FF5500] font-bold tracking-widest uppercase">{scenario.name}</span>
            <span className="text-neutral-400 font-bold">{Math.floor(session.elapsedTime)}s</span>
          </div>
          
          <div className="space-y-3">
            {scenario.objectives?.map((obj) => {
              const prog = session.objectiveProgress[obj.id];
              return (
                <div key={obj.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-neutral-300">
                    <span>{obj.description}</span>
                    <span>{Math.floor(prog.timeInTolerance)}s / {obj.requiredDurationSeconds}s</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (prog.timeInTolerance / obj.requiredDurationSeconds) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-neutral-400 leading-relaxed">
            {scenario.expectedBehavior}
          </div>
        </div>
      </div>
    );
  }

  // 3. SCENARIO RESULT / ANALYSIS
  if (session.status === "COMPLETED" || session.status === "FAILED") {
    const isSuccess = session.status === "COMPLETED";
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md font-mono text-xs select-none p-4">
        <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className={`p-6 flex flex-col items-center justify-center border-b ${isSuccess ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-rose-950/30 border-rose-900/50'}`}>
            {isSuccess ? <Check className="w-12 h-12 text-emerald-500 mb-3" /> : <X className="w-12 h-12 text-rose-500 mb-3" />}
            <h2 className={`text-2xl font-bold uppercase tracking-widest ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
              SCENARIO {isSuccess ? 'COMPLETED' : 'FAILED'}
            </h2>
            <p className="text-neutral-400 mt-2">{session.failureReason || "All educational objectives met."}</p>
          </div>

          <div className="p-6 text-white">
             {/* Analysis Metrics */}
             <h3 className="text-neutral-500 font-bold tracking-widest mb-4 text-[10px] border-b border-white/10 pb-2">FLIGHT ANALYSIS</h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="flex flex-col bg-black/30 p-3 rounded">
                  <span className="text-neutral-500 text-[10px] mb-1">DURATION</span>
                  <span className="font-bold text-lg">{Math.floor(session.elapsedTime)}s</span>
                </div>
                <div className="flex flex-col bg-black/30 p-3 rounded">
                  <span className="text-neutral-500 text-[10px] mb-1">MAX ALTITUDE</span>
                  <span className="font-bold text-lg">{session.resultData?.maxAltitude.toFixed(1)}m</span>
                </div>
                <div className="flex flex-col bg-black/30 p-3 rounded">
                  <span className="text-neutral-500 text-[10px] mb-1">MAX DRIFT</span>
                  <span className="font-bold text-lg">{session.resultData?.maxDrift.toFixed(1)}m</span>
                </div>
                <div className="flex flex-col bg-black/30 p-3 rounded">
                  <span className="text-neutral-500 text-[10px] mb-1">MAX TILT</span>
                  <span className="font-bold text-lg">{session.resultData?.maxTilt.toFixed(1)}°</span>
                </div>
                <div className="flex flex-col bg-black/30 p-3 rounded">
                  <span className="text-neutral-500 text-[10px] mb-1">MOTOR IMBALANCE</span>
                  <span className="font-bold text-lg">{(session.resultData!.motorImbalance * 100).toFixed(0)}%</span>
                </div>
                <div className="flex flex-col bg-black/30 p-3 rounded">
                  <span className="text-neutral-500 text-[10px] mb-1">BATT CONSUMED</span>
                  <span className="font-bold text-lg">{session.resultData?.batteryConsumed.toFixed(1)}%</span>
                </div>
                <div className="flex flex-col bg-black/30 p-3 rounded">
                  <span className="text-neutral-500 text-[10px] mb-1">WIND SPEED</span>
                  <span className="font-bold text-lg">{session.resultData?.windSpeed.toFixed(1)} m/s</span>
                </div>
                <div className="flex flex-col bg-black/30 p-3 rounded">
                  <span className="text-neutral-500 text-[10px] mb-1">PAYLOAD</span>
                  <span className="font-bold text-lg">{scenario.faults.payloadMassKg?.toFixed(1)} kg</span>
                </div>
             </div>

             {/* Learning Summary */}
             <h3 className="text-neutral-500 font-bold tracking-widest mb-4 text-[10px] border-b border-white/10 pb-2">EDUCATIONAL SUMMARY</h3>
             <div className="bg-[#FF5500]/10 border border-[#FF5500]/30 p-4 rounded-lg text-[#ffaa88] leading-relaxed">
               <p className="mb-2 font-bold text-[#FF5500]">WHAT YOU LEARNED</p>
               <p>{scenario.learningObjective}</p>
               <p className="mt-2">{scenario.expectedBehavior}</p>
             </div>
          </div>

          <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end gap-3">
            <button onClick={onReset} className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold uppercase tracking-widest transition-colors pointer-events-auto">
              RESET SIMULATOR
            </button>
            <button onClick={onClose} className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#ff7733] text-white rounded font-bold uppercase tracking-widest transition-colors pointer-events-auto">
              RETURN TO GARAGE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
