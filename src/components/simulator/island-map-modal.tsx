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
    name: "NAV Station Alpha",
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
      <div className="relative z-10 w-full max-w-5xl max-h-[95vh] bg-neutral-900 border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-200 pointer-events-auto">
        
        {/* Header Bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-neutral-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-[#38bdf8] shadow-xs">
              <Compass className="h-4 w-4 text-[#38bdf8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-xl sm:text-xl tracking-wider uppercase text-white">
                  Tactical Island Map
                </h2>
                <span className="bg-blue-900/40 border border-blue-500/30 text-[#38bdf8] text-xl font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
                  Live GPS
                </span>
              </div>
              <p className="text-xl text-white/50 hidden sm:block">
                Island Grid 2.4km × 2.2km • Topographical Architecture & Waypoints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Telemetry Coordinate Pill */}
            <div className="hidden md:flex items-center gap-2.5 bg-neutral-50 px-3 py-1.5 rounded-lg border border-white/10 text-xl text-white/80">
              <span className="text-white/40 text-xl">POS:</span>
              <strong className="text-white font-mono">
                X:{telemetry.position.x.toFixed(0)}m Z:{telemetry.position.z.toFixed(0)}m
              </strong>
              <span className="text-white/20">|</span>
              <span className="text-white/40 text-xl">ALT:</span>
              <strong className="text-[#38bdf8] font-mono">{telemetry.altitude.toFixed(1)}m</strong>
              <span className="text-white/20">|</span>
              <span className="text-white/40 text-xl">HDG:</span>
              <strong className="text-white font-mono">{telemetry.heading}°</strong>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/10 hover:bg-neutral-900/20 active:scale-95 text-white/90 text-xl font-bold border border-white/10 transition-all cursor-pointer"
              title="Close Map (Esc)"
            >
              <X className="h-4 w-4 text-white/60" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </header>

        {/* Map Canvas & Sidebar */}
        <div className="flex-1 flex flex-col landscape:flex-row lg:flex-row overflow-hidden min-h-0">
          
          {/* Main Topographical Map Viewport */}
          <div className="flex-1 bg-neutral-100 relative overflow-hidden flex items-center justify-center p-2 sm:p-4 min-h-[300px] sm:min-h-[480px] landscape:min-h-[200px]">
            
            {/* Multi-Level Zoom Toolbar (100%, 160%, 240%) */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-neutral-900 border border-white/10/90 rounded-xl p-1 shadow-md backdrop-blur-md">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.8, Math.round((z - 0.3) * 10) / 10))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-neutral-950 transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              
              <div className="h-4 w-px bg-neutral-200 mx-0.5" />

              <button
                onClick={() => setZoomLevel(1.0)}
                className={`px-2 py-1 rounded-lg text-xl font-bold font-mono transition-all cursor-pointer ${
                  zoomLevel === 1.0
                    ? "bg-[#38bdf8] text-white shadow-xs"
                    : "text-white/80 hover:bg-white/10"
                }`}
                title="Full Island Overview (100%)"
              >
                100%
              </button>
              <button
                onClick={() => setZoomLevel(1.6)}
                className={`px-2 py-1 rounded-lg text-xl font-bold font-mono transition-all cursor-pointer ${
                  zoomLevel === 1.6
                    ? "bg-[#38bdf8] text-white shadow-xs"
                    : "text-white/80 hover:bg-white/10"
                }`}
                title="Regional Sector View (160%)"
              >
                160%
              </button>
              <button
                onClick={() => setZoomLevel(2.4)}
                className={`px-2 py-1 rounded-lg text-xl font-bold font-mono transition-all cursor-pointer ${
                  zoomLevel === 2.4
                    ? "bg-[#38bdf8] text-white shadow-xs"
                    : "text-white/80 hover:bg-white/10"
                }`}
                title="Tactical Focus View (240%)"
              >
                240%
              </button>

              <div className="h-4 w-px bg-neutral-200 mx-0.5" />

              <button
                onClick={() => setZoomLevel((z) => Math.min(2.8, Math.round((z + 0.3) * 10) / 10))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-neutral-950 transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Topographical SVG Map Canvas */}
            <svg
                viewBox={`0 0 ${SVG_CANVAS_SIZE} ${SVG_CANVAS_SIZE}`}
                className="w-full h-full max-w-[720px] max-h-[720px] rounded-xl border border-white/10 shadow-lg bg-[#030712] transition-transform duration-300 ease-out"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: zoomLevel <= 1.05 ? "center center" : `${droneSvg.x}px ${droneSvg.y}px`,
                }}
              >
                <defs>
                  <pattern id="modal-recon-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.05" />
                  </pattern>

                  <radialGradient id="modal-recon-cone" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                    <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect width={SVG_CANVAS_SIZE} height={SVG_CANVAS_SIZE} fill="#030712" />
                <rect width={SVG_CANVAS_SIZE} height={SVG_CANVAS_SIZE} fill="url(#modal-recon-grid)" />

                {/* Coastline */}
                <path
                  d={mapData.coastlinePath}
                  fill="#0a0a0a"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeOpacity="0.15"
                  strokeLinejoin="round"
                />

                {/* Lake */}
                <circle
                  cx={mapData.waterways.lake.cx}
                  cy={mapData.waterways.lake.cy}
                  r={mapData.waterways.lake.r}
                  fill="#ffffff"
                  fillOpacity="0.03"
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeOpacity="0.1"
                />
                
                {/* River Channel */}
                <path
                  d={mapData.waterways.riverPath}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeOpacity="0.05"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Master Road & Highway Network */}
                <g fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round">
                  {mapData.roads.highways.map((h) => (
                    <path key={h.id} d={h.path} strokeWidth={h.width} />
                  ))}
                  {mapData.roads.connectors.map((c) => (
                    <path key={c.id} d={c.path} strokeWidth={c.width} />
                  ))}
                  {mapData.roads.mountainPasses.map((m) => (
                    <path key={m.id} d={m.path} strokeWidth={m.width} strokeDasharray="5 4" />
                  ))}
                </g>

                {/* Central Airfield & Runway Complex */}
                <g transform="translate(450, 450)">
                  <rect x="-80" y="-12" width="160" height="24" rx="2" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />
                  <line x1="-70" y1="0" x2="70" y2="0" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.8" strokeDasharray="6 5" />
                  <text x="0" y="-18" fill="#ffffff" fillOpacity="0.4" fontSize="12" fontWeight="bold" textAnchor="middle">
                    RUNWAY 09/27
                  </text>
                </g>

                {/* Live Flight Trail */}
                {flightPathPoints && (
                  <polyline
                    points={flightPathPoints}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.65"
                  />
                )}

                {/* Active Waypoint Line */}
                <line
                  x1={droneSvg.x}
                  y1={droneSvg.y}
                  x2={targetSvg.x}
                  y2={targetSvg.y}
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  opacity="0.85"
                />

                {/* Midpoint Distance Tag */}
                <g transform={`translate(${(droneSvg.x + targetSvg.x) / 2}, ${(droneSvg.y + targetSvg.y) / 2})`}>
                  <rect x="-40" y="-14" width="80" height="28" rx="4" fill="#000000" stroke="#ffffff" strokeWidth="1.2" />
                  <text x="0" y="5" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
                    {navStats.dist.toFixed(0)}m
                  </text>
                </g>

                {/* Helipads & Landmarks with Anti-Collision Labels */}
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
                        <circle cx={pt.x} cy={pt.y} r="18" fill="none" stroke="#ffffff" strokeWidth="2" className="animate-ping" opacity="0.75" />
                      )}

                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="12"
                        fill={isSelected ? "#ffffff" : "#000000"}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? "2.5" : "1.5"}
                        strokeOpacity={isSelected ? "1" : "0.5"}
                        className="transition-transform duration-150 group-hover:scale-125 shadow-lg"
                      />
                      <text
                        x={pt.x}
                        y={pt.y + 4}
                        fill={isSelected ? "#000000" : "#ffffff"}
                        fontSize="11"
                        fontWeight="900"
                        textAnchor="middle"
                        className="pointer-events-none"
                      >
                        H
                      </text>

                      {/* Premium Label */}
                      <g transform={`translate(${pt.x + ox}, ${pt.y + oy})`}>
                        <rect
                          x="-70"
                          y="-16"
                          width="140"
                          height="28"
                          rx="4"
                          fill="#000000"
                          fillOpacity="0.8"
                          stroke="#ffffff"
                          strokeOpacity={isSelected ? "1" : "0.3"}
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="4"
                          fill="#ffffff"
                          fontSize="13"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="pointer-events-none shadow-black drop-shadow-md"
                        >
                          {poi.name}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Drone Tracker Reticle */}
                <g transform={`translate(${droneSvg.x}, ${droneSvg.y})`}>
                  <g transform={`rotate(${telemetry.heading})`}>
                    <path d="M 0 0 L -45 -120 A 120 120 0 0 1 45 -120 Z" fill="url(#modal-recon-cone)" />
                  </g>
                  <circle cx="0" cy="0" r="16" fill="none" stroke="#ffffff" strokeWidth="2" className="animate-ping" opacity="0.6" />
                  <circle cx="0" cy="0" r="12" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                  <g transform={`rotate(${telemetry.heading})`}>
                    <path d="M 0 -14 L -7 7 L 0 3 L 7 7 Z" fill="#000000" />
                  </g>
                </g>
              </svg>
          </div>

          {/* Tactical Info & Waypoint Selector Sidebar — White Theme */}
          <div className="w-full landscape:w-72 lg:w-84 bg-neutral-50/90 border-t landscape:border-t-0 landscape:border-l lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between p-4 overflow-y-auto max-h-[40vh] landscape:max-h-none lg:max-h-none text-xl custom-scrollbar">
            
            <div className="space-y-4">
              {/* Active Target Banner */}
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-white/10 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xl font-bold text-white/50 uppercase tracking-wider">
                    <Target className="h-3.5 w-3.5 text-[#38bdf8]" />
                    <span>WAYPOINT TARGET</span>
                  </div>
                  <span className="text-xl font-bold text-[#38bdf8] font-mono bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/30">
                    BEARING {navStats.bearing}°
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <h3 className="font-heading font-extrabold text-xl text-white uppercase">
                    {activeTarget.name}
                  </h3>
                  <strong className="text-xl text-[#38bdf8] font-mono">
                    {navStats.dist.toFixed(0)}m
                  </strong>
                </div>

                <p className="text-xl text-white/60 leading-relaxed">
                  {activeTarget.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xl">
                  <div className="p-2 rounded-lg bg-neutral-50 border border-white/10">
                    <span className="text-white/50 block">EST FLIGHT TIME</span>
                    <strong className="text-white">~{navStats.etaSec}s @ cruise</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-50 border border-white/10">
                    <span className="text-white/50 block">PAD ELEVATION</span>
                    <strong className="text-blue-400">{activeTarget.elevation}</strong>
                  </div>
                </div>
              </div>

              {/* Waypoints & Helipads List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xl font-bold text-white/50 uppercase tracking-wider">
                  <span>DESIGNATED STATIONS ({TACTICAL_POIS.length})</span>
                  <span className="text-white/40">CLICK TO TRACK</span>
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
                            ? "bg-[#38bdf8]/20 border-[#38bdf8] text-white shadow-xs"
                            : "bg-neutral-900 border-white/10 hover:border-neutral-300 hover:bg-white/10 text-white/90"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xl font-mono border ${
                              isSelected
                                ? "bg-[#38bdf8] text-white border-[#38bdf8]"
                                : "bg-neutral-900/10 text-blue-400 border-white/10"
                            }`}
                          >
                            H
                          </span>
                          <div>
                            <span className="font-bold block text-xl leading-tight text-white">
                              {poi.name}
                            </span>
                            <span className="text-xl text-white/50">
                              {poi.callsign} • {poi.elevation}
                            </span>
                          </div>
                        </div>

                        <span className={`text-xl font-mono font-bold ${isSelected ? "text-[#38bdf8]" : "text-white/60"}`}>
                          {d.toFixed(0)}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleSelectTarget(TACTICAL_POIS[0])}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-white/10 text-white/90 border border-white/10 text-xl font-bold transition-all cursor-pointer shadow-xs"
              >
                <Crosshair className="h-3.5 w-3.5 text-[#38bdf8]" />
                <span>Return Home (Alpha)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#38bdf8] hover:bg-[#e04b00] active:scale-95 text-white text-xl font-extrabold transition-all cursor-pointer shadow-md"
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


