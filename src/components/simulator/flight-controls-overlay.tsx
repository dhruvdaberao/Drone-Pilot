import React from "react";
import { MinimapWidget } from "./minimap-widget";
import { Lock, NavigationOff } from "lucide-react";

export function FlightControlsOverlay({ telemetry, autoMoveLocked, onToggleMap, sensorHealth }: { telemetry?: any, autoMoveLocked?: string, onToggleMap?: () => void, sensorHealth?: Record<string, boolean> }) {
  const isGpsHealthy = sensorHealth ? sensorHealth['gps'] : true;

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
          <span className={`text-[10px] font-bold ${isGpsHealthy ? 'text-[#38bdf8]' : 'text-rose-500'} tracking-widest uppercase mb-1`}>
            {isGpsHealthy ? 'Radar Map' : 'GPS OFFLINE'}
          </span>
          {telemetry && isGpsHealthy ? (
            <MinimapWidget telemetry={telemetry} onClick={onToggleMap || (() => {})} />
          ) : (
            <div 
              className="w-24 h-24 rounded-full bg-black/50 border-2 border-rose-500/30 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-900/20 transition-colors shadow-[inset_0_0_20px_rgba(244,63,94,0.2)]"
              onClick={() => alert("GPS Sensor is currently OFFLINE. Location tracking and map data are unavailable.")}
            >
              <NavigationOff className="w-6 h-6 text-rose-500/50 mb-1" />
              <span className="text-[8px] font-bold text-rose-500/70 tracking-widest text-center px-2">SIGNAL<br/>LOST</span>
            </div>
          )}
        </div>

      </div>
      {autoMoveLocked && (
        <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/30 text-[10px] font-bold tracking-widest uppercase animate-pulse">
          <Lock className="w-3 h-3" />
          Auto-Navigating to {autoMoveLocked}
        </div>
      )}
    </div>
  );
}


