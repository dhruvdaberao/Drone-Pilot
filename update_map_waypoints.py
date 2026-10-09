import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/island-map-modal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for custom waypoints
if 'import React, { useEffect, useMemo, useState, useRef }' not in content:
    content = content.replace('import React, { useEffect, useMemo, useState }', 'import React, { useEffect, useMemo, useState, useRef }')

# Add radarToWorldCoords
content = content.replace(
    'const droneSvg = worldToSvg(telemetry.position.x, telemetry.position.z);',
    'const droneSvg = worldToSvg(telemetry.position.x, telemetry.position.z);\n\n  const svgToWorld = (svgX: number, svgY: number) => {\n    const center = SVG_CANVAS_SIZE / 2;\n    const scale = (SVG_CANVAS_SIZE * 0.46) / 1400;\n    return { x: (svgX - center) / scale, z: (svgY - center) / scale };\n  };'
)

# Handle SVG Click
old_svg_def = 'viewBox={`0 0 ${SVG_CANVAS_SIZE} ${SVG_CANVAS_SIZE}`}'
new_svg_def = '''viewBox={`0 0 ${SVG_CANVAS_SIZE} ${SVG_CANVAS_SIZE}`}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const rx = (e.clientX - rect.left) / rect.width;
                    const ry = (e.clientY - rect.top) / rect.height;
                    const svgX = rx * SVG_CANVAS_SIZE;
                    const svgY = ry * SVG_CANVAS_SIZE;
                    const w = svgToWorld(svgX, svgY);
                    
                    if (onSelectWaypoint) {
                       onSelectWaypoint({
                          id: `custom-wp-${Date.now()}`,
                          name: `WP-${Math.abs(Math.round(w.x))}-${Math.abs(Math.round(w.z))}`,
                          x: w.x,
                          z: w.z,
                          elevation: 100
                       });
                    }
                  }}'''

content = content.replace(old_svg_def, new_svg_def)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
