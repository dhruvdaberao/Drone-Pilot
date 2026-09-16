// ==========================================================
// DRONE PILOT — TACTICAL ISLAND RECONNAISSANCE MAP (AAA SPEC)
// Professional military/aviation topographical reconnaissance map
// with contour elevation lines, satellite terrain shading, active waypoint targeting,
// interactive zoom/pan, single sleek close button, and zero overlapping clutter.
// ==========================================================

"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { TelemetryState } from "@/lib/simulation/types";
import {
  X,
  Navigation,
  Compass,
  MapPin,
  Target,
  Mountain,
  Building2,
  Trees,
  Droplets,
  Radio,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Layers,
  Plane,
} from "lucide-react";
import { getCoastlineSvgPath } from "@/lib/world/map-data";
import { HELIPAD_LIST } from "@/lib/world/helipad-definitions";
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

const TACTICAL_POIS: TacticalPOI[] = [
  {
    id: "training-alpha",
    name: "Helipad Station Alpha",
    callsign: "BASE-01",
    category: "airfield",
    x: 0,
    z: 0,
    elevation: "1.2m AGL",
    elevationMeters: 1.2,
    description: "Central Flight Academy asphalt runway & primary drone apron.",
    labelOffsetX: 0,
    labelOffsetY: -24,
  },
  {
    id: "mountain-apex",
    name: "Mount Apex Weather Station",
    callsign: "APEX-WX",
    category: "mountain",
    x: -480,
    z: -450,
    elevation: "28.5m AGL",
    elevationMeters: 28.5,
    description: "North-west granite mountain ridge with meteorological telemetry mast.",
    labelOffsetX: 0,
    labelOffsetY: -24,
  },
  {
    id: "forest-outpost",
    name: "Forest Ranger Station",
    callsign: "PINES-04",
    category: "forest",
    x: 450,
    z: -420,
    elevation: "4.0m AGL",
    elevationMeters: 4.0,
    description: "Coniferous timber outpost nestled in a dense pine forest clearing.",
    labelOffsetX: 0,
    labelOffsetY: -24,
  },
  {
    id: "downtown-heliport",
    name: "Downtown Heliport Plaza",
    callsign: "METRO-01",
    category: "city",
    x: 520,
    z: 380,
    elevation: "2.5m AGL",
    elevationMeters: 2.5,
    description: "Municipal vertiport situated between corporate skyscrapers.",
    labelOffsetX: -36,
    labelOffsetY: 26, // Placed below and left
  },
  {
    id: "city-rooftop",
    name: "Apex Center Skyport",
    callsign: "ROOF-TOP",
    category: "city",
    x: 560,
    z: 410,
    elevation: "58.5m AGL",
    elevationMeters: 58.5,
    description: "Elevated high-rise skyport atop the tallest island skyscraper.",
    labelOffsetX: 40,
    labelOffsetY: -26, // Placed above and right (no collision with METRO-01)
  },
  {
    id: "valley-bridge",
    name: "Valley Bridge Station",
    callsign: "RIVER-02",
    category: "water",
    x: -120,
    z: 120,
    elevation: "2.5m AGL",
    elevationMeters: 2.5,
    description: "Riverside observation platform adjacent to historic stone arch bridge.",
    labelOffsetX: 0,
    labelOffsetY: 26, // Placed below the bridge
  },
  {
    id: "harbor-cargo",
    name: "Harbor Cargo Apron",
    callsign: "PORT-DOCK",
    category: "industrial",
    x: 120,
    z: 620,
    elevation: "1.8m AGL",
    elevationMeters: 1.8,
    description: "Logistics shipping terminal bordered by fuel silos and container cranes.",
    labelOffsetX: 0,
    labelOffsetY: 24,
  },
  {
    id: "pelican-cove",
    name: "Pelican Cove Marine Station",
    callsign: "COVE-MED",
    category: "water",
    x: -580,
    z: 320,
    elevation: "1.5m AGL",
    elevationMeters: 1.5,
    description: "South-west coastal cove pad overlooking turquoise shallow reefs.",
    labelOffsetX: -20,
    labelOffsetY: 24,
  },
];

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
  const [hoveredPoi, setHoveredPoi] = useState<TacticalPOI | null>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const coastlinePath900 = useMemo(() => getCoastlineSvgPath(128, 900), []);

  // Map coordinate conversion: World [-1100, 1100] -> SVG [0, 900]
  const worldToSvg = (x: number, z: number) => {
    const scale = (900 * 0.44) / 1100;
    const svgX = 450 + x * scale;
    const svgZ = 450 + z * scale;
    return { x: svgX, y: svgZ };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-mono select-none">
      {/* Click outside backdrop to close */}
      <div
        className="absolute inset-0 cursor-pointer pointer-events-auto"
        onClick={onClose}
        aria-label="Close Map Backdrop"
      />

      {/* Main Recon Panel Container */}
      <div className="relative z-10 w-full max-w-5xl max-h-[95vh] bg-neutral-950 border-2 border-neutral-700/80 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(255,85,0,0.15)] flex flex-col overflow-hidden text-neutral-100 animate-in zoom-in-95 duration-200 pointer-events-auto">
        
        {/* ==================================================== */}
        {/* MODAL HEADER: SINGLE SLEEK CLOSE BUTTON               */}
        {/* ==================================================== */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-800 bg-neutral-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[#ff5500] shadow-inner">
              <Compass className="h-4 w-4 text-[#ff5500]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-sm sm:text-base tracking-wider uppercase text-white">
                  Tactical Island Reconnaissance
                </h2>
                <span className="bg-[#ff5500]/20 border border-[#ff5500]/60 text-[#ff5500] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500] animate-ping" />
                  Live GPS
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 hidden sm:block">
                Grid System 920m × 920m • Real-Time Satellite Topography & Waypoint Navigation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Telemetry Coordinate Pill */}
            <div className="hidden md:flex items-center gap-2.5 bg-black/60 px-3 py-1.5 rounded-lg border border-neutral-700/80 text-xs">
              <span className="text-neutral-400 text-[10px]">POS:</span>
              <strong className="text-white font-mono">
                X:{telemetry.position.x.toFixed(0)}m Z:{telemetry.position.z.toFixed(0)}m
              </strong>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-400 text-[10px]">ALT:</span>
              <strong className="text-[#ff5500] font-mono">{telemetry.altitude.toFixed(1)}m</strong>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-400 text-[10px]">HDG:</span>
              <strong className="text-white font-mono">{telemetry.heading}°</strong>
            </div>

            {/* SINGLE Sleek Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white text-xs font-bold border border-neutral-600 shadow-md transition-all cursor-pointer"
              title="Close Map (Esc)"
            >
              <X className="h-4 w-4 text-neutral-300" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </header>

        {/* ==================================================== */}
        {/* MAP CANVAS & SIDEBAR                                 */}
        {/* ==================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* Main Topographical Map Viewport */}
          <div className="flex-1 bg-[#050811] relative overflow-hidden flex items-center justify-center p-2 sm:p-4 min-h-[350px] sm:min-h-[480px]">
            
            {/* Interactive Zoom Toolbar (Top-Left of Map) */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-1 shadow-xl backdrop-blur-md">
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.3))}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.3))}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <div className="h-4 w-px bg-neutral-700 mx-0.5" />
              <button
                onClick={() => setZoomLevel(1.0)}
                className="px-2 py-1 rounded-lg hover:bg-neutral-800 text-[10px] font-bold text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Reset View (100%)"
              >
                100%
              </button>
            </div>

            {/* Topographical SVG Map Canvas */}
            <svg
              viewBox="0 0 900 900"
              className="w-full h-full max-w-[720px] max-h-[720px] rounded-xl border border-neutral-800/80 shadow-2xl bg-[#081726] transition-transform duration-300 ease-out"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: `${droneSvg.x}px ${droneSvg.y}px`,
              }}
            >
              <defs>
                {/* Tactical Maritime Radar Grid */}
                <pattern id="recon-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#132a45" strokeWidth="0.8" opacity="0.6" />
                </pattern>

                {/* Radar Vision Cone */}
                <radialGradient id="recon-cone" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff5500" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#ff5500" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* 1. Deep Maritime Ocean Water */}
              <rect width="900" height="900" fill="#081726" />
              <rect width="900" height="900" fill="url(#recon-grid)" />

              {/* Bathymetry Range Rings */}
              <circle cx="450" cy="450" r="440" fill="none" stroke="#164e63" strokeWidth="1" strokeDasharray="6 8" opacity="0.4" />
              <circle cx="450" cy="450" r="390" fill="none" stroke="#164e63" strokeWidth="1" strokeDasharray="3 5" opacity="0.3" />
              <circle cx="450" cy="450" r="260" fill="none" stroke="#164e63" strokeWidth="1" strokeDasharray="2 4" opacity="0.25" />

              {/* 2. Shallow Coral Reef Turquoise Water Shelf */}
              <path
                d={coastlinePath900}
                fill="none"
                stroke="#0d4a6e"
                strokeWidth="24"
                strokeLinejoin="round"
                opacity="0.85"
              />

              {/* 3. Natural Golden Sand Beach Coastline */}
              <path
                d={coastlinePath900}
                fill="#dfc086"
                stroke="#c29d5b"
                strokeWidth="8"
                strokeLinejoin="round"
              />

              {/* 4. Natural Island Landmass (SOLID LUSH GREEN - NO HEAT MAP GRADIENTS) */}
              <path
                d={coastlinePath900}
                fill="#1b3d2b"
                stroke="#2d5e3f"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Central Plains Meadow Zone around Airfield */}
              <ellipse cx="450" cy="450" rx="190" ry="130" fill="#254d37" opacity="0.8" />

              {/* Topographical Elevation Isolines (Thin & Clean) */}
              <g transform="translate(450, 450) scale(0.78) translate(-450, -450)" opacity="0.35">
                <path d={coastlinePath900} fill="none" stroke="#4ade80" strokeWidth="1.2" strokeDasharray="4 4" />
              </g>
              <g transform="translate(450, 450) scale(0.58) translate(-450, -450)" opacity="0.30">
                <path d={coastlinePath900} fill="none" stroke="#a3e635" strokeWidth="1.2" strokeDasharray="4 4" />
              </g>
              <g transform="translate(450, 450) scale(0.38) translate(-450, -450)" opacity="0.30">
                <path d={coastlinePath900} fill="none" stroke="#facc15" strokeWidth="1.2" strokeDasharray="4 4" />
              </g>

              {/* 5. Natural Regional Biomes */}
              {/* NORTH-WEST MOUNTAIN APEX MASSIF */}
              <g transform="translate(277, 288)">
                <ellipse cx="0" cy="0" rx="100" ry="80" fill="#2e3b4e" stroke="#475569" strokeWidth="1.5" />
                <ellipse cx="-10" cy="-8" rx="68" ry="52" fill="#3b4b5e" stroke="#64748b" strokeWidth="1.2" />
                <ellipse cx="-18" cy="-12" rx="40" ry="30" fill="#4d5f75" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="-20" cy="-14" r="16" fill="#e2e8f0" opacity="0.9" />
                <text x="-20" y="-10" fill="#0f172a" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="monospace">62m</text>
                <text x="-20" y="6" fill="#cbd5e1" fontSize="7" fontWeight="bold" textAnchor="middle">MT APEX</text>
              </g>

              {/* NORTH-EAST CONIFEROUS PINE FOREST */}
              <g transform="translate(612, 298)">
                <ellipse cx="0" cy="0" rx="90" ry="75" fill="#133621" opacity="0.95" stroke="#164e2a" strokeWidth="1.2" />
                {/* Forest canopy clusters */}
                <circle cx="-30" cy="-20" r="18" fill="#0e2919" opacity="0.8" />
                <circle cx="25" cy="-25" r="22" fill="#0e2919" opacity="0.8" />
                <circle cx="-15" cy="20" r="24" fill="#0e2919" opacity="0.8" />
                <circle cx="30" cy="20" r="19" fill="#0e2919" opacity="0.8" />
                <text x="0" y="-45" fill="#86efac" fontSize="8" fontWeight="bold" textAnchor="middle" opacity="0.9">PINES WOODLAND</text>
              </g>

              {/* ALPINE LAKE & VALLEY RIVER ESTUARY */}
              <circle cx="390" cy="400" r="28" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
              <text x="390" y="403" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">LAKE</text>
              {/* Natural Winding River Channel */}
              <path
                d="M 390 425 Q 402 460 406 493 T 392 560 T 360 630 T 310 735"
                fill="none"
                stroke="#0c4a6e"
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 390 425 Q 402 460 406 493 T 392 560 T 360 630 T 310 735"
                fill="none"
                stroke="#0284c7"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 6. High-Visibility Road & Highway Network */}
              {/* Highway Casing (Dark Asphalt Border) */}
              <g fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 450 450 L 406 493" />
                <path d="M 406 493 Q 320 520 241 565" />
                <path d="M 406 493 Q 440 580 493 673" />
                <path d="M 493 673 Q 570 650 637 586" />
                <path d="M 637 586 Q 660 440 612 298" />
                <path d="M 612 298 Q 450 240 277 288" />
                <path d="M 277 288 Q 340 360 450 450" />
              </g>
              {/* Highway Surface (High-Visibility Yellow) */}
              <g fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 450 450 L 406 493" />
                <path d="M 406 493 Q 320 520 241 565" />
                <path d="M 406 493 Q 440 580 493 673" />
                <path d="M 493 673 Q 570 650 637 586" />
                <path d="M 637 586 Q 660 440 612 298" />
                <path d="M 612 298 Q 450 240 277 288" />
                <path d="M 277 288 Q 340 360 450 450" />
              </g>

              {/* Concrete Highway River Bridge */}
              <rect x="396" y="487" width="20" height="12" rx="2" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.5" transform="rotate(-15 406 493)" />

              {/* 7. Central Airfield & Runway Complex */}
              <g transform="translate(450, 450)">
                {/* Airfield Apron Pad */}
                <polygon points="-90,-25 90,-25 100,25 -100,25" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                {/* 240m Runway Strip */}
                <rect x="-95" y="-14" width="190" height="28" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
                {/* Runway Centerline */}
                <line x1="-80" y1="0" x2="80" y2="0" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="6 5" />
                {/* Threshold Markings */}
                <line x1="-88" y1="-10" x2="-88" y2="10" stroke="#ffffff" strokeWidth="2.5" />
                <line x1="88" y1="-10" x2="88" y2="10" stroke="#ffffff" strokeWidth="2.5" />
                {/* Runway Headings */}
                <text x="-80" y="4" fill="#ffffff" fontSize="7" fontWeight="900" textAnchor="middle">09</text>
                <text x="80" y="4" fill="#ffffff" fontSize="7" fontWeight="900" textAnchor="middle">27</text>
                {/* Airport Hangars */}
                <rect x="-70" y="-36" width="22" height="15" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
                <rect x="-42" y="-36" width="22" height="15" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
                <rect x="-14" y="-36" width="22" height="15" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
                <text x="-31" y="-26" fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle">HANGARS</text>
                {/* Control Tower */}
                <circle cx="45" cy="-30" r="7" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
                <circle cx="45" cy="-30" r="2" fill="#ffffff" />
              </g>

              {/* 8. Downtown Metropolis & Harbor Marina */}
              <g transform="translate(640, 590)">
                {/* Paved City District Base */}
                <rect x="-65" y="-65" width="130" height="110" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                {/* City Streets Grid */}
                <line x1="-65" y1="-15" x2="65" y2="-15" stroke="#334155" strokeWidth="5" />
                <line x1="-65" y1="20" x2="65" y2="20" stroke="#334155" strokeWidth="5" />
                <line x1="-15" y1="-65" x2="-15" y2="45" stroke="#334155" strokeWidth="5" />
                <line x1="25" y1="-65" x2="25" y2="45" stroke="#334155" strokeWidth="5" />
                {/* Skyscraper 1: Bank Tower */}
                <rect x="-55" y="-55" width="32" height="32" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                {/* Skyscraper 2: Tech Center */}
                <rect x="32" y="-55" width="26" height="32" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                {/* Skyscraper 3: Apex High-Rise Tower with Rooftop Skyport */}
                <rect x="10" y="2" width="34" height="34" rx="2" fill="#020617" stroke="#ff5500" strokeWidth="2" />
                <text x="27" y="22" fill="#ff5500" fontSize="7" fontWeight="900" textAnchor="middle">APEX</text>
                {/* Commercial Building 4 */}
                <rect x="-55" y="-7" width="32" height="24" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
              </g>

              {/* Harbor Cargo Apron & Shipping Marina Piers */}
              <g transform="translate(493, 673)">
                <rect x="-18" y="-12" width="36" height="24" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
                {/* Wooden Docks extending into ocean */}
                <rect x="-8" y="12" width="6" height="32" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                <rect x="6" y="12" width="6" height="40" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                {/* Colored Shipping Containers */}
                <rect x="-15" y="-8" width="10" height="5" fill="#dc2626" />
                <rect x="-15" y="-1" width="10" height="5" fill="#0284c7" />
                <rect x="2" y="-8" width="10" height="5" fill="#eab308" />
              </g>

              {/* 9. Live Flight Trail Path */}
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

              {/* 10. Active Waypoint Navigation Vector Line */}
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

              {/* 11. Canonical Helipads with Anti-Collision Labels */}
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
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle cx={pt.x} cy={pt.y} r="18" fill="none" stroke="#ff5500" strokeWidth="2" className="animate-ping" opacity="0.75" />
                    )}

                    {/* Helipad Round Concrete Marker */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="10"
                      fill={isSelected ? "#ff5500" : "#0f172a"}
                      stroke={isSelected ? "#ffffff" : "#22c55e"}
                      strokeWidth={isSelected ? "2.5" : "2"}
                      className="transition-transform duration-150 group-hover:scale-125 shadow-lg"
                    />

                    {/* Helipad Symbol [H] */}
                    <text
                      x={pt.x}
                      y={pt.y + 3.5}
                      fill={isSelected ? "#000000" : "#22c55e"}
                      fontSize="10"
                      fontWeight="900"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      H
                    </text>

                    {/* Anti-Collision Offset Callout Badge */}
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
                        fontFamily="monospace"
                      >
                        {poi.callsign} • {poi.elevation}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 12. Live Drone Marker & Radar Sweep Vision Cone */}
              <g transform={`translate(${droneSvg.x}, ${droneSvg.y})`}>
                {/* Vision Field-of-View Cone */}
                <g transform={`rotate(${telemetry.heading})`}>
                  <path d="M 0 0 L -35 -100 A 100 100 0 0 1 35 -100 Z" fill="url(#recon-cone)" />
                  <line x1="0" y1="0" x2="0" y2="-100" stroke="#ff5500" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.9" />
                </g>

                {/* Drone Core Rings */}
                <circle cx="0" cy="0" r="14" fill="none" stroke="#ff5500" strokeWidth="2" className="animate-ping" opacity="0.6" />
                <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
                
                {/* Heading Chevron */}
                <g transform={`rotate(${telemetry.heading})`}>
                  <polygon points="0,-8 5,5 0,2 -5,5" fill="#ff5500" stroke="#000000" strokeWidth="0.8" />
                </g>
              </g>
            </svg>
          </div>

          {/* ==================================================== */}
          {/* TACTICAL INFORMATION & WAYPOINT SELECTOR SIDEBAR     */}
          {/* ==================================================== */}
          <div className="w-full lg:w-84 bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col justify-between p-4 overflow-y-auto max-h-[40vh] lg:max-h-none text-xs">
            
            <div className="space-y-4">
              {/* Active Target Banner */}
              <div className="p-3 rounded-xl bg-black/60 border border-[#ff5500]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    <Target className="h-3.5 w-3.5 text-[#ff5500]" />
                    <span>NAVIGATION WAYPOINT</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#ff5500] font-mono bg-orange-950/60 px-2 py-0.5 rounded border border-[#ff5500]/40">
                    BEARING {navStats.bearing}°
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <h3 className="font-heading font-extrabold text-sm text-white uppercase">
                    {activeTarget.name}
                  </h3>
                  <strong className="text-base text-[#ff5500] font-mono">
                    {navStats.dist.toFixed(0)}m
                  </strong>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {activeTarget.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-1.5 rounded bg-neutral-800/80 border border-neutral-700">
                    <span className="text-neutral-500 block">EST FLIGHT TIME</span>
                    <strong className="text-white">~{navStats.etaSec}s @ cruise</strong>
                  </div>
                  <div className="p-1.5 rounded bg-neutral-800/80 border border-neutral-700">
                    <span className="text-neutral-500 block">PAD ELEVATION</span>
                    <strong className="text-emerald-400">{activeTarget.elevation}</strong>
                  </div>
                </div>
              </div>

              {/* Waypoints & Helipads List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span>DESIGNATED LANDING SITES ({TACTICAL_POIS.length})</span>
                  <span className="text-neutral-500">CLICK TO TRACK</span>
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
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-[#ff5500]/15 border-[#ff5500] text-white"
                            : "bg-neutral-800/50 border-neutral-700/60 hover:bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] font-mono border ${
                              isSelected
                                ? "bg-[#ff5500] text-black border-[#ff5500]"
                                : "bg-neutral-900 text-[#22c55e] border-neutral-700"
                            }`}
                          >
                            H
                          </span>
                          <div>
                            <span className="font-bold block text-xs leading-tight">
                              {poi.name}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {poi.callsign} • {poi.elevation}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-bold text-neutral-300">
                          {d.toFixed(0)}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleSelectTarget(TACTICAL_POIS[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold transition-all cursor-pointer"
              >
                <Crosshair className="h-3.5 w-3.5 text-[#ff5500]" />
                <span>Return Home (Alpha)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-extrabold transition-all cursor-pointer"
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
