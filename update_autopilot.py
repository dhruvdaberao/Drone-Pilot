import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/flight-simulator.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add isAutopilot state
if 'const [isAutopilot, setIsAutopilot] = useState(false);' not in content:
    content = content.replace('const [isHoverMode, setIsHoverMode] = useState(true);', 'const [isHoverMode, setIsHoverMode] = useState(true);\n  const [isAutopilot, setIsAutopilot] = useState(false);')

# Override input in render loop
old_input = '''        // Capture Inputs
        let input = inputManager.getInput();

        if (input.cameraToggle) {'''

new_input = '''        // Capture Inputs
        let input = inputManager.getInput();
        
        // Phase 3: Automated Waypoint Missions (Autopilot)
        if (isAutopilot && activeWaypointRef.current && physics.sensorHealth.gps) {
          const wpDx = activeWaypointRef.current.x - physics.posX;
          const wpDz = activeWaypointRef.current.z - physics.posZ;
          const dist = Math.hypot(wpDx, wpDz);
          
          if (dist > 5.0) {
            const dirX = wpDx / dist;
            const dirZ = wpDz / dist;
            
            const forwardX = -Math.sin(physics.yaw);
            const forwardZ = -Math.cos(physics.yaw);
            const rightX = Math.cos(physics.yaw);
            const rightZ = -Math.sin(physics.yaw);
            
            // Project world direction onto drone local axes
            const localPitch = -(dirX * forwardX + dirZ * forwardZ);
            const localRoll = (dirX * rightX + dirZ * rightZ);
            
            // Proportional braking near the waypoint
            const speedScale = Math.min(0.6, dist / 25.0);
            input = {
               ...input,
               pitch: localPitch * speedScale,
               roll: localRoll * speedScale
            };
          } else {
             // Reached target, disable autopilot
             setIsAutopilot(false);
          }
        }

        if (input.cameraToggle) {'''

content = content.replace(old_input, new_input)

# Replace activeWaypoint with activeWaypointRef to access inside loop safely
if 'const activeWaypointRef = useRef<NavigationWaypoint | null>(null);' not in content:
    content = content.replace('const [activeWaypoint, setActiveWaypoint] = useState<NavigationWaypoint | null>(null);', '''const [activeWaypoint, _setActiveWaypoint] = useState<NavigationWaypoint | null>(null);
  const activeWaypointRef = useRef<NavigationWaypoint | null>(null);
  const setActiveWaypoint = (wp: NavigationWaypoint | null) => {
    _setActiveWaypoint(wp);
    activeWaypointRef.current = wp;
  };''')


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
