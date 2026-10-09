import os

files_to_update = [
    'src/components/simulator/glass-panels.tsx',
    'src/components/simulator/environment-control-panel.tsx',
    'src/components/simulator/island-map-modal.tsx',
    'src/components/simulator/post-flight-report-modal.tsx',
    'src/components/simulator/telemetry-hud.tsx'
]

for file_path in files_to_update:
    full_path = f"C:/Users/wbl/Desktop/Drone-Pilot/{file_path}"
    if not os.path.exists(full_path): continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace specific colors
    content = content.replace('#38bdf8', '#FF5500')
    content = content.replace('bg-blue-900', 'bg-orange-900')
    content = content.replace('border-blue-500', 'border-orange-500')
    content = content.replace('text-blue-400', 'text-orange-400')
    content = content.replace('accent-blue-400', 'accent-orange-500')
    content = content.replace('bg-blue-600', 'bg-orange-600')
    content = content.replace('hover:bg-blue-700', 'hover:bg-orange-700')
    content = content.replace('text-blue-500', 'text-orange-500')
    content = content.replace('bg-blue-100 text-blue-600', 'bg-orange-100 text-orange-600')

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
print("Done")
