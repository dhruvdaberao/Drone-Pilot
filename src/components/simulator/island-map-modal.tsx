"use client";

import React, { useEffect } from "react";
import { TelemetryState } from "@/lib/simulation/types";
import { X, Navigation, Compass, MapPin, Target, Mountain, Building2, Trees, Droplets, Radio, ShieldCheck } from "lucide-react";

interface IslandMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetryState;
  droneName: string;
}

interface PointOfInterest {
  id: string;
  name: string;
  category: "airfield" | "mountain" | "city" | "water" | "forest";
  x: number; // world x (-450 to 450)
  z: number; // world z (-450 to 450)
  elevation: string;
  description: string;
  challenge: string;
}

const POINTS_OF_INTEREST: PointOfInterest[] = [
  {
    id: "airfield",
    name: "Helipad Station Alpha",
    category: "airfield",
    x: 0,
    z: 0,
    elevation: "0.3m AGL",
    description: "Primary aviation launch & recovery platform with precision markings.",
    challenge: "Practice precision landings inside the inner circle.",
  },
  {
    id: "apex",
    name: "Mount Apex Summit",
    category: "mountain",
    x: -180,
    z: -170,
    elevation: "62.0m AGL",
    description: "Highest rocky peak on the island with permanent snow cap and summit radio beacon.",
    challenge: "Climb to 65m and inspect the red warning strobe.",
  },
  {
    id: "city",
    name: "Downtown Metropolis",
    category: "city",
    x: 135,
    z: 140,
    elevation: "58.0m AGL",
    description: "Dense skyscraper financial district featuring 25-58m commercial towers.",
    challenge: "Fly through the narrow skyscraper alley and hoop at 35m.",
  },
  {
    id: "tower",
    name: "48m Comms Lattice Mast",
    category: "city",
    x: 75,
    z: 80,
    elevation: "48.0m AGL",
    description: "High-power radio transmission tower with rotating radar dish and flashing beacon.",
    challenge: "Perform a 360° orbit around the antenna array.",
  },
  {
    id: "lake",
    name: "Crystal Mountain Lake",
    category: "water",
    x: -140,
    z: -50,
    elevation: "0.3m AGL",
    description: "Secluded alpine reservoir feeding the valley river delta.",
    challenge: "Hover 1.5m above the water surface.",
  },
  {
    id: "river_bridge",
    name: "Valley River & Stone Bridge",
    category: "water",
    x: -55,
    z: 65,
    elevation: "1.6m AGL",
    description: "Meandering freshwater channel crossed by a historic stone arched bridge.",
    challenge: "Fly directly beneath the bridge archway.",
  },
  {
    id: "forest",
    name: "Whispering Pines",
    category: "forest",
    x: 120,
    z: -120,
    elevation: "8.0m AGL",
    description: "Vast coniferous forest with 180+ mature pine trees and granite boulders.",
    challenge: "Slalom through the forest canopy without hitting tree branches.",
  },
];

