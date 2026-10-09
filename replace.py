import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/island-map-modal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '<rect x="-40" y="-14" width="80" height="28" rx="4" fill="#000000" stroke="#ffffff" strokeWidth="1.2" />' in line:
        lines[i] = '                  <rect x="-35" y="-12" width="70" height="24" rx="12" fill="#0f172a" fillOpacity="0.8" stroke="#38bdf8" strokeWidth="1" />\n'
    if '<text x="0" y="5" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">' in line:
        lines[i] = '                  <text x="0" y="4" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">\n'
    if 'const oy = poi.labelOffsetY;' in line:
        lines[i] = line + '''
                  const catColor = 
                    poi.category === "airfield" ? "#38bdf8" :
                    poi.category === "mountain" ? "#f59e0b" :
                    poi.category === "forest" ? "#22c55e" :
                    poi.category === "water" ? "#06b6d4" :
                    poi.category === "industrial" ? "#a855f7" :
                    poi.category === "city" ? "#f43f5e" : "#94a3b8";
'''
    if '<circle cx={pt.x} cy={pt.y} r="18" fill="none" stroke="#38bdf8" strokeWidth="2" className="animate-ping" opacity="0.75" />' in line:
        lines[i] = '                        <circle cx={pt.x} cy={pt.y} r="18" fill="none" stroke={catColor} strokeWidth="2" className="animate-ping" opacity="0.75" />\n'
    if 'r="12"' in line and 'fill={isSelected ? "#ffffff" : "#000000"}' in lines[i+1]:
        lines[i] = '                        r="10"\n'
        lines[i+1] = '                        fill={isSelected ? catColor : "#0f172a"}\n'
        lines[i+2] = '                        stroke={catColor}\n'
        lines[i+3] = '                        strokeWidth={isSelected ? "3" : "2"}\n'
        lines[i+4] = '                        strokeOpacity="0.9"\n'
    if 'fill={isSelected ? "#000000" : "#ffffff"}' in line and 'fontSize="14"' in lines[i+1]:
        lines[i] = '                        fill={isSelected ? "#000000" : catColor}\n'
        lines[i+1] = '                        fontSize="11"\n'
    if 'H' in line and 'className="pointer-events-none"' in lines[i-2]:
        lines[i] = '                        {poi.category === "airfield" ? "H" : poi.category.charAt(0).toUpperCase()}\n'
    if 'fillOpacity="0.8"' in line and '<rect' in lines[i-6]:
        # We need to remove the rect. We can just comment it out or make it invisible.
        lines[i-6] = '{/* \n'
        lines[i+4] = '*/}\n'

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
