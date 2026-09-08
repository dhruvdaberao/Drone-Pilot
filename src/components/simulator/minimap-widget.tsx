"use client";

import React from "react";
import { TelemetryState } from "@/lib/simulation/types";
import { Maximize2 } from "lucide-react";

interface MinimapWidgetProps {
  telemetry: TelemetryState;
  onClick: () => void;
}

export function MinimapWidget({ telemetry, onClick }: MinimapWidgetProps) {
  // World space: [-450, 450]
  // Radar SVG viewBox: 0 to 200 (center is 100, 100)
  // Scale factor: 200 / 900 = 0.2222
  const worldToRadar = (x: number, z: number) => {
    const rx = 100 + (x / 450) * 88;
    const rz = 100 + (z / 450) * 88;
    return {
      x: Math.max(12, Math.min(188, rx)),
      y: Math.max(12, Math.min(188, rz)),
    };
  };

  const dronePos = worldToRadar(telemetry.position.x, telemetry.position.z);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Open Full Island Map"
      className="group relative cursor-pointer pointer-events-auto select-none transition-all duration-200 hover:scale-105 active:scale-95"
      title="Click to open Full Island Tactical Map"
    >
      {/* Outer Circular Container with Bold Black Border */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/95 backdrop-blur-md border-2 sm:border-3 border-black shadow-xl overflow-hidden relative flex items-center justify-center">
        
        {/* Radar SVG Vector Graphic */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            {/* Radar Sweep Gradient */}
            <radialGradient id="mini-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff5500" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Surrounding Ocean */}
          <circle cx="100" cy="100" r="100" fill="#0284c7" />

          {/* 2. Sandy Beach Outer Rim */}
          <ellipse cx="100" cy="100" rx="82" ry="80" fill="#e0c598" />

          {/* 3. Main Island Turf Landmass */}
          <ellipse cx="100" cy="100" rx="74" ry="72" fill="#476b3f" stroke="#365330" strokeWidth="1" />

          {/* 4. Mountain Lake & River */}
          <circle cx="72" cy="90" r="9" fill="#0284c7" />
          <path
            d="M 72 90 Q 80 97 88 106 T 90 118 T 83 132 T 74 148"
            fill="none"
            stroke="#0284c7"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* 5. Mountain Peaks (North-West) */}
          <polygon points="64,54 78,68 50,68" fill="#475569" />
          <polygon points="64,54 69,59 59,59" fill="#ffffff" /> {/* Snowcap */}
          <polygon points="76,62 88,72 64,72" fill="#475569" />
          <polygon points="76,62 80,66 72,66" fill="#ffffff" />

          {/* 6. Whispering Pines Forest (North-East) */}
          <g fill="#1b4332">
            <polygon points="120,60 124,68 116,68" />
            <polygon points="130,55 134,63 126,63" />
            <polygon points="138,62 142,70 134,70" />
            <polygon points="126,68 130,76 122,76" />
            <polygon points="136,72 140,80 132,80" />
          </g>

          {/* 7. Metropolis City Grid (South-East) */}
          <g fill="#1e293b" stroke="#000000" strokeWidth="0.5">
            <rect x="120" y="120" width="7" height="7" rx="1" />
            <rect x="130" y="118" width="8" height="8" rx="1" fill="#0f172a" />
            <rect x="140" y="122" width="6" height="7" rx="1" />
            <rect x="122" y="130" width="7" height="7" rx="1" />
            <rect x="131" y="129" width="9" height="9" rx="1" fill="#0f172a" />
          </g>

          {/* 8. Central Helipad Station (100, 100) */}
          <circle cx="100" cy="100" r="5" fill="#2e3440" stroke="#f59e0b" strokeWidth="1" />
          <text x="100" y="102.5" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            H
          </text>

          {/* 9. Radar Concentric Distance Rings & Crosshair */}
          <circle cx="100" cy="100" r="40" fill="none" stroke="#000000" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.4" />
          <circle cx="100" cy="100" r="75" fill="none" stroke="#000000" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
          <line x1="100" y1="12" x2="100" y2="188" stroke="#000000" strokeWidth="0.6" opacity="0.3" />
          <line x1="12" y1="100" x2="188" y2="100" stroke="#000000" strokeWidth="0.6" opacity="0.3" />

          {/* 10. Cardinal North Tick & Label */}
          <polygon points="100,6 104,14 96,14" fill="#ff5500" stroke="#000000" strokeWidth="0.8" />
          <text x="100" y="24" fill="#ff5500" fontSize="10" fontWeight="extrabold" textAnchor="middle" fontFamily="sans-serif">
            N
          </text>

          {/* 11. LIVE DRONE POSITION & HEADING CHEVRON */}
          <g transform={`translate(${dronePos.x}, ${dronePos.y})`}>
            {/* Subtle radar ripple */}
            <circle cx="0" cy="0" r="7" fill="none" stroke="#ff5500" strokeWidth="1.2" opacity="0.7" />
            
            {/* Drone Icon Base */}
            <circle cx="0" cy="0" r="4.5" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />

            {/* Rotating Heading Arrow */}
            <g transform={`rotate(${telemetry.heading})`}>
              <path
                d="M 0 -5 L 3.5 3 L 0 1.2 L -3.5 3 Z"
                fill="#ff5500"
                stroke="#000000"
                strokeWidth="0.8"
              />
            </g>
          </g>
        </svg>

        {/* Floating Expand Hint Pill on Hover */}
        <div className="absolute bottom-1 bg-black/90 text-white text-[8px] font-bold px-1.5 py-0.2 rounded tracking-widest uppercase flex items-center gap-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <span>MAP</span>
          <Maximize2 className="h-2 w-2 text-[#FF5500]" />
        </div>
      </div>
    </div>
  );
}
