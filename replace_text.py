import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/island-map-modal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_transform = '                      <g transform={`translate(${pt.x + ox}, ${pt.y + oy})`}>'
new_transform = '                      <g transform={`translate(${pt.x + ox}, ${pt.y + oy + 8})`}>'

old_text = '''                        <text
                          x="0"
                          y="4"
                          fill="#ffffff"
                          fontSize="13"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="pointer-events-none shadow-black drop-shadow-md"
                        >'''

new_text = '''                        <text
                          x="0"
                          y="4"
                          fill={isSelected ? "#ffffff" : "#cbd5e1"}
                          fontSize={isSelected ? "13" : "11"}
                          fontWeight={isSelected ? "bold" : "600"}
                          textAnchor="middle"
                          className="pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                          style={{ textShadow: '0px 1px 4px black, 0px -1px 4px black, 1px 0px 4px black, -1px 0px 4px black' }}
                        >'''

if old_transform in content:
    content = content.replace(old_transform, new_transform)
else:
    print('old_transform not found')

if old_text in content:
    content = content.replace(old_text, new_text)
else:
    print('old_text not found')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
