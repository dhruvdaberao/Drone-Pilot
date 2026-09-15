"use client";

import React, { useMemo, useState } from "react";
import { RegionDefinition, Helipad, RegionId } from "@/lib/world/world-types";
import { getCoastlineSvgPath, worldToRadarCoords } from "@/lib/world/map-data";
import { REGIONS, REGION_LIST } from "@/lib/world/region-definitions";
import { HELIPADS, HELIPAD_LIST } from "@/lib/world/helipad-definitions";
import { Compass, Crosshair, MapPin, Layers, Radio } from "lucide-react";

interface WorldMapSelectorProps {
  selectedRegionId: RegionId;
  selectedHelipadId: string;
  onSelectRegion: (regionId: RegionId) => void;
  onSelectHelipad: (helipadId: string) => void;
  className?: string;
}

const MAP_SIZE = 700;

export function WorldMapSelector({
  selectedRegionId,
  selectedHelipadId,
  onSelectRegion,
  onSelectHelipad,
  className = "",
}: WorldMapSelectorProps) {
  const [hoveredRegionId, setHoveredRegionId] = useState<RegionId | null>(null);
  const [hoveredHelipadId, setHoveredHelipadId] = useState<string | null>(null);

  // Generate SVG paths
  const islandCoastlinePath = useMemo(() => getCoastlineSvgPath(120, MAP_SIZE), []);

  // Compute region centers in SVG space
  const projectedRegions = useMemo(() => {
    return REGION_LIST.filter((r) => r.id !== "water").map((r) => {
      const pt = worldToRadarCoords(r.center.x, r.center.z, MAP_SIZE);
      const minPt = worldToRadarCoords(r.bounds.minX, r.bounds.minZ, MAP_SIZE);
      const maxPt = worldToRadarCoords(r.bounds.maxX, r.bounds.maxZ, MAP_SIZE);
      const width = Math.abs(maxPt.x - minPt.x);
      const height = Math.abs(maxPt.y - minPt.y);

      return {
        ...r,
        svgX: pt.x,
        svgY: pt.y,
        rectX: Math.min(minPt.x, maxPt.x),
        rectY: Math.min(minPt.y, maxPt.y),
        rectWidth: width,
        rectHeight: height,
      };
    });
  }, []);

  // Compute helipads in SVG space
  const projectedHelipads = useMemo(() => {
    return HELIPAD_LIST.map((h) => {
      const pt = worldToRadarCoords(h.position.x, h.position.z, MAP_SIZE);
      return {
        ...h,
        svgX: pt.x,
        svgY: pt.y,
      };
    });
  }, []);

  const selectedHelipad = HELIPADS[selectedHelipadId];
  const selectedRegion = REGIONS[selectedRegionId];

  return (
    <div
      className={`relative flex flex-col bg-white border-2 border-black rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden font-sans select-none ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 text-white border-b-2 border-black">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-[#FF5500] animate-pulse" />
          <span className="font-heading font-bold text-xs uppercase tracking-wider">
            TACTICAL ARCHIPELAGO RADAR
          </span>
          <span className="font-mono text-[11px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700">
            2000m × 1800m
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-neutral-400">
          <span>DATUM: MSL 0.0m</span>
          <span className="text-neutral-600">•</span>
          <span className="text-[#FF5500] font-semibold">
            ACTIVE: {selectedRegion?.name.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Map SVG Viewport */}
      <div className="relative w-full aspect-square bg-[#0b4b6f] overflow-hidden group">
        {/* Ocean Background Gradient & Grid */}
        <svg
          viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
          className="w-full h-full cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Ocean Water Pattern */}
            <pattern id="ocean-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
            </pattern>

            {/* Island Land Gradient */}
            <linearGradient id="island-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a6842" />
              <stop offset="45%" stopColor="#3d5a37" />
              <stop offset="85%" stopColor="#4e6e44" />
              <stop offset="100%" stopColor="#5a7d4e" />
            </linearGradient>

            {/* Sandy Shoreline Filter */}
            <filter id="shore-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Deep Ocean Grid */}
          <rect width={MAP_SIZE} height={MAP_SIZE} fill="#0d466b" />
          <rect width={MAP_SIZE} height={MAP_SIZE} fill="url(#ocean-grid)" />

          {/* 2. Concentric Radar Distance Rings (Radius: 300m, 600m, 900m, 1200m) */}
          {[150, 300, 450, 600].map((r, i) => (
            <circle
              key={i}
              cx={MAP_SIZE / 2}
              cy={MAP_SIZE / 2}
              r={r * 0.44}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
          ))}

          {/* Crosshair Center Axes */}
          <line
            x1={MAP_SIZE / 2}
            y1={0}
            x2={MAP_SIZE / 2}
            y2={MAP_SIZE}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1"
          />
          <line
            x1={0}
            y1={MAP_SIZE / 2}
            x2={MAP_SIZE}
            y2={MAP_SIZE / 2}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1"
          />

          {/* 3. Sandy Beach Perimeter & Coastal Shelf */}
          <path
            d={islandCoastlinePath}
            fill="none"
            stroke="#d4b581"
            strokeWidth="18"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* 4. Island Landmass Body */}
          <path
            d={islandCoastlinePath}
            fill="url(#island-grad)"
            stroke="#263b22"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* 5. Natural Geographic Features */}
          {/* Mountain Massif Shading (NW) */}
          <path
            d="M 180 230 Q 230 190 310 240 Q 280 320 200 310 Z"
            fill="rgba(40, 50, 60, 0.45)"
            stroke="rgba(200, 215, 230, 0.3)"
            strokeWidth="1.5"
          />
          <text
            x="240"
            y="250"
            fill="rgba(255, 255, 255, 0.5)"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="2"
          >
            ▲ MT. APEX (85m)
          </text>

          {/* River Estuary Arc */}
          <path
            d="M 310 280 Q 290 360 300 420 Q 320 480 280 540"
            fill="none"
            stroke="#0284c7"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* 6. Region Highlight Zones */}
          {projectedRegions.map((region) => {
            const isSelected = region.id === selectedRegionId;
            const isHovered = region.id === hoveredRegionId;

            return (
              <g
                key={region.id}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectRegion(region.id)}
                onMouseEnter={() => setHoveredRegionId(region.id)}
                onMouseLeave={() => setHoveredRegionId(null)}
              >
                {/* Bounding Area Tint */}
                <rect
                  x={region.rectX}
                  y={region.rectY}
                  width={region.rectWidth}
                  height={region.rectHeight}
                  rx="16"
                  fill={isSelected ? region.mapColor : isHovered ? "rgba(255,255,255,0.15)" : "transparent"}
                  fillOpacity={isSelected ? 0.28 : isHovered ? 0.15 : 0}
                  stroke={isSelected ? region.mapColor : isHovered ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)"}
                  strokeWidth={isSelected ? 2.5 : 1}
                  strokeDasharray={isSelected ? "none" : "4 4"}
                />

                {/* Region Center Label Pin */}
                <g transform={`translate(${region.svgX}, ${region.svgY})`}>
                  <rect
                    x="-45"
                    y="-12"
                    width="90"
                    height="24"
                    rx="12"
                    fill={isSelected ? "#000000" : "rgba(20, 20, 20, 0.85)"}
                    stroke={isSelected ? "#FF5500" : "rgba(255,255,255,0.3)"}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={isSelected ? "#FF5500" : "#ffffff"}
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                    letterSpacing="0.5"
                  >
                    {region.shortName.toUpperCase()}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 7. Helipads Beacons Layer */}
          {projectedHelipads.map((helipad) => {
            const isSelected = helipad.id === selectedHelipadId;
            const isParentRegion = helipad.regionId === selectedRegionId;
            const isHovered = helipad.id === hoveredHelipadId;

            return (
              <g
                key={helipad.id}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRegion(helipad.regionId);
                  onSelectHelipad(helipad.id);
                }}
                onMouseEnter={() => setHoveredHelipadId(helipad.id)}
                onMouseLeave={() => setHoveredHelipadId(null)}
              >
                {/* Pulsing Selection Target Reticle for Selected Helipad */}
                {isSelected && (
                  <g transform={`translate(${helipad.svgX}, ${helipad.svgY})`}>
                    <circle
                      r="22"
                      fill="none"
                      stroke="#FF5500"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-spin"
                      style={{ animationDuration: "8s" }}
                    />
                    <circle
                      r="16"
                      fill="none"
                      stroke="#FF5500"
                      strokeWidth="1.5"
                      opacity="0.8"
                    />
                    <line x1="-26" y1="0" x2="26" y2="0" stroke="#FF5500" strokeWidth="1.5" />
                    <line x1="0" y1="-26" x2="0" y2="26" stroke="#FF5500" strokeWidth="1.5" />
                  </g>
                )}

                {/* Helipad Symbol Base */}
                <circle
                  cx={helipad.svgX}
                  cy={helipad.svgY}
                  r={isSelected ? 9 : isParentRegion ? 7 : 5.5}
                  fill={isSelected ? "#FF5500" : isParentRegion ? "#ffffff" : "rgba(255, 255, 255, 0.7)"}
                  stroke="#000000"
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* 'H' Symbol */}
                {(isParentRegion || isSelected) && (
                  <text
                    x={helipad.svgX}
                    y={helipad.svgY + 3.5}
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "#000000"}
                    fontSize={isSelected ? "9" : "7.5"}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    H
                  </text>
                )}

                {/* Hover Tactical Tooltip */}
                {(isHovered || (isSelected && isParentRegion)) && (
                  <g transform={`translate(${helipad.svgX}, ${helipad.svgY - 20})`}>
                    <rect
                      x="-65"
                      y="-16"
                      width="130"
                      height="18"
                      rx="4"
                      fill="#000000"
                      stroke="#FF5500"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="-4"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {helipad.name.split(" ")[0]} ({helipad.elevation}m)
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 8. Map Compass Rose (Top Right) */}
          <g transform={`translate(${MAP_SIZE - 45}, 45)`}>
            <circle r="22" fill="rgba(10, 15, 25, 0.7)" stroke="#ffffff" strokeWidth="1" />
            <polygon points="0,-16 5,0 0,2 -5,0" fill="#FF5500" />
            <polygon points="0,16 5,0 0,-2 -5,0" fill="#ffffff" opacity="0.6" />
            <text
              x="0"
              y="-6"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="7"
              fontWeight="bold"
              fontFamily="monospace"
            >
              N
            </text>
          </g>

          {/* 9. Distance Scale Bar (Bottom Left) */}
          <g transform={`translate(24, ${MAP_SIZE - 28})`}>
            <rect x="0" y="0" width="88" height="14" fill="rgba(0,0,0,0.6)" rx="3" />
            <line x1="8" y1="7" x2="80" y2="7" stroke="#ffffff" strokeWidth="2" />
            <line x1="8" y1="4" x2="8" y2="10" stroke="#ffffff" strokeWidth="2" />
            <line x1="80" y1="4" x2="80" y2="10" stroke="#ffffff" strokeWidth="2" />
            <text x="44" y="-3" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">
              200 METERS
            </text>
          </g>
        </svg>

        {/* Selected Spawn Overlay Badge */}
        {selectedHelipad && (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md border-2 border-black rounded-xl p-2.5 shadow-md flex items-center gap-2.5 max-w-[260px]">
            <div className="p-2 rounded-lg bg-orange-50 border border-orange-200 shrink-0">
              <Crosshair className="h-4 w-4 text-[#FF5500]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                TARGET SPAWN POINT
              </span>
              <strong className="text-xs font-heading font-bold text-neutral-900 truncate block">
                {selectedHelipad.name}
              </strong>
              <span className="text-[10px] font-mono text-neutral-600 block">
                ALT: {selectedHelipad.elevation.toFixed(1)}m • {selectedHelipad.surfaceType.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Region Quick Filter Bar */}
      <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" /> SECTORS:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {REGION_LIST.filter((r) => r.id !== "water").map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRegion(r.id)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all ${
                r.id === selectedRegionId
                  ? "bg-black text-white shadow-sm"
                  : "bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300"
              }`}
            >
              {r.shortName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
