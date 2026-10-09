import os

# 1. Update telemetry-hud.tsx
file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/telemetry-hud.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('isHoverMode: boolean;', 'isHoverMode: boolean;\n  isAutopilot?: boolean;\n  onToggleAutopilot?: () => void;')
content = content.replace('isHoverMode,\n  onToggleHover,', 'isHoverMode,\n  onToggleHover,\n  isAutopilot,\n  onToggleAutopilot,')

old_controls = '''          {/* Quick Action Buttons */}
          <div className="flex justify-between items-center px-1">'''

new_controls = '''          {/* Quick Action Buttons */}
          <div className="flex justify-between items-center px-1">
            <button
              onClick={onToggleAutopilot}
              disabled={!activeWaypoint}
              className={`p-2.5 rounded-full shadow-lg transition-all border ${
                isAutopilot 
                  ? "bg-[#38bdf8] text-white border-[#38bdf8] animate-pulse" 
                  : activeWaypoint
                    ? "bg-neutral-800 text-[#38bdf8] border-[#38bdf8]/40 hover:bg-[#38bdf8]/20"
                    : "bg-neutral-900/50 text-neutral-600 border-white/5 cursor-not-allowed"
              }`}
              title={activeWaypoint ? "Toggle Autopilot to Waypoint" : "Select a Waypoint on the Map first"}
            >
              <Navigation className="h-5 w-5" />
            </button>'''

content = content.replace(old_controls, new_controls)
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Update flight-simulator.tsx to pass the props
fs_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/flight-simulator.tsx'
with open(fs_path, 'r', encoding='utf-8') as f:
    fs_content = f.read()

old_render = '''          <TelemetryHUD
            telemetry={telemetry}
            droneName={selectedDrone.name}
            cameraMode={cameraMode}
            onSelectCameraMode={handleSelectCameraMode}
            onReset={handleReset}
            onExit={onExit}
            isHoverMode={isHoverMode}
            onToggleHover={handleToggleHover}
            onToggleMap={() => setIsMapModalOpen((prev) => !prev)}'''

new_render = '''          <TelemetryHUD
            telemetry={telemetry}
            droneName={selectedDrone.name}
            cameraMode={cameraMode}
            onSelectCameraMode={handleSelectCameraMode}
            onReset={handleReset}
            onExit={onExit}
            isHoverMode={isHoverMode}
            onToggleHover={handleToggleHover}
            isAutopilot={isAutopilot}
            onToggleAutopilot={() => setIsAutopilot(prev => !prev)}
            onToggleMap={() => setIsMapModalOpen((prev) => !prev)}'''

fs_content = fs_content.replace(old_render, new_render)
with open(fs_path, 'w', encoding='utf-8') as f:
    f.write(fs_content)

print("Done")
