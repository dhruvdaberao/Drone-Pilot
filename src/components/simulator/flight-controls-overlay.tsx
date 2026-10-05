import React from "react";
import { MinimapWidget } from "./minimap-widget";
import { Lock, NavigationOff } from "lucide-react";

export function FlightControlsOverlay({ telemetry, autoMoveLocked, onToggleMap, sensorHealth }: { telemetry?: any, autoMoveLocked?: string, onToggleMap?: () => void, sensorHealth?: Record<string, boolean> }) {
  const isGpsHealthy = sensorHealth ? sensorHealth['gps'] : true;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
      <div className="flex items-center justify-center gap-12 bg-black/40 backdrop-blur-md border border-white/10 px-8 py-4 rounded-3xl shadow-2xl">
        
        {/* Left Stick (WASD) */}
        <div className="flex flex-col items-center gap-1 relative">
          <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase mb-1">Throttle / Yaw</span>
          
          {telemetry && telemetry.maxThrustToWeightRatio < 1.0 && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-rose-500/90 text-white px-3 py-1.5 rounded-lg border border-rose-400 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap animate-bounce shadow-[0_0_15px_rgba(244,63,94,0.5)]">
              ⚠️ OVERLOADED - CANNOT FLY
            </div>
          )}

          <div className={`flex flex-col items-center gap-1 ${telemetry && telemetry.maxThrustToWeightRatio < 1.0 ? 'opacity-30' : ''}`}>
            <div className={`w-12 h-12 rounded-lg ${autoMoveLocked === 'NORTH' ? 'bg-emerald-500/40 border-emerald-400' : 'bg-white/90 border-white text-black hover:bg-white transition-colors shadow-lg'} border flex items-center justify-center text-black font-mono text-xl font-bold shadow-inner relative`}>
              W
              {autoMoveLocked === 'NORTH' && <Lock className="absolute -top-3 -right-3 w-4 h-4 text-emerald-400" />}
            </div>
            <div className="flex gap-1">
              <div className={`w-12 h-12 rounded-lg ${autoMoveLocked === 'WEST' ? 'bg-emerald-500/40 border-emerald-400' : 'bg-white/90 border-white text-black hover:bg-white transition-colors shadow-lg'} border flex items-center justify-center text-black font-mono text-xl font-bold shadow-inner relative`}>
                A
                {autoMoveLocked === 'WEST' && <Lock className="absolute -bottom-3 -left-3 w-4 h-4 text-emerald-400" />}
              </div>
              <div className={`w-12 h-12 rounded-lg ${autoMoveLocked === 'SOUTH' ? 'bg-emerald-500/40 border-emerald-400' : 'bg-white/90 border-white text-black hover:bg-white transition-colors shadow-lg'} border flex items-center justify-center text-black font-mono text-xl font-bold shadow-inner relative`}>
                S
                {autoMoveLocked === 'SOUTH' && <Lock className="absolute -bottom-3 right-2 w-4 h-4 text-emerald-400" />}
              </div>
              <div className={`w-12 h-12 rounded-lg ${autoMoveLocked === 'EAST' ? 'bg-emerald-500/40 border-emerald-400' : 'bg-white/90 border-white text-black hover:bg-white transition-colors shadow-lg'} border flex items-center justify-center text-black font-mono text-xl font-bold shadow-inner relative`}>
                D
                {autoMoveLocked === 'EAST' && <Lock className="absolute -bottom-3 -right-3 w-4 h-4 text-emerald-400" />}
              </div>
            </div>
          </div>
        </div>

        {/* Right Stick (Map) */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <span className={`text-[10px] font-bold ${isGpsHealthy ? 'text-white/60' : 'text-rose-500'} tracking-widest uppercase mb-1`}>
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

      <button
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = "/fly";
          }
        }}
        className="mt-2 pointer-events-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-white/80 hover:bg-white text-black backdrop-blur-md border border-white/10 text-xs font-black uppercase tracking-widest transition-all shadow-lg"
      >
        Exit to Dashboard
      </button>

      {autoMoveLocked && (
        <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/30 text-[10px] font-bold tracking-widest uppercase animate-pulse mt-2">
          <Lock className="w-3 h-3" />
          Auto-Navigating to {autoMoveLocked}
        </div>
      )}
    </div>
  );
}


