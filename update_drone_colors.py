import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/ui/aircraft-model-builder.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make carbon fiber and dark graphite lighter so they don't blend into the dark background
content = content.replace('color: 0x08090a,', 'color: 0x2a2c33,')
content = content.replace('color: 0x111215,', 'color: 0x3d4149,')
content = content.replace('color: 0x24262b,', 'color: 0x4f545e,')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done aircraft-model-builder")
