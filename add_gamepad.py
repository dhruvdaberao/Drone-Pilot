import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/lib/simulation/input-manager.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'private lockedRoll = 0;' in line:
        new_lines.append('  private gpButtonStates: Record<number, boolean> = {};\n')
    
    if 'let kbYaw = 0;' in line:
        pass
    
    if '// Combine Keyboard + Touch with priority clamp' in line:
        gamepad_code = '''
    // Gamepad inputs (Xbox/PS Controllers & USB RC Transmitters)
    let gpThrottle = 0;
    let gpPitch = 0;
    let gpRoll = 0;
    let gpYaw = 0;

    if (typeof navigator !== "undefined" && navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (!gp) continue;
        
        // Deadzone helper
        const applyDeadzone = (val: number, deadzone: number = 0.05) => Math.abs(val) < deadzone ? 0 : val;

        const axes = gp.axes;
        if (axes.length >= 4) {
           gpYaw += applyDeadzone(axes[0]);
           gpThrottle -= applyDeadzone(axes[1]); // Invert Y (stick up is negative)
           gpRoll -= applyDeadzone(axes[2]);     // Right stick X (right is positive, we want -1 for right)
           gpPitch += applyDeadzone(axes[3]);    // Right stick Y (up is negative, we want -1 for forward)
        }

        // Map standard buttons
        // Button 0 (A/Cross): Hover Assist
        if (gp.buttons[0]?.pressed && !this.gpButtonStates[0]) {
           this.hoverAssistActive = !this.hoverAssistActive;
        }
        // Button 1 (B/Circle) or Button 3 (Y/Triangle): Camera Toggle
        if ((gp.buttons[1]?.pressed && !this.gpButtonStates[1]) || (gp.buttons[3]?.pressed && !this.gpButtonStates[3])) {
           this.triggerCameraToggle = true;
        }
        // Button 2 (X/Square): Reset
        if (gp.buttons[2]?.pressed && !this.gpButtonStates[2]) {
           this.triggerReset = true;
        }
        
        for (let b = 0; b < gp.buttons.length; b++) {
           this.gpButtonStates[b] = gp.buttons[b].pressed;
        }
        break; // Only use the first active controller
      }
    }
'''
        new_lines.insert(-1, gamepad_code)
        
    if 'const throttle = Math.max(-1, Math.min(1, kbThrottle + this.touchThrottle));' in line:
        new_lines[-1] = '    const throttle = Math.max(-1, Math.min(1, kbThrottle + this.touchThrottle + gpThrottle));\n'
    elif 'const pitch = Math.max(-1, Math.min(1, kbPitch + this.touchPitch));' in line:
        new_lines[-1] = '    const pitch = Math.max(-1, Math.min(1, kbPitch + this.touchPitch + gpPitch));\n'
    elif 'const roll = Math.max(-1, Math.min(1, kbRoll + this.touchRoll));' in line:
        new_lines[-1] = '    const roll = Math.max(-1, Math.min(1, kbRoll + this.touchRoll + gpRoll));\n'
    elif 'const yaw = Math.max(-1, Math.min(1, kbYaw + this.touchYaw));' in line:
        new_lines[-1] = '    const yaw = Math.max(-1, Math.min(1, kbYaw + this.touchYaw + gpYaw));\n'

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
