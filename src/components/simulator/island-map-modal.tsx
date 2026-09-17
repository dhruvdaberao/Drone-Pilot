// ==========================================================
// DRONE PILOT — TACTICAL ISLAND RECONNAISSANCE MAP (PHASE 1)
// Aviation/military topographical reconnaissance map driven by WORLD_DEFINITION
// with dynamic terrain shading, master road network, live waypoint navigation,
// interactive zoom, sleek close button, and zero clutter.
// ==========================================================

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { TelemetryState } from "@/lib/simulation/types";
import {
  X,
  Compass,
  Target,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from "lucide-react";
import { getTacticalMapData, worldToRadarCoords } from "@/lib/world/map-data";
import { WORLD_DEFINITION } from "@/lib/world/world-definition";
import { NavigationWaypoint } from "./minimap-widget";

interface IslandMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetryState;
  droneName: string;
  activeWaypoint?: NavigationWaypoint | null;
  onSelectWaypoint?: (waypoint: NavigationWaypoint | null) => void;
}

interface TacticalPOI {
  id: string;
  name: string;
  category: "airfield" | "mountain" | "city" | "water" | "forest" | "industrial";
  x: number;
  z: number;
  elevation: string;
  elevationMeters: number;
  description: string;
  callsign: string;
  labelOffsetX: number;
  labelOffsetY: number;
}

// Canonical POIs derived directly from WORLD_DEFINITION
const TACTICAL_POIS: TacticalPOI[] = [
  {
    id: "training-alpha",
    name: "Helipad Station Alpha",
    callsign: "BASE-01",
    category: "airfield",
    x: 0,
    z: 0,
    elevation: "1.2m MSL",
    elevationMeters: 1.2,
    description: "Central Flight Academy asphalt runway & primary drone apron.",
    labelOffsetX: 0,
    labelOffsetY: -24,
  },
  {
    id: "mountain-alpha",
    name: "Mount Apex Weather Station",
    callsign: "APEX-WX",
    category: "mountain",
    x: -580,
    z: -560,
    elevation: "48.0m MSL",
    elevationMeters: 48.0,
    description: "North-west granite mountain ridge with meteorological telemetry mast.",
    labelOffsetX: 0,
    labelOffsetY: -24,
  },
  {
    id: "mtn-apex-summit",
    name: "Mount Apex Summit Peak",
    callsign: "SUMMIT-145",
    category: "mountain",
    x: -620,
    z: -720,
    elevation: "145.0m MSL",
    elevationMeters: 145.0,
    description: "Highest geographic point on the island with permanent crags and radio mast.",
    labelOffsetX: 0,
    labelOffsetY: -24,
  },
  {
    id: "forest-alpha",
    name: "Forest Ranger Station",
    callsign: "PINES-01",
    category: "forest",
    x: -620,
    z: -40,
    elevation: "5.5m MSL",
    elevationMeters: 5.5,
    description: "Coniferous timber outpost nestled in a dense pine forest clearing.",
    labelOffsetX: 0,
    labelOffsetY: -24,
  },
  {
    id: "city-alpha",
    name: "Downtown Heliport Plaza",
    callsign: "METRO-01",
    category: "city",
    x: 640,
    z: 320,
    elevation: "2.5m MSL",
    elevationMeters: 2.5,
    description: "Municipal vertiport situated between corporate skyscrapers.",
    labelOffsetX: -36,
    labelOffsetY: 26,
  },
  {
    id: "city-apex-rooftop",
    name: "Apex Center Skyport",
    callsign: "ROOF-TOP",
    category: "city",
    x: 760,
    z: 360,
    elevation: "68.0m MSL",
    elevationMeters: 68.0,
    description: "Elevated high-rise skyport atop the tallest island skyscraper.",
    labelOffsetX: 40,
    labelOffsetY: -26,
  },
  {
    id: "river-alpha",
    name: "Valley Bridge Station",
    callsign: "RIVER-01",
    category: "water",
    x: -160,
    z: 160,
    elevation: "3.5m MSL",
    elevationMeters: 3.5,
    description: "Riverside observation platform adjacent to historic stone arch bridge.",
    labelOffsetX: 0,
    labelOffsetY: 26,
  },
  {
    id: "industrial-alpha",
    name: "Harbor Cargo Terminal",
    callsign: "PORT-DOCK",
    category: "industrial",
    x: 360,
    z: 760,
    elevation: "1.8m MSL",
    elevationMeters: 1.8,
    description: "Logistics shipping terminal bordered by fuel silos and container cranes.",
    labelOffsetX: 0,
    labelOffsetY: 24,
  },
  {
    id: "coast-alpha",
    name: "Pelican Cove Marine Station",
    callsign: "COVE-MED",
    category: "water",
    x: -720,
    z: 560,
    elevation: "2.0m MSL",
    elevationMeters: 2.0,
    description: "South-west coastal cove pad overlooking turquoise shallow reefs.",
    labelOffsetX: -20,
    labelOffsetY: 24,
  },
];

