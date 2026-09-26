import React from "react";
import { FlightCoachInsight } from "@/lib/simulation/flight-coach-types";
import { Info, AlertTriangle, Lightbulb, CheckCircle2, ShieldAlert, X } from "lucide-react";

interface FlightCoachPanelProps {
  insight: FlightCoachInsight | null;
  history: FlightCoachInsight[];
  onDismiss: () => void;
  onClearHistory: () => void;
}

export function FlightCoachPanel({ insight, history, onDismiss, onClearHistory }: FlightCoachPanelProps) {
  if (!insight && history.length === 0) return null;

  const getIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case "ATTENTION": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "OBSERVATION": return <EyeIcon />;
      case "INFO":
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "border-rose-500/50";
      case "ATTENTION": return "border-orange-500/50";
      case "OBSERVATION": return "border-[#FF5500]/50";
      case "INFO":
      default: return "border-blue-400/30";
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-2xl px-4 pointer-events-none">
      {insight && (
        <div className={`pointer-events-auto bg-neutral-950/95 backdrop-blur-md border ${getBorderColor(insight.severity)} rounded-xl p-4 shadow-2xl flex flex-col gap-3 font-mono text-white animate-in slide-in-from-bottom-5 duration-300`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-3">
              {getIcon(insight.severity)}
              <div>
                <p className="text-[10px] text-white/50 tracking-widest font-bold uppercase">{insight.severity} • FLIGHT COACH</p>
                <h3 className="text-sm font-bold tracking-wide uppercase">{insight.title}</h3>
              </div>
            </div>
            <button onClick={onDismiss} className="p-1 hover:bg-white/10 rounded">
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-[#FF5500] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3 h-3" /> WHAT HAPPENED
                </span>
                <p className="text-xs text-white/80 leading-relaxed">{insight.explanation.what}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#FF5500] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3 h-3" /> WHY
                </span>
                <p className="text-xs text-white/80 leading-relaxed">{insight.explanation.why}</p>
              </div>
            </div>
            
            <div className="space-y-3 border-l border-white/10 pl-4">
              <div>
                <span className="text-[10px] text-[#FF5500] font-bold tracking-widest uppercase block mb-1">EVIDENCE LOG</span>
                <ul className="text-[10px] text-white/60 space-y-1">
                  {insight.evidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-white/30">&gt;</span> {ev}
                    </li>
                  ))}
                  {insight.evidence.length === 0 && <li>&gt; No active telemetry evidence</li>}
                </ul>
              </div>
              <div className="bg-black/30 p-2 rounded border border-white/5 mt-2">
                <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase block mb-1">LEARNING OBJECTIVE</span>
                <p className="text-xs text-white/90">{insight.explanation.learn}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF5500]">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