export function IslandMapModal({ isOpen, onClose, telemetry, droneName }: IslandMapModalProps) {
  // ESC key handler to close map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Map coordinate conversion:
  // World space: [-450, 450] in X and Z
  // SVG viewBox: 0 to 900 (where center 450, 450 corresponds to world 0, 0)
  const worldToSvg = (x: number, z: number) => {
    const svgX = 450 + x;
    const svgZ = 450 + z;
    return { x: svgX, y: svgZ };
  };

  const droneSvg = worldToSvg(telemetry.position.x, telemetry.position.z);

  // Convert flight path to SVG polyline points string
  const flightPathPoints = telemetry.flightPath
    ? telemetry.flightPath
        .map((p) => {
          const pt = worldToSvg(p.x, p.z);
          return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        })
        .join(" ")
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 font-mono select-none">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Tactical Card */}
      <div className="relative z-10 w-full max-w-5xl max-h-[94vh] bg-white border-3 border-black rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-900 animate-in zoom-in-95 duration-200">
        
        {/* ==================================================== */}
        {/* MODAL HEADER                                         */}
        {/* ==================================================== */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b-2 border-black bg-neutral-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-extrabold text-sm border-2 border-black shadow-sm">
              <Compass className="h-4 w-4 text-[#FF5500]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-sm sm:text-base tracking-wider uppercase text-neutral-950">
                  Tactical Island Map
                </h2>
                <span className="bg-[#FF5500] text-white text-[10px] font-bold px-2 py-0.5 rounded border border-black uppercase tracking-wider">
                  Live Radar
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 hidden sm:block">
                Archipelago Flight Sector Alpha • Airspace Bounds: 920m x 920m
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Telemetry Pill */}
            <div className="hidden md:flex items-center gap-3 bg-white px-3 py-1 rounded-lg border-2 border-black text-xs font-semibold shadow-sm">
              <div className="flex items-center gap-1.5 text-neutral-800">
                <Navigation className="h-3 w-3 text-[#FF5500]" />
                <span>POS: X {telemetry.position.x.toFixed(0)}m, Z {telemetry.position.z.toFixed(0)}m</span>
              </div>
              <span className="text-neutral-300">|</span>
              <span>ALT: {telemetry.altitude.toFixed(1)}m</span>
              <span className="text-neutral-300">|</span>
              <span>HDG: {telemetry.heading}°</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black text-white hover:bg-neutral-800 active:scale-95 transition-all text-xs font-bold border-2 border-black shadow-md cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Close (Esc)</span>
            </button>
          </div>
        </header>

        {/* ==================================================== */}
        {/* MAP CANVAS & SIDEBAR                                 */}
        {/* ==================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Detailed SVG Map Container */}
          <div className="flex-1 bg-[#bfe3f7] relative overflow-hidden flex items-center justify-center p-2 sm:p-4 min-h-[360px] sm:min-h-[460px]">
            <svg
              viewBox="0 0 900 900"
              className="w-full h-full max-w-[720px] max-h-[720px] rounded-xl border-2 border-black shadow-lg bg-[#0284c7]"
              style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
            >
              <defs>
                {/* Ocean Waves Pattern */}
                <pattern id="ocean-ripples" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 0 20 Q 10 16 20 20 T 40 20" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.35" />
                </pattern>

                {/* Island Turf Texture Pattern */}
                <pattern id="turf-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="1.2" fill="#3d5c36" opacity="0.4" />
                  <circle cx="15" cy="15" r="1.2" fill="#537c49" opacity="0.4" />
                </pattern>

                {/* Radar Sweep Gradient */}
                <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff5500" stopOpacity="0.3" />
                  <stop offset="60%" stopColor="#ff5500" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* 1. Surrounding Ocean Water */}
              <rect width="900" height="900" fill="#0284c7" />
              <rect width="900" height="900" fill="url(#ocean-ripples)" />

              {/* Ocean Depth Rings */}
              <circle cx="450" cy="450" r="440" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.4" />
              <circle cx="450" cy="450" r="410" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 4" opacity="0.3" />

              {/* 2. Sandy Shoreline Bed (Outer Island: R=370) */}
              <ellipse cx="450" cy="450" rx="370" ry="360" fill="#e0c598" stroke="#cca873" strokeWidth="4" />
              {/* Coastal Coves & Bays */}
              <circle cx="310" cy="630" r="80" fill="#e0c598" />
              <circle cx="590" cy="590" r="70" fill="#e0c598" />
              <circle cx="280" cy="310" r="75" fill="#e0c598" />

              {/* 3. Main Island Plateau / Lush Grassland (R=345) */}
              <ellipse cx="450" cy="450" rx="340" ry="330" fill="#476b3f" stroke="#365330" strokeWidth="3" />
              <rect width="900" height="900" fill="url(#turf-dots)" />

              {/* 4. Coastal Bluffs & Hills */}
              <circle cx="230" cy="610" r="55" fill="#5c7255" opacity="0.8" />
              <circle cx="630" cy="240" r="65" fill="#5c7255" opacity="0.8" />
              <circle cx="700" cy="310" r="60" fill="#5c7255" opacity="0.8" />

              {/* 5. Water Bodies: Mountain Lake & Winding River */}
              {/* Mountain Lake (X: -140 -> 310, Z: -50 -> 400) */}
              <circle cx="310" cy="400" r="46" fill="#cca873" />
              <circle cx="310" cy="400" r="42" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="308" cy="398" r="5" fill="#475569" /> {/* Lake rock */}

              {/* Winding River Delta flowing from Lake to Coastal Bay */}
              <path
                d="M 310 400 Q 340 430 380 470 T 400 520 T 385 570 T 365 620 T 325 680 T 290 740"
                fill="none"
                stroke="#cca873"
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 310 400 Q 340 430 380 470 T 400 520 T 385 570 T 365 620 T 325 680 T 290 740"
                fill="none"
                stroke="#0284c7"
                strokeWidth="20"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Stone Arched River Bridge */}
              <rect x="385" y="505" width="22" height="12" rx="2" fill="#64748b" stroke="#1e293b" strokeWidth="1.5" transform="rotate(25 395 515)" />

              {/* South-West Marina Bay & Pier */}
              <rect x="295" y="625" width="8" height="42" fill="#78350f" stroke="#3d1d03" strokeWidth="1" />
              <circle cx="320" cy="685" r="5" fill="#ef4444" stroke="#000" strokeWidth="1" />
              <circle cx="285" cy="700" r="5" fill="#22c55e" stroke="#000" strokeWidth="1" />
              <circle cx="340" cy="725" r="5" fill="#f59e0b" stroke="#000" strokeWidth="1" />

              {/* 6. Mount Apex Mountain Massif (North-West) */}
              {/* Ridge contours */}
              <ellipse cx="270" cy="280" rx="140" ry="120" fill="#334155" opacity="0.5" />
              {/* Individual Peaks */}
              <polygon points="270,218 338,280 202,280" fill="#475569" stroke="#1e293b" strokeWidth="2" />
              <polygon points="270,218 293,239 247,239" fill="#f1f5f9" /> {/* Snow Cap Apex */}
              <polygon points="320,255 376,305 264,305" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
              <polygon points="320,255 338,272 302,272" fill="#f1f5f9" />
              <polygon points="225,315 283,365 167,365" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
              <polygon points="225,315 244,332 206,332" fill="#f1f5f9" />
              <polygon points="355,305 403,347 307,347" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
              <polygon points="290,345 332,381 248,381" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />

              {/* Apex Summit Radio Mast & Strobe */}
              <line x1="270" y1="218" x2="270" y2="202" stroke="#d97706" strokeWidth="2.5" />
              <circle cx="270" cy="200" r="3.5" fill="#ff0000" className="animate-pulse" />

              {/* 7. Whispering Pines Alpine Forest (North-East: 550, 330) */}
              <g fill="#1b4332" opacity="0.9">
                {[
                  [520, 260], [550, 240], [580, 260], [610, 250], [640, 270],
                  [500, 290], [530, 290], [560, 280], [590, 290], [620, 300],
                  [480, 320], [510, 320], [540, 310], [570, 320], [600, 330],
                  [500, 350], [530, 350], [560, 340], [590, 360], [620, 370],
                  [520, 380], [550, 380], [580, 390], [610, 400], [640, 410],
                ].map(([tx, tz], i) => (
                  <polygon key={i} points={`${tx},${tz - 9} ${tx + 6},${tz + 6} ${tx - 6},${tz + 6}`} />
                ))}
              </g>

              {/* 8. Metropolis City & Industrial Park (South-East: 580, 580) */}
              {/* Road Grid */}
              <rect x="560" y="470" width="16" height="230" fill="#1e293b" />
              <rect x="470" y="560" width="230" height="16" fill="#1e293b" />

              {/* Commercial Skyscrapers */}
              {[
                { x: 540, y: 540, w: 24, h: 24, label: "Tower A", color: "#334155" },
                { x: 575, y: 535, w: 28, h: 26, label: "Nexus", color: "#1e293b" },
                { x: 615, y: 545, w: 22, h: 28, label: "Spire", color: "#475569" },
                { x: 535, y: 580, w: 26, h: 26, label: "Commerce", color: "#334155" },
                { x: 575, y: 585, w: 32, h: 30, label: "Apex", color: "#0f172a" },
                { x: 620, y: 585, w: 26, h: 24, label: "Horizon", color: "#334155" },
                { x: 540, y: 625, w: 28, h: 24, label: "Lofts", color: "#475569" },
                { x: 580, y: 635, w: 30, h: 28, label: "Tech", color: "#1e293b" },
                { x: 620, y: 625, w: 24, h: 26, label: "Harbor", color: "#334155" },
              ].map((b, i) => (
                <g key={i}>
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    fill={b.color}
                    stroke="#000"
                    strokeWidth="1.5"
                    rx="2"
                  />
                  {/* Roof Helipad on Apex Center */}
                  {b.label === "Apex" && (
                    <circle cx={b.x + b.w / 2} cy={b.y + b.h / 2} r="8" fill="#111827" stroke="#ff5500" strokeWidth="1.5" />
                  )}
                </g>
              ))}

              {/* 48m Communications Lattice Tower */}
              <g transform="translate(525, 530)">
                <polygon points="0,-12 10,12 -10,12" fill="#d97706" stroke="#000" strokeWidth="1" />
                <line x1="0" y1="-12" x2="0" y2="-18" stroke="#000" strokeWidth="2" />
                <circle cx="0" cy="-18" r="3" fill="#ef4444" className="animate-pulse" />
              </g>

              {/* Industrial Fuel Silos */}
              {[
                [510, 500], [524, 500], [510, 512], [524, 512]
              ].map(([sx, sy], i) => (
                <circle key={i} cx={sx} cy={sy} r="5" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
              ))}

              {/* 9. Central Airfield & Helipad Station (450, 450) */}
              <circle cx="450" cy="450" r="24" fill="#2e3440" stroke="#f59e0b" strokeWidth="2.5" />
              <circle cx="450" cy="450" r="14" fill="none" stroke="#ffffff" strokeWidth="2" />
              {/* Helipad "H" */}
              <text x="450" y="456" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                H
              </text>
              {/* Secondary Pad Bravo */}
              <circle cx="482" cy="450" r="10" fill="#3f4654" stroke="#38bdf8" strokeWidth="1.5" />

              {/* 10. Flight Training Hoops (Orange target circles) */}
              {[
                [495, 495], [530, 530], [400, 410], [340, 370], [300, 320], [585, 570]
              ].map(([hx, hy], i) => (
                <circle key={i} cx={hx} cy={hy} r="6" fill="none" stroke="#ff5500" strokeWidth="2.5" strokeDasharray="3 2" />
              ))}

              {/* 11. Flight Breadcrumb Trail */}
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

              {/* 12. Points of Interest Markers */}
              {POINTS_OF_INTEREST.map((poi) => {
                const pt = worldToSvg(poi.x, poi.z);
                return (
                  <g key={poi.id} className="cursor-pointer group">
                    <circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                    <circle cx={pt.x} cy={pt.y} r="2.5" fill="#ff5500" />
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      fill="#000000"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none bg-white font-sans"
                      style={{ textShadow: "0 0 4px #ffffff, 0 0 4px #ffffff" }}
                    >
                      {poi.name}
                    </text>
                  </g>
                );
              })}

              {/* 13. LIVE DRONE POSITION & HEADING CONE */}
              <g transform={`translate(${droneSvg.x}, ${droneSvg.y})`}>
                {/* Heading radar field-of-view cone */}
                <g transform={`rotate(${telemetry.heading})`}>
                  <path
                    d="M 0 0 L -35 -90 A 90 90 0 0 1 35 -90 Z"
                    fill="url(#radar-glow)"
                  />
                  <line x1="0" y1="0" x2="0" y2="-90" stroke="#ff5500" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                </g>

                {/* Radar Ripple Ping */}
                <circle cx="0" cy="0" r="14" fill="none" stroke="#ff5500" strokeWidth="2" className="animate-ping" opacity="0.6" />

                {/* Drone Symbol (White bordered circle with rotating aircraft chevron) */}
                <circle cx="0" cy="0" r="10" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
                
                {/* Rotating Aircraft Chevron pointing in heading direction */}
                <g transform={`rotate(${telemetry.heading})`}>
                  <path
                    d="M 0 -7 L 5 5 L 0 2 L -5 5 Z"
                    fill="#ff5500"
                    stroke="#000000"
                    strokeWidth="1"
                  />
                </g>
              </g>

              {/* Compass Rose (Top Right) */}
              <g transform="translate(830, 70)">
                <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                <line x1="0" y1="-24" x2="0" y2="24" stroke="#000000" strokeWidth="1.5" />
                <line x1="-24" y1="0" x2="24" y2="0" stroke="#000000" strokeWidth="1.5" />
                <polygon points="0,-24 4,-8 -4,-8" fill="#ff5500" />
                <polygon points="0,24 4,8 -4,8" fill="#475569" />
                <text x="0" y="-12" fill="#ff5500" fontSize="10" fontWeight="bold" textAnchor="middle">N</text>
                <text x="0" y="20" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">S</text>
                <text x="16" y="3" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">E</text>
                <text x="-16" y="3" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">W</text>
              </g>

              {/* Airspace Scale Bar (Bottom Left) */}
              <g transform="translate(40, 850)">
                <rect x="0" y="-14" width="120" height="20" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="3" />
                <line x1="10" y1="-4" x2="110" y2="-4" stroke="#000000" strokeWidth="2" />
                <line x1="10" y1="-8" x2="10" y2="0" stroke="#000000" strokeWidth="2" />
                <line x1="60" y1="-6" x2="60" y2="-2" stroke="#000000" strokeWidth="1" />
                <line x1="110" y1="-8" x2="110" y2="0" stroke="#000000" strokeWidth="2" />
                <text x="60" y="3" fill="#000000" fontSize="7" fontWeight="bold" textAnchor="middle">100 METERS</text>
              </g>
            </svg>
          </div>

          {/* ==================================================== */}
          {/* TACTICAL INFORMATION SIDEBAR                         */}
          {/* ==================================================== */}
          <div className="w-full lg:w-80 bg-neutral-50 border-t-2 lg:border-t-0 lg:border-l-2 border-black flex flex-col justify-between p-4 overflow-y-auto max-h-[40vh] lg:max-h-none text-xs">
            
            {/* 1. Aircraft Avionics Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-300">
                <span className="font-heading font-extrabold uppercase text-neutral-900 tracking-wider">
                  Aircraft Status
                </span>
                <span className="font-bold text-[10px] bg-black text-white px-2 py-0.5 rounded">
                  {droneName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-lg border-2 border-neutral-300">
                  <span className="text-neutral-500 block text-[9px] uppercase font-bold">Flight Mode</span>
                  <strong className="text-neutral-900 font-heading">{telemetry.flightMode}</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border-2 border-neutral-300">
                  <span className="text-neutral-500 block text-[9px] uppercase font-bold">Altitude</span>
                  <strong className="text-neutral-900 font-heading">{telemetry.altitude.toFixed(1)}m</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border-2 border-neutral-300">
                  <span className="text-neutral-500 block text-[9px] uppercase font-bold">Ground Speed</span>
                  <strong className="text-neutral-900 font-heading">{telemetry.groundSpeed.toFixed(1)} km/h</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border-2 border-neutral-300">
                  <span className="text-neutral-500 block text-[9px] uppercase font-bold">Dist from Home</span>
                  <strong className="text-neutral-900 font-heading">{telemetry.distanceFromHome.toFixed(1)}m</strong>
                </div>
              </div>

              {/* 2. Destination Guide & Objectives */}
              <div className="pt-2">
                <span className="font-heading font-extrabold uppercase text-neutral-900 tracking-wider text-[11px] block mb-2">
                  Key Flight Sectors
                </span>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {POINTS_OF_INTEREST.map((poi) => (
                    <div
                      key={poi.id}
                      className="p-2.5 rounded-xl bg-white border-2 border-neutral-300 hover:border-black transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-900 text-xs">
                          {poi.category === "mountain" && <Mountain className="h-3.5 w-3.5 text-slate-600" />}
                          {poi.category === "city" && <Building2 className="h-3.5 w-3.5 text-blue-600" />}
                          {poi.category === "water" && <Droplets className="h-3.5 w-3.5 text-sky-600" />}
                          {poi.category === "forest" && <Trees className="h-3.5 w-3.5 text-emerald-600" />}
                          {poi.category === "airfield" && <Target className="h-3.5 w-3.5 text-[#FF5500]" />}
                          <span>{poi.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                          {poi.elevation}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-600 mt-1 leading-tight">
                        {poi.description}
                      </p>
                      <div className="mt-1 text-[9px] font-bold text-[#FF5500] flex items-center gap-1">
                        <span>🎯 {poi.challenge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="pt-3 border-t border-neutral-300 text-[10px] text-neutral-500 flex items-center justify-between">
              <span>Click ESC or Close to resume flight</span>
              <span className="font-bold text-neutral-900">100% 3D World</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
