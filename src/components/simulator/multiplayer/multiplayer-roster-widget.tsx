"use client";

import React, { useState } from "react";
import { RemotePlayerState } from "@/lib/multiplayer/multiplayer-types";
import { Users, Wifi } from "lucide-react";

interface MultiplayerRosterWidgetProps {
  players: RemotePlayerState[];
  myCallsign: string;
}

export function MultiplayerRosterWidget({ players, myCallsign }: MultiplayerRosterWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-20 left-3 z-30 font-mono select-none pointer-events-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-2 border-black shadow-md text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-all cursor-pointer"
      >
        <Users className="h-3.5 w-3.5 text-[#FF5500]" />
        <span>AIRSPACE: {players.length + 1} PILOT{players.length > 0 ? "S" : ""}</span>
        <Wifi className="h-3 w-3 text-emerald-600 ml-1" />
      </button>

      {isOpen && (
        <div className="mt-2 w-64 bg-white border-2 border-black rounded-2xl shadow-xl p-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            ACTIVE SESSION PILOTS
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-orange-50 border border-orange-200 text-xs">
              <span className="font-bold text-[#FF5500]">{myCallsign} (YOU)</span>
              <span className="text-[10px] bg-white px-1 rounded border border-orange-300 font-mono">LOCAL</span>
            </div>

            {players.map((p) => (
              <div
                key={p.playerId}
                className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs"
              >
                <span className="font-bold text-neutral-800">{p.callsign}</span>
                <span className="text-[10px] text-neutral-500">{p.flightMode}</span>
              </div>
            ))}

            {players.length === 0 && (
              <p className="text-[10px] text-neutral-400 py-1 text-center">
                No other pilots in local sector.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
