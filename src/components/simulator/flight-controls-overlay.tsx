import React from "react";
import { MinimapWidget } from "./minimap-widget";

import { Lock } from "lucide-react";

export function FlightControlsOverlay({ telemetry, autoMoveLocked, onToggleMap }: { telemetry?: any, autoMoveLocked?: string, onToggleMap?: () => void }) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
      <div className="flex items-center justify-center gap-12 bg-black/40 backdrop-blur-md border border-white/10 px-8 py-4 rounded-3xl shadow-2xl">
        
        {/* Left Stick (WASD) */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-[#FF5500] tracking-widest uppercase mb-1">Throttle / Yaw</span>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white/90 font-mono text-sm font-bold shadow-inner">W</div>
            <div className="flex gap-1">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white/90 font-mono text-sm font-bold shadow-inner">A</div>
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white/90 font-mono text-sm font-bold shadow-inner">S</div>
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white/90 font-mono text-sm font-bold shadow-inner">D</div>
            </div>
          </div>
        </div>

        {/* Right Stick (Map) */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <span className="text-[10px] font-bold text-[#38bdf8] tracking-widest uppercase mb-1">Radar Map</span>
          {telemetry && <MinimapWidget telemetry={telemetry} onClick={onToggleMap || (() => {})} />}
        </div>

      </div>
    </div>
  );
}


