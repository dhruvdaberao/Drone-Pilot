import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/flight-simulator.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'spawnConfigRef.current.x',
    'spawnConfigRef.current.position.x'
)
content = content.replace(
    'spawnConfigRef.current.z',
    'spawnConfigRef.current.position.z'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
