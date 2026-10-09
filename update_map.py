import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/island-map-modal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<defs>'
end_marker = '</svg>'

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.rfind(end_marker)
    
    new_children = """<defs>
                  <radialGradient id="modal-recon-cone" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                    <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </radialGradient>
                  
                  <radialGradient id="island-topo" cx="45%" cy="45%" r="55%">
                    <stop offset="0%" stopColor="#355e3b" />
                    <stop offset="40%" stopColor="#2e4a29" />
                    <stop offset="80%" stopColor="#4c6e3b" />
                    <stop offset="95%" stopColor="#7c7353" />
                    <stop offset="100%" stopColor="#b6a382" />
                  </radialGradient>
                  
                  <radialGradient id="ocean-grad" cx="50%" cy="50%" r="75%">
                    <stop offset="0%" stopColor="#08426b" />
                    <stop offset="100%" stopColor="#021c33" />
                  </radialGradient>
                </defs>

                {/* Ocean Background */}
                <rect width={SVG_CANVAS_SIZE} height={SVG_CANVAS_SIZE} fill="url(#ocean-grad)" />

                {/* Coastline / Island Mass */}
                <path
                  d={mapData.coastlinePath}
                  fill="url(#island-topo)"
                  stroke="#a38c64"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />

                {/* Lake */}
                <circle
                  cx={mapData.waterways.lake.cx}
                  cy={mapData.waterways.lake.cy}
                  r={mapData.waterways.lake.r}
                  fill="#0ea5e9"
                  fillOpacity="0.9"
                  stroke="#38bdf8"
                  strokeWidth="3"
                />
                
                {/* River Channel */}
                <path
                  d={mapData.waterways.riverPath}
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="8"
                  strokeOpacity="0.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Master Road & Highway Network */}
                <g fill="none" strokeOpacity="1.0" strokeLinecap="round" strokeLinejoin="round">
                  {mapData.roads.highways.map((h) => (
                    <path key={h.id} d={h.path} strokeWidth={h.width + 1.5} stroke="#222222" />
                  ))}
                  {mapData.roads.connectors.map((c) => (
                    <path key={c.id} d={c.path} strokeWidth={c.width + 1} stroke="#444444" />
                  ))}
                  {mapData.roads.mountainPasses.map((m) => (
                    <path key={m.id} d={m.path} strokeWidth={m.width + 0.5} stroke="#594635" strokeDasharray="6 4" />
                  ))}
                </g>

                {/* Central Airfield & Runway Complex */}
                <g transform="translate(450, 450)">
                  <rect x="-80" y="-12" width="160" height="24" rx="2" fill="#222222" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
                  <line x1="-70" y1="0" x2="70" y2="0" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" strokeDasharray="6 5" />
                  <text x="0" y="-18" fill="#ffffff" fillOpacity="0.8" fontSize="14" fontWeight="bold" textAnchor="middle">
                    RUNWAY 09/27
                  </text>
                </g>

                {/* Live Flight Trail */}
                {flightPathPoints && (
                  <polyline
                    points={flightPathPoints}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                )}

                {/* Active Waypoint Line */}
                {targetSvg && (
                  <line
                    x1={droneSvg.x}
                    y1={droneSvg.y}
                    x2={targetSvg.x}
                    y2={targetSvg.y}
                    stroke="#ffae00"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    opacity="0.9"
                  />
                )}

                {/* Midpoint Distance Tag */}
                {targetSvg && (
                  <g transform={`translate(${(droneSvg.x + targetSvg.x) / 2}, ${(droneSvg.y + targetSvg.y) / 2})`}>
                    <rect x="-35" y="-12" width="70" height="24" rx="12" fill="#ffae00" fillOpacity="0.95" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="0" y="4" fill="#000000" fontSize="12" fontWeight="900" textAnchor="middle">
                      {navStats.dist.toFixed(0)}m
                    </text>
                  </g>
                )}

                {/* Helipads & Landmarks with Real Map Labels */}
                {TACTICAL_POIS.map((poi) => {
                  const pt = worldToSvg(poi.x, poi.z);
                  const isSelected = poi.id === selectedPoiId;
                  const ox = poi.labelOffsetX;
                  const oy = poi.labelOffsetY;

                  // Bright map colors
                  const catColor = 
                    poi.category === "airfield" ? "#ffffff" :
                    poi.category === "mountain" ? "#f59e0b" :
                    poi.category === "forest" ? "#10b981" :
                    poi.category === "water" ? "#06b6d4" :
                    poi.category === "industrial" ? "#a855f7" :
                    poi.category === "city" ? "#ef4444" : "#ffffff";

                  return (
                    <g
                      key={poi.id}
                      className="cursor-pointer group"
                      onClick={() => handleSelectTarget(poi)}
                    >
                      {isSelected && (
                        <circle cx={pt.x} cy={pt.y} r="22" fill="none" stroke="#ffae00" strokeWidth="3" className="animate-ping" opacity="0.9" />
                      )}

                      {/* Map Marker Pin */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="12"
                        fill={catColor}
                        stroke="#000000"
                        strokeWidth="2.5"
                        className="transition-transform duration-150 group-hover:scale-125 shadow-lg"
                      />
                      <circle cx={pt.x} cy={pt.y} r="4" fill="#000000" />

                      {/* Clean Map Text Label */}
                      <g transform={`translate(${pt.x + ox}, ${pt.y + oy + 8})`}>
                        {/* Text Outline for readability */}
                        <text
                          x="0"
                          y="4"
                          fill="#000000"
                          stroke="#000000"
                          strokeWidth="4"
                          strokeLinejoin="round"
                          fontSize={isSelected ? "17" : "15"}
                          fontWeight="900"
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {poi.name}
                        </text>
                        {/* Main Text Foreground */}
                        <text
                          x="0"
                          y="4"
                          fill="#ffffff"
                          fontSize={isSelected ? "17" : "15"}
                          fontWeight="900"
                          textAnchor="middle"
                          className="pointer-events-none"
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
                  <circle cx="0" cy="0" r="12" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />
                  <g transform={`rotate(${telemetry.heading})`}>
                    <path d="M 0 -16 L -8 8 L 0 4 L 8 8 Z" fill="#ffffff" />
                  </g>
                </g>
              """
              
    content = content[:start_idx] + new_children + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SVG replaced successfully.")
else:
    print("Could not find SVG bounds.")
