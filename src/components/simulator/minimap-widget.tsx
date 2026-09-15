// ==========================================================
// DRONE PILOT — TACTICAL MINIMAP RADAR WIDGET
// Renders the natural irregular island coastline & real-time telemetry
// ==========================================================

"use client";

import React, { useMemo } from "react";
import { TelemetryState } from "@/lib/simulation/types";
import { worldToRadarCoords, getTacticalMapData } from "@/lib/world/map-data";

interface MinimapWidgetProps {
  telemetry: TelemetryState;
  onClick: () => void;
}

export function MinimapWidget({ telemetry, onClick }: MinimapWidgetProps) {
  const mapData = useMemo(() => getTacticalMapData(200), []);
  const dronePos = worldToRadarCoords(telemetry.position.x, telemetry.position.z, 200);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Open Full Island Map"
      className="group relative cursor-pointer pointer-events-auto select-none transition-all duration-200 hover:scale-105 active:scale-95"
      title="Click to open Full Island Tactical Map (M)"
    >
      {/* Outer Circular Radar Container with Black Border */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-2 sm:border-3 border-black shadow-xl overflow-hidden relative flex items-center justify-center">
        {/* Radar SVG Graphic */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* 1. Surrounding Ocean Expanse */}
          <rect width="200" height="200" fill="#0284c7" />

          {/* 2. Natural Irregular Coastline — Sandy Beach Shelf */}
          <path
            d={mapData.coastlinePath}
            fill="#deb887"
            stroke="#d4a373"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* 3. Natural Irregular Island — Turf Landmass (scaled slightly inside) */}
          <g transform="translate(100, 100) scale(0.92) translate(-100, -100)">
            <path
              d={mapData.coastlinePath}
              fill="#476b3f"
              stroke="#34522d"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>

          {/* 4. Key Region Geographic Anchors */}
          {/* Mountain Massif (North-West) */}
          <polygon points="56,48 70,62 44,62" fill="#475569" />
          <polygon points="56,48 61,53 51,53" fill="#ffffff" />
          <polygon points="68,56 78,66 58,66" fill="#475569" />

          {/* Forest Pines (North-East) */}
          <g fill="#1a361a">
            <polygon points="132,58 136,66 128,66" />
            <polygon points="144,52 148,60 140,60" />
            <polygon points="152,60 156,68 148,68" />
            <polygon points="138,68 142,76 134,76" />
          </g>

          {/* Downtown Metropolis (South-East) */}
          <g fill="#1e293b" stroke="#000000" strokeWidth="0.5">
            <rect x="134" y="124" width="8" height="8" rx="1" />
            <rect x="145" y="122" width="9" height="10" rx="1" fill="#0f172a" />
            <rect x="136" y="135" width="7" height="8" rx="1" />
          </g>

          {/* Harbor Industrial (South) */}
          <g fill="#d97706" opacity="0.85">
            <rect x="105" y="146" width="10" height="6" rx="1" />
            <circle cx="102" cy="154" r="3" />
          </g>

          {/* 5. Central Academy Launchpad Alpha (Origin) */}
          <circle cx="100" cy="100" r="4.5" fill="#242831" stroke="#f59e0b" strokeWidth="1.2" />
          <text
            x="100"
            y="102"
            fill="#ffffff"
            fontSize="4.5"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            H
          </text>

          {/* 6. Radar Concentric Rings & Crosshairs */}
          <circle cx="100" cy="100" r="40" fill="none" stroke="#000000" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.35" />
          <circle cx="100" cy="100" r="75" fill="none" stroke="#000000" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.35" />
          <line x1="100" y1="8" x2="100" y2="192" stroke="#000000" strokeWidth="0.5" opacity="0.25" />
          <line x1="8" y1="100" x2="192" y2="100" stroke="#000000" strokeWidth="0.5" opacity="0.25" />

          {/* 7. Cardinal North Indicator */}
          <polygon points="100,5 103.5,12 96.5,12" fill="#ff5500" stroke="#000000" strokeWidth="0.5" />
          <text x="100" y="20" fill="#ff5500" fontSize="8" fontWeight="extrabold" textAnchor="middle" fontFamily="sans-serif">
            N
          </text>

          {/* 8. Live Drone Position Marker & Heading Chevron */}
          <g transform={`translate(${dronePos.x}, ${dronePos.y})`}>
            {/* Range Pulse */}
            <circle cx="0" cy="0" r="6" fill="none" stroke="#ff5500" strokeWidth="1.2" opacity="0.75" />

            {/* Drone Center Core */}
            <circle cx="0" cy="0" r="3.2" fill="#000000" stroke="#ffffff" strokeWidth="1" />

            {/* Heading Pointer Chevron */}
            <g transform={`rotate(${telemetry.heading})`}>
              <polygon points="0,-9 -4,-4 4,-4" fill="#ff5500" stroke="#000000" strokeWidth="0.5" />
            </g>
          </g>
        </svg>

        {/* Hover Icon Indicator */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow">
            EXPAND
          </span>
        </div>
      </div>
    </div>
  );
}
