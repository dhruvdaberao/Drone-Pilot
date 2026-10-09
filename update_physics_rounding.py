import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/lib/simulation/flight-physics.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix rounding of motorOutputs
old_outputs = 'motorOutputs: this.motorOutputs.map((o) => Math.round(o * 100) / 100),'
new_outputs = 'motorOutputs: this.motorOutputs.map((o) => Math.round(o * 1000) / 1000),'
content = content.replace(old_outputs, new_outputs)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
