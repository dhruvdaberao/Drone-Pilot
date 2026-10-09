import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/modular-drone.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix blade material to be visible when standing
content = content.replace('color: 0x14161a,', 'color: 0x4f545e,')
# Set depthWrite to true for blades so they render correctly
content = content.replace('depthWrite: false, // CRITICAL: prevents invisible blades from occluding the blur disc!', 'depthWrite: true, // Fixed occlusion')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done modular-drone")