const SVG_CANVAS_SIZE = 900;

export function IslandMapModal({
  isOpen,
  onClose,
  telemetry,
  droneName,
  activeWaypoint,
  onSelectWaypoint,
}: IslandMapModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [selectedPoiId, setSelectedPoiId] = useState<string>(activeWaypoint?.id || "training-alpha");

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Derived tactical map data bundle from canonical WORLD_DEFINITION
  const mapData = useMemo(() => getTacticalMapData(SVG_CANVAS_SIZE, 1400), []);

  const worldToSvg = (x: number, z: number) => {
    return worldToRadarCoords(x, z, SVG_CANVAS_SIZE, 1400);
  };

  const droneSvg = worldToSvg(telemetry.position.x, telemetry.position.z);

  // Flight path points
  const flightPathPoints = useMemo(() => {
    if (!telemetry.flightPath || telemetry.flightPath.length === 0) return "";
    return telemetry.flightPath
      .map((p) => {
        const pt = worldToSvg(p.x, p.z);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(" ");
  }, [telemetry.flightPath]);

  // Active target POI
  const activeTarget = useMemo(() => {
    return TACTICAL_POIS.find((p) => p.id === selectedPoiId) || TACTICAL_POIS[0];
  }, [selectedPoiId]);

  const targetSvg = worldToSvg(activeTarget.x, activeTarget.z);

  // Flight Distance & Bearing from Drone to Selected Target
  const navStats = useMemo(() => {
    const dx = activeTarget.x - telemetry.position.x;
    const dz = activeTarget.z - telemetry.position.z;
    const dist = Math.hypot(dx, dz);
    let bearing = (Math.atan2(dx, -dz) * 180) / Math.PI;
    if (bearing < 0) bearing += 360;
    const groundSpeed = Math.max(0.5, telemetry.groundSpeed || 8);
    const etaSec = Math.round(dist / groundSpeed);
    return { dist, bearing: Math.round(bearing), etaSec };
  }, [activeTarget, telemetry.position, telemetry.groundSpeed]);

  const handleSelectTarget = (poi: TacticalPOI) => {
    setSelectedPoiId(poi.id);
    if (onSelectWaypoint) {
      onSelectWaypoint({
        id: poi.id,
        name: poi.name.split(" ")[0] || poi.callsign,
        x: poi.x,
        z: poi.z,
        elevation: poi.elevationMeters,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 font-mono select-none">
      {/* Click outside backdrop to close */}
      <div
        className="absolute inset-0 cursor-pointer pointer-events-auto"
        onClick={onClose}
        aria-label="Close Map Backdrop"
      />

      {/* Main Recon Panel Container — Minimal Premium White Card */}
      <div className="relative z-10 w-full max-w-5xl max-h-[95vh] bg-white border border-neutral-200/90 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden text-neutral-900 animate-in zoom-in-95 duration-200 pointer-events-auto">
        
        {/* Header Bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ff5500] shadow-xs">
              <Compass className="h-4 w-4 text-[#ff5500]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-sm sm:text-base tracking-wider uppercase text-neutral-900">
                  Tactical Island Map
                </h2>
                <span className="bg-orange-50 border border-orange-200 text-[#ff5500] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500] animate-ping" />
                  Live GPS
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 hidden sm:block">
                Island Grid 2.4km × 2.2km • Topographical Architecture & Waypoints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Telemetry Coordinate Pill */}
            <div className="hidden md:flex items-center gap-2.5 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-700">
              <span className="text-neutral-400 text-[10px]">POS:</span>
              <strong className="text-neutral-900 font-mono">
                X:{telemetry.position.x.toFixed(0)}m Z:{telemetry.position.z.toFixed(0)}m
              </strong>
              <span className="text-neutral-300">|</span>
              <span className="text-neutral-400 text-[10px]">ALT:</span>
              <strong className="text-[#ff5500] font-mono">{telemetry.altitude.toFixed(1)}m</strong>
              <span className="text-neutral-300">|</span>
              <span className="text-neutral-400 text-[10px]">HDG:</span>
              <strong className="text-neutral-900 font-mono">{telemetry.heading}°</strong>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 text-xs font-bold border border-neutral-200 transition-all cursor-pointer"
              title="Close Map (Esc)"
            >
              <X className="h-4 w-4 text-neutral-600" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </header>

        {/* Map Canvas & Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* Main Topographical Map Viewport */}
          <div className="flex-1 bg-neutral-100 relative overflow-hidden flex items-center justify-center p-2 sm:p-4 min-h-[350px] sm:min-h-[480px]">
            
            {/* Multi-Level Zoom Toolbar (100%, 160%, 240%) */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-white/95 border border-neutral-200/90 rounded-xl p-1 shadow-md backdrop-blur-md">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.8, Math.round((z - 0.3) * 10) / 10))}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              
              <div className="h-4 w-px bg-neutral-200 mx-0.5" />

              <button
                onClick={() => setZoomLevel(1.0)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  zoomLevel === 1.0
                    ? "bg-[#ff5500] text-white shadow-xs"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
                title="Full Island Overview (100%)"
              >
                100%
              </button>
              <button
                onClick={() => setZoomLevel(1.6)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  zoomLevel === 1.6
                    ? "bg-[#ff5500] text-white shadow-xs"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
                title="Regional Sector View (160%)"
              >
                160%
              </button>
              <button
                onClick={() => setZoomLevel(2.4)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  zoomLevel === 2.4
                    ? "bg-[#ff5500] text-white shadow-xs"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
                title="Tactical Focus View (240%)"
              >
                240%
              </button>

              <div className="h-4 w-px bg-neutral-200 mx-0.5" />

              <button
                onClick={() => setZoomLevel((z) => Math.min(2.8, Math.round((z + 0.3) * 10) / 10))}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Topographical SVG Map Canvas */}
            <svg
              viewBox={`0 0 ${SVG_CANVAS_SIZE} ${SVG_CANVAS_SIZE}`}
              className="w-full h-full max-w-[720px] max-h-[720px] rounded-xl border border-neutral-200/90 shadow-lg bg-[#081726] transition-transform duration-300 ease-out"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: zoomLevel <= 1.05 ? "center center" : `${droneSvg.x}px ${droneSvg.y}px`,
              }}
            >
              <defs>
                <pattern id="modal-recon-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#132a45" strokeWidth="0.8" opacity="0.6" />
                </pattern>

                <radialGradient id="modal-recon-cone" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff5500" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#ff5500" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* 1. Deep Maritime Ocean Water */}
              <rect width={SVG_CANVAS_SIZE} height={SVG_CANVAS_SIZE} fill="#081726" />
              <rect width={SVG_CANVAS_SIZE} height={SVG_CANVAS_SIZE} fill="url(#modal-recon-grid)" />

              {/* 2. Shallow Coral Reef Turquoise Water Shelf */}
              <path
                d={mapData.coastlinePath}
                fill="none"
                stroke="#0d4a6e"
                strokeWidth="24"
                strokeLinejoin="round"
                opacity="0.85"
              />

              {/* 3. Natural Golden Sand Beach Coastline */}
              <path
                d={mapData.coastlinePath}
                fill="#dfc086"
                stroke="#c29d5b"
                strokeWidth="8"
                strokeLinejoin="round"
              />

              {/* 4. Natural Island Landmass */}
              <path
                d={mapData.coastlinePath}
                fill="#1b3d2b"
                stroke="#2d5e3f"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Central Plains Meadow Zone around Airfield */}
              <ellipse cx="450" cy="450" rx="170" ry="120" fill="#254d37" opacity="0.8" />

              {/* 5. Natural Regional Biomes & Elevation Relief */}
              {/* NW MOUNT APEX MASSIF */}
              <g transform="translate(285, 265)">
                <ellipse cx="0" cy="0" rx="130" ry="100" fill="#2e3b4e" stroke="#475569" strokeWidth="1.5" />
                <ellipse cx="-15" cy="-12" rx="90" ry="70" fill="#3b4b5e" stroke="#64748b" strokeWidth="1.2" />
                <ellipse cx="-25" cy="-20" rx="55" ry="40" fill="#4d5f75" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="-30" cy="-25" r="18" fill="#e2e8f0" opacity="0.9" />
                <text x="-30" y="-21" fill="#0f172a" fontSize="9" fontWeight="900" textAnchor="middle">
                  145m
                </text>
                <text x="-10" y="24" fill="#cbd5e1" fontSize="8" fontWeight="bold" textAnchor="middle">
                  MT APEX MASSIF
                </text>
              </g>

              {/* WEST WHISPERING PINES FOREST */}
              <g transform="translate(275, 460)">
                <ellipse cx="0" cy="0" rx="120" ry="90" fill="#133621" opacity="0.95" stroke="#164e2a" strokeWidth="1.2" />
                <circle cx="-35" cy="-25" r="24" fill="#0e2919" opacity="0.8" />
                <circle cx="30" cy="-30" r="28" fill="#0e2919" opacity="0.8" />
                <circle cx="-20" cy="25" r="30" fill="#0e2919" opacity="0.8" />
                <circle cx="35" cy="25" r="24" fill="#0e2919" opacity="0.8" />
                <text x="0" y="-55" fill="#86efac" fontSize="8" fontWeight="bold" textAnchor="middle" opacity="0.9">
                  WHISPERING PINES
                </text>
              </g>

              {/* ALPINE LAKE & CARVED RIVER CANYON */}
              <circle
                cx={mapData.waterways.lake.cx}
                cy={mapData.waterways.lake.cy}
                r={mapData.waterways.lake.r}
                fill="#0284c7"
                stroke="#38bdf8"
                strokeWidth="2"
              />
              <text x={mapData.waterways.lake.cx} y={mapData.waterways.lake.cy + 3} fill="#ffffff" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                LAKE
              </text>

              {/* River Channel */}
              <path
                d={mapData.waterways.riverPath}
                fill="none"
                stroke="#0c4a6e"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={mapData.waterways.riverPath}
                fill="none"
                stroke="#0284c7"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 6. Master Road & Highway Network */}
              <g fill="none" stroke="#0f172a" strokeLinecap="round" strokeLinejoin="round">
                {mapData.roads.highways.map((h) => (
                  <path key={h.id} d={h.path} strokeWidth={h.width + 4} />
                ))}
                {mapData.roads.connectors.map((c) => (
                  <path key={c.id} d={c.path} strokeWidth={c.width + 3} />
                ))}
                {mapData.roads.mountainPasses.map((m) => (
                  <path key={m.id} d={m.path} strokeWidth={m.width + 2} />
                ))}
              </g>
              <g fill="none" stroke="#f59e0b" strokeLinecap="round" strokeLinejoin="round">
                {mapData.roads.highways.map((h) => (
                  <path key={h.id} d={h.path} strokeWidth={h.width + 1} />
                ))}
                {mapData.roads.connectors.map((c) => (
                  <path key={c.id} d={c.path} strokeWidth={c.width} />
                ))}
                {mapData.roads.mountainPasses.map((m) => (
                  <path key={m.id} d={m.path} strokeWidth={m.width} strokeDasharray="5 4" />
                ))}
              </g>

              {/* Highway River Canyon Bridge */}
              {mapData.roads.bridges.map((b) => (
                <path
                  key={b.id}
                  d={b.path}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth={b.width + 2}
                  strokeLinecap="butt"
                />
              ))}

              {/* 7. Central Airfield & Runway Complex */}
              <g transform="translate(450, 450)">
                <polygon points="-70,-20 70,-20 80,20 -80,20" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <rect x="-80" y="-12" width="160" height="24" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="-70" y1="0" x2="70" y2="0" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="6 5" />
                <line x1="-76" y1="-8" x2="-76" y2="8" stroke="#ffffff" strokeWidth="2.5" />
                <line x1="76" y1="-8" x2="76" y2="8" stroke="#ffffff" strokeWidth="2.5" />
                <text x="0" y="-16" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">
                  RUNWAY 09/27
                </text>
              </g>

              {/* 8. Downtown Metropolis & Harbor Marina */}
              <g transform="translate(680, 550)">
                <rect x="-85" y="-75" width="170" height="150" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <line x1="-85" y1="-20" x2="85" y2="-20" stroke="#334155" strokeWidth="6" />
                <line x1="-85" y1="35" x2="85" y2="35" stroke="#334155" strokeWidth="6" />
                <line x1="-20" y1="-75" x2="-20" y2="75" stroke="#334155" strokeWidth="6" />
                <line x1="35" y1="-75" x2="35" y2="75" stroke="#334155" strokeWidth="6" />
                {/* Skyscraper Blocks */}
                <rect x="-70" y="-60" width="38" height="32" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                <rect x="45" y="-60" width="32" height="32" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                {/* Apex High-Rise Tower */}
                <rect x="15" y="10" width="40" height="40" rx="2" fill="#020617" stroke="#ff5500" strokeWidth="2" />
                <text x="35" y="34" fill="#ff5500" fontSize="8" fontWeight="900" textAnchor="middle">
                  APEX
                </text>
                <text x="0" y="-66" fill="#93c5fd" fontSize="8" fontWeight="bold" textAnchor="middle">
                  METROPOLIS
                </text>
              </g>

              {/* Harbor Industrial Wharves & Piers */}
              <g transform="translate(560, 700)">
                <rect x="-35" y="-20" width="70" height="40" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1" />
                <rect x="-10" y="20" width="10" height="45" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                <rect x="12" y="20" width="10" height="55" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                <text x="0" y="-25" fill="#fcd34d" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                  HARBOR PORT
                </text>
              </g>

              {/* 9. Live Flight Trail */}
              {flightPathPoints && (
                <polyline
                  points={flightPathPoints}
                  fill="none"
                  stroke="#ff5500"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              )}

              {/* 10. Active Waypoint Line */}
              <line
                x1={droneSvg.x}
                y1={droneSvg.y}
                x2={targetSvg.x}
                y2={targetSvg.y}
                stroke="#ff5500"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                opacity="0.95"
              />

              {/* Midpoint Distance Tag */}
              <g transform={`translate(${(droneSvg.x + targetSvg.x) / 2}, ${(droneSvg.y + targetSvg.y) / 2})`}>
                <rect x="-35" y="-10" width="70" height="20" rx="4" fill="#020617" stroke="#ff5500" strokeWidth="1.2" />
                <text x="0" y="3" fill="#ff5500" fontSize="9" fontWeight="900" textAnchor="middle">
                  {navStats.dist.toFixed(0)}m
                </text>
              </g>

              {/* 11. Helipads & Landmarks with Anti-Collision Labels */}
              {TACTICAL_POIS.map((poi) => {
                const pt = worldToSvg(poi.x, poi.z);
                const isSelected = poi.id === selectedPoiId;
                const ox = poi.labelOffsetX;
                const oy = poi.labelOffsetY;

                return (
                  <g
                    key={poi.id}
                    className="cursor-pointer group"
                    onClick={() => handleSelectTarget(poi)}
                  >
                    {isSelected && (
                      <circle cx={pt.x} cy={pt.y} r="18" fill="none" stroke="#ff5500" strokeWidth="2" className="animate-ping" opacity="0.75" />
                    )}

                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="10"
                      fill={isSelected ? "#ff5500" : "#0f172a"}
                      stroke={isSelected ? "#ffffff" : "#22c55e"}
                      strokeWidth={isSelected ? "2.5" : "2"}
                      className="transition-transform duration-150 group-hover:scale-125 shadow-lg"
                    />

                    <text
                      x={pt.x}
                      y={pt.y + 3.5}
                      fill={isSelected ? "#000000" : "#22c55e"}
                      fontSize="10"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      H
                    </text>

                    {/* Offset Callout Badge */}
                    <g transform={`translate(${pt.x + ox}, ${pt.y + oy})`}>
                      <rect
                        x="-46"
                        y="-10"
                        width="92"
                        height="18"
                        rx="4"
                        fill="#020617"
                        stroke={isSelected ? "#ff5500" : "#475569"}
                        strokeWidth={isSelected ? "1.8" : "1"}
                        opacity="0.96"
                        className="shadow-xl"
                      />
                      <text
                        x="0"
                        y="2"
                        fill={isSelected ? "#ff5500" : "#f8fafc"}
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {poi.callsign} • {poi.elevation}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 12. Live Drone Marker & Radar Sweep Vision Cone */}
              <g transform={`translate(${droneSvg.x}, ${droneSvg.y})`}>
                <g transform={`rotate(${telemetry.heading})`}>
                  <path d="M 0 0 L -35 -100 A 100 100 0 0 1 35 -100 Z" fill="url(#modal-recon-cone)" />
                  <line x1="0" y1="0" x2="0" y2="-100" stroke="#ff5500" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.9" />
                </g>

                <circle cx="0" cy="0" r="14" fill="none" stroke="#ff5500" strokeWidth="2" className="animate-ping" opacity="0.6" />
                <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
                
                <g transform={`rotate(${telemetry.heading})`}>
                  <polygon points="0,-8 5,5 0,2 -5,5" fill="#ff5500" stroke="#000000" strokeWidth="0.8" />
                </g>
              </g>
            </svg>
          </div>

          {/* Tactical Info & Waypoint Selector Sidebar — White Theme */}
          <div className="w-full lg:w-84 bg-neutral-50/90 border-t lg:border-t-0 lg:border-l border-neutral-200 flex flex-col justify-between p-4 overflow-y-auto max-h-[40vh] lg:max-h-none text-xs">
            
            <div className="space-y-4">
              {/* Active Target Banner */}
              <div className="p-3.5 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    <Target className="h-3.5 w-3.5 text-[#ff5500]" />
                    <span>WAYPOINT TARGET</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#ff5500] font-mono bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    BEARING {navStats.bearing}°
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <h3 className="font-heading font-extrabold text-sm text-neutral-900 uppercase">
                    {activeTarget.name}
                  </h3>
                  <strong className="text-base text-[#ff5500] font-mono">
                    {navStats.dist.toFixed(0)}m
                  </strong>
                </div>

                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  {activeTarget.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="text-neutral-500 block">EST FLIGHT TIME</span>
                    <strong className="text-neutral-900">~{navStats.etaSec}s @ cruise</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="text-neutral-500 block">PAD ELEVATION</span>
                    <strong className="text-emerald-700">{activeTarget.elevation}</strong>
                  </div>
                </div>
              </div>

              {/* Waypoints & Helipads List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  <span>DESIGNATED STATIONS ({TACTICAL_POIS.length})</span>
                  <span className="text-neutral-400">CLICK TO TRACK</span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {TACTICAL_POIS.map((poi) => {
                    const isSelected = poi.id === selectedPoiId;
                    const d = Math.hypot(poi.x - telemetry.position.x, poi.z - telemetry.position.z);
                    return (
                      <button
                        key={poi.id}
                        type="button"
                        onClick={() => handleSelectTarget(poi)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-orange-50/80 border-[#ff5500] text-neutral-950 shadow-xs"
                            : "bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] font-mono border ${
                              isSelected
                                ? "bg-[#ff5500] text-white border-[#ff5500]"
                                : "bg-neutral-100 text-emerald-700 border-neutral-200"
                            }`}
                          >
                            H
                          </span>
                          <div>
                            <span className="font-bold block text-xs leading-tight text-neutral-900">
                              {poi.name}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {poi.callsign} • {poi.elevation}
                            </span>
                          </div>
                        </div>

                        <span className={`text-xs font-mono font-bold ${isSelected ? "text-[#ff5500]" : "text-neutral-600"}`}>
                          {d.toFixed(0)}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleSelectTarget(TACTICAL_POIS[0])}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Crosshair className="h-3.5 w-3.5 text-[#ff5500]" />
                <span>Return Home (Alpha)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#ff5500] hover:bg-[#e04b00] active:scale-95 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md"
              >
                Resume Flight
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
