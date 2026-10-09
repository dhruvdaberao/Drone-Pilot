import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/lib/simulation/battery-model.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add lastTerminalVoltage state
if 'private lastTerminalVoltage: number = 16.8;' not in content:
    content = content.replace('private temperatureC = 22.0;', 'private temperatureC = 22.0;\n  private lastTerminalVoltage: number = 16.8;')
    
# Update lastTerminalVoltage during update()
old_term = 'const terminalVoltage = Math.max(0, openCircuitVoltage - currentAmps * packInternalResistance);'
new_term = 'const terminalVoltage = Math.max(0, openCircuitVoltage - currentAmps * packInternalResistance);\n    this.lastTerminalVoltage = terminalVoltage;'
if new_term not in content:
    content = content.replace(old_term, new_term)

# Replace getThrustAuthority
old_auth = '''  public getThrustAuthority(): number {
    const frac = this.remainingMah / this.capacityMah;
    if (frac > 0.15) return 1.0;
    if (frac <= 0.0) return 0.0;
    return 0.4 + (frac / 0.15) * 0.6;
  }'''
new_auth = '''  public getThrustAuthority(): number {
    // True voltage sag limits motor RPM. Thrust ~ RPM^2 ~ Voltage^2
    const maxVoltage = 4.2 * this.cellCount;
    // Hard cutoff at 3.0V per cell
    const cutoffVoltage = 3.0 * this.cellCount;
    
    if (this.lastTerminalVoltage <= cutoffVoltage) {
      return 0.0; // ESCs shut down
    }
    
    // Calculate authority based on voltage sag. 
    // At full 16.8V (4S) = 1.0 authority. At 14.0V = (14/16.8)^2 = 0.69 authority.
    const voltageRatio = this.lastTerminalVoltage / maxVoltage;
    let auth = voltageRatio * voltageRatio;
    
    // Add soft limit if battery capacity is absolutely dead
    const frac = this.remainingMah / this.capacityMah;
    if (frac <= 0.05) {
       auth *= (frac / 0.05);
    }
    
    return Math.max(0.0, Math.min(1.0, auth));
  }'''

content = content.replace(old_auth, new_auth)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
