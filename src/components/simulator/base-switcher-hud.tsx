"use client";

import React, { useState } from "react";
import {
  MapPin,
  ChevronDown,
  Mountain,
  Building2,
  Trees,
  Waves,
  Compass,
  Plane,
  Anchor,
  Wheat,
  X,
  Sparkles,
} from "lucide-react";

export interface FastTravelBase {
  id: string;
  name: string;
  region: string;
  category: string;
  position: { x: number; y: number; z: number };
  headingDeg: number;
  elevationMsl: number;
  description: string;
  iconType: "mountain" | "city" | "forest" | "lake" | "river" | "grassland" | "harbor" | "runway";
}

export const ISLAND_BASES: FastTravelBase[] = [
  {
    id: "training-alpha",
    name: "Helipad Alpha (Main Academy)",
    region: "Central Proving Grounds",
    category: "Airfield",
    position: { x: 0, y: 2.0, z: 0 },
    headingDeg: 0,
    elevationMsl: 1.2,
    description: "Primary flight training runway and high-visibility student apron.",
    iconType: "runway",
  },
  {
    id: "mountain-summit",
    name: "Mount Apex Summit Peak",
    region: "Alpine Highlands",
    category: "Mountain Base",
    position: { x: -620, y: 147.0, z: -720 },
    headingDeg: 180,
    elevationMsl: 145.0,
    description: "The highest crag on the island with communications mast and alpine thermals.",
    iconType: "mountain",
  },
  {
    id: "city-vertiport",
    name: "Apex Tower Rooftop Vertiport",
    region: "Downtown Metropolis",
    category: "Urban High-Rise",
    position: { x: 760, y: 70.0, z: 360 },
    headingDeg: 90,
    elevationMsl: 68.0,
    description: "Skyscraper vertiport overlooking city skyline, avenues, and traffic.",
    iconType: "city",
  },
  {
    id: "forest-outpost",
    name: "Whispering Pines Ranger Station",
    region: "Dense Pine Forest",
    category: "Forest Base",
    position: { x: -620, y: 7.2, z: -40 },
    headingDeg: 45,
    elevationMsl: 5.5,
    description: "Deep pine forest watchtower clearing with grazing deer and slalom courses.",
    iconType: "forest",
  },
  {
    id: "lake-dock",
    name: "Crystal Mountain Lake Shore",
    region: "Alpine Lake Basin",
    category: "Freshwater Lake",
    position: { x: -320, y: 10.2, z: -240 },
    headingDeg: 0,
    elevationMsl: 8.5,
    description: "Scenic pristine reservoir basin, stone embankments, and lakeside campsite.",
    iconType: "lake",
  },
  {
    id: "river-bridge",
    name: "Grand Valley Canyon Bridge",
    region: "River Canyon",
    category: "Canyon Overlook",
    position: { x: -140, y: 6.4, z: 160 },
    headingDeg: 45,
    elevationMsl: 4.8,
    description: "Dramatic arched bridge spanning the carved river gorge and waterfall downstream.",
    iconType: "river",
  },
  {
    id: "grassland-farm",
    name: "Emerald Foothills Homestead",
    region: "Grasslands & Pastures",
    category: "Rural Meadow",
    position: { x: 210, y: 4.6, z: 80 },
    headingDeg: 270,
    elevationMsl: 2.8,
    description: "Cozy rural farmhouse, traditional red barn, rotating windmill & pastures.",
    iconType: "grassland",
  },
  {
    id: "harbor-piers",
    name: "Deepwater Cargo Terminal",
    region: "Industrial Harbor",
    category: "Maritime Port",
    position: { x: 420, y: 3.2, z: 860 },
    headingDeg: 180,
    elevationMsl: 1.5,
    description: "Active shipping berths, container storage yard, and coastal lighthouse.",
    iconType: "harbor",
  },
];

interface BaseSwitcherHUDProps {
  onTeleport: (base: FastTravelBase) => void;
}

export function BaseSwitcherHUD({ onTeleport }: BaseSwitcherHUDProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBase, setSelectedBase] = useState<FastTravelBase>(ISLAND_BASES[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSelect = (base: FastTravelBase) => {
    setSelectedBase(base);
    setIsOpen(false);
    onTeleport(base);

    setToastMessage(`FAST TRAVEL: ${base.name.toUpperCase()}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const getBaseIcon = (type: FastTravelBase["iconType"]) => {
    switch (type) {
      case "mountain":
        return <Mountain className="h-4 w-4 text-amber-400" />;
      case "city":
        return <Building2 className="h-4 w-4 text-cyan-400" />;
      case "forest":
        return <Trees className="h-4 w-4 text-emerald-400" />;
      case "lake":
        return <Waves className="h-4 w-4 text-blue-400" />;
      case "river":
        return <Compass className="h-4 w-4 text-teal-400" />;
      case "grassland":
        return <Wheat className="h-4 w-4 text-yellow-400" />;
      case "harbor":
        return <Anchor className="h-4 w-4 text-orange-400" />;
      case "runway":
      default:
        return <Plane className="h-4 w-4 text-purple-400" />;
    }
  };

  return (
    <>
      {/* Trigger Button in Top Header */}
      <div className="relative pointer-events-auto">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/85 hover:bg-neutral-800 text-white font-mono text-xs font-bold border border-white/20 shadow-lg backdrop-blur-md transition-all cursor-pointer active:scale-95"
          title="Switch between flight bases across the island"
        >
          <MapPin className="h-3.5 w-3.5 text-[#FF5500] animate-pulse" />
          <span className="hidden sm:inline">BASE:</span>
          <span className="text-[#FF5500] truncate max-w-[120px] sm:max-w-[160px]">
            {selectedBase.category}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu Modal */}
        {isOpen && (
          <div className="absolute top-10 left-0 sm:left-auto sm:right-0 w-80 sm:w-96 rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border border-white/20 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200 font-mono text-white select-none">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF5500]" />
                <span className="text-xs font-black tracking-wider uppercase text-white">
                  ISLAND FLIGHT BASES
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 mb-2.5">
              Select any base to instantaneously fast-travel your drone with safe altitude & landing clearance:
            </p>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {ISLAND_BASES.map((b) => {
                const isCurrent = selectedBase.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => handleSelect(b)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isCurrent
                        ? "bg-[#FF5500]/20 border-[#FF5500]/60 text-white shadow-inner"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0 mt-0.5">
                      {getBaseIcon(b.iconType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate text-white">{b.name}</span>
                        <span className="text-[10px] font-extrabold text-[#FF5500] shrink-0 ml-1">
                          {b.elevationMsl}m
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{b.region}</div>
                      <div className="text-[10px] text-neutral-400/80 line-clamp-1 mt-0.5">
                        {b.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Tactical Teleport Confirmation Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300 font-mono">
          <div className="px-4 py-2 rounded-xl bg-neutral-950/90 border border-[#FF5500]/70 text-[#FF5500] text-xs font-black shadow-[0_0_20px_rgba(255,85,0,0.4)] backdrop-blur-md flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-spin" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}
